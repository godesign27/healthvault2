import { useActionFeedback } from '../hooks/useActionFeedback';
import { X, CreditCard as Edit, Share2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FormTemplateDef } from '../lib/forms/catalog';
import { FormResponseRow, isResponseComplete, saveFormResponse } from '../lib/forms/responses';
import {
  FormAutofillContext,
  buildAutofillAnswers,
  mergeFormAnswers,
} from '../lib/forms/autopopulate';

interface FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  template: FormTemplateDef;
  patientProfileId: string | null;
  response?: FormResponseRow;
  autofillContext?: FormAutofillContext | null;
  darkMode?: boolean;
  onSaved?: () => void | Promise<void>;
  onShareClick?: () => void;
}

function mergedAnswers(
  template: FormTemplateDef,
  response: FormResponseRow | undefined,
  autofillContext: FormAutofillContext | null | undefined,
): Record<string, string> {
  const saved = (response?.answers_json as Record<string, string>) || {};
  if (!autofillContext) return { ...saved };
  const autofill = buildAutofillAnswers(template, autofillContext);
  return mergeFormAnswers(saved, autofill);
}

export function FormDrawer({
  isOpen,
  onClose,
  template,
  patientProfileId,
  response,
  autofillContext,
  darkMode = false,
  onSaved,
  onShareClick,
}: FormDrawerProps) {
  const { notify, feedback } = useActionFeedback();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const complete = isResponseComplete(response);

  // Merge saved answers with profile autofill whenever the drawer opens.
  useEffect(() => {
    if (isOpen) {
      setFormData(mergedAnswers(template, response, autofillContext));
      setIsEditing(false);
    }
  }, [isOpen, response, template, autofillContext]);

  const handleSave = async () => {
    if (!patientProfileId) {
      notify('Could not resolve your patient profile. Please refresh and try again.', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveFormResponse({
        patientProfileId,
        templateId: template.id,
        answers: formData,
      });
      setIsEditing(false);
      if (onSaved) await onSaved();
      notify('Form saved.');
    } catch (err: any) {
      console.error('Failed to save form:', err);
      notify(err instanceof Error ? err.message : 'Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(mergedAnswers(template, response, autofillContext));
  };

  if (!isOpen) return null;

  return (
    <>
      {feedback}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={template.title}
        className="fixed top-0 right-0 h-full w-full max-w-2xl z-50 shadow-2xl transform transition-transform"
        style={{
          backgroundColor: 'var(--hv-color-surface-raised)',
          isolation: 'isolate',
        }}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b flex items-start justify-between border-stroke-subtle">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-content-primary">{template.title}</h2>
                {complete ? (
                  <span className="px-3 py-1 bg-surface-feedback-success text-content-on-action text-xs font-medium rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-surface-feedback-warning text-content-on-action text-xs font-medium rounded-lg flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Incomplete
                  </span>
                )}
              </div>
              <p className="text-sm text-content-secondary">{template.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors border-stroke-default text-content-primary hover:bg-surface-sunken"
                >
                  <Edit className="w-4 h-4" />
                  {complete ? 'Edit' : 'Fill Out'}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors hover:bg-surface-sunken text-content-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {template.fields.map((field) => {
                const value = formData[field.key] ?? '';
                return (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-2 text-content-primary">
                      {field.label}
                    </label>
                    {isEditing ? (
                      field.type === 'textarea' ? (
                        <textarea
                          value={value}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          rows={3}
                          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                            darkMode
                              ? 'bg-surface-sunken border-stroke-default text-content-primary placeholder:text-content-secondary'
                              : 'bg-surface-raised border-stroke-default text-content-primary placeholder:text-content-secondary'
                          }`}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={value}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                            darkMode
                              ? 'bg-surface-sunken border-stroke-default text-content-primary'
                              : 'bg-surface-raised border-stroke-default text-content-primary'
                          }`}
                        >
                          <option value="">Select...</option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={value}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                            darkMode
                              ? 'bg-surface-sunken border-stroke-default text-content-primary placeholder:text-content-secondary'
                              : 'bg-surface-raised border-stroke-default text-content-primary placeholder:text-content-secondary'
                          }`}
                        />
                      )
                    ) : (
                      <div className="text-sm text-content-primary">
                        {value || <span className="text-content-tertiary">Not provided</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>



          <div className="px-6 py-4 border-t flex items-center justify-between border-stroke-subtle">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors text-content-primary hover:bg-surface-sunken disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-action-primary text-content-on-action rounded-lg text-sm font-medium hover:bg-action-primary transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors text-content-primary hover:bg-surface-sunken"
                >
                  Close
                </button>
                {complete && onShareClick && (
                  <button
                    onClick={onShareClick}
                    className="px-6 py-2.5 bg-action-primary text-content-on-action rounded-lg text-sm font-medium hover:bg-action-primary transition-colors flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
