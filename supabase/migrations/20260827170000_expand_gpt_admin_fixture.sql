/* Expand the deterministic GPT App fixture for all P0 narrative tabs. */

UPDATE public.analytics_metric_snapshots
SET metrics = metrics || '{
  "users": {
    "newUsers":37,"activatedUsers":92,"activationRate":71.9,"engagedUsers":64,"atRiskUsers":12,"returningUsers":29,
    "activationFunnel":[
      {"stage":"Account created","users":128,"conversionRate":100},
      {"stage":"Profile started","users":116,"conversionRate":90.6},
      {"stage":"Data connected","users":101,"conversionRate":78.9},
      {"stage":"First task complete","users":92,"conversionRate":71.9},
      {"stage":"Returned in 7 days","users":64,"conversionRate":50.0}
    ],
    "cohorts":[
      {"cohort":"Internal pilot","users":48,"activated":41,"engaged30d":34,"tasksPerUser":7.2},
      {"cohort":"Early access","users":43,"activated":31,"engaged30d":21,"tasksPerUser":5.4},
      {"cohort":"New this week","users":37,"activated":20,"engaged30d":9,"tasksPerUser":3.1}
    ]
  },
  "interactions": {
    "correctionRate":8.6,"rephraseRate":11.3,"abandonmentRate":1.8,"toolFailureRate":3.5,"explicitFeedbackRate":14.2,
    "failureReasons":[
      {"reason":"Required source unavailable","tasks":21,"users":17,"changePercent":16.7},
      {"reason":"Missing confirmation","tasks":14,"users":12,"changePercent":-6.7},
      {"reason":"Tool execution error","tasks":11,"users":9,"changePercent":22.2},
      {"reason":"Insufficient user data","tasks":9,"users":8,"changePercent":12.5},
      {"reason":"Low-confidence classification","tasks":7,"users":7,"changePercent":0}
    ]
  },
  "capabilityHealth": {
    "healthy":5,"degraded":2,"unavailable":0,
    "capabilities":[
      {"id":"health_snapshot","name":"Health Snapshot","status":"healthy","requests":184,"users":82,"successRate":86.4,"p95LatencyMs":2410,"topFailure":"Missing source data"},
      {"id":"appointment_prep","name":"Appointment Prep","status":"healthy","requests":142,"users":61,"successRate":81.7,"p95LatencyMs":2760,"topFailure":"Incomplete profile"},
      {"id":"medical_forms","name":"Medical Forms","status":"degraded","requests":126,"users":54,"successRate":76.2,"p95LatencyMs":3180,"topFailure":"Share confirmation"},
      {"id":"medications","name":"Medication Support","status":"healthy","requests":98,"users":47,"successRate":79.6,"p95LatencyMs":2250,"topFailure":"Medication not found"},
      {"id":"add_information","name":"Add Information","status":"degraded","requests":75,"users":39,"successRate":68.0,"p95LatencyMs":3360,"topFailure":"Validation rejected"},
      {"id":"privacy_control","name":"Privacy & Control","status":"healthy","requests":61,"users":35,"successRate":88.5,"p95LatencyMs":1940,"topFailure":"Confirmation expired"},
      {"id":"life_signals","name":"Life Signals","status":"healthy","requests":56,"users":28,"successRate":83.9,"p95LatencyMs":2080,"topFailure":"Insufficient history"}
    ]
  },
  "unmetNeeds": {
    "totalSignals":73,"affectedUsers":42,"growingClusters":4,"reviewedPercent":38,
    "clusters":[
      {"label":"Explain lab-result changes","signals":19,"users":14,"growthPercent":46.2,"opportunityScore":86,"confidence":0.91,"dominantSignal":"Unsupported request"},
      {"label":"Prepare follow-up questions","signals":16,"users":12,"growthPercent":33.3,"opportunityScore":81,"confidence":0.88,"dominantSignal":"Repeated rephrase"},
      {"label":"Import wearable history","signals":14,"users":11,"growthPercent":55.6,"opportunityScore":78,"confidence":0.86,"dominantSignal":"Source unavailable"},
      {"label":"Track symptom patterns","signals":13,"users":9,"growthPercent":18.2,"opportunityScore":72,"confidence":0.83,"dominantSignal":"Unsupported request"},
      {"label":"Share appointment summary","signals":11,"users":8,"growthPercent":10.0,"opportunityScore":66,"confidence":0.79,"dominantSignal":"Abandoned workflow"}
    ]
  },
  "weeklyBrief": {
    "status":"draft","weekEnding":"2026-08-27","generatedAt":"2026-08-27T19:00:00Z",
    "items":[
      {"type":"observed_fact","title":"Task growth outpaced user growth","body":"Meaningful tasks increased 24.1% while active users increased 18.5% versus the prior seven-day period.","evidence":"Insights · Usage"},
      {"type":"observed_fact","title":"Activation drops after the first successful task","body":"92 users completed a first task, but only 64 returned within seven days—the largest absolute funnel loss.","evidence":"Users · Activation funnel"},
      {"type":"observed_fact","title":"Two capabilities are degraded","body":"Medical Forms and Add Information miss the pilot health threshold because of lower success and p95 latency above three seconds.","evidence":"Capabilities · Health table"},
      {"type":"model_interpretation","title":"Users may be treating Health Snapshot as a gateway","body":"High Health Snapshot adoption alongside growing Appointment Prep use suggests that users begin broadly and then move into a concrete care workflow.","evidence":"Insights · Top intents"},
      {"type":"model_interpretation","title":"Source availability is driving avoidable retries","body":"Source-unavailable failures and wearable-import demand appear related, but this relationship requires investigation before being treated as causal.","evidence":"Interactions · Failure reasons"},
      {"type":"recommendation","title":"Investigate the post-task return gap","body":"Interview five activated users who did not return within seven days and compare their completed intent and data-source state.","evidence":"Users · Activation funnel"},
      {"type":"recommendation","title":"Prioritize validation failures in Add Information","body":"Review rejected fields and confirmation behavior before expanding the capability rollout.","evidence":"Capabilities · Add Information"}
    ]
  }
}'::jsonb,
    snapshot_version = 2,
    source_version = 'gpt-admin-fixture-v2',
    generated_at = '2026-08-27T19:00:00Z'
WHERE id = '10000000-0000-4000-8000-000000000001';
