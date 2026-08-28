export const APPOINTMENT_PREP_WIDGET_URI = "ui://widget/health-vault-appointment-prep.html";

export const APPOINTMENT_PREP_WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; color: #202528; background: transparent; }
    .card { overflow: hidden; border: 1px solid #e5e7e8; border-radius: 14px; background: #fdfdfc; box-shadow: 0 8px 28px rgba(28,37,44,.05); }
    .hero { padding: 20px; color: #f4f7fb; background: #17213a; border-bottom: 3px solid #0b8063; }
    .eyebrow { margin: 0 0 8px; color: #9ee3cf; font-size: 11px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 22px; line-height: 1.25; letter-spacing: -.02em; }
    .appointment-meta { margin: 8px 0 0; color: #cbd3e0; font-size: 12px; line-height: 1.55; }
    .content { display: grid; gap: 20px; padding: 20px; }
    .section { display: grid; gap: 8px; }
    h2 { margin: 0; font-size: 14px; letter-spacing: -.01em; }
    ul { display: grid; gap: 8px; margin: 0; padding-left: 20px; }
    li { padding-left: 2px; font-size: 13px; line-height: 1.5; }
    .context { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; }
    .metric { padding: 12px; border: 1px solid #e5e7e8; border-radius: 8px; background: #f5f7f8; }
    .metric strong { display: block; color: #17213a; font-size: 20px; }
    .metric span { display: block; margin-top: 3px; color: #687075; font-size: 11px; }
    .notice { padding: 12px 14px; border-left: 3px solid #0b8063; border-radius: 8px; color: #145846; background: #edf6f2; font-size: 12px; line-height: 1.5; }
    .actions { padding: 0 20px 20px; }
    button { width: 100%; min-height: 44px; border: 0; border-radius: 8px; cursor: pointer; color: #f4f7fb; background: #2563eb; font: inherit; font-weight: 750; }
    button:hover { background: #1d4ed8; }
    button:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
    @media (prefers-color-scheme: dark) {
      body { color: #eef1f3; }
      .card { border-color: #343a3e; background: #15191c; box-shadow: none; }
      .metric { border-color: #343a3e; background: #191e21; }
      .metric strong { color: #eef1f3; }
      .metric span { color: #a7afb4; }
      .notice { color: #c7f2e4; background: #163b32; }
    }
    @media (max-width: 520px) { .context { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main id="app" class="card"><div class="content">Preparing your appointment brief…</div></main>
  <script>
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const list = (items, empty) => '<ul>' + ((items?.length ? items : [empty]).map((item) => '<li>' + esc(item) + '</li>').join('')) + '</ul>';
    const fmt = (value) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
    function render() {
      const brief = window.openai?.toolOutput?.brief;
      if (!brief) return;
      const appointment = brief.appointment || {};
      const context = brief.relevantContext || {};
      const provider = appointment.provider_name || 'Your provider';
      const visit = appointment.appointment_type || 'Upcoming visit';
      const meta = [provider, appointment.scheduled_at ? fmt(appointment.scheduled_at) : '', appointment.location || ''].filter(Boolean).join(' · ');
      document.getElementById('app').innerHTML = '<div class="hero"><p class="eyebrow">Appointment prep</p><h1>' + esc(visit) + '</h1><p class="appointment-meta">' + esc(meta || 'No scheduled appointment was found; this brief can still help organize your discussion.') + '</p></div>'
        + '<div class="content"><section class="section"><h2>Your priorities</h2>' + list(brief.visitGoals, 'Review current health and next steps') + '</section>'
        + '<section class="section"><h2>Questions to ask</h2>' + list(brief.questionsToAsk, 'What should I know or do after this visit?') + '</section>'
        + '<section class="section"><h2>Health Vault context</h2><div class="context"><div class="metric"><strong>' + esc(context.activeConditions?.length || 0) + '</strong><span>Active conditions</span></div><div class="metric"><strong>' + esc(context.activeMedications?.length || 0) + '</strong><span>Active medications</span></div><div class="metric"><strong>' + esc(context.allergies?.length || 0) + '</strong><span>Allergies</span></div></div></section>'
        + '<div class="notice">' + esc(brief.medicalDisclaimer || 'Review this informational brief for accuracy before your visit.') + '</div></div>'
        + '<div class="actions"><button id="open-vault">Open Health Vault</button></div>';
      document.getElementById('open-vault')?.addEventListener('click', () => {
        const href = 'https://healthvault.me/?app=dashboard&source=chatgpt';
        if (window.openai?.openExternal) window.openai.openExternal({ href });
        else window.open(href, '_blank', 'noopener,noreferrer');
      });
    }
    window.addEventListener('openai:set_globals', render);
    render();
  </script>
</body>
</html>`;
