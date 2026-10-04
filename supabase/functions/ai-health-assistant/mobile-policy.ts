// Explicit allowlist: new tools are unavailable to mobile until reviewed.
export const MOBILE_READ_TOOLS = new Set([
  'getMedicalHistory', 'getHealthRecords', 'getUserCoverages', 'getMedications', 'getCareTeam',
]);
export function toolAllowed(name: string, readOnly: boolean): boolean {
  return !readOnly || MOBILE_READ_TOOLS.has(name);
}
export const MOBILE_READ_ONLY_VERSION = 1;
