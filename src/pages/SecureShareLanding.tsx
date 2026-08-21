/**
 * Secure Share Landing Page
 *
 * IMPORTANT SECURITY NOTES:
 *
 * 1. Prevent caching of sensitive shared data
 *    Backend should set these headers:
 *    - Cache-Control: no-store, max-age=0
 *    - For Next.js API routes, also export:
 *      export const dynamic = 'force-dynamic';
 *      export const revalidate = 0;
 *      export const fetchCache = 'force-no-store';
 *
 * 2. PDF Integrity Footer
 *    TODO: Backend PDF generation should include on every page:
 *    "Digitally signed by Health Vault • Timestamp: [ISO timestamp]"
 *    (Use light gray text, small font, right-aligned)
 */

import { useEffect, useState } from 'react';
import { Clock, Shield, FileText, User, Building2, Calendar, AlertCircle, Lock, Download } from 'lucide-react';

type ShareStatus = 'pending' | 'delivered' | 'opened' | 'revoked' | 'expired';

type LandingSharePayload = {
  id: string;
  status: ShareStatus;
  patient: { id: string; name: string; birthDate?: string };
  recipient: { displayName: string; orgName?: string };
  forms: { id: string; title: string; version: string; signedAt?: string }[];
  files: { pdfUrl: string; bundleUrl?: string };
  expiresAt?: string;
  openedAt?: string;
  revokedAt?: string;
};

function StatusBadge({ status }: { status: ShareStatus }) {
  const baseClasses = 'inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium gap-1.5';

  switch (status) {
    case 'opened':
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800 border border-green-200`}>
          <Shield className="w-3 h-3" />
          Opened
        </span>
      );
    case 'delivered':
      return (
        <span className={`${baseClasses} bg-emerald-100 text-emerald-800 border border-emerald-200`}>
          <Shield className="w-3 h-3" />
          Delivered
        </span>
      );
    case 'revoked':
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800 border border-red-200`}>
          <Lock className="w-3 h-3" />
          Revoked
        </span>
      );
    case 'expired':
      return (
        <span className={`${baseClasses} bg-slate-200 text-slate-700 border border-slate-300`}>
          <Clock className="w-3 h-3" />
          Expired
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-slate-200 text-slate-700 border border-slate-300`}>
          Pending
        </span>
      );
  }
}

export default function SecureShareLanding() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LandingSharePayload | null>(null);
  const [accessLoggedAt, setAccessLoggedAt] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1];
    const token = url.searchParams.get('token');

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share/${id}?token=${encodeURIComponent(token || '')}`;
        const res = await fetch(apiUrl);

        if (res.status === 403) {
          throw new Error('Access to these forms has been revoked or the link is invalid.');
        }
        if (res.status === 410) {
          throw new Error('This share link has expired.');
        }
        if (!res.ok) {
          throw new Error(`Unable to load shared forms (${res.status}).`);
        }

        const payload = (await res.json()) as LandingSharePayload;
        setData(payload);

        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share/${payload.id}/opened`, {
          method: 'POST',
        })
          .then(() => {
            setAccessLoggedAt(new Date().toLocaleString());
          })
          .catch(() => {});
      } catch (e: any) {
        setError(e.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const isDisabled = data ? (data.status === 'revoked' || data.status === 'expired') : true;
  const hasMultipleForms = data && data.forms.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Full Width Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <img
                src="/hv_logo-light.png"
                alt="Health Vault Logo"
                className="h-9 w-9 sm:h-12 sm:w-12"
              />
              <h1 className="text-slate-900 text-2xl sm:text-3xl font-bold">Health Vault</h1>
            </div>
            {loading ? (
              <div className="h-8 w-24 rounded animate-pulse bg-slate-200"></div>
            ) : data ? (
              <StatusBadge status={data.status} />
            ) : null}
          </div>

          <h2 className="text-slate-900 flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5" /> Secure Form Share
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="space-y-4">
            <div className="h-5 w-96 rounded animate-pulse bg-slate-200"></div>
            <div className="h-32 w-full rounded-lg animate-pulse bg-white"></div>
            <div className="h-32 w-full rounded-lg animate-pulse bg-white"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-900 mb-1">Cannot open shared forms</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Revoked/Expired State */}
            {(data.status === 'revoked' || data.status === 'expired') ? (
              <div className="flex flex-col items-center justify-center py-16 opacity-60">
                <Lock className="h-12 w-12 mb-4 text-slate-400" />
                <h2 className="text-xl font-semibold mb-2 text-slate-700">
                  {data.status === 'revoked' ? 'Access revoked by patient' : 'This link has expired'}
                </h2>
                <p className="text-sm text-center max-w-md text-slate-500">
                  This form share is no longer available. Please contact the patient directly if you need access.
                </p>
              </div>
            ) : (
              <>
                {/* Instructional Text */}
                <p className="text-slate-600 mb-6">
                  Access the patient-authorized forms below. Download as a PDF packet or as a FHIR JSON bundle for EHR import.
                </p>

                {/* Intended Recipient */}
                <div className="hv-surface-card hv-surface-card--flat p-6 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Intended Recipient</span>
                    </div>
                    <div>
                      <p className="text-slate-900 text-xl font-bold">{data.recipient.displayName}</p>
                      {data.recipient.orgName && (
                        <div className="flex items-center gap-2 text-slate-600 mt-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="text-sm">{data.recipient.orgName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Patient Information - Emphasized */}
                <div className="bg-slate-900 rounded-lg shadow-sm border border-slate-800 p-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">Patient Information</span>
                    </div>
                    <div>
                      <p className="text-white text-xl font-bold">{data.patient.name}</p>
                      {data.patient.birthDate && (
                        <div className="flex items-center gap-2 text-slate-300 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-sm">DOB {data.patient.birthDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Link Expiration Notice */}
                {data.expiresAt && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3 text-amber-900">
                      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">
                        Link expires on <span className="font-medium">{new Date(data.expiresAt).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Included Forms */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-slate-900 text-lg font-semibold">Included Forms</h2>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {data.forms.length} {data.forms.length === 1 ? 'form' : 'forms'}
                      </span>
                    </div>
                    {hasMultipleForms && data.files.pdfUrl && (
                      <a
                        href={data.files.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download All Forms
                      </a>
                    )}
                  </div>

                  {/* Individual Form Cards */}
                  {data.forms.map((form) => (
                    <div key={form.id} className="hv-surface-card hv-surface-card--flat p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <h3 className="text-slate-900 font-semibold">{form.title}</h3>
                          <p className="text-sm text-slate-500">
                            v{form.version}
                            {form.signedAt && ` · signed ${new Date(form.signedAt).toLocaleString()}`}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 border border-slate-300 whitespace-nowrap">
                          PDF + FHIR
                        </span>
                      </div>

                      <div className="h-px bg-slate-200 mb-6"></div>

                      {/* Download Buttons */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <a
                          href={data.files.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </a>
                        <a
                          href={data.files.bundleUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                            data.files.bundleUrl
                              ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                          }`}
                          onClick={(e) => !data.files.bundleUrl && e.preventDefault()}
                        >
                          <Download className="w-4 h-4" />
                          Download FHIR Bundle (JSON)
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Provider Guidance Note */}
                <p className="text-xs text-slate-500 mb-6">
                  If your electronic health record (EHR) supports FHIR, you can import this JSON file directly.
                </p>

                {/* Footer Information */}
                <div className="pt-6">
                  {accessLoggedAt && (
                    <div className="flex items-start gap-3 text-slate-700 mb-4">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">
                        Opening this page records an access event for audit purposes. Access logged at {accessLoggedAt}.
                      </p>
                    </div>
                  )}
                  {/* TODO: Future enhancement - Mark as Received button for providers */}
                  {/* TODO: Future enhancement - Export Access Log option for patients */}
                </div>
              </>
            )}

            {/* Legal Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                This secure document and any attached files contain confidential health information shared with authorization from the patient through Health Vault.
                It is intended solely for the named recipient and may contain protected health information (PHI) governed by HIPAA and related privacy laws.
                Any unauthorized review, use, disclosure, or distribution is prohibited. If you received this in error, please notify{' '}
                <a href="mailto:support@healthvault.app" className="text-slate-900 hover:underline">
                  support@healthvault.app
                </a>{' '}
                and delete the message immediately.
              </p>
              <p className="text-xs text-slate-500">
                © 2025 Health Vault, Inc. All rights reserved. Health Vault™ and its associated logos are trademarks of Health Vault, Inc.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
