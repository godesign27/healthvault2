import {useId, useRef, useState} from 'react';
import {insuranceProviderInitials,displayInsuranceMemberId,insuranceCoverageStatus,formatInsuranceDate} from '../../../packages/api-client/src/insurance-status';
import { Edit2, Trash2, Star, StarOff, StopCircle, PlayCircle } from 'lucide-react';
import { CoverageWithProvider } from '../../schemas/insurance';
import { StatusBadge } from './StatusBadge';
import { Card } from '../ui/Card';

interface CoverageCardProps {
  coverage: CoverageWithProvider;
  darkMode?: boolean;
  showActions?: boolean;
  busy?: boolean;
  onSaveMemberId?: (coverage: CoverageWithProvider, value: string) => Promise<boolean>;
  onEdit?: (coverage: CoverageWithProvider) => void;
  onDelete?: (coverage: CoverageWithProvider) => void;
  onSetPrimary?: (coverage: CoverageWithProvider) => void;
  onStopCoverage?: (coverage: CoverageWithProvider) => void;
  onResumeCoverage?: (coverage: CoverageWithProvider) => void;
}

export function CoverageCard({
  coverage,
  darkMode = false,
  showActions = true,
  busy = false,
  onSaveMemberId,
  onEdit,
  onDelete,
  onSetPrimary,
  onStopCoverage,
  onResumeCoverage,
}: CoverageCardProps) {
  const memberFieldId = useId();
  const [editingMember, setEditingMember] = useState(false);
  const [memberDraft, setMemberDraft] = useState('');
  const restoreMemberFocus = useRef(false);
  const cancelMemberEdit = () => { restoreMemberFocus.current = true; setEditingMember(false); setMemberDraft(''); };
  const badgeStatus = insuranceCoverageStatus(coverage);
  const isStopped = coverage.coverageStatus === 'stopped';

  return (
    <Card
      shadow="blur"
      className="h-full"
      state="default"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between p-4 sm:p-6 pb-4">
        <div className="flex min-w-0 items-start gap-4">
          <div aria-hidden="true" className="w-12 h-12 shrink-0 rounded-lg bg-action-primary text-white flex items-center justify-center text-xl font-semibold">
            {insuranceProviderInitials(coverage.provider.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className={`font-semibold text-lg ${
                darkMode ? 'text-white' : 'text-content-primary'
              }`}>{coverage.provider.name}</h3>
              {isStopped && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-overlay text-white text-xs font-medium rounded">
                  Stopped
                </span>
              )}
              {coverage.isPrimary && !isStopped && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded">
                  <Star className="w-3 h-3 fill-current" />
                  Primary
                </span>
              )}
            </div>
            <p className={`text-sm ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>{coverage.planName}</p>
          </div>
        </div>
        <StatusBadge status={badgeStatus} darkMode={darkMode} />
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-6 pb-4 ${
        darkMode ? 'text-content-primary' : 'text-content-primary'
      }`}>
        <div className={editingMember ? "col-span-2" : undefined}>
          <p className={`text-xs mb-1 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>Member ID</p>
          <p className="font-mono text-sm break-words">{displayInsuranceMemberId(coverage.memberId)}</p>
          {showActions && onSaveMemberId && (editingMember ? (
            <form className="mt-3 space-y-3" onKeyDown={event => { if (event.key === 'Escape' && !busy) { event.preventDefault(); cancelMemberEdit(); } }} onSubmit={async event => {
              event.preventDefault();
              if (await onSaveMemberId(coverage, memberDraft)) {setEditingMember(false); setMemberDraft('');}
            }}>
              <label htmlFor={memberFieldId} className="block text-sm">Member ID from your insurance card</label>
              <input autoFocus id={memberFieldId} value={memberDraft} onChange={event => setMemberDraft(event.target.value)}
                required disabled={busy} autoComplete="off" spellCheck={false}
                className="w-full min-h-12 rounded-lg border border-current bg-surface-default px-3 text-content-primary" />
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={busy || !memberDraft.trim()} className="min-h-12 px-3 rounded-lg bg-action-primary text-white">Save ID</button>
                <button type="button" disabled={busy} className="min-h-12 px-3 rounded-lg text-content-primary" onClick={cancelMemberEdit}>Cancel</button>
              </div>
            </form>
          ) : <button ref={node => { if (node && restoreMemberFocus.current) { restoreMemberFocus.current = false; node.focus(); } }} disabled={busy} onClick={() => setEditingMember(true)} className="min-h-12 mt-2 px-3 rounded-lg text-content-primary underline">
            {coverage.memberId ? 'Update member ID' : 'Add member ID'}
          </button>)}
        </div>
        {coverage.groupNumber && (
          <div>
            <p className={`text-xs mb-1 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>Group Number</p>
            <p className="font-mono text-sm break-words">{coverage.groupNumber}</p>
          </div>
        )}
        {coverage.bin && (
          <div>
            <p className={`text-xs mb-1 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>BIN</p>
            <p className="font-mono text-sm break-words">{coverage.bin}</p>
          </div>
        )}
        {coverage.pcn && (
          <div>
            <p className={`text-xs mb-1 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>PCN</p>
            <p className="font-mono text-sm break-words">{coverage.pcn}</p>
          </div>
        )}
      </div>
      <div className={`px-6 pb-4 text-xs ${
        darkMode ? 'text-content-secondary' : 'text-content-secondary'
      }`}>
        Effective: {formatInsuranceDate(coverage.effectiveStart)}
        {coverage.effectiveEnd && ` - ${formatInsuranceDate(coverage.effectiveEnd)}`}
      </div>
      {showActions && (
        <div className="flex flex-wrap items-center gap-2 border-t border-stroke-default px-6 pb-2 pt-4">
          {!isStopped && (
            <>
              {onEdit && (
                <button disabled={busy}
                  onClick={() => onEdit(coverage)}
                  className={`flex min-h-12 items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus ${
                    darkMode
                      ? 'text-content-primary hover:bg-surface-sunken'
                      : 'text-content-primary hover:bg-surface-overlay'
                  }`}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {!coverage.isPrimary && onSetPrimary && (
                <button disabled={busy}
                  onClick={() => onSetPrimary(coverage)}
                  className={`flex min-h-12 items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus ${
                    darkMode
                      ? 'text-content-primary hover:bg-surface-sunken'
                      : 'text-content-primary hover:bg-surface-overlay'
                  }`}
                >
                  <StarOff className="w-4 h-4" />
                  Set Primary
                </button>
              )}
              {onStopCoverage && (
                <button disabled={busy}
                  onClick={() => onStopCoverage(coverage)}
                  className={`flex min-h-12 items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus ${
                    darkMode
                      ? 'text-orange-400 hover:bg-surface-sunken'
                      : 'text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <StopCircle className="w-4 h-4" />
                  Mark Stopped
                </button>
              )}
            </>
          )}
          {isStopped && onResumeCoverage && (
            <button disabled={busy}
              onClick={() => onResumeCoverage(coverage)}
              className={`flex min-h-12 items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus ${
                darkMode
                  ? 'text-green-400 hover:bg-surface-sunken'
                  : 'text-green-600 hover:bg-green-50'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              Mark Active
            </button>
          )}
          {onDelete && (
            <button disabled={busy}
              onClick={() => onDelete(coverage)}
              className="ml-auto flex min-h-12 items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
