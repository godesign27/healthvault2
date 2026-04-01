export interface TrackEventPayload {
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export function track(event: string, payload?: TrackEventPayload): void {
  console.log('[Analytics]', event, payload);

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, payload);
  }
}
