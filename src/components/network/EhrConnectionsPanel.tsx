import { useCallback, useEffect, useState } from 'react';
import { Building2, Link2, Loader2, RefreshCw, Unplug } from 'lucide-react';
import {
  disconnectEhrConnection,
  getSyncStatus,
  listEhrConnections,
  syncFhirConnection,
  type EhrConnection,
  type SyncStatusResult,
} from '../../lib/network/ehr-connections';

interface EhrConnectionsPanelProps {
  onConnect?: () => void;
  onConnectionChange?: () => void;
}

function formatSyncTime(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Connected';
    case 'pending': return 'Pending';
    case 'revoked': return 'Disconnected';
    case 'expired': return 'Expired';
    default: return status;
  }
}

export function EhrConnectionsPanel({ onConnect, onConnectionChange }: EhrConnectionsPanelProps) {
  const [connections, setConnections] = useState<EhrConnection[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [conns, sync] = await Promise.all([
        listEhrConnections(),
        getSyncStatus(),
      ]);
      setConnections(conns.filter((c) => c.status !== 'revoked'));
      setSyncStatus(sync);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSync = async (connectionId: string) => {
    setSyncingId(connectionId);
    setError(null);
    try {
      await syncFhirConnection(connectionId);
      await load();
      onConnectionChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Disconnect this provider? You can reconnect later.')) return;
    setDisconnectingId(connectionId);
    try {
      await disconnectEhrConnection(connectionId);
      await load();
      onConnectionChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setDisconnectingId(null);
    }
  };

  return (
    <section className="mb-8 rounded-2xl border border-stroke-subtle bg-surface-raised p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Connected Providers
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Digital EHR connections for automatic record import.
            {syncStatus?.lastSyncedAt && (
              <> Last sync: {formatSyncTime(syncStatus.lastSyncedAt)}.</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-stroke-default rounded-lg text-content-secondary hover:bg-action-secondary transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {onConnect && (
            <button
              type="button"
              onClick={onConnect}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-action-primary text-content-on-action rounded-lg font-medium hover:bg-action-primary-hover transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Connect
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-content-secondary py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading connections…
        </div>
      ) : connections.length === 0 ? (
        <p className="text-sm text-content-secondary py-2">
          No digital provider connections yet. Connect a hospital or clinic to import records automatically, or use Request Manually for email-based requests.
        </p>
      ) : (
        <ul className="space-y-3">
          {connections.map((conn) => (
            <li
              key={conn.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl border border-stroke-subtle bg-surface-sunken/50"
            >
              <div className="min-w-0">
                <p className="font-medium text-content-primary truncate">{conn.providerName}</p>
                <p className="text-xs text-content-secondary mt-0.5">
                  {statusLabel(conn.status)}
                  {conn.ehrSource ? ` · ${conn.ehrSource}` : ''}
                  {conn.lastSyncedAt ? ` · Synced ${formatSyncTime(conn.lastSyncedAt)}` : ''}
                </p>
              </div>
              {conn.status !== 'revoked' && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {conn.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleSync(conn.id)}
                      disabled={syncingId === conn.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-stroke-default rounded-lg text-content-secondary hover:bg-action-secondary transition-colors"
                    >
                      {syncingId === conn.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Sync
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDisconnect(conn.id)}
                    disabled={disconnectingId === conn.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-stroke-default rounded-lg text-content-secondary hover:bg-action-secondary transition-colors"
                  >
                    {disconnectingId === conn.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Unplug className="w-3.5 h-3.5" />
                    )}
                    Disconnect
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
