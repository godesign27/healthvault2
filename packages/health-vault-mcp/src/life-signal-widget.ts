export const LIFE_SIGNAL_WIDGET_URI = "ui://widget/health-vault-life-signal.html";

export const LIFE_SIGNAL_WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; color: #202528; background: transparent; }
    .card { padding: 20px; border: 1px solid #e5e7e8; border-radius: 14px; background: #fdfdfc; box-shadow: 0 8px 28px rgba(28,37,44,.05); }
    .eyebrow { margin: 0 0 6px; color: #0b8063; font-size: 11px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 22px; letter-spacing: -.02em; }
    .intro { margin: 8px 0 20px; color: #687075; font-size: 12px; line-height: 1.5; }
    .signals { display: grid; gap: 16px; }
    .signal { display: grid; grid-template-columns: 74px minmax(0,1fr) 32px; align-items: center; gap: 12px; }
    label { font-size: 13px; font-weight: 700; }
    output { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 8px; color: #145846; background: #edf6f2; font-size: 13px; font-weight: 750; }
    input[type=range] { width: 100%; accent-color: #0b8063; cursor: pointer; }
    .scale { display: flex; justify-content: space-between; margin: -8px 44px 0 86px; color: #8a9094; font-size: 10px; }
    .note { display: grid; gap: 6px; margin-top: 20px; }
    textarea { min-height: 72px; resize: vertical; padding: 12px; border: 1px solid #d8dcde; border-radius: 8px; color: inherit; background: transparent; font: inherit; font-size: 13px; line-height: 1.45; }
    textarea:focus, input:focus-visible { outline: 3px solid #a7e1cf; outline-offset: 2px; }
    button { width: 100%; min-height: 44px; margin-top: 16px; border: 0; border-radius: 8px; cursor: pointer; color: #f4f7fb; background: #2563eb; font: inherit; font-weight: 750; }
    button:hover { background: #1d4ed8; }
    button:disabled { cursor: wait; opacity: .65; }
    .result { margin-top: 16px; padding: 12px 14px; border-radius: 8px; color: #145846; background: #edf9f5; font-size: 12px; line-height: 1.5; }
    .error { color: #991b1b; background: #fef2f2; }
    @media (prefers-color-scheme: dark) {
      body { color: #eef1f3; }
      .card { border-color: #343a3e; background: #15191c; box-shadow: none; }
      .intro, .scale { color: #a7afb4; }
      output, .result { color: #c7f2e4; background: #163b32; }
      textarea { border-color: #4a5156; }
    }
  </style>
</head>
<body>
  <main class="card">
    <p class="eyebrow">Life Signal</p>
    <h1>How are you feeling today?</h1>
    <p class="intro">Set each signal from 1 to 5. For stress and pain, a higher number means more discomfort.</p>
    <div id="signals" class="signals"></div>
    <div class="scale"><span>1 · Low</span><span>5 · High</span></div>
    <div class="note"><label for="note">Optional note</label><textarea id="note" maxlength="2000" placeholder="Add context that may help you notice patterns later."></textarea></div>
    <button id="log">Log Life Signal</button>
    <div id="result" aria-live="polite"></div>
  </main>
  <script>
    const definitions = [['sleep', 'Sleep'], ['energy', 'Energy'], ['mood', 'Mood'], ['stress', 'Stress'], ['pain', 'Pain']];
    let submitting = false;
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    document.getElementById('signals').innerHTML = definitions.map(([key, label]) => '<div class="signal"><label for="' + key + '">' + label + '</label><input id="' + key + '" type="range" min="1" max="5" step="1" value="3"><output id="' + key + '-value" for="' + key + '">3</output></div>').join('');
    definitions.forEach(([key]) => document.getElementById(key).addEventListener('input', (event) => { document.getElementById(key + '-value').textContent = event.target.value; }));
    document.getElementById('log').addEventListener('click', async () => {
      if (submitting) return;
      submitting = true;
      const button = document.getElementById('log');
      const resultTarget = document.getElementById('result');
      button.disabled = true;
      button.textContent = 'Logging…';
      resultTarget.innerHTML = '';
      try {
        const input = Object.fromEntries(definitions.map(([key]) => [key, Number(document.getElementById(key).value)]));
        const note = document.getElementById('note').value.trim();
        const result = await window.openai.callTool('log_life_signal', { ...input, note: note || undefined, confirmed: true });
        const saved = result?.structuredContent?.saved || result?.saved;
        if (!saved) throw new Error('Health Vault did not return the saved check-in.');
        resultTarget.innerHTML = '<div class="result" role="status"><strong>Life Signal logged</strong><br>Your confirmed check-in is now in Health Vault.</div>';
        button.textContent = 'Logged';
      } catch (error) {
        resultTarget.innerHTML = '<div class="result error" role="alert">' + esc(error?.message || 'Unable to log this Life Signal.') + '</div>';
        button.disabled = false;
        button.textContent = 'Try Again';
      } finally { submitting = false; }
    });
  </script>
</body>
</html>`;
