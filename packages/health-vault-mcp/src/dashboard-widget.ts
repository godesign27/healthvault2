export const DASHBOARD_WIDGET_URI = "ui://widget/health-vault-dashboard.html";

export const DASHBOARD_WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 14px; color: #171717; background: transparent; }
    .card { border: 1px solid rgba(120,113,108,.24); border-radius: 20px; background: #fff; overflow: hidden; box-shadow: 0 12px 34px rgba(28,25,23,.08); }
    .hero { padding: 22px; color: white; background: linear-gradient(135deg,#19074d 0%,#3b1877 55%,#008a68 140%); }
    .eyebrow { margin: 0 0 6px; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; opacity: .78; }
    h1 { margin: 0; font-size: 24px; line-height: 1.2; }
    .subtitle { margin: 7px 0 0; font-size: 14px; opacity: .82; }
    .stats { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; padding: 16px; }
    .stat { padding: 14px; border-radius: 14px; background: #f7f7f6; }
    .value { display: block; font-size: 24px; font-weight: 750; color: #19074d; }
    .label { display: block; margin-top: 2px; font-size: 12px; color: #68635f; }
    .section { padding: 4px 16px 16px; }
    h2 { margin: 8px 0 10px; font-size: 15px; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid #eceae8; font-size: 13px; }
    .status { flex: 0 0 auto; font-weight: 700; color: #008a68; }
    .status.todo { color: #9a5b00; }
    .appointment { padding: 13px 14px; border-radius: 14px; background: #edf9f5; color: #075e49; font-size: 13px; line-height: 1.45; }
    .actions { display: flex; gap: 10px; padding: 0 16px 16px; }
    button { width: 100%; border: 0; border-radius: 999px; padding: 11px 14px; cursor: pointer; font: inherit; font-weight: 750; color: white; background: #171717; }
    .empty { padding: 28px 20px; text-align: center; color: #68635f; }
    @media (prefers-color-scheme: dark) {
      body { color: #f5f5f4; }
      .card { background: #1c1917; border-color: #44403c; }
      .stat { background: #292524; }
      .value { color: #c4b5fd; }
      .label { color: #a8a29e; }
      .row { border-color: #44403c; }
      .appointment { background: #063f33; color: #d1fae5; }
      button { color: #171717; background: #f5f5f4; }
    }
  </style>
</head>
<body>
  <main id="app" class="card"><div class="empty">Loading your Health Vault…</div></main>
  <script>
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const openVault = () => {
      const href = 'https://healthvault27.com';
      if (window.openai?.openExternal) window.openai.openExternal({ href });
      else window.open(href, '_blank', 'noopener,noreferrer');
    };
    function render() {
      const summary = window.openai?.toolOutput?.summary;
      if (!summary) return;
      const appointment = summary.nextAppointment;
      const checklist = summary.onboarding?.checklist ?? [];
      const appointmentHtml = appointment
        ? '<strong>' + esc(appointment.appointmentType || 'Appointment') + '</strong><br>'
          + esc(appointment.providerName || 'Provider') + ' · '
          + esc(new Date(appointment.scheduledAt).toLocaleString())
          + (appointment.location ? '<br>' + esc(appointment.location) : '')
        : 'No upcoming appointment is currently scheduled.';
      const checklistHtml = checklist.map((item) =>
        '<div class="row"><span>' + esc(item.label) + '</span><span class="status '
        + (item.complete ? '' : 'todo') + '">' + (item.complete ? 'Complete' : (item.optional ? 'Optional' : 'Needs attention'))
        + '</span></div>'
      ).join('');
      document.getElementById('app').innerHTML =
        '<header class="hero"><p class="eyebrow">Health Vault</p><h1>'
        + esc(summary.patientName || 'Your health dashboard')
        + '</h1><p class="subtitle">A private overview from your connected Health Vault account.</p></header>'
        + '<section class="stats" aria-label="Health summary">'
        + '<div class="stat"><span class="value">' + esc(summary.activeConditions) + '</span><span class="label">Active conditions</span></div>'
        + '<div class="stat"><span class="value">' + esc(summary.activeMedications) + '</span><span class="label">Active medications</span></div>'
        + '<div class="stat"><span class="value">' + esc(summary.allergies) + '</span><span class="label">Allergies</span></div>'
        + '<div class="stat"><span class="value">' + esc(summary.healthRecords) + '</span><span class="label">Health records</span></div></section>'
        + '<section class="section"><h2>Next appointment</h2><div class="appointment">' + appointmentHtml + '</div></section>'
        + '<section class="section"><h2>Vault setup</h2>' + checklistHtml + '</section>'
        + '<div class="actions"><button id="open-vault">Open Health Vault</button></div>';
      document.getElementById('open-vault')?.addEventListener('click', openVault);
    }
    window.addEventListener('openai:set_globals', render);
    render();
  </script>
</body>
</html>`;
