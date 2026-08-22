export type PageContext =
  | 'dashboard'
  | 'medical-forms'
  | 'health-records'
  | 'insurance'
  | 'medical-profile'
  | 'care'
  | 'network'
  | 'wellness'
  | 'vitals';

export const voiceMessages: Record<PageContext, string> = {
  dashboard: "This is your health dashboard. Want to review your records, check vitals, or manage your care?",

  'medical-forms': "This is your medical forms. Need help filling one out or sending it to a provider?",

  'health-records': "You're in your health records. Want me to review results or find something specific?",

  insurance: "This is your insurance page. Need help understanding coverage or adding a plan?",

  'medical-profile': "You're managing your medical profile. Want to add a condition, medication, or allergy?",

  care: "You're managing your care team. Want to schedule something or contact a provider?",

  network: "This is your healthcare network. Looking for a new provider or adding a pharmacy?",

  wellness: "This is your wellness log. Want to record a meal, review recent entries, or complete a Life Signal check-in?",

  vitals: "You're tracking your vitals. Want to record new measurements or review trends?"
};

export const getVoiceMessageForContext = (context: PageContext): string => {
  return voiceMessages[context] || voiceMessages.dashboard;
};

export const getGreetingForContext = (context: PageContext): string => {
  return voiceMessages[context] || voiceMessages.dashboard;
};
