export const ONBOARDING_WIDGET_URI = "ui://widget/health-vault-onboarding.html";

export const ONBOARDING_WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; color: #17213a; background: transparent; }
    .card { overflow: hidden; border: 1px solid #e4e7ea; border-radius: 16px; background: #fff; box-shadow: 0 8px 28px rgba(23,33,58,.06); }
    header { padding: 22px; color: #fff; background: #17213a; border-bottom: 3px solid #0b8063; }
    .eyebrow { margin: 0 0 7px; color: #9ee3cf; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 22px; line-height: 1.2; }
    .intro { margin: 7px 0 0; color: #cbd3e0; font-size: 13px; line-height: 1.45; }
    .progress-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px 8px; font-size: 12px; }
    .progress { height: 7px; margin: 0 20px 10px; overflow: hidden; border-radius: 999px; background: #e8ecef; }
    .progress span { display: block; height: 100%; border-radius: inherit; background: #0b8063; }
    ol { margin: 0; padding: 4px 20px 8px; list-style: none; }
    li { display: grid; grid-template-columns: 24px 1fr; gap: 10px; padding: 12px 0; border-top: 1px solid #eceeef; }
    .marker { display: grid; place-items: center; width: 22px; height: 22px; border: 1px solid #c9d0d5; border-radius: 50%; color: #687075; font-size: 11px; font-weight: 800; }
    .done .marker { border-color: #0b8063; color: #fff; background: #0b8063; }
    h2 { margin: 1px 0 3px; font-size: 13px; }
    .description { margin: 0; color: #687075; font-size: 11px; line-height: 1.45; }
    .next { margin: 8px 20px 20px; padding: 14px; border-radius: 10px; background: #f1f6f4; }
    .next strong { display: block; margin-bottom: 4px; font-size: 13px; }
    .next p { margin: 0 0 12px; color: #52605c; font-size: 11px; line-height: 1.45; }
    button { width: 100%; border: 0; border-radius: 8px; padding: 11px 13px; cursor: pointer; color: #fff; background: #2563eb; font: inherit; font-size: 13px; font-weight: 750; }
    button:hover { background: #1d4ed8; }
    .prompt { margin-top: 9px; color: #52605c; font-size: 11px; }
    @media (prefers-color-scheme: dark) {
      body { color: #eef1f3; }
      .card { border-color: #343a3e; background: #15191c; box-shadow: none; }
      li { border-color: #343a3e; }
      .description { color: #aab1b5; }
      .progress { background: #31383c; }
      .next { background: #19352e; }
      .next p, .prompt { color: #b6c6c0; }
    }
  </style>
</head>
<body>
  <main id="app" class="card"><header><p class="eyebrow">Health Vault</p><h1>Getting your Vault ready</h1></header></main>
  <script>
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const openExternal = (href) => {
      if (window.openai?.openExternal) window.openai.openExternal({ href });
      else window.open(href, '_blank', 'noopener,noreferrer');
    };
    function render() {
      const status = window.openai?.toolOutput?.onboarding;
      if (!status) return;
      const percent = Math.round((status.completedCount / status.totalCount) * 100);
      const stages = (status.stages || []).map((stage, index) => '<li class="' + (stage.complete ? 'done' : '') + '"><span class="marker">' + (stage.complete ? '✓' : (index + 1)) + '</span><div><h2>' + esc(stage.label) + '</h2><p class="description">' + esc(stage.description) + '</p></div></li>').join('');
      const action = status.recommendedAction || {};
      const actionControl = action.href
        ? '<button id="continue-action">' + esc(action.label) + '</button>'
        : '<div class="prompt"><strong>Try in chat:</strong> “' + esc(action.prompt || '') + '”</div>';
      document.getElementById('app').innerHTML = '<header><p class="eyebrow">Health Vault</p><h1>' + (status.complete ? 'Your Vault is ready' : 'Finish your Health Vault setup') + '</h1><p class="intro">A short, privacy-first setup that gives you immediate value in ChatGPT.</p></header><div class="progress-row"><strong>' + esc(status.completedCount) + ' of ' + esc(status.totalCount) + ' complete</strong><span>' + percent + '%</span></div><div class="progress" aria-label="Onboarding progress"><span style="width:' + percent + '%"></span></div><ol>' + stages + '</ol><section class="next"><strong>Recommended next step: ' + esc(action.label) + '</strong><p>' + esc(action.description) + '</p>' + actionControl + '</section>';
      document.getElementById('continue-action')?.addEventListener('click', () => openExternal(action.href));
    }
    render();
    window.addEventListener('openai:set_globals', render);
  </script>
</body>
</html>`;
