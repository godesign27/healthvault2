type Page = 'privacy' | 'terms' | 'support';

// Draft legal text: deployment for review does not approve these notices
// as final policy or binding terms. Retention and contractual review remain open.
const content: Record<Page, { title: string; sections: [string, string][] }> = {
  privacy: {
    title: 'Privacy notice',
    sections: [
      ['Your information in Health Vault', 'Health Vault is operated by GO Design, Inc., an Illinois corporation. Health Vault stores the information you provide to manage your personal Vault. This can include contact and profile information, medical records and uploaded files, conditions, medications, allergies, insurance details, form answers, appointments, and wellness entries. Connected providers and imports may supply information you choose to bring into your Vault.'],
      ['Who this release is for', 'The initial release is for adults age 18 and older managing their own personal Vault. Parent-managed, family and dependent accounts are not available in this release.'],
      ['How information is used', 'Information is used to provide account access, organize your records, prepare forms and summaries, carry out your requested imports and sharing, and operate and troubleshoot the service. AI-generated summaries and insights can be inaccurate and are not a substitute for professional care.'],
      ['ChatGPT and AI features', 'Connecting Health Vault to ChatGPT allows the connected app to retrieve information and perform supported actions on your behalf. Information returned to ChatGPT is also handled under your agreement and settings with that service. Disconnecting the app does not remove information already included in a conversation. AI features may send relevant information to the model provider to generate a response.'],
      ['Sharing and service providers', 'When you create a secure share, the selected information is made available through an expiring link. Anyone who receives a usable link may be able to access the shared information; do not forward it. Revocation stops future access through that link but cannot retrieve copies already downloaded. Health Vault uses infrastructure providers, including Supabase for account/data services, Cloudflare for hosting, and Resend for email delivery.'],
      ['Your controls', 'In Settings, Download My Data provides a JSON export of personal structured Vault data, including saved form answers and wellness entries. Original files, images and PDFs are downloaded separately from their records. Credentials and internal administrative records are excluded. Request Account Deletion submits a request for review and provides a status and reference. Submitting a request does not immediately erase data, revoke existing shares, or close the account.'],
      ['Retention and deletion review', 'Your deletion request requires review of personal Vault records, uploaded files, provider/consent records, access links and backup handling. The operator must confirm the scope, any required retention and the outcome of that review before recording a request as completed. No immediate-erasure or fixed backup-removal deadline is promised by this draft.'],
      ['Questions', 'Use the Support page for contact information. Do not send passwords, access links or medical documents in an initial support email.'],
    ],
  },
  terms: {
    title: 'Terms of use',
    sections: [
      ['About the service', 'Health Vault is operated by GO Design, Inc., an Illinois corporation. Health Vault provides tools to organize personal health information, prepare forms, track wellness information and share selected records. Feature availability may vary. This draft describes the service and requires operator review before publication as binding terms.'],
      ['Eligibility', 'The initial release is for adults age 18 and older managing their own personal Vault. Parent-managed, family and dependent accounts are not available in this release.'],
      ['No medical advice or emergency service', 'Health Vault and its AI features do not diagnose conditions or replace a licensed healthcare professional. Review important information with your clinician. Do not rely on Health Vault for emergency assistance.'],
      ['Your account and information', 'Use an account you are authorized to access. Provide information you have the right to store and share, review imported data and generated summaries for errors, and protect your sign-in credentials and shared links. Do not attempt to access another person’s records or bypass access controls.'],
      ['Confirmation and sharing', 'Review proposed changes before confirming them. A saved form is not necessarily a signed form. Sharing requires its own confirmation. Check the recipient, information included and expiration before sharing; a recipient can retain a copy even after the link expires or is revoked.'],
      ['Third-party services', 'Connected provider systems, ChatGPT, AI providers and email services have their own availability, functionality and terms. Health Vault cannot guarantee that imported information is complete or that an email will reach an inbox.'],
      ['Leaving the service', 'You can download personal structured data and submit an account deletion request in Settings. A deletion request is reviewed; it is not immediate erasure. Retention and provider-record obligations must be resolved before completion.'],
      ['Questions and unresolved terms', 'Contact information is on the Support page. Applicable jurisdiction, liability terms and retention disclosures require approval before these draft terms are finalized.'],
    ],
  },
  support: {
    title: 'Health Vault support',
    sections: [
      ['Contact', 'For help with Health Vault, operated by GO Design, Inc., contact team@healthvault.me. Include the feature you used, what happened, and the approximate time. Avoid including medical details in your first message.'],
      ['Business mailing address', 'GO Design, Inc., 26027 W. Brandt Rd, Barrington, IL 60010, USA.'],
      ['Account data', 'Open Settings to download your personal structured data or submit a deletion request for review. Keep the request reference so you can identify it when following up. A pending request does not mean your account has been deleted.'],
      ['Protect your information', 'Never email your password, authentication codes, access tokens, or private sharing links. Do not attach health records unless a secure process has been arranged.'],
      ['Medical emergencies', 'This contact is for product support, not medical care or emergencies. Seek appropriate emergency or professional medical help when needed.'],
    ],
  },
};

export function AccountPolicyPage({ page }: { page: Page }) {
  const { title, sections } = content[page];
  return <div className="min-h-screen bg-surface-base text-content-primary">
    <header className="border-b border-stroke-default"><div className="mx-auto max-w-3xl px-6 py-6 flex flex-wrap gap-4 justify-between"><a href="/" className="font-semibold text-xl">Health Vault</a><a href="/dashboard" className="underline">Open my Vault</a></div></header>
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
      <div><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-3 text-sm text-content-secondary">{page === 'support' ? 'Product and account assistance' : 'Draft for review · October 2, 2026 · Not approved as final policy'}</p></div>
      {sections.map(([heading, text]) => <section key={heading} id={heading === 'No medical advice or emergency service' ? 'medical-disclaimer' : undefined} className="space-y-3"><h2 className="text-xl font-semibold">{heading}</h2><p className="leading-7 text-content-secondary">{text}</p></section>)}
      {page === 'support' && <a className="inline-block rounded-lg border border-stroke-default px-5 py-3 underline" href="mailto:team@healthvault.me?subject=Health%20Vault%20support">Email Health Vault</a>}
    </main>
    <footer className="mx-auto max-w-3xl px-6 py-8 border-t border-stroke-default"><nav aria-label="Account policies" className="flex gap-6"><a href="/privacy" className="underline">Privacy</a><a href="/terms" className="underline">Terms</a><a href="/support" className="underline">Support</a></nav></footer>
  </div>;
}
