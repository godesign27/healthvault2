import { PopupMenu } from '../ui/PopupMenu';
import { Dialog } from '../ui/Dialog';
import {useId, useRef, useState} from 'react';
import {insuranceProviderInitials,displayInsuranceMemberId,insuranceCoverageStatus,formatInsuranceDate} from '../../../packages/api-client/src/insurance-status';
import { MoreHorizontal, Star } from 'lucide-react';
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
  const [confirmRemoval, setConfirmRemoval] = useState(false);
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
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-overlay text-content-primary text-xs font-medium rounded">
                  Stopped
                </span>
              )}
              {coverage.isPrimary && !isStopped && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-action-primary text-content-on-action text-xs font-medium rounded">
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
      {showActions && <div className="border-t border-stroke-default px-6 py-3">
        <PopupMenu align="start" trigger={<button type="button" disabled={busy} className="min-h-12 rounded-lg px-3 text-sm text-content-secondary hover:bg-surface-sunken" aria-label={`More options for ${coverage.provider.name}`}><MoreHorizontal className="h-5 w-5" aria-hidden="true" /></button>} items={[
          ...(!isStopped && onEdit ? [{label:'Edit coverage',onClick:() => onEdit(coverage),disabled:busy}] : []),
          ...(!isStopped && !coverage.isPrimary && onSetPrimary ? [{label:'Set primary',onClick:() => onSetPrimary(coverage),disabled:busy}] : []),
          ...(!isStopped && onStopCoverage ? [{label:'Stop coverage',onClick:() => onStopCoverage(coverage),disabled:busy}] : []),
          ...(isStopped && onResumeCoverage ? [{label:'Resume coverage',onClick:() => onResumeCoverage(coverage),disabled:busy}] : []),
          ...(onDelete ? [{label:'Remove coverage',onClick:() => setConfirmRemoval(true),disabled:busy}] : []),
        ]} />
      </div>}
      {confirmRemoval && <Dialog isOpen onClose={() => { if (!busy) setConfirmRemoval(false); }} title="Remove saved coverage?" footerContent={<>
        <button type="button" disabled={busy} className="min-h-12 px-4 text-content-primary" onClick={() => setConfirmRemoval(false)}>Keep coverage</button>
        <button type="button" disabled={busy} className="min-h-12 rounded-lg bg-action-primary px-4 text-content-on-action" onClick={() => { setConfirmRemoval(false); onDelete?.(coverage); }}>Remove coverage</button>
      </>}><p className="text-content-secondary">Remove this saved coverage from Health Vault? This does not cancel your insurance.</p></Dialog>}
    </Card>
  );
}
