interface InvitationDeliveryInput {
  email: string;
  invitationId: string;
  appUrl: string;
}

export interface InvitationDeliveryPlan {
  email: string;
  emailRedirectTo: string;
  shouldCreateUser: true;
}

export function createInvitationDeliveryPlan(input: InvitationDeliveryInput): InvitationDeliveryPlan {
  const email = input.email.trim().toLocaleLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('a valid email is required');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.invitationId)) {
    throw new Error('a valid invitation identifier is required');
  }

  let base: URL;
  try {
    base = new URL(input.appUrl);
  } catch {
    throw new Error('APP_URL must be a valid URL');
  }
  const isLocal = base.hostname === 'localhost' || base.hostname === '127.0.0.1';
  if (base.protocol !== 'https:' && !(isLocal && base.protocol === 'http:')) {
    throw new Error('invitation delivery requires HTTPS outside localhost');
  }
  base.pathname = `/provider/invitations/${input.invitationId}`;
  base.search = '';
  base.hash = '';

  return { email, emailRedirectTo: base.toString(), shouldCreateUser: true };
}
