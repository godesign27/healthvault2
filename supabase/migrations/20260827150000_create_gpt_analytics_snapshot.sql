/*
  GPT App analytics foundation and deterministic Insights fixture.

  Raw structured events are service-write-only. Administrators read versioned,
  privacy-minimized metric snapshots through a role-aware function. The initial
  fixture is explicitly marked synthetic and cannot be confused with live data.
*/

CREATE TABLE IF NOT EXISTS public.analytics_events (
  event_id uuid PRIMARY KEY,
  product_key text NOT NULL REFERENCES public.admin_products(product_key),
  event_name text NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  actor_ref text,
  session_id text,
  request_id text,
  correlation_id text,
  cohort_id text,
  privacy_classification text NOT NULL CHECK (
    privacy_classification IN ('aggregate', 'minimized', 'sensitive')
  ),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT analytics_events_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_product_occurred
  ON public.analytics_events (product_key, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_request
  ON public.analytics_events (product_key, request_id)
  WHERE request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.analytics_metric_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key text NOT NULL REFERENCES public.admin_products(product_key),
  snapshot_version integer NOT NULL CHECK (snapshot_version > 0),
  data_status text NOT NULL CHECK (data_status IN ('synthetic', 'live')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  comparison_start timestamptz NOT NULL,
  comparison_end timestamptz NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source_version text NOT NULL,
  metrics jsonb NOT NULL,
  CONSTRAINT analytics_metric_snapshots_period_check CHECK (period_start < period_end),
  CONSTRAINT analytics_metric_snapshots_comparison_check CHECK (comparison_start < comparison_end),
  CONSTRAINT analytics_metric_snapshots_metrics_object CHECK (jsonb_typeof(metrics) = 'object'),
  UNIQUE (product_key, snapshot_version, data_status, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_analytics_metric_snapshots_latest
  ON public.analytics_metric_snapshots (product_key, data_status, generated_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metric_snapshots ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_events FROM anon, authenticated;
REVOKE ALL ON public.analytics_metric_snapshots FROM anon, authenticated;

INSERT INTO public.analytics_metric_snapshots (
  id,
  product_key,
  snapshot_version,
  data_status,
  period_start,
  period_end,
  comparison_start,
  comparison_end,
  generated_at,
  source_version,
  metrics
)
VALUES (
  '10000000-0000-4000-8000-000000000001',
  'gpt_app',
  1,
  'synthetic',
  '2026-08-20T00:00:00Z',
  '2026-08-27T00:00:00Z',
  '2026-08-13T00:00:00Z',
  '2026-08-20T00:00:00Z',
  '2026-08-27T19:00:00Z',
  'gpt-insights-fixture-v1',
  '{
    "activeUsers": 128,
    "activeUsersChangePercent": 18.5,
    "meaningfulTasks": 742,
    "meaningfulTasksChangePercent": 24.1,
    "successRate": 78.4,
    "successRateChangePoints": 3.2,
    "tasksPerActiveUser": 5.8,
    "tasksPerActiveUserChangePercent": 4.7,
    "p95LatencyMs": 2840,
    "unsupportedRate": 6.2,
    "unknownOutcomeRate": 7.8,
    "activity": [
      {"date":"2026-08-20","activeUsers":61,"meaningfulTasks":82},
      {"date":"2026-08-21","activeUsers":72,"meaningfulTasks":91},
      {"date":"2026-08-22","activeUsers":78,"meaningfulTasks":96},
      {"date":"2026-08-23","activeUsers":83,"meaningfulTasks":104},
      {"date":"2026-08-24","activeUsers":91,"meaningfulTasks":112},
      {"date":"2026-08-25","activeUsers":109,"meaningfulTasks":121},
      {"date":"2026-08-26","activeUsers":128,"meaningfulTasks":136}
    ],
    "outcomes": {
      "success":582,"partialSuccess":63,"failure":37,"abandoned":14,"unsupported":46,"unknown":58
    },
    "topIntents": [
      {"intent":"Health snapshot","tasks":184,"users":82,"successRate":86.4,"changePercent":22.3},
      {"intent":"Appointment prep","tasks":142,"users":61,"successRate":81.7,"changePercent":31.5},
      {"intent":"Medical forms","tasks":126,"users":54,"successRate":76.2,"changePercent":12.4},
      {"intent":"Medications","tasks":98,"users":47,"successRate":79.6,"changePercent":8.2},
      {"intent":"Add information","tasks":75,"users":39,"successRate":68.0,"changePercent":18.8}
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  metrics = EXCLUDED.metrics,
  generated_at = EXCLUDED.generated_at,
  source_version = EXCLUDED.source_version;

CREATE OR REPLACE FUNCTION public.get_admin_gpt_insights_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_principal uuid := auth.uid();
  result jsonb;
BEGIN
  IF current_principal IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_role_assignments assignment
    WHERE assignment.principal_id = current_principal
      AND assignment.revoked_at IS NULL
      AND (assignment.product_key IS NULL OR assignment.product_key = 'gpt_app')
      AND (
        assignment.role_key = 'platform_owner'
        OR 'analytics.read' = ANY(assignment.permissions)
      )
  ) THEN
    RAISE EXCEPTION 'GPT App analytics access denied' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'snapshotId', snapshot.id,
    'productKey', snapshot.product_key,
    'snapshotVersion', snapshot.snapshot_version,
    'dataStatus', snapshot.data_status,
    'periodStart', snapshot.period_start,
    'periodEnd', snapshot.period_end,
    'comparisonStart', snapshot.comparison_start,
    'comparisonEnd', snapshot.comparison_end,
    'generatedAt', snapshot.generated_at,
    'sourceVersion', snapshot.source_version,
    'metrics', snapshot.metrics
  )
  INTO result
  FROM public.analytics_metric_snapshots snapshot
  WHERE snapshot.product_key = 'gpt_app'
  ORDER BY (snapshot.data_status = 'live') DESC, snapshot.generated_at DESC
  LIMIT 1;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_gpt_insights_snapshot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_gpt_insights_snapshot() TO authenticated;

COMMENT ON FUNCTION public.get_admin_gpt_insights_snapshot() IS
  'Returns the latest role-authorized GPT App snapshot, preferring live data when available.';
