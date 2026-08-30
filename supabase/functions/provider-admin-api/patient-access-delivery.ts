const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildDigestDeliveryJobs(invitations: Array<{ id: string; email: string }>) {
  const grouped = new Map<string, string[]>();
  for (const invitation of invitations) {
    if (!UUID_PATTERN.test(invitation.id)) throw new Error('invitation id must be a valid UUID');
    const email = invitation.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320) throw new Error('email must be a valid address');
    grouped.set(email, [...(grouped.get(email) ?? []), invitation.id]);
  }
  return [...grouped.entries()].map(([recipientEmail, invitationIds]) => ({ recipientEmail, invitationIds, invitationCount: invitationIds.length }));
}
