import { Edit2, Trash2, RefreshCw, Star, StarOff, StopCircle, PlayCircle } from 'lucide-react';
import { CoverageWithProvider, maskMemberId } from '../../schemas/insurance';
import { StatusBadge } from './StatusBadge';

interface CoverageCardProps {
  coverage: CoverageWithProvider;
  darkMode?: boolean;
  showActions?: boolean;
  onEdit?: (coverage: CoverageWithProvider) => void;
  onDelete?: (coverage: CoverageWithProvider) => void;
  onSetPrimary?: (coverage: CoverageWithProvider) => void;
  onRefreshVerification?: (coverage: CoverageWithProvider) => void;
  onStopCoverage?: (coverage: CoverageWithProvider) => void;
  onResumeCoverage?: (coverage: CoverageWithProvider) => void;
}

export function CoverageCard({
  coverage,
  darkMode = false,
  showActions = true,
  onEdit,
  onDelete,
  onSetPrimary,
  onRefreshVerification,
  onStopCoverage,
  onResumeCoverage,
}: CoverageCardProps) {
  const effectiveEndDate = coverage.effectiveEnd ? new Date(coverage.effectiveEnd) : null;
  const isExpiringSoon = effectiveEndDate && effectiveEndDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  const isStopped = coverage.coverageStatus === 'stopped';

  return (
    <div className={`rounded-xl border p-6 ${
      isStopped
        ? darkMode ? 'border-stroke-subtle bg-surface-raised/50 opacity-75' : 'border-stroke-default bg-white/50 opacity-75'
        : darkMode ? 'border-stroke-default bg-surface-raised' : 'border-stroke-subtle bg-white'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          {coverage.provider.logoUrl && (
            <img
              src={coverage.provider.logoUrl}
              alt={coverage.provider.name}
              className="w-12 h-12 rounded-lg"
            />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
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
        <StatusBadge status={isExpiringSoon ? 'expiring' : coverage.verificationStatus} darkMode={darkMode} />
      </div>

      <div className={`grid grid-cols-2 gap-4 mb-4 ${
        darkMode ? 'text-content-primary' : 'text-content-primary'
      }`}>
        <div>
          <p className={`text-xs mb-1 ${
            darkMode ? 'text-content-secondary' : 'text-content-secondary'
          }`}>Member ID</p>
          <p className="font-mono text-sm">{maskMemberId(coverage.memberId || '')}</p>
        </div>
        {coverage.groupNumber && (
          <div>
            <p className={`text-xs mb-1 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>Group Number</p>
            <p className="font-mono text-sm">{coverage.groupNumber}</p>
          </div>
        )}
        {coverage.bin && (
          <div>
            <p className={`text-xs mb-1 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>BIN</p>
            <p className="font-mono text-sm">{coverage.bin}</p>
          </div>
        )}
        {coverage.pcn && (
          <div>
            <p className={`text-xs mb-1 ${
              darkMode ? 'text-content-secondary' : 'text-content-secondary'
            }`}>PCN</p>
            <p className="font-mono text-sm">{coverage.pcn}</p>
          </div>
        )}
      </div>

      <div className={`text-xs mb-4 ${
        darkMode ? 'text-content-secondary' : 'text-content-secondary'
      }`}>
        Effective: {new Date(coverage.effectiveStart).toLocaleDateString()}
        {effectiveEndDate && ` - ${effectiveEndDate.toLocaleDateString()}`}
      </div>

      {showActions && (
        <div className="flex items-center gap-2 pt-4 border-t border-stroke-default">
          {!isStopped && (
            <>
              {!coverage.isPrimary && onSetPrimary && (
                <button
                  onClick={() => onSetPrimary(coverage)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'text-content-primary hover:bg-surface-sunken'
                      : 'text-content-primary hover:bg-surface-overlay'
                  }`}
                >
                  <StarOff className="w-4 h-4" />
                  Set Primary
                </button>
              )}
              {onRefreshVerification && (
                <button
                  onClick={() => onRefreshVerification(coverage)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'text-content-primary hover:bg-surface-sunken'
                      : 'text-content-primary hover:bg-surface-overlay'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Verify
                </button>
              )}
              {onStopCoverage && (
                <button
                  onClick={() => onStopCoverage(coverage)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'text-orange-400 hover:bg-surface-sunken'
                      : 'text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <StopCircle className="w-4 h-4" />
                  Stop Coverage
                </button>
              )}
            </>
          )}
          {isStopped && onResumeCoverage && (
            <button
              onClick={() => onResumeCoverage(coverage)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'text-green-400 hover:bg-surface-sunken'
                  : 'text-green-600 hover:bg-green-50'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              Resume Coverage
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(coverage)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
