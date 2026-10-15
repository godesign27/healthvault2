import { formatRecordDate } from '../../../packages/api-client/src/record-date';
import { FileText, Image, FlaskConical, Stethoscope, Link2, Upload, Database } from 'lucide-react';
import { HealthRecord, RecordKind, RecordSource } from '../../lib/records/types';

interface RecordCardProps {
  record: HealthRecord;
  darkMode?: boolean;
  onClick?: () => void;
}

function getKindIcon(kind: RecordKind) {
  switch (kind) {
    case RecordKind.Lab:
      return FlaskConical;
    case RecordKind.Imaging:
      return Image;
    case RecordKind.Pathology:
      return FlaskConical;
    case RecordKind.SpecialistReport:
      return Stethoscope;
    default:
      return FileText;
  }
}

function getKindColor(kind: RecordKind, darkMode: boolean) {
  const colors = {
    [RecordKind.Lab]: darkMode ? 'bg-surface-feedback-info text-content-feedback-info' : 'bg-surface-feedback-info text-content-feedback-info',
    [RecordKind.Imaging]: darkMode ? 'bg-surface-feedback-info text-content-feedback-info' : 'bg-surface-feedback-info text-content-feedback-info',
    [RecordKind.Pathology]: darkMode ? 'bg-surface-feedback-warning text-content-feedback-warning' : 'bg-surface-feedback-warning text-content-feedback-warning',
    [RecordKind.SpecialistReport]: darkMode ? 'bg-surface-feedback-info text-content-feedback-info' : 'bg-surface-feedback-info text-content-feedback-info',
    [RecordKind.Other]: darkMode ? 'bg-surface-sunken/10 text-content-secondary' : 'bg-surface-sunken text-content-secondary',
  };
  return colors[kind];
}

function getSourceBadge(source: RecordSource) {
  const badges = {
    [RecordSource.Connected]: { icon: Database, label: 'Connected', color: 'bg-surface-feedback-success text-content-feedback-success' },
    [RecordSource.Uploaded]: { icon: Upload, label: 'Uploaded', color: 'bg-surface-feedback-info text-content-feedback-info' },
    [RecordSource.Shared]: { icon: Link2, label: 'Shared', color: 'bg-surface-feedback-warning text-content-feedback-warning' },
  };
  return badges[source];
}

export function RecordCard({ record, darkMode = false, onClick }: RecordCardProps) {
  const Icon = getKindIcon(record.kind);
  const sourceBadge = getSourceBadge(record.source);
  const SourceIcon = sourceBadge.icon;

  return (
    <div
      onClick={onClick}
      className="hv-surface-card hv-surface-card--flat hv-surface-card--interactive p-4 cursor-pointer transition-all hover:[background:var(--hv-component-card-background-sunken)] hover:border-stroke-default"
    >
      <div className="flex gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${getKindColor(record.kind, darkMode)}`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold truncate ${
              'text-content-primary'
            }`}>
              {record.title}
            </h3>
            <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sourceBadge.color}`}>
              <SourceIcon className="w-3 h-3" />
              {sourceBadge.label}
            </span>
          </div>

          <div className={`flex items-center gap-2 text-sm mb-2 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>
            {record.providerName && (
              <span className="truncate">{record.providerName}</span>
            )}
            {record.serviceDate && (
              <>
                <span>•</span>
                <span>{formatRecordDate(record.serviceDate)}</span>
              </>
            )}
          </div>

          {record.aiSummary && (
            <div
              className={`text-sm p-2 rounded-lg border text-content-primary [background:var(--hv-component-card-background-sunken)] ${
                darkMode ? 'border-stroke-default' : 'border-stroke-subtle'
              }`}
            >
              <div className="flex items-start gap-1.5">
                <span className="text-xs font-medium text-content-feedback-success mt-0.5">AI</span>
                <p className="flex-1 line-clamp-2">{record.aiSummary}</p>
              </div>
            </div>
          )}

          {record.tags && record.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {record.tags.map((tag, i) => (
                <span
                  key={i}
                  className={`inline-block px-2 py-0.5 rounded text-xs ${
                    darkMode
                      ? 'bg-surface-sunken text-content-primary'
                      : 'bg-surface-sunken text-content-secondary'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
