export const DASHBOARD_WIDGET_URI = "ui://widget/health-vault-dashboard-v2.html";

export const DASHBOARD_WIDGET_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; color: #202528; background: transparent; }
    .card { border: 1px solid #e5e7e8; border-radius: 14px; background: #fff; overflow: hidden; box-shadow: 0 8px 28px rgba(28,37,44,.05); }
    .hero { padding: 22px 20px; color: white; background: #17213a; border-bottom: 3px solid #0b8063; }
    .eyebrow { margin: 0 0 7px; font-size: 11px; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; color: #9ee3cf; }
    h1 { margin: 0; font-size: 24px; letter-spacing: -.025em; line-height: 1.2; }
    .subtitle { margin: 7px 0 0; max-width: 52ch; font-size: 13px; line-height: 1.5; color: #cbd3e0; }
    .stats { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); border-bottom: 1px solid #e5e7e8; }
    .stat { padding: 16px; border-right: 1px solid #e5e7e8; background: #fbfcfc; }
    .stat:last-child { border-right: 0; }
    .value { display: block; font-size: 23px; font-weight: 720; letter-spacing: -.02em; color: #17213a; }
    .label { display: block; margin-top: 3px; font-size: 11px; line-height: 1.35; color: #687075; }
    .section { padding: 17px 18px 4px; }
    h2 { margin: 0 0 10px; font-size: 14px; letter-spacing: -.01em; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid #eceae8; font-size: 13px; }
    .status { flex: 0 0 auto; font-weight: 700; color: #008a68; }
    .status.todo { color: #9a5b00; }
    .appointment { padding: 13px 14px; border-left: 3px solid #0b8063; border-radius: 8px; background: #edf6f2; color: #145846; font-size: 13px; line-height: 1.5; }
    details { border-top: 1px solid #eceae8; }
    summary { cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; padding: 13px 0; font-size: 14px; font-weight: 750; }
    summary::-webkit-details-marker { display: none; }
    summary::after { content: '+'; color: #78716c; font-size: 18px; }
    details[open] summary::after { content: '−'; }
    .detail-list { display: grid; gap: 8px; padding: 0 0 13px; }
    .detail-item { padding: 10px 0; border-bottom: 1px solid #eceeef; font-size: 13px; line-height: 1.45; }
    .detail-item:last-child { border-bottom: 0; }
    .detail-item strong { display: block; }
    .meta { color: #68635f; font-size: 12px; }
    .actions { display: flex; gap: 10px; padding: 16px 18px 18px; }
    button { width: 100%; border: 0; border-radius: 8px; padding: 12px 14px; cursor: pointer; font: inherit; font-weight: 700; color: white; background: #17213a; transition: background .18s ease, transform .12s ease; }
    button:hover { background: #24304f; }
    button:active { transform: scale(.985); }
    .empty { padding: 28px 20px; text-align: center; color: #68635f; }
    @media (prefers-color-scheme: dark) {
      body { color: #f5f5f4; }
      body { color: #eef1f3; }
      .card { background: #15191c; border-color: #343a3e; box-shadow: none; }
      .hero { background: #17213a; border-bottom-color: #30b792; }
      .stats { border-color: #343a3e; }
      .stat { background: #191e21; border-color: #343a3e; }
      .value { color: #eef1f3; }
      .label, .meta { color: #9ea6aa; }
      .row, details, .detail-item { border-color: #343a3e; }
      .appointment { background: #163b32; color: #c7f2e4; border-left-color: #30b792; }
      button { color: #17213a; background: #f2f4f5; }
      button:hover { background: #dfe4e7; }
    }
    @media (max-width: 560px) {
      .stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
      .stat:nth-child(2) { border-right: 0; }
      .stat:nth-child(-n+2) { border-bottom: 1px solid #e5e7e8; }
    }
  </style>
</head>
<body>
  <main id="app" class="card"><div class="empty">Loading your Health Vault…</div></main>
  <script>
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const openVault = () => {
      const incomplete = window.openai?.toolOutput?.summary?.onboarding?.complete === false;
      const href = incomplete
        ? 'https://healthvault27.com/?app=onboarding&source=chatgpt'
        : 'https://healthvault27.com/?app=dashboard&source=chatgpt';
      if (window.openai?.openExternal) window.openai.openExternal({ href });
      else window.open(href, '_blank', 'noopener,noreferrer');
    };
    function render() {
      const summary = window.openai?.toolOutput?.summary;
      if (!summary) return;
      const appointment = summary.nextAppointment;
      const checklist = summary.onboarding?.checklist ?? [];
      const details = summary.details ?? {};
      const formatDate = (value) => value ? new Date(value + (String(value).length === 10 ? 'T00:00:00' : '')).toLocaleDateString() : '';
      const list = (rows, primary, secondary) => rows.length
        ? rows.map((row) => '<div class="detail-item"><strong>' + esc(primary(row)) + '</strong>'
          + (secondary(row) ? '<span class="meta">' + esc(secondary(row)) + '</span>' : '') + '</div>').join('')
        : '<div class="detail-item meta">Nothing recorded yet.</div>';
      const conditionHtml = list(details.conditions ?? [], (r) => r.name || 'Condition', (r) => [r.notes, r.managing_physician ? 'Managed by ' + r.managing_physician : '', formatDate(r.diagnosed_on)].filter(Boolean).join(' · '));
      const medicationHtml = list(details.medications ?? [], (r) => r.name || 'Medication', (r) => [r.dosage, r.frequency, r.prescribed_by ? 'Prescribed by ' + r.prescribed_by : ''].filter(Boolean).join(' · '));
      const allergyHtml = list(details.allergies ?? [], (r) => r.allergen || 'Allergy', (r) => [r.reaction, r.severity].filter(Boolean).join(' · '));
      const recordHtml = list(details.recentRecords ?? [], (r) => r.title || r.kind || 'Health record', (r) => [r.provider_name, formatDate(r.service_date || r.received_at)].filter(Boolean).join(' · '));
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
        + '<section class="section"><h2>Your health details</h2>'
        + '<details><summary>Active conditions</summary><div class="detail-list">' + conditionHtml + '</div></details>'
        + '<details><summary>Medications</summary><div class="detail-list">' + medicationHtml + '</div></details>'
        + '<details><summary>Allergies</summary><div class="detail-list">' + allergyHtml + '</div></details>'
        + '<details><summary>Recent records</summary><div class="detail-list">' + recordHtml + '</div></details></section>'
        + '<section class="section"><h2>Vault setup</h2>' + checklistHtml + '</section>'
        + '<div class="actions"><button id="open-vault">Open Health Vault</button></div>';
      document.getElementById('open-vault')?.addEventListener('click', openVault);
    }
    window.addEventListener('openai:set_globals', render);
    render();
  </script>
</body>
</html>`;
