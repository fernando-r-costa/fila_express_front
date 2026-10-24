'use client';

export type AnalyticsEventName =
  | 'public_home_viewed'
  | 'client_flow_started'
  | 'estimate_requested'
  | 'estimate_succeeded'
  | 'estimate_accepted'
  | 'appointment_created'
  | 'appointment_cancelled_by_client'
  | 'appointment_status_observed'
  | 'admin_login_succeeded'
  | 'admin_call_next_succeeded'
  | 'admin_service_finished'
  | 'admin_appointment_cancelled'
  | 'admin_appointment_no_show';

export type ObservableAppointmentStatus =
  | 'confirmed'
  | 'arrived'
  | 'in_progress'
  | 'finished'
  | 'cancelled'
  | 'no_show';

type AnalyticsValue = string | number | boolean;
type AnalyticsProperties = Record<string, AnalyticsValue | null | undefined>;

declare global {
  interface Window {
    zaraz?: {
      track: (
        eventName: string,
        properties?: Record<string, AnalyticsValue>
      ) => void | Promise<void>;
    };
  }
}

const OBSERVED_STATUS_STORAGE_KEY =
  'fila-express:analytics:observed-statuses:v1';
const observedStatusesFallback = new Set<string>();

const sanitizeProperties = (properties: AnalyticsProperties) =>
  Object.fromEntries(
    Object.entries(properties).filter(
      (entry): entry is [string, AnalyticsValue] =>
        entry[1] !== null && entry[1] !== undefined
    )
  );

export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties = {}
) {
  if (typeof window === 'undefined' || !window.zaraz?.track) return false;

  try {
    const result = window.zaraz.track(
      eventName,
      sanitizeProperties(properties)
    );
    if (result && typeof result.catch === 'function') {
      result.catch(() => undefined);
    }
    return true;
  } catch {
    // Analytics nunca deve interromper o fluxo principal da aplicação.
    return false;
  }
}

const getObservedStatuses = () => {
  if (typeof window === 'undefined') return observedStatusesFallback;

  try {
    const stored = window.sessionStorage.getItem(OBSERVED_STATUS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return observedStatusesFallback;
  }
};

const persistObservedStatuses = (statuses: Set<string>) => {
  observedStatusesFallback.clear();
  statuses.forEach((status) => observedStatusesFallback.add(status));

  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(
      OBSERVED_STATUS_STORAGE_KEY,
      JSON.stringify(Array.from(statuses))
    );
  } catch {
    // Mantém a deduplicação em memória quando sessionStorage não está disponível.
  }
};

export function observeAppointmentStatus({
  appointmentId,
  status,
  source,
}: {
  appointmentId: string | number;
  status?: string;
  source: 'tracker' | 'dashboard';
}) {
  const observableStatuses: ObservableAppointmentStatus[] = [
    'confirmed',
    'arrived',
    'in_progress',
    'finished',
    'cancelled',
    'no_show',
  ];

  if (
    !status ||
    !observableStatuses.includes(status as ObservableAppointmentStatus)
  ) {
    return;
  }

  const deduplicationKey = `${appointmentId}:${status}:${source}`;
  const observedStatuses = getObservedStatuses();
  if (observedStatuses.has(deduplicationKey)) return;

  const wasTracked = trackAnalyticsEvent('appointment_status_observed', {
    appointment_id: String(appointmentId),
    status,
    source,
  });
  if (!wasTracked) return;

  observedStatuses.add(deduplicationKey);
  persistObservedStatuses(observedStatuses);
}
