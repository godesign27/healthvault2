export const SHARE_WIDGET_URI = "ui://widget/health-vault-share-confirmation.html";

export const SHARE_WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; color: #202528; background: transparent; }
    .card { padding: 20px; border: 1px solid #e5e7e8; border-radius: 14px; background: #fff; box-shadow: 0 8px 28px rgba(28,37,44,.05); }
    .profile { display: flex; align-items: center; gap: 12px; }
    .avatar { display: grid; width: 48px; height: 48px; flex: 0 0 48px; place-items: center; border-radius: 12px; color: #fff; background: #17213a; font-size: 17px; font-weight: 750; }
    .eyebrow { margin: 0 0 4px; color: #0b8063; font-size: 10px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 19px; line-height: 1.25; }
    .organization { margin: 3px 0 0; color: #687075; font-size: 12px; }
    .scope { margin: 18px 0; padding: 14px; border-radius: 10px; background: #f5f7f8; }
    .scope-title { margin: 0 0 8px; font-size: 12px; font-weight: 700; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { padding: 5px 8px; border: 1px solid #d7e4df; border-radius: 999px; color: #145846; background: #edf6f2; font-size: 11px; }
    .expires { margin: 10px 0 0; color: #687075; font-size: 11px; }
    .notice { margin: 0 0 16px; color: #68635f; font-size: 11px; line-height: 1.45; }
    button { width: 100%; padding: 12px 16px; border: 0; border-radius: 9px; cursor: pointer; color: #fff; background: #2563eb; font: inherit; font-weight: 750; }
    button:hover { background: #1d4ed8; }
    button:disabled { cursor: wait; opacity: .65; }
    .result { margin-top: 14px; padding: 12px; border-radius: 9px; color: #145846; background: #edf9f5; font-size: 12px; line-height: 1.45; }
    .result a { color: #2563eb; font-weight: 700; }
    .error { color: #991b1b; background: #fef2f2; }
    @media (prefers-color-scheme: dark) {
      body { color: #eef1f3; }
      .card { border-color: #343a3e; background: #15191c; box-shadow: none; }
      .scope { background: #191e21; }
      .organization, .expires, .notice { color: #a7afb4; }
      .chip { border-color: #286c5a; color: #c7f2e4; background: #163b32; }
      .result { color: #c7f2e4; background: #163b32; }
      .result a { color: #8ab4ff; }
    }
  </style>
</head>
<body>
  <main id="app" class="card">Preparing secure share…</main>
  <script>
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    let submitting = false;
    let completedShare = null;
    const label = (value) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    function render() {
      const preview = window.openai?.toolOutput?.preview;
      if (!preview) return;
      const initials = String(preview.recipientName || 'Secure Share').split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
      const result = completedShare
        ? '<div class="result" role="status"><strong>Secure share created</strong><br><a id="open-share" href="' + esc(completedShare.shareUrl) + '">Open secure share</a><br>Share ID: ' + esc(completedShare.id) + '</div>'
        : '';
      document.getElementById('app').innerHTML = '<div class="profile"><div class="avatar" aria-hidden="true">' + esc(initials) + '</div><div><p class="eyebrow">Secure health share</p><h1>' + esc(preview.recipientName) + '</h1>'
        + (preview.recipientOrganization ? '<p class="organization">' + esc(preview.recipientOrganization) + '</p>' : '') + '</div></div>'
        + '<div class="scope"><p class="scope-title">Information to share</p><div class="chips">' + preview.categories.map((category) => '<span class="chip">' + esc(label(category)) + '</span>').join('') + '</div>'
        + '<p class="expires">Expires ' + esc(preview.expiresInDays) + ' day' + (preview.expiresInDays === 1 ? '' : 's') + ' after creation · Patient name included</p></div>'
        + '<p class="notice">This creates a read-only link. Nothing is sent automatically, and you can revoke access later.</p>'
        + (completedShare ? result : '<button id="confirm-share"' + (submitting ? ' disabled' : '') + '>' + (submitting ? 'Creating secure share…' : 'Confirm Secure Share') + '</button><div id="share-result"></div>');
      document.getElementById('confirm-share')?.addEventListener('click', confirmShare);
      document.getElementById('open-share')?.addEventListener('click', (event) => {
        event.preventDefault();
        const href = completedShare?.shareUrl;
        if (href && window.openai?.openExternal) window.openai.openExternal({ href });
      });
    }
    async function confirmShare() {
      const preview = window.openai?.toolOutput?.preview;
      if (!preview || submitting) return;
      submitting = true;
      render();
      try {
        const result = await window.openai.callTool('create_health_share', {
          recipientName: preview.recipientName,
          recipientOrganization: preview.recipientOrganization || undefined,
          categories: preview.categories,
          expiresInDays: preview.expiresInDays,
          note: preview.note || undefined,
          confirmed: true
        });
        completedShare = result?.structuredContent?.share || result?.share || null;
        if (!completedShare) throw new Error('The secure share was not returned.');
      } catch (error) {
        const target = document.getElementById('share-result');
        if (target) target.innerHTML = '<div class="result error" role="alert">' + esc(error?.message || 'Unable to create the secure share.') + '</div>';
      } finally {
        submitting = false;
        if (completedShare) render();
        else {
          const button = document.getElementById('confirm-share');
          if (button) { button.disabled = false; button.textContent = 'Confirm Secure Share'; }
        }
      }
    }
    window.addEventListener('openai:set_globals', render);
    render();
  </script>
</body>
</html>`;
