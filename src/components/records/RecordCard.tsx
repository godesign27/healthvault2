import { FileText, Image, FlaskConical, Stethoscope, File, Link2, Upload, Database } from 'lucide-react';
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
    [RecordKind.Lab]: darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
    [RecordKind.Imaging]: darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600',
    [RecordKind.Pathology]: darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600',
    [RecordKind.SpecialistReport]: darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-600',
    [RecordKind.Other]: darkMode ? 'bg-stone-500/10 text-stone-400' : 'bg-stone-50 text-stone-600',
  };
  return colors[kind];
}

function getSourceBadge(source: RecordSource) {
  const badges = {
    [RecordSource.Connected]: { icon: Database, label: 'Connected', color: 'bg-emerald-100 text-emerald-700' },
    [RecordSource.Uploaded]: { icon: Upload, label: 'Uploaded', color: 'bg-blue-100 text-blue-700' },
    [RecordSource.Shared]: { icon: Link2, label: 'Shared', color: 'bg-amber-100 text-amber-700' },
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
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        darkMode
          ? 'border-stone-700 bg-stone-800/50 hover:bg-stone-800 hover:border-stone-600'
          : 'border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300'
      }`}
    >
      <div className="flex gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${getKindColor(record.kind, darkMode)}`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold truncate ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>
              {record.title}
            </h3>
            <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sourceBadge.color}`}>
              <SourceIcon className="w-3 h-3" />
              {sourceBadge.label}
            </span>
          </div>

          <div className={`flex items-center gap-2 text-sm mb-2 ${
            darkMode ? 'text-stone-400' : 'text-stone-600'
          }`}>
            {record.providerName && (
              <span className="truncate">{record.providerName}</span>
            )}
            {record.serviceDate && (
              <>
                <span>•</span>
                <span>{new Date(record.serviceDate).toLocaleDateString()}</span>
              </>
            )}
          </div>

          {record.aiSummary && (
            <div className={`text-sm p-2 rounded border ${
              darkMode
                ? 'bg-stone-900/50 border-stone-700 text-stone-300'
                : 'bg-stone-50 border-stone-200 text-stone-700'
            }`}>
              <div className="flex items-start gap-1.5">
                <span className="text-xs font-medium text-emerald-500 mt-0.5">AI</span>
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
                      ? 'bg-stone-700 text-stone-300'
                      : 'bg-stone-100 text-stone-600'
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
