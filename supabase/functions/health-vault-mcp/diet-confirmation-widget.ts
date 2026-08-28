export const DIET_CONFIRMATION_WIDGET_URI = "ui://widget/health-vault-diet-confirmation.html";

export const DIET_CONFIRMATION_WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; color: #202528; background: transparent; }
    .card { overflow: hidden; border: 1px solid #e2e5e7; border-radius: 14px; background: #fdfdfc; box-shadow: 0 8px 28px rgba(28,37,44,.05); }
    .hero { padding: 18px 20px; color: #f7fafc; background: #17213a; border-bottom: 3px solid #0b8063; }
    .eyebrow { margin: 0 0 6px; color: #9ee3cf; font-size: 11px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 21px; letter-spacing: -.02em; }
    .body { display: grid; gap: 14px; padding: 18px 20px; }
    .entry { padding: 12px 0; border-bottom: 1px solid #e8eaeb; }
    .entry:last-child { border-bottom: 0; }
    .entry-head { display: flex; justify-content: space-between; gap: 12px; }
    .entry strong { font-size: 13px; text-transform: capitalize; }
    .entry time, .meta { color: #72797d; font-size: 11px; }
    .items { margin: 6px 0 0; color: #3f464a; font-size: 13px; line-height: 1.45; }
    .notice { padding: 11px 13px; border-radius: 8px; color: #145846; background: #edf6f2; font-size: 12px; line-height: 1.45; }
    .actions { display: grid; grid-template-columns: 1fr auto; gap: 10px; padding: 0 20px 20px; }
    button, a { min-height: 44px; border-radius: 8px; font: inherit; font-weight: 750; }
    button { border: 0; cursor: pointer; color: #fff; background: #2563eb; }
    button:hover { background: #1d4ed8; }
    button:disabled { cursor: wait; opacity: .65; }
    a { display: grid; place-items: center; padding: 0 16px; color: #2563eb; text-decoration: none; border: 1px solid #bfdbfe; }
    button:focus-visible, a:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
    .error { margin: 0 20px 18px; padding: 11px 13px; border-radius: 8px; color: #991b1b; background: #fef2f2; font-size: 12px; }
    .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
    .stat { padding: 12px; border-radius: 8px; background: #f2f5f6; }
    .stat strong { display: block; color: #17213a; font-size: 20px; }
    .stat span { color: #687075; font-size: 11px; }
    @media (prefers-color-scheme: dark) {
      body { color: #eef1f3; }
      .card { border-color: #343a3e; background: #15191c; box-shadow: none; }
      .entry { border-color: #343a3e; }
      .items { color: #d5dade; }
      .stat { background: #202529; }
      .stat strong { color: #eef1f3; }
      .notice { color: #c7f2e4; background: #163b32; }
    }
    @media (max-width: 480px) { .actions, .stats { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main id="app" class="card"><div class="body">Preparing your diet log…</div></main>
  <script>
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const fmt = (value) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Time not provided';
    const entryMarkup = (entry) => '<article class="entry"><div class="entry-head"><strong>' + esc(entry.mealType) + '</strong><time>' + esc(fmt(entry.consumedAt)) + '</time></div><p class="items">' + esc((entry.items || []).map((item) => [item.amount, item.name].filter(Boolean).join(' ')).join(' · ') || 'No items supplied') + '</p>' + (entry.waterMl ? '<p class="meta">Water: ' + esc(entry.waterMl) + ' mL</p>' : '') + '</article>';
    const app = document.getElementById('app');
    let preview = null;
    let submitting = false;
    function renderPreview() {
      preview = window.openai?.toolOutput?.preview;
      if (!preview?.entries?.length) return;
      app.innerHTML = '<div class="hero"><p class="eyebrow">Diet Log</p><h1>Review before saving</h1></div><div class="body">' + preview.entries.map(entryMarkup).join('') + '<div class="notice">Nothing has been saved yet. Confirm once to add all ' + preview.entries.length + ' entr' + (preview.entries.length === 1 ? 'y' : 'ies') + ' to your Wellness log.</div></div><div class="actions"><button id="confirm">Confirm Diet Log</button><a href="https://healthvault.me/?app=wellness&source=chatgpt" id="wellness">Open Wellness</a></div><div id="error"></div>';
      document.getElementById('confirm')?.addEventListener('click', save);
      document.getElementById('wellness')?.addEventListener('click', (event) => { event.preventDefault(); const href = event.currentTarget.href; if (window.openai?.openExternal) window.openai.openExternal({ href }); else window.open(href, '_blank', 'noopener,noreferrer'); });
    }
    async function save() {
      if (submitting || !preview) return;
      submitting = true;
      const button = document.getElementById('confirm');
      button.disabled = true; button.textContent = 'Saving…';
      try {
        const result = await window.openai.callTool('log_diet_entries', { entries: preview.entries, confirmed: true });
        const wellness = result?.structuredContent?.wellness || result?.wellness;
        if (!wellness) throw new Error('Health Vault did not return the Wellness summary.');
        renderWellness(wellness);
      } catch (error) {
        document.getElementById('error').innerHTML = '<div class="error" role="alert">' + esc(error?.message || 'Unable to save this diet log.') + '</div>';
        button.disabled = false; button.textContent = 'Try Again';
      } finally { submitting = false; }
    }
    function renderWellness(wellness) {
      const diet = wellness.diet || {};
      const signals = wellness.lifeSignals || [];
      app.innerHTML = '<div class="hero"><p class="eyebrow">Wellness</p><h1>Diet log updated</h1></div><div class="body"><div class="stats"><div class="stat"><strong>' + esc(diet.loggedEntries || 0) + '</strong><span>Diet entries · 7 days</span></div><div class="stat"><strong>' + esc(diet.loggedWaterMl || 0) + '</strong><span>Water logged · mL</span></div><div class="stat"><strong>' + esc(signals.length) + '</strong><span>Life Signals · 7 days</span></div></div><div class="notice">Your confirmed entries were saved once and are now available on the Wellness page.</div></div><div class="actions"><a style="grid-column:1/-1" href="https://healthvault.me/?app=wellness&source=chatgpt" id="open-wellness">Open Wellness</a></div>';
      document.getElementById('open-wellness')?.addEventListener('click', (event) => { event.preventDefault(); const href = event.currentTarget.href; if (window.openai?.openExternal) window.openai.openExternal({ href }); else window.open(href, '_blank', 'noopener,noreferrer'); });
    }
    window.addEventListener('openai:set_globals', renderPreview);
    renderPreview();
  </script>
</body>
</html>`;
