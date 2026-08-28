export const HEALTH_VAULT_WEB_URL = "https://healthvault.me";

type ChecklistItem = {
  key: string;
  label: string;
  complete: boolean;
  optional?: boolean;
};

type OnboardingSummary = {
  activeConditions: number;
  activeMedications: number;
  allergies: number;
  healthRecords: number;
  onboarding?: {
    complete?: boolean;
    checklist?: ChecklistItem[];
  };
};

export type OnboardingAction = {
  label: string;
  description: string;
  href?: string;
  prompt?: string;
};

export function buildOnboardingStatus(summary: OnboardingSummary) {
  const checklist = summary.onboarding?.checklist ?? [];
  const complete = (key: string) => Boolean(checklist.find((item) => item.key === key)?.complete);
  const hasHealthContext =
    summary.activeConditions + summary.activeMedications + summary.allergies + summary.healthRecords > 0;
  const secureProfileComplete = complete("email") && complete("identity");
  const preferencesComplete = complete("preferences");
  const snapshotReady = secureProfileComplete && hasHealthContext;

  const stages = [
    {
      key: "connected",
      label: "Connect Health Vault",
      description: "Your private Health Vault account is connected to ChatGPT.",
      complete: true,
    },
    {
      key: "profile",
      label: "Secure your profile",
      description: "Verify your email and complete private identity details in Health Vault.",
      complete: secureProfileComplete,
    },
    {
      key: "foundation",
      label: "Add health context",
      description: "Add one medication, allergy, condition, record, or health fact with confirmation.",
      complete: hasHealthContext,
    },
    {
      key: "preferences",
      label: "Choose assistant preferences",
      description: "Set how the Health Vault assistant should support you.",
      complete: preferencesComplete,
    },
    {
      key: "snapshot",
      label: "Review your first snapshot",
      description: "See the immediate value of the health context you have contributed.",
      complete: snapshotReady,
    },
  ];

  const recommendedAction: OnboardingAction = !complete("email")
    ? {
        label: "Verify email",
        description: "Continue the secure account flow in Health Vault.",
        href: `${HEALTH_VAULT_WEB_URL}/?app=onboarding&step=start&source=chatgpt`,
      }
    : !complete("identity")
      ? {
          label: "Complete secure profile",
          description: "Add identity details privately in Health Vault, not in chat.",
          href: `${HEALTH_VAULT_WEB_URL}/?app=onboarding&step=identity&source=chatgpt`,
        }
      : !hasHealthContext
        ? {
            label: "Add health information",
            description: "Return to chat and add a medication, allergy, condition, record, or health fact.",
            prompt: "Health Vault, help me add my first health fact.",
          }
        : !preferencesComplete
          ? {
              label: "Choose preferences",
              description: "Set assistant preferences securely in Health Vault.",
              href: `${HEALTH_VAULT_WEB_URL}/?app=onboarding&step=preferences&source=chatgpt`,
            }
          : {
              label: "Review health snapshot",
              description: "Your first Health Vault snapshot is ready.",
              prompt: "Health Vault, show me what you know about me.",
            };

  return {
    complete: stages.every((stage) => stage.complete),
    completedCount: stages.filter((stage) => stage.complete).length,
    totalCount: stages.length,
    stages,
    recommendedAction,
    optionalActions: [
      {
        label: complete("insurance") ? "Insurance added" : "Add insurance",
        description: complete("insurance")
          ? "Your insurance step is complete."
          : "Optional: add coverage details securely in Health Vault.",
        href: complete("insurance")
          ? undefined
          : `${HEALTH_VAULT_WEB_URL}/?app=onboarding&step=insurance&source=chatgpt`,
      },
    ],
  };
}
