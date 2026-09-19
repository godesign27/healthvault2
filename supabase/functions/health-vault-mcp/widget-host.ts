// Embedded into each widget: no external script or network permissions needed.
export const WIDGET_HOST_SCRIPT = String.raw`
const hvHost = (() => {
  let output = window.openai?.toolOutput || null;
  let ready = false;
  let sequence = 0;
  let locked = false;
  const listeners = new Set();
  const pending = new Map();
  const attempts = new Set();
  const notify = (value) => {
    if (locked || !value || JSON.stringify(output) === JSON.stringify(value)) return;
    output = value;
    listeners.forEach(fn => fn());
  };
  window.addEventListener('openai:set_globals', event => notify(event.detail?.globals?.toolOutput));
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.data?.jsonrpc !== '2.0') return;
    const message = event.data;
    if (message.id === 'hv-init' && message.result) {
      ready = true;
      window.parent.postMessage({ jsonrpc: '2.0', method: 'ui/notifications/initialized', params: {} }, '*');
    } else if (pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message || 'The request failed.'));
      else request.resolve(message.result);
    } else if (message.method === 'ui/notifications/tool-result' && !message.params?.isError) {
      notify(message.params?.structuredContent);
    }
  });
  window.parent.postMessage({ jsonrpc: '2.0', id: 'hv-init', method: 'ui/initialize', params: {
    protocolVersion: '2026-01-26', appInfo: { name: 'health-vault', version: '1.0.0' }, appCapabilities: {}
  } }, '*');
  return {
    get output() { return output; },
    get confirmationSubmitted() { return locked; },
    subscribe(fn) { listeners.add(fn); },
    async callTool(name, args) {
      const mutation = args.confirmed === true;
      const key = name + JSON.stringify(args);
      if (mutation && attempts.has(key)) throw new Error('This confirmation was already submitted. Check Health Vault before trying again.');
      if (!window.openai?.callTool && !ready) throw new Error('The ChatGPT connection is not ready. Reopen this card and try again.');
      if (mutation) { attempts.add(key); locked = true; }
      const id = 'hv-call-' + (++sequence);
      let timer;
      try {
        const call = window.openai?.callTool
          ? window.openai.callTool(name, args)
          : new Promise((resolve, reject) => {
              pending.set(id, { resolve, reject });
              window.parent.postMessage({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }, '*');
            });
        const result = await Promise.race([call, new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('No response was received from ChatGPT.')), 30000);
        })]);
        if (result?.isError) throw new Error((result.content || []).filter(item => item.type === 'text').map(item => item.text).join(' ') || 'Health Vault could not complete the request.');
        return result;
      } catch (error) {
        throw new Error((error?.message || 'Unable to complete the request.') + (mutation ? ' Check Health Vault before confirming again; the result is unverified.' : ''));
      } finally { clearTimeout(timer); pending.delete(id); }
    }
  };
})();
`;
