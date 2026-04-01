export interface LabValues {
  [key: string]: {
    value: number | string;
    unit?: string;
    refRange?: string;
    flag?: 'H' | 'L' | 'N';
  };
}

export function summarizeLabTemplate(values: LabValues): string {
  const prompt = `Summarize these lab results in plain language for a patient:

${Object.entries(values).map(([name, data]) =>
  `${name}: ${data.value}${data.unit ? ' ' + data.unit : ''} ${data.refRange ? '(ref: ' + data.refRange + ')' : ''} ${data.flag ? '[' + data.flag + ']' : ''}`
).join('\n')}

Highlight any abnormal values and explain their clinical significance.`;

  return prompt;
}

export function summarizeImagingTemplate(findings: string, impression: string): string {
  return `Translate this radiology report into patient-friendly language:

FINDINGS: ${findings}

IMPRESSION: ${impression}

Explain what was found and what it means for the patient's health.`;
}

export function comparePanelsTemplate(current: LabValues, previous: LabValues): string {
  return `Compare these two sets of lab results and note any significant changes:

PREVIOUS RESULTS:
${Object.entries(previous).map(([name, data]) =>
  `${name}: ${data.value}${data.unit ? ' ' + data.unit : ''}`
).join('\n')}

CURRENT RESULTS:
${Object.entries(current).map(([name, data]) =>
  `${name}: ${data.value}${data.unit ? ' ' + data.unit : ''}`
).join('\n')}

Identify trends (improving, worsening, stable) and clinical implications.`;
}

export function explainRecordTemplate(recordType: string, content: string): string {
  return `Explain this ${recordType} in simple terms:

${content}

What does this mean for the patient? What should they know or do?`;
}

export function searchRecordsPrompt(query: string): string {
  return `Find health records matching: "${query}"

Search by: document type, provider, diagnosis, date, or keywords.`;
}
