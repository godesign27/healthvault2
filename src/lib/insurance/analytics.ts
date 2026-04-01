type InsuranceEvent =
  | 'insurance.connect.opened'
  | 'insurance.connect.success'
  | 'insurance.connect.failed'
  | 'insurance.verify.refresh'
  | 'insurance.onboarding.skipped'
  | 'insurance.set_primary'
  | 'insurance.edit'
  | 'insurance.delete';

interface AnalyticsEventData {
  providerId?: string;
  method?: 'oauth' | 'upload' | 'manual';
  duration_ms?: number;
  error_code?: string;
  coverage_id?: string;
  [key: string]: unknown;
}

export function emitInsuranceEvent(
  event: InsuranceEvent,
  data: AnalyticsEventData = {}
): void {
  const eventData = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  console.log('[Insurance Analytics]', eventData);

  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.track(event, eventData);
  }
}

export class InsuranceAnalytics {
  private startTime: number | null = null;

  startTimer(): void {
    this.startTime = Date.now();
  }

  getDuration(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  trackConnectOpened(providerId?: string): void {
    this.startTimer();
    emitInsuranceEvent('insurance.connect.opened', { providerId });
  }

  trackConnectSuccess(providerId: string, method: 'oauth' | 'upload' | 'manual'): void {
    emitInsuranceEvent('insurance.connect.success', {
      providerId,
      method,
      duration_ms: this.getDuration(),
    });
  }

  trackConnectFailed(
    providerId: string,
    method: 'oauth' | 'upload' | 'manual',
    errorCode: string
  ): void {
    emitInsuranceEvent('insurance.connect.failed', {
      providerId,
      method,
      error_code: errorCode,
      duration_ms: this.getDuration(),
    });
  }

  trackVerifyRefresh(coverageId: string): void {
    emitInsuranceEvent('insurance.verify.refresh', { coverage_id: coverageId });
  }

  trackOnboardingSkipped(): void {
    emitInsuranceEvent('insurance.onboarding.skipped', {
      duration_ms: this.getDuration(),
    });
  }

  trackSetPrimary(coverageId: string): void {
    emitInsuranceEvent('insurance.set_primary', { coverage_id: coverageId });
  }

  trackEdit(coverageId: string): void {
    emitInsuranceEvent('insurance.edit', { coverage_id: coverageId });
  }

  trackDelete(coverageId: string): void {
    emitInsuranceEvent('insurance.delete', { coverage_id: coverageId });
  }
}
