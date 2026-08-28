export const DASHBOARD_WIDGET_URI = "ui://widget/health-vault-dashboard.html";

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
    .hero { display: flex; align-items: center; gap: 14px; padding: 22px 20px; color: white; background: #17213a; border-bottom: 3px solid #0b8063; }
    .avatar { width: 58px; height: 58px; flex: 0 0 58px; border: 2px solid rgba(255,255,255,.32); border-radius: 12px; object-fit: cover; background: #24304f; }
    .avatar-fallback { display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 750; color: #fff; }
    .avatar[hidden] { display: none; }
    .hero-copy { min-width: 0; }
    .eyebrow { margin: 0 0 7px; font-size: 11px; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; color: #9ee3cf; }
    h1 { margin: 0; font-size: 24px; letter-spacing: -.025em; line-height: 1.2; }
    .subtitle { margin: 7px 0 0; max-width: 52ch; font-size: 13px; line-height: 1.5; color: #cbd3e0; }
    .profile-meta { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 8px; color: #b9c4d5; font-size: 11px; }
    .verified { color: #9ee3cf; }
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
    .change-banner { margin: 16px 18px 0; padding: 12px 14px; border: 1px solid #a7e1cf; border-radius: 8px; background: #edf9f5; color: #145846; font-size: 12px; line-height: 1.45; }
    .change-banner strong { display: block; margin-bottom: 2px; }
    .detail-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 2px; }
    .detail-toolbar h2 { margin: 0; }
    .collapse-all { width: auto; padding: 6px 0; border-radius: 0; color: #2563eb; background: transparent; font-size: 12px; }
    .collapse-all:hover { color: #1d4ed8; background: transparent; text-decoration: underline; }
    .detail-section { padding: 0; border-top: 1px solid #eceae8; }
    summary { list-style: none; }
    summary::-webkit-details-marker { display: none; }
    .detail-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 14px 0 10px; color: inherit; cursor: pointer; text-align: left; }
    .detail-heading:hover { color: #2563eb; }
    .detail-heading:focus-visible { outline: 2px solid #0b8063; outline-offset: 3px; }
    .detail-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .detail-title h3 { margin: 0; font-size: 14px; font-weight: 750; }
    .detail-chevron { width: 16px; flex: 0 0 16px; color: #2563eb; font-size: 16px; line-height: 1; text-align: center; }
    .detail-chevron::before { content: '↓'; }
    details[open] > .detail-heading .detail-chevron::before { content: '↑'; }
    .detail-count { color: #78716c; font-size: 11px; }
    .detail-list { display: grid; padding: 6px 0 4px; }
    .detail-item { padding: 10px 0; border-bottom: 1px solid #eceeef; font-size: 13px; line-height: 1.45; }
    .detail-item:last-child { border-bottom: 0; }
    .detail-item strong { display: block; }
    .detail-item[hidden] { display: none; }
    .meta { color: #68635f; font-size: 12px; }
    .view-more { width: auto; margin: 2px 0 8px; padding: 5px 0; border-radius: 0; color: #2563eb; background: transparent; font-size: 12px; text-align: left; cursor: pointer; }
    .view-more:hover { color: #1d4ed8; background: transparent; text-decoration: underline; }
    .view-more-details .less-label, .medical-id-disclosure .less-label { display: none; }
    .view-more-details[open] .more-label, .medical-id-disclosure[open] .more-label { display: none; }
    .view-more-details[open] .less-label, .medical-id-disclosure[open] .less-label { display: inline; }
    .medical-id { margin-top: 10px; padding: 12px 14px; border: 1px solid #eceae8; border-radius: 8px; background: #fbfbfa; }
    .medical-id-note { margin: 0; color: #68635f; font-size: 11px; line-height: 1.45; }
    .medical-id-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 0 18px; margin-top: 8px; }
    .private-detail { padding: 9px 0; border-top: 1px solid #eceae8; font-size: 12px; }
    .private-detail span { display: block; color: #78716c; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
    .private-detail strong { display: block; margin-top: 2px; overflow-wrap: anywhere; }
    .medical-id-actions { display: flex; justify-content: flex-start; }
    .setup-disclosure { border-top: 1px solid #eceae8; }
    .setup-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 14px 0 10px; cursor: pointer; }
    .setup-heading:hover { color: #2563eb; }
    .setup-heading:focus-visible { outline: 2px solid #0b8063; outline-offset: 3px; }
    .setup-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .setup-title h2 { margin: 0; }
    .setup-chevron { width: 16px; flex: 0 0 16px; color: #2563eb; font-size: 16px; line-height: 1; text-align: center; }
    .setup-chevron::before { content: '↓'; }
    .setup-disclosure[open] .setup-chevron::before { content: '↑'; }
    .setup-progress { flex: 0 0 auto; color: #008a68; font-size: 12px; font-weight: 750; }
    .setup-panel { padding-bottom: 4px; }
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
      .row, .detail-section, .detail-item, .setup-disclosure { border-color: #343a3e; }
      .detail-count { color: #9ea6aa; }
      .collapse-all, .detail-heading:hover, .detail-chevron, .view-more, .setup-heading:hover, .setup-chevron { color: #8ab4ff; background: transparent; }
      .collapse-all:hover, .view-more:hover { color: #b8d1ff; background: transparent; }
      .view-more { color: #75d8ba; background: transparent; }
      .view-more:hover { color: #a2ead5; background: transparent; }
      .medical-id { background: #191e21; border-color: #343a3e; }
      .medical-id-note, .private-detail span { color: #9ea6aa; }
      .private-detail { border-color: #343a3e; }
      .appointment { background: #163b32; color: #c7f2e4; border-left-color: #30b792; }
      .change-banner { background: #163b32; border-color: #286c5a; color: #c7f2e4; }
      button { color: #17213a; background: #f2f4f5; }
      button:hover { background: #dfe4e7; }
    }
    @media (max-width: 560px) {
      .stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
      .stat:nth-child(2) { border-right: 0; }
      .stat:nth-child(-n+2) { border-bottom: 1px solid #e5e7e8; }
      .medical-id-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main id="app" class="card"><div class="empty">Loading your Health Vault…</div></main>
  <script>
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const uiState = { details: {}, viewMore: {}, medicalId: false, setupOpen: null };
    const openVault = () => {
      const href = 'https://healthvault.me/?app=dashboard&source=chatgpt';
      if (window.openai?.openExternal) window.openai.openExternal({ href });
      else window.open(href, '_blank', 'noopener,noreferrer');
    };
    function render() {
      const summary = window.openai?.toolOutput?.summary;
      if (!summary) return;
      const appointment = summary.nextAppointment;
      const checklist = summary.onboarding?.checklist ?? [];
      const details = summary.details ?? {};
      const profile = summary.profile ?? {};
      const privateProfile = profile.private ?? {};
      const recentChange = window.openai?.toolOutput?.recentChange;
      const responseMetadata = window.openai?.toolResponseMetadata ?? {};
      const hiddenMetadata = responseMetadata?.mcp_tool_result?._meta
        ?? responseMetadata?.call_tool_result?._meta
        ?? responseMetadata?._meta
        ?? responseMetadata;
      const profilePhotoSource = hiddenMetadata.profilePhotoDataUrl || profile.photoUrl;
      const formatDate = (value) => value ? new Date(value + (String(value).length === 10 ? 'T00:00:00' : '')).toLocaleDateString() : '';
      const initials = String(summary.patientName || 'Health Vault').split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
      const avatarHtml = profilePhotoSource
        ? '<img id="profile-photo" class="avatar" src="' + esc(profilePhotoSource) + '" alt="Profile photo">'
          + '<div id="profile-photo-fallback" class="avatar avatar-fallback" aria-hidden="true" hidden>' + esc(initials) + '</div>'
        : '<div class="avatar avatar-fallback" aria-hidden="true">' + esc(initials) + '</div>';
      const publicMeta = [
        profile.location ? '<span>' + esc(profile.location) + '</span>' : '',
        profile.identityVerified ? '<span class="verified">Identity verified</span>' : '',
      ].filter(Boolean).join('');
      const detailSection = (id, title, rows, primary, secondary) => {
        const previewLimit = 3;
        const item = (row) => '<div class="detail-item"><strong>' + esc(primary(row)) + '</strong>'
          + (secondary(row) ? '<span class="meta">' + esc(secondary(row)) + '</span>' : '') + '</div>';
        const items = rows.length
          ? rows.slice(0, previewLimit).map(item).join('')
          : '<div class="detail-item meta">Nothing recorded yet.</div>';
        const remaining = Math.max(0, rows.length - previewLimit);
        const control = remaining
          ? '<details class="view-more-details" data-view-more="' + id + '"' + (uiState.viewMore[id] ? ' open' : '') + '><summary class="view-more"><span class="more-label">View ' + remaining + ' more</span><span class="less-label">Show less</span></summary>'
            + rows.slice(previewLimit).map(item).join('') + '</details>'
          : '';
        return '<details class="detail-section" data-detail-section="' + id + '"' + (uiState.details[id] !== false ? ' open' : '') + '><summary class="detail-heading">'
          + '<span class="detail-title"><span class="detail-chevron" aria-hidden="true"></span><h3>' + esc(title) + '</h3></span><span class="detail-count">' + rows.length + ' recorded</span></summary>'
          + '<div class="detail-panel"><div class="detail-list">' + items + '</div>' + control + '</div></details>';
      };
      const conditionHtml = detailSection('conditions', 'Active conditions', details.conditions ?? [], (r) => r.name || 'Condition', (r) => [r.notes, r.managing_physician ? 'Managed by ' + r.managing_physician : '', formatDate(r.diagnosed_on)].filter(Boolean).join(' · '));
      const medicationHtml = detailSection('medications', 'Medications', details.medications ?? [], (r) => r.name || 'Medication', (r) => [r.dosage, r.frequency, r.prescribed_by ? 'Prescribed by ' + r.prescribed_by : ''].filter(Boolean).join(' · '));
      const allergyHtml = detailSection('allergies', 'Allergies', details.allergies ?? [], (r) => r.allergen || 'Allergy', (r) => [r.reaction, r.severity].filter(Boolean).join(' · '));
      const recordHtml = detailSection('records', 'Recent records', details.recentRecords ?? [], (r) => r.title || r.kind || 'Health record', (r) => [r.provider_name, formatDate(r.service_date || r.received_at)].filter(Boolean).join(' · '));
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
      const setupCompleteCount = checklist.filter((item) => item.complete).length;
      const setupPercent = checklist.length ? Math.round((setupCompleteCount / checklist.length) * 100) : 0;
      const setupComplete = checklist.length > 0 && setupCompleteCount === checklist.length;
      const setupOpen = uiState.setupOpen === null ? !setupComplete : uiState.setupOpen;
      const privateRows = [
        ['Date of birth', formatDate(privateProfile.dateOfBirth)],
        ['Email', privateProfile.email],
        ['Phone', privateProfile.phone],
        ['Address', privateProfile.address],
        ['Blood type', privateProfile.bloodType],
        ['Organ donor', privateProfile.organDonor === true ? 'Yes' : privateProfile.organDonor === false ? 'No' : null],
        ['Emergency contact', privateProfile.emergencyContact
          ? [privateProfile.emergencyContact.name, privateProfile.emergencyContact.relationship, privateProfile.emergencyContact.phone].filter(Boolean).join(' · ')
          : null],
      ].filter((entry) => entry[1]);
      const privateHtml = privateRows.length
        ? privateRows.map(([label, value]) => '<div class="private-detail"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>').join('')
        : '<div class="private-detail meta">No Medical ID details are on file.</div>';
      document.getElementById('app').innerHTML =
        '<header class="hero">' + avatarHtml + '<div class="hero-copy"><p class="eyebrow">Health Vault</p><h1>'
        + esc(summary.patientName || 'Your health dashboard')
        + '</h1><p class="subtitle">A private overview from your connected Health Vault account.</p>'
        + (publicMeta ? '<div class="profile-meta">' + publicMeta + '</div>' : '') + '</div></header>'
        + '<section class="stats" aria-label="Health summary">'
        + '<div class="stat"><span class="value">' + esc(summary.activeConditions) + '</span><span class="label">Active conditions</span></div>'
        + '<div class="stat"><span class="value">' + esc(summary.activeMedications) + '</span><span class="label">Active medications</span></div>'
        + '<div class="stat"><span class="value">' + esc(summary.allergies) + '</span><span class="label">Allergies</span></div>'
        + '<div class="stat"><span class="value">' + esc(summary.healthRecords) + '</span><span class="label">Health records</span></div></section>'
        + (recentChange ? '<div class="change-banner" role="status"><strong>' + esc(recentChange.title || 'Health Vault updated') + '</strong>' + esc(recentChange.message || 'Your dashboard now reflects the confirmed change.') + '</div>' : '')
        + '<section class="section"><h2>Next appointment</h2><div class="appointment">' + appointmentHtml + '</div></section>'
        + '<section class="section"><div class="detail-toolbar"><h2>Your health details</h2><button id="toggle-all-details" class="collapse-all">Collapse all</button></div>'
        + conditionHtml + medicationHtml + allergyHtml + recordHtml + '</section>'
        + '<section class="section"><h2>Medical ID</h2><div class="medical-id"><p class="medical-id-note">Private details stay concealed until you choose to show them. Check your surroundings before revealing.</p>'
        + '<details class="medical-id-disclosure"' + (uiState.medicalId ? ' open' : '') + '><summary class="view-more"><span class="more-label">Show Medical ID</span><span class="less-label">Hide Medical ID</span></summary>'
        + '<div class="medical-id-grid">' + privateHtml + '</div></details></div></section>'
        + '<section class="section"><details id="vault-setup" class="setup-disclosure"' + (setupOpen ? ' open' : '') + '><summary class="setup-heading">'
        + '<span class="setup-title"><span class="setup-chevron" aria-hidden="true"></span><h2>Vault setup</h2></span>'
        + '<span class="setup-progress">' + setupPercent + '%</span></summary><div class="setup-panel">' + checklistHtml + '</div></details></section>'
        + '<div class="actions"><button id="open-vault">Open Health Vault</button></div>';
      document.getElementById('open-vault')?.addEventListener('click', openVault);
      document.getElementById('profile-photo')?.addEventListener('error', (event) => {
        event.currentTarget.hidden = true;
        const fallback = document.getElementById('profile-photo-fallback');
        if (fallback) fallback.hidden = false;
      }, { once: true });
      const syncAllDetailsLabel = () => {
        const sections = [...document.querySelectorAll('[data-detail-section]')];
        const allExpanded = sections.every((section) => section.open);
        const control = document.getElementById('toggle-all-details');
        if (control) control.textContent = allExpanded ? 'Collapse all' : 'Expand all';
      };
      document.querySelectorAll('[data-detail-section]').forEach((section) => {
        section.addEventListener('toggle', () => {
          uiState.details[section.dataset.detailSection] = section.open;
          syncAllDetailsLabel();
        });
      });
      document.querySelectorAll('[data-view-more]').forEach((section) => {
        section.addEventListener('toggle', () => {
          uiState.viewMore[section.dataset.viewMore] = section.open;
        });
      });
      document.querySelector('.medical-id-disclosure')?.addEventListener('toggle', (event) => {
        uiState.medicalId = event.currentTarget.open;
      });
      document.getElementById('vault-setup')?.addEventListener('toggle', (event) => {
        uiState.setupOpen = event.currentTarget.open;
      });
      document.getElementById('toggle-all-details')?.addEventListener('click', () => {
        const sections = [...document.querySelectorAll('[data-detail-section]')];
        const shouldExpand = !sections.every((section) => section.open);
        sections.forEach((section) => {
          uiState.details[section.dataset.detailSection] = shouldExpand;
          section.open = shouldExpand;
        });
        syncAllDetailsLabel();
      });
    }
    window.addEventListener('openai:set_globals', render);
    render();
  </script>
</body>
</html>`;
