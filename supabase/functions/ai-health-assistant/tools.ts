import type { ToolHandler, ToolResult } from './types.ts';

function success<T>(data: T, message?: string): ToolResult<T> {
  return { success: true, data, message };
}

function error(msg: string): ToolResult<never> {
  return { success: false, error: msg };
}

export const TOOL_HANDLERS: Record<string, ToolHandler> = {
  getMedicalHistory: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'getMedicalHistory',
        description:
          'Retrieves the user\'s medical history including conditions, medications, allergies, and immunizations.',
        parameters: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              enum: ['conditions', 'medications', 'allergies', 'immunizations', 'all'],
              description: 'Which section to retrieve. Defaults to all.',
            },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const section = (args.section as string) || 'all';
        const result: Record<string, unknown[]> = {};

        const tables =
          section === 'all'
            ? ['conditions', 'medications', 'allergies', 'immunizations']
            : [section];

        const queries = tables.map((t) =>
          sb
            .from(t)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        );

        const responses = await Promise.all(queries);

        for (let i = 0; i < tables.length; i++) {
          if (responses[i].error) {
            return error(`Database error fetching ${tables[i]}: ${responses[i].error.message}`);
          }
          result[tables[i]] = responses[i].data || [];
        }

        const total = Object.values(result).reduce((s, a) => s + a.length, 0);
        return success(result, `Retrieved ${total} medical history item${total !== 1 ? 's' : ''}.`);
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  getIncompleteForms: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'getIncompleteForms',
        description:
          'Returns incomplete medical forms for the current user with completion progress.',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Optional category filter for forms.',
            },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const patientRes = await sb
          .from('patient_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        let query = sb
          .from('form_responses')
          .select(
            `id, template_id, answers_json, status, updated_at,
             form_templates!inner (id, title, description, category, fhir_questionnaire_json)`
          )
          .eq('status', 'incomplete')
          .order('updated_at', { ascending: false });

        if (patientRes.data?.id) {
          query = query.eq('patient_id', patientRes.data.id);
        }

        if (args.category) {
          query = query.eq('form_templates.category', args.category);
        }

        const { data, error: dbErr } = await query;
        if (dbErr) return error(`Database error: ${dbErr.message}`);

        const forms = (data || []).map((row: any) => {
          const t = row.form_templates;
          const answers = row.answers_json || {};
          const totalFields = t?.fhir_questionnaire_json?.item?.length || 0;
          return {
            id: row.id,
            templateId: row.template_id,
            title: t?.title || 'Untitled',
            category: t?.category || '',
            answeredFields: Object.keys(answers).length,
            totalFields,
            updatedAt: row.updated_at,
          };
        });

        return success(forms, `Found ${forms.length} incomplete form${forms.length !== 1 ? 's' : ''}.`);
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  openForm: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'openForm',
        description:
          'Returns a form definition with its fields and saved answers. Provide either formId (existing response) or templateId (new form).',
        parameters: {
          type: 'object',
          properties: {
            formId: {
              type: 'string',
              description: 'ID of an existing form response.',
            },
            templateId: {
              type: 'string',
              description: 'ID of a form template to start fresh.',
            },
          },
        },
      },
    },
    execute: async (args, _userId, sb) => {
      try {
        if (!args.formId && !args.templateId) {
          return error('Either formId or templateId is required.');
        }

        let templateId = args.templateId as string | undefined;
        let existing: any = null;

        if (args.formId) {
          const { data, error: dbErr } = await sb
            .from('form_responses')
            .select('*, form_templates(*)')
            .eq('id', args.formId)
            .maybeSingle();
          if (dbErr) return error(`Database error: ${dbErr.message}`);
          if (!data) return error('Form response not found.');
          existing = data;
          templateId = data.template_id;
        }

        const { data: template, error: tErr } = await sb
          .from('form_templates')
          .select('*')
          .eq('id', templateId)
          .maybeSingle();

        if (tErr) return error(`Database error: ${tErr.message}`);
        if (!template) return error('Form template not found.');

        const q = template.fhir_questionnaire_json || {};
        const fields = (q.item || []).map((item: any) => ({
          linkId: item.linkId || '',
          text: item.text || '',
          type: item.type || 'string',
          required: item.required || false,
          options:
            item.answerOption?.map(
              (o: any) => o.valueCoding?.display || o.valueString
            ) || undefined,
        }));

        return success(
          {
            responseId: existing?.id || null,
            templateId: template.id,
            title: template.title,
            description: template.description,
            category: template.category,
            fields,
            savedAnswers: existing?.answers_json || {},
            status: existing ? existing.status : 'new',
          },
          `Loaded form: ${template.title}`
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  saveFormAnswers: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'saveFormAnswers',
        description:
          'Saves partial or complete answers for a medical form. Supports incremental saves. Set markComplete=true only when all required fields are filled.',
        parameters: {
          type: 'object',
          properties: {
            formId: {
              type: 'string',
              description: 'Existing form response ID for update.',
            },
            templateId: {
              type: 'string',
              description: 'Template ID for creating a new response.',
            },
            answers: {
              type: 'object',
              description: 'Key-value map of field linkId to answer value.',
              additionalProperties: true,
            },
            markComplete: {
              type: 'boolean',
              description: 'Whether to mark the form as complete.',
            },
          },
          required: ['templateId', 'answers'],
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const answers = (args.answers || {}) as Record<string, unknown>;
        const markComplete = args.markComplete === true;
        const status = markComplete ? 'complete' : 'incomplete';
        const signedAt = markComplete ? new Date().toISOString() : null;

        const patientRes = await sb
          .from('patient_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!patientRes.data?.id) {
          return error('Patient profile not found.');
        }

        if (args.formId) {
          const { data: existing, error: fErr } = await sb
            .from('form_responses')
            .select('answers_json')
            .eq('id', args.formId)
            .maybeSingle();

          if (fErr) return error(`Database error: ${fErr.message}`);
          if (!existing) return error('Form response not found.');

          const merged = { ...(existing.answers_json || {}), ...answers };

          const { error: uErr } = await sb
            .from('form_responses')
            .update({
              answers_json: merged,
              status,
              signed_at: signedAt,
              updated_at: new Date().toISOString(),
            })
            .eq('id', args.formId);

          if (uErr) return error(`Save failed: ${uErr.message}`);

          return success(
            { formId: args.formId, status, savedFields: Object.keys(merged).length },
            'Form answers saved.'
          );
        }

        const { data: newResp, error: iErr } = await sb
          .from('form_responses')
          .insert({
            template_id: args.templateId,
            patient_id: patientRes.data.id,
            answers_json: answers,
            status,
            signed_at: signedAt,
          })
          .select('id')
          .single();

        if (iErr) return error(`Save failed: ${iErr.message}`);

        return success(
          { formId: newResp.id, status, savedFields: Object.keys(answers).length },
          'New form response created.'
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  shareForm: {
    confirmationRequired: true,
    definition: {
      type: 'function',
      function: {
        name: 'shareForm',
        description:
          'Shares completed forms with a recipient via secure link. Requires confirmed=true. Only completed forms can be shared.',
        parameters: {
          type: 'object',
          properties: {
            formIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs of completed form responses to share.',
            },
            recipientName: {
              type: 'string',
              description: 'Name of the recipient.',
            },
            recipientEmail: {
              type: 'string',
              description: 'Email address of the recipient.',
            },
            recipientOrg: {
              type: 'string',
              description: 'Optional organization name.',
            },
            note: {
              type: 'string',
              description: 'Optional message to include with the share.',
            },
            confirmed: {
              type: 'boolean',
              description: 'Must be true to execute the share.',
            },
          },
          required: ['formIds', 'recipientName', 'recipientEmail', 'confirmed'],
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        if (!args.confirmed) {
          return error(
            'Share requires explicit confirmation. Set confirmed: true to proceed.'
          );
        }

        const formIds = args.formIds as string[];
        if (!formIds?.length) return error('At least one form ID is required.');

        const { data: formRows, error: formsErr } = await sb
          .from('form_responses')
          .select('id, template_id, status, signed_at, form_templates(title, version)')
          .in('id', formIds);

        if (formsErr) return error(`Database error: ${formsErr.message}`);
        if (!formRows?.length) return error('No matching form responses found.');

        const rowById = new Map(formRows.map((row: any) => [row.id, row]));
        for (const fid of formIds) {
          const row = rowById.get(fid);
          if (!row) return error(`Form ${fid} not found.`);
          if (row.status !== 'complete') {
            return error(`Form ${fid} is not complete.`);
          }
        }

        const { data: profile } = await sb
          .from('user_profiles')
          .select('first_name, last_name, date_of_birth')
          .eq('user_id', userId)
          .maybeSingle();

        const patientName = profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          : '';
        const displayName = String(args.recipientName || '').trim();
        const orgName = args.recipientOrg ? String(args.recipientOrg).trim() : '';

        const forms = formIds.map((fid) => {
          const row = rowById.get(fid)!;
          const template = row.form_templates;
          return {
            id: row.id,
            title: template?.title || row.template_id,
            version: template?.version || '2025.01',
            signedAt: row.signed_at || undefined,
          };
        });

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const res = await fetch(`${supabaseUrl}/functions/v1/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            patientId: userId,
            forms,
            recipient: {
              displayName,
              orgName: orgName || undefined,
              email: args.recipientEmail,
              method: 'SecureLink',
              patientName,
              patientDob: profile?.date_of_birth || undefined,
              providerName: orgName || displayName,
            },
            note: args.note || '',
            options: {
              package: { pdf: true, fhirBundle: true },
              cc: { me: true, patient: false },
            },
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return error(`Share failed: ${body.error || res.statusText}`);
        }

        const result = await res.json();

        return success(
          {
            shareId: result.id,
            status: result.status || 'sent',
            recipientEmail: args.recipientEmail,
            shareUrl: result.shareUrl,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          `Forms shared with ${args.recipientName} (${args.recipientEmail}).`
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  getHealthRecords: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'getHealthRecords',
        description:
          'Returns health records for the current user. Supports filtering by kind, source (use source=shared for records submitted by a provider via a manual record request), date range, and text search.',
        parameters: {
          type: 'object',
          properties: {
            kind: {
              type: 'string',
              enum: ['lab', 'imaging', 'pathology', 'specialist_report', 'other'],
              description: 'Filter by record kind.',
            },
            source: {
              type: 'string',
              enum: ['connected', 'uploaded', 'shared'],
              description: 'Filter by how the record was received.',
            },
            fromDate: {
              type: 'string',
              description: 'Start date filter (YYYY-MM-DD).',
            },
            toDate: {
              type: 'string',
              description: 'End date filter (YYYY-MM-DD).',
            },
            search: {
              type: 'string',
              description: 'Free-text search across title, provider, and summary.',
            },
            limit: {
              type: 'number',
              description: 'Max records to return (1-100, default 50).',
            },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);

        let query = sb
          .from('health_records')
          .select('*')
          .eq('user_id', userId)
          .order('service_date', { ascending: false, nullsFirst: false })
          .limit(limit);

        if (args.kind) query = query.eq('kind', args.kind);
        if (args.source) query = query.eq('source', args.source);
        if (args.fromDate) query = query.gte('service_date', args.fromDate);
        if (args.toDate) query = query.lte('service_date', args.toDate);
        if (args.search) {
          const s = args.search as string;
          query = query.or(
            `title.ilike.%${s}%,provider_name.ilike.%${s}%,ai_summary.ilike.%${s}%`
          );
        }

        const { data, error: dbErr } = await query;
        if (dbErr) return error(`Database error: ${dbErr.message}`);

        const records = (data || []).map((r: any) => ({
          id: r.id,
          kind: r.kind,
          title: r.title,
          providerName: r.provider_name,
          serviceDate: r.service_date,
          source: r.source,
          fileType: r.file_type,
          aiSummary: r.ai_summary,
          tags: r.tags || [],
        }));

        return success(
          records,
          `Found ${records.length} health record${records.length !== 1 ? 's' : ''}.`
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  getHealthRecordRequests: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'getHealthRecordRequests',
        description:
          'Lists the user\'s manual health record requests to providers (email + secure portal). Statuses: pending, sent, received, failed. Optional filters by requestId or status. Does not return secure tokens.',
        parameters: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
              description: 'If set, returns only this request (must belong to the user).',
            },
            status: {
              type: 'string',
              enum: ['pending', 'sent', 'received', 'failed'],
              description: 'Filter by request status.',
            },
            limit: {
              type: 'number',
              description: 'Max rows (1-50, default 20).',
            },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
        let query = sb
          .from('health_record_requests')
          .select(
            'id, provider_name, provider_id, provider_email, doctor_name, patient_name, record_types, date_range_start, date_range_end, status, notes, message, urgency, created_at, updated_at, opened_at, submitted_at, expires_at'
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (args.requestId) {
          query = query.eq('id', args.requestId);
        }
        if (args.status) {
          query = query.eq('status', args.status);
        }

        const { data, error: dbErr } = await query;
        if (dbErr) return error(`Database error: ${dbErr.message}`);

        const rows = (data || []).map((r: any) => ({
          id: r.id,
          providerName: r.provider_name,
          providerId: r.provider_id,
          providerEmail: r.provider_email,
          doctorName: r.doctor_name,
          patientName: r.patient_name,
          recordTypes: r.record_types || [],
          dateRangeStart: r.date_range_start,
          dateRangeEnd: r.date_range_end,
          status: r.status,
          notes: r.notes,
          messagePreview: r.message
            ? String(r.message).slice(0, 200)
            : null,
          urgency: r.urgency,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          openedAt: r.opened_at,
          submittedAt: r.submitted_at,
          expiresAt: r.expires_at,
        }));

        return success(
          rows,
          `Found ${rows.length} record request${rows.length !== 1 ? 's' : ''}.`
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  deleteHealthRecordRequest: {
    confirmationRequired: true,
    definition: {
      type: 'function',
      function: {
        name: 'deleteHealthRecordRequest',
        description:
          'Deletes/cancels a manual health record request owned by the user. Requires confirmation.',
        parameters: {
          type: 'object',
          properties: {
            requestId: { type: 'string', description: 'ID of the request to delete.' },
            confirmed: { type: 'boolean', description: 'Must be true to delete.' },
          },
          required: ['requestId', 'confirmed'],
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        if (!args.confirmed) {
          return error('Deleting a record request requires confirmation.');
        }
        const { error: dbErr } = await sb
          .from('health_record_requests')
          .delete()
          .eq('id', args.requestId)
          .eq('user_id', userId);
        if (dbErr) return error(`Database error: ${dbErr.message}`);
        return success({ requestId: args.requestId, deleted: true }, 'Record request removed.');
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  summarizeRecord: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'summarizeRecord',
        description:
          'Returns a factual, non-diagnostic summary of a specific health record. Does not invent conclusions.',
        parameters: {
          type: 'object',
          properties: {
            recordId: {
              type: 'string',
              description: 'ID of the health record to summarize.',
            },
          },
          required: ['recordId'],
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        if (!args.recordId) return error('Record ID is required.');

        const { data: record, error: dbErr } = await sb
          .from('health_records')
          .select('*')
          .eq('id', args.recordId)
          .eq('user_id', userId)
          .maybeSingle();

        if (dbErr) return error(`Database error: ${dbErr.message}`);
        if (!record) return error('Record not found or access denied.');

        if (record.ai_summary) {
          return success(
            {
              recordId: record.id,
              title: record.title,
              kind: record.kind,
              providerName: record.provider_name,
              serviceDate: record.service_date,
              summary: record.ai_summary,
            },
            record.ai_summary
          );
        }

        const kindLabel: Record<string, string> = {
          lab: 'Lab',
          imaging: 'Imaging',
          pathology: 'Pathology',
          specialist_report: 'Specialist Report',
          other: 'Other',
        };

        const parts = [`${kindLabel[record.kind] || record.kind} record: "${record.title}"`];
        if (record.provider_name) parts.push(`from ${record.provider_name}`);
        if (record.service_date) parts.push(`dated ${record.service_date}`);
        parts.push(`received via ${record.source}`);
        if (record.tags?.length) parts.push(`tagged: ${record.tags.join(', ')}`);

        const summary = parts.join(' — ') + '.';

        return success(
          {
            recordId: record.id,
            title: record.title,
            kind: record.kind,
            providerName: record.provider_name,
            serviceDate: record.service_date,
            summary,
          },
          summary
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  searchInsuranceProvider: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'searchInsuranceProvider',
        description:
          'Searches insurance providers/plans by name or payer ID from the catalog.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search term for provider name, slug, or payer ID.',
            },
            limit: {
              type: 'number',
              description: 'Max results (1-50, default 20).',
            },
          },
          required: ['query'],
        },
      },
    },
    execute: async (args, _userId, sb) => {
      try {
        const q = args.query as string;
        if (!q) return error('Search query is required.');

        const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);

        const { data, error: dbErr } = await sb
          .from('insurance_providers')
          .select('id, name, payer_id, logo_url, slug, is_popular')
          .or(`name.ilike.%${q}%,slug.ilike.%${q}%,payer_id.ilike.%${q}%`)
          .order('is_popular', { ascending: false })
          .order('name', { ascending: true })
          .limit(limit);

        if (dbErr) return error(`Database error: ${dbErr.message}`);

        const providers = (data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          payerId: r.payer_id,
          slug: r.slug,
          isPopular: r.is_popular,
        }));

        if (!providers.length) {
          return success([], `No insurance providers found matching "${q}".`);
        }

        return success(
          providers,
          `Found ${providers.length} provider${providers.length !== 1 ? 's' : ''} matching "${q}".`
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  getUserCoverages: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'getUserCoverages',
        description:
          'Returns insurance coverages for the current user, optionally filtered to active-only.',
        parameters: {
          type: 'object',
          properties: {
            activeOnly: {
              type: 'boolean',
              description: 'If true, return only active coverages (default true).',
            },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const activeOnly = args.activeOnly !== false;

        let query = sb
          .from('insurance_coverages')
          .select(
            `id, plan_name, member_id_hash, group_number, relationship,
             is_primary, verification_status, coverage_status,
             effective_start, effective_end,
             insurance_providers!inner (name)`
          )
          .eq('user_id', userId)
          .order('is_primary', { ascending: false });

        if (activeOnly) {
          query = query.eq('coverage_status', 'active');
        }

        const { data, error: dbErr } = await query;
        if (dbErr) return error(`Database error: ${dbErr.message}`);

        const coverages = (data || []).map((r: any) => ({
          id: r.id,
          planName: r.plan_name,
          providerName: (r.insurance_providers as any)?.name || 'Unknown',
          memberIdMasked: r.member_id_hash
            ? `****${r.member_id_hash.slice(-4)}`
            : '****',
          groupNumber: r.group_number,
          relationship: r.relationship,
          isPrimary: r.is_primary,
          coverageStatus: r.coverage_status,
          effectiveStart: r.effective_start,
          effectiveEnd: r.effective_end,
        }));

        return success(
          coverages,
          `Found ${coverages.length} coverage${coverages.length !== 1 ? 's' : ''}.`
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  searchInNetworkProviders: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'searchInNetworkProviders',
        description:
          'Searches the user\'s saved care providers by name, specialty, relationship, or network status.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search by name, specialty, or clinic.',
            },
            specialty: {
              type: 'string',
              description: 'Filter by specialty.',
            },
            relationship: {
              type: 'string',
              enum: [
                'Primary',
                'Specialist',
                'Dental',
                'Vision',
                'Therapy',
                'Other',
              ],
              description: 'Filter by relationship type.',
            },
            inNetworkOnly: {
              type: 'boolean',
              description: 'If true, return only in-network providers.',
            },
            limit: {
              type: 'number',
              description: 'Max results (1-50, default 20).',
            },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);

        let query = sb
          .from('providers')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true })
          .limit(limit);

        if (args.inNetworkOnly) query = query.eq('in_network', true);
        if (args.specialty) query = query.ilike('specialty', `%${args.specialty}%`);
        if (args.relationship) query = query.eq('relationship', args.relationship);
        if (args.query) {
          const s = args.query as string;
          query = query.or(
            `name.ilike.%${s}%,specialty.ilike.%${s}%,clinic.ilike.%${s}%`
          );
        }

        const { data, error: dbErr } = await query;
        if (dbErr) return error(`Database error: ${dbErr.message}`);

        const providers = (data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          specialty: r.specialty,
          clinic: r.clinic,
          phone: r.phone,
          relationship: r.relationship,
          inNetwork: r.in_network,
          lastVisitDate: r.last_visit_date,
        }));

        return success(
          providers,
          `Found ${providers.length} provider${providers.length !== 1 ? 's' : ''}.`
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  searchPharmacies: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'searchPharmacies',
        description:
          'Searches the user\'s saved pharmacies by name, preferred status, or network status.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search by pharmacy name or chain.',
            },
            preferredOnly: {
              type: 'boolean',
              description: 'If true, return only preferred pharmacies.',
            },
            inNetworkOnly: {
              type: 'boolean',
              description: 'If true, return only in-network pharmacies.',
            },
            limit: {
              type: 'number',
              description: 'Max results (1-50, default 20).',
            },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);

        let query = sb
          .from('pharmacies')
          .select('*')
          .eq('user_id', userId)
          .order('preferred', { ascending: false })
          .order('name', { ascending: true })
          .limit(limit);

        if (args.preferredOnly) query = query.eq('preferred', true);
        if (args.inNetworkOnly) query = query.eq('in_network', true);
        if (args.query) {
          const s = args.query as string;
          query = query.or(`name.ilike.%${s}%,chain.ilike.%${s}%,address.ilike.%${s}%`);
        }

        const { data, error: dbErr } = await query;
        if (dbErr) return error(`Database error: ${dbErr.message}`);

        const pharmacies = (data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          chain: r.chain,
          phone: r.phone,
          address: r.address,
          preferred: r.preferred,
          inNetwork: r.in_network,
        }));

        return success(
          pharmacies,
          `Found ${pharmacies.length} pharmac${pharmacies.length !== 1 ? 'ies' : 'y'}.`
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  requestHealthRecord: {
    confirmationRequired: true,
    definition: {
      type: 'function',
      function: {
        name: 'requestHealthRecord',
        description:
          'Creates a manual health record request: emails the provider a secure link to upload records (record-request edge function). Requires provider email, provider name, and confirmation.',
        parameters: {
          type: 'object',
          properties: {
            providerName: { type: 'string', description: 'Name of the provider or facility.' },
            providerEmail: {
              type: 'string',
              description: 'Provider email address (required to send the secure portal link).',
            },
            providerId: { type: 'string', description: 'Optional internal provider ID.' },
            doctorName: { type: 'string', description: 'Optional specific doctor name.' },
            patientName: { type: 'string', description: 'Patient name shown to the provider in the email.' },
            recordTypes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Types of records being requested.',
            },
            dateRangeStart: { type: 'string', description: 'Start date (YYYY-MM-DD).' },
            dateRangeEnd: { type: 'string', description: 'End date (YYYY-MM-DD).' },
            message: {
              type: 'string',
              description: 'Short message included in the email to the provider.',
            },
            notes: { type: 'string', description: 'Internal notes stored on the request.' },
            urgency: {
              type: 'string',
              enum: ['routine', 'urgent', 'stat'],
              description: 'Request urgency (default routine).',
            },
            confirmed: { type: 'boolean', description: 'Must be true to submit.' },
          },
          required: ['providerName', 'providerEmail', 'confirmed'],
        },
      },
    },
    execute: async (args, userId, _sb) => {
      try {
        if (!args.confirmed) return error('Record request requires confirmation.');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const res = await fetch(`${supabaseUrl}/functions/v1/record-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            userId,
            providerName: args.providerName,
            providerEmail: args.providerEmail,
            providerId: args.providerId || undefined,
            doctorName: args.doctorName || undefined,
            patientName: args.patientName || undefined,
            recordTypes:
              Array.isArray(args.recordTypes) && args.recordTypes.length > 0
                ? args.recordTypes
                : ['OTHER'],
            dateRangeStart: args.dateRangeStart || undefined,
            dateRangeEnd: args.dateRangeEnd || undefined,
            message: args.message || undefined,
            notes: args.notes || undefined,
            urgency: args.urgency || 'routine',
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          return error(
            typeof body.error === 'string'
              ? body.error
              : `Record request failed (${res.status})`
          );
        }
        return success(
          {
            requestId: body.id,
            providerName: args.providerName,
            status: body.status,
            emailSent: body.emailSent,
            emailError: body.emailError ?? null,
            expiresAt: body.expiresAt ?? null,
          },
          body.emailSent
            ? `Record request sent to ${args.providerName}; the provider received an email with a secure upload link.`
            : `Record request created for ${args.providerName}. ${body.emailError ? `Email: ${body.emailError}` : ''}`
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  setPrimaryInsurance: {
    confirmationRequired: true,
    definition: {
      type: 'function',
      function: {
        name: 'setPrimaryInsurance',
        description: 'Sets a specific insurance coverage as the primary plan. Requires confirmation.',
        parameters: {
          type: 'object',
          properties: {
            coverageId: { type: 'string', description: 'ID of the coverage to set as primary.' },
            confirmed: { type: 'boolean', description: 'Must be true to proceed.' },
          },
          required: ['coverageId', 'confirmed'],
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        if (!args.confirmed) return error('Setting primary insurance requires confirmation.');
        await sb.from('insurance_coverages').update({ is_primary: false, updated_at: new Date().toISOString() }).eq('user_id', userId);
        const { error: dbErr } = await sb.from('insurance_coverages').update({ is_primary: true, updated_at: new Date().toISOString() }).eq('id', args.coverageId).eq('user_id', userId);
        if (dbErr) return error(`Database error: ${dbErr.message}`);
        return success({ coverageId: args.coverageId, isPrimary: true }, 'Primary insurance updated.');
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  verifyInsurance: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'verifyInsurance',
        description: 'Marks an insurance coverage as verified.',
        parameters: {
          type: 'object',
          properties: {
            coverageId: { type: 'string', description: 'ID of the coverage to verify.' },
          },
          required: ['coverageId'],
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const { data: coverage, error: fErr } = await sb.from('insurance_coverages').select('id').eq('id', args.coverageId).eq('user_id', userId).maybeSingle();
        if (fErr) return error(`Database error: ${fErr.message}`);
        if (!coverage) return error('Coverage not found or access denied.');
        const { error: dbErr } = await sb.from('insurance_coverages').update({ verification_status: 'verified', last_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', args.coverageId).eq('user_id', userId);
        if (dbErr) return error(`Database error: ${dbErr.message}`);
        return success({ coverageId: args.coverageId, verificationStatus: 'verified' }, 'Insurance verified.');
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  addProvider: {
    confirmationRequired: true,
    definition: {
      type: 'function',
      function: {
        name: 'addProvider',
        description: 'Adds a new care provider to the user\'s network. Requires confirmation.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Provider name.' },
            specialty: { type: 'string', description: 'Medical specialty.' },
            clinic: { type: 'string', description: 'Clinic or practice name.' },
            phone: { type: 'string', description: 'Phone number.' },
            email: { type: 'string', description: 'Email address.' },
            address: { type: 'string', description: 'Office address.' },
            relationship: { type: 'string', enum: ['Primary', 'Specialist', 'Dental', 'Vision', 'Therapy', 'Other'], description: 'Relationship type.' },
            inNetwork: { type: 'boolean', description: 'Whether in-network.' },
            confirmed: { type: 'boolean', description: 'Must be true to proceed.' },
          },
          required: ['name', 'confirmed'],
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        if (!args.confirmed) return error('Adding a provider requires confirmation.');
        const { data, error: dbErr } = await sb.from('providers').insert({
          user_id: userId, name: args.name, specialty: args.specialty || null,
          clinic: args.clinic || null, phone: args.phone || null, email: args.email || null,
          address: args.address || null, relationship: args.relationship || null,
          in_network: args.inNetwork ?? null, connection_source: 'Manual',
        }).select('id, name').single();
        if (dbErr) return error(`Database error: ${dbErr.message}`);
        return success({ id: data.id, name: data.name }, `Added ${data.name} to your care network.`);
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  setPreferredPharmacy: {
    confirmationRequired: true,
    definition: {
      type: 'function',
      function: {
        name: 'setPreferredPharmacy',
        description: 'Sets a pharmacy as the user\'s preferred pharmacy. Requires confirmation.',
        parameters: {
          type: 'object',
          properties: {
            pharmacyId: { type: 'string', description: 'ID of the pharmacy.' },
            confirmed: { type: 'boolean', description: 'Must be true to proceed.' },
          },
          required: ['pharmacyId', 'confirmed'],
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        if (!args.confirmed) return error('Setting preferred pharmacy requires confirmation.');
        await sb.from('pharmacies').update({ preferred: false, updated_at: new Date().toISOString() }).eq('user_id', userId);
        const { error: dbErr } = await sb.from('pharmacies').update({ preferred: true, updated_at: new Date().toISOString() }).eq('id', args.pharmacyId).eq('user_id', userId);
        if (dbErr) return error(`Database error: ${dbErr.message}`);
        return success({ pharmacyId: args.pharmacyId, preferred: true }, 'Preferred pharmacy updated.');
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  getMedications: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'getMedications',
        description: 'Returns the user\'s medications with dosage, frequency, and active status.',
        parameters: {
          type: 'object',
          properties: {
            activeOnly: { type: 'boolean', description: 'If true, only active medications.' },
            search: { type: 'string', description: 'Search by name or prescriber.' },
            limit: { type: 'number', description: 'Max results (1-100, default 50).' },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);
        let query = sb.from('medications').select('*').eq('user_id', userId).order('start_date', { ascending: false, nullsFirst: false }).limit(limit);
        if (args.activeOnly) {
          const today = new Date().toISOString().split('T')[0];
          query = query.or(`end_date.is.null,end_date.gte.${today}`);
        }
        if (args.search) query = query.or(`name.ilike.%${args.search}%,prescribed_by.ilike.%${args.search}%`);
        const { data, error: dbErr } = await query;
        if (dbErr) return error(`Database error: ${dbErr.message}`);
        const today = new Date().toISOString().split('T')[0];
        const meds = (data || []).map((r: any) => ({
          id: r.id, name: r.name, dosage: r.dosage, frequency: r.frequency,
          prescribedBy: r.prescribed_by, startDate: r.start_date, endDate: r.end_date,
          isActive: !r.end_date || r.end_date >= today,
        }));
        const active = meds.filter((m: any) => m.isActive).length;
        return success(meds, `Found ${meds.length} medication${meds.length !== 1 ? 's' : ''} (${active} active).`);
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  summarizeMedication: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'summarizeMedication',
        description: 'Returns a plain-language summary of a specific medication.',
        parameters: {
          type: 'object',
          properties: {
            medicationId: { type: 'string', description: 'ID of the medication.' },
          },
          required: ['medicationId'],
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const { data: med, error: dbErr } = await sb.from('medications').select('*').eq('id', args.medicationId).eq('user_id', userId).maybeSingle();
        if (dbErr) return error(`Database error: ${dbErr.message}`);
        if (!med) return error('Medication not found or access denied.');
        const today = new Date().toISOString().split('T')[0];
        const isActive = !med.end_date || med.end_date >= today;
        const parts = [`${med.name}${med.dosage ? ` (${med.dosage})` : ''}`];
        if (med.frequency) parts.push(`taken ${med.frequency}`);
        if (med.prescribed_by) parts.push(`prescribed by ${med.prescribed_by}`);
        parts.push(isActive ? 'currently active' : 'no longer active');
        const summary = parts.join(' -- ') + '.';
        return success({ id: med.id, name: med.name, dosage: med.dosage, frequency: med.frequency, isActive, summary }, summary);
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  checkRefillStatus: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'checkRefillStatus',
        description: 'Checks which medications may need a refill based on end dates within 30 days.',
        parameters: {
          type: 'object',
          properties: {
            medicationId: { type: 'string', description: 'Optional specific medication ID.' },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        let query = sb.from('medications').select('id, name, end_date, start_date').eq('user_id', userId);
        if (args.medicationId) query = query.eq('id', args.medicationId);
        const { data, error: dbErr } = await query;
        if (dbErr) return error(`Database error: ${dbErr.message}`);
        const today = new Date();
        const meds = (data || []).map((m: any) => {
          const end = m.end_date ? new Date(m.end_date) : null;
          const isActive = !end || end >= today;
          const daysRemaining = end ? Math.ceil((end.getTime() - today.getTime()) / 86400000) : null;
          return { id: m.id, name: m.name, isActive, endDate: m.end_date, daysRemaining, needsRefill: isActive && daysRemaining !== null && daysRemaining <= 30 };
        });
        const needing = meds.filter((m: any) => m.needsRefill);
        return success({ medications: meds }, needing.length > 0 ? `${needing.length} medication${needing.length !== 1 ? 's' : ''} may need a refill soon.` : 'No medications need a refill at this time.');
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  getCareTeam: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'getCareTeam',
        description: 'Returns the user\'s care team members with contact info and primary status.',
        parameters: {
          type: 'object',
          properties: {
            primaryOnly: { type: 'boolean', description: 'If true, only primary members.' },
            search: { type: 'string', description: 'Search by name, specialty, or organization.' },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        let query = sb.from('care_team').select('*').eq('user_id', userId).order('is_primary', { ascending: false }).order('name', { ascending: true });
        if (args.primaryOnly) query = query.eq('is_primary', true);
        if (args.search) query = query.or(`name.ilike.%${args.search}%,specialty.ilike.%${args.search}%,organization.ilike.%${args.search}%`);
        const { data, error: dbErr } = await query;
        if (dbErr) return error(`Database error: ${dbErr.message}`);
        const members = (data || []).map((r: any) => ({
          id: r.id, name: r.name, title: r.title, specialty: r.specialty,
          organization: r.organization, email: r.email, phone: r.phone, isPrimary: r.is_primary,
        }));
        return success(members, `Found ${members.length} care team member${members.length !== 1 ? 's' : ''}.`);
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  getCareTimeline: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'getCareTimeline',
        description:
          'Returns a chronological timeline of care events: health records, manual record requests to providers, form completions, and shares.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max events (1-50, default 20).' },
          },
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
        const [recRes, reqRes, formRes, shareRes] = await Promise.all([
          sb.from('health_records').select('id, title, service_date, kind, provider_name').eq('user_id', userId).order('service_date', { ascending: false, nullsFirst: false }).limit(limit),
          sb.from('health_record_requests').select('id, provider_name, status, created_at, opened_at, submitted_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
          sb.from('form_responses').select('id, status, updated_at, form_templates!inner(title)').eq('patient_id', userId).order('updated_at', { ascending: false }).limit(limit),
          sb.from('share_events').select('id, sent_at, status, recipient').eq('patient_id', userId).order('sent_at', { ascending: false }).limit(limit),
        ]);
        const events: any[] = [];
        if (!recRes.error && recRes.data) {
          for (const r of recRes.data) events.push({ type: 'record', id: r.id, title: r.title, date: r.service_date || '', detail: r.provider_name ? `From ${r.provider_name}` : null });
        }
        if (!reqRes.error && reqRes.data) {
          for (const q of reqRes.data as any[]) {
            const detailParts = [`Status: ${q.status}`];
            if (q.opened_at) detailParts.push('Provider opened link');
            if (q.submitted_at) detailParts.push('Records submitted');
            events.push({
              type: 'record_request',
              id: q.id,
              title: `Record request to ${q.provider_name}`,
              date: q.submitted_at || q.opened_at || q.created_at || '',
              detail: detailParts.join('; '),
            });
          }
        }
        if (!formRes.error && formRes.data) {
          for (const f of formRes.data as any[]) events.push({ type: 'form', id: f.id, title: f.form_templates?.title || 'Medical Form', date: f.updated_at || '', detail: f.status === 'complete' ? 'Completed' : 'In progress' });
        }
        if (!shareRes.error && shareRes.data) {
          for (const s of shareRes.data as any[]) events.push({ type: 'share', id: s.id, title: `Shared records with ${typeof s.recipient === 'object' ? s.recipient?.name || 'Someone' : 'Someone'}`, date: s.sent_at || '', detail: s.status });
        }
        events.sort((a, b) => { if (!a.date) return 1; if (!b.date) return -1; return new Date(b.date).getTime() - new Date(a.date).getTime(); });
        const trimmed = events.slice(0, limit);
        return success(trimmed, `Retrieved ${trimmed.length} care timeline event${trimmed.length !== 1 ? 's' : ''}.`);
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  getCareOverview: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'getCareOverview',
        description:
          'Returns a high-level summary: care team, medications, pending forms, records, manual record requests (sent/received), conditions, allergies, immunizations.',
        parameters: { type: 'object', properties: {} },
      },
    },
    execute: async (_args, userId, sb) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [ct, meds, forms, recs, conds, allerg, immun, reqSent, reqReceived] =
          await Promise.all([
            sb.from('care_team').select('id', { count: 'exact', head: true }).eq('user_id', userId),
            sb.from('medications').select('id, end_date').eq('user_id', userId),
            sb.from('form_responses').select('id', { count: 'exact', head: true }).eq('patient_id', userId).eq('status', 'incomplete'),
            sb.from('health_records').select('id', { count: 'exact', head: true }).eq('user_id', userId),
            sb.from('conditions').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'Active'),
            sb.from('allergies').select('id', { count: 'exact', head: true }).eq('user_id', userId),
            sb.from('immunizations').select('id, next_dose').eq('user_id', userId),
            sb.from('health_record_requests').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'sent'),
            sb.from('health_record_requests').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'received'),
          ]);
        const activeMeds = (meds.data || []).filter((m: any) => !m.end_date || m.end_date >= today).length;
        const upcoming = (immun.data || []).filter((i: any) => i.next_dose && i.next_dose >= today).length;
        const overview = {
          careTeamCount: ct.count || 0,
          activeMedications: activeMeds,
          pendingForms: forms.count || 0,
          recentRecords: recs.count || 0,
          recordRequestsAwaitingProvider: reqSent.count || 0,
          recordRequestsCompleted: reqReceived.count || 0,
          activeConditions: conds.count || 0,
          allergies: allerg.count || 0,
          upcomingImmunizations: upcoming,
        };
        return success(
          overview,
          `Overview: ${overview.activeConditions} conditions, ${overview.activeMedications} meds, ${overview.pendingForms} pending forms, ${overview.recordRequestsAwaitingProvider} record requests in progress, ${overview.careTeamCount} care team.`
        );
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  getMedicalProfile: {
    confirmationRequired: false,
    definition: {
      type: 'function',
      function: {
        name: 'getMedicalProfile',
        description: 'Returns the user\'s medical profile overview with personal info and medical data counts.',
        parameters: { type: 'object', properties: {} },
      },
    },
    execute: async (_args, userId, sb) => {
      try {
        const [userRes, conds, meds, allerg, immun] = await Promise.all([
          sb.from('user_profiles').select('first_name, last_name, email, date_of_birth, phone, address_line1, city, state, postal_code, country, emergency_contact').eq('user_id', userId).maybeSingle(),
          sb.from('conditions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          sb.from('medications').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          sb.from('allergies').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          sb.from('immunizations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        ]);
        const counts = { conditions: conds.count || 0, medications: meds.count || 0, allergies: allerg.count || 0, immunizations: immun.count || 0 };
        const total = counts.conditions + counts.medications + counts.allergies + counts.immunizations;
        const hasProfile = !!userRes.data?.first_name;
        const status = !hasProfile && total === 0 ? 'empty' : hasProfile && total >= 2 ? 'complete' : 'partial';
        const row = userRes.data;
        const ec = row?.emergency_contact as { name?: string; relationship?: string; phone?: string } | null;
        const user = row ? {
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          dateOfBirth: row.date_of_birth,
          phone: row.phone,
          addressLine1: row.address_line1 || null,
          city: row.city || null,
          state: row.state || null,
          postalCode: row.postal_code || null,
          country: row.country || null,
          emergencyContact: ec ? {
            name: ec.name || null,
            relationship: ec.relationship || null,
            phone: ec.phone || null,
          } : null,
        } : null;
        return success({ user, counts, completionStatus: status }, `Profile: ${counts.conditions} conditions, ${counts.medications} meds, ${counts.allergies} allergies, ${counts.immunizations} immunizations. Status: ${status}.`);
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },

  updateMedicalProfile: {
    confirmationRequired: true,
    definition: {
      type: 'function',
      function: {
        name: 'updateMedicalProfile',
        description:
          'Updates the user\'s profile (name, phone, date of birth, address, emergency contact). Requires confirmed=true after the user agrees.',
        parameters: {
          type: 'object',
          properties: {
            firstName: { type: 'string', description: 'First name.' },
            lastName: { type: 'string', description: 'Last name.' },
            phone: { type: 'string', description: 'Phone number.' },
            dateOfBirth: { type: 'string', description: 'Date of birth (YYYY-MM-DD).' },
            addressLine1: { type: 'string', description: 'Street address line 1.' },
            city: { type: 'string', description: 'City.' },
            state: { type: 'string', description: 'State or province (e.g. IL).' },
            postalCode: { type: 'string', description: 'ZIP / postal code.' },
            emergencyContactName: { type: 'string', description: 'Emergency contact full name.' },
            emergencyContactRelationship: { type: 'string', description: 'Emergency contact relationship (e.g. Spouse).' },
            emergencyContactPhone: { type: 'string', description: 'Emergency contact phone number.' },
            confirmed: { type: 'boolean', description: 'Must be true to execute the update.' },
          },
          required: ['confirmed'],
        },
      },
    },
    execute: async (args, userId, sb) => {
      try {
        if (!args.confirmed) return error('Profile update requires confirmation. Set confirmed: true after the user agrees.');

        const updates: Record<string, unknown> = {};
        const fields: string[] = [];

        if (args.firstName !== undefined) { updates.first_name = String(args.firstName); fields.push('first name'); }
        if (args.lastName !== undefined) { updates.last_name = String(args.lastName); fields.push('last name'); }
        if (args.phone !== undefined) { updates.phone = String(args.phone); fields.push('phone'); }
        if (args.dateOfBirth !== undefined) { updates.date_of_birth = String(args.dateOfBirth); fields.push('date of birth'); }
        if (args.addressLine1 !== undefined) { updates.address_line1 = String(args.addressLine1); fields.push('address'); }
        if (args.city !== undefined) { updates.city = String(args.city); fields.push('city'); }
        if (args.state !== undefined) { updates.state = String(args.state); fields.push('state'); }
        if (args.postalCode !== undefined) { updates.postal_code = String(args.postalCode); fields.push('postal code'); }

        const hasEmergency =
          args.emergencyContactName !== undefined ||
          args.emergencyContactRelationship !== undefined ||
          args.emergencyContactPhone !== undefined;

        if (hasEmergency) {
          const { data: existing } = await sb
            .from('user_profiles')
            .select('emergency_contact')
            .eq('user_id', userId)
            .maybeSingle();

          const ec = {
            ...((existing?.emergency_contact as Record<string, string>) || {}),
          };
          if (args.emergencyContactName !== undefined) ec.name = String(args.emergencyContactName);
          if (args.emergencyContactRelationship !== undefined) ec.relationship = String(args.emergencyContactRelationship);
          if (args.emergencyContactPhone !== undefined) ec.phone = String(args.emergencyContactPhone);
          updates.emergency_contact = ec;
          fields.push('emergency contact');
        }

        if (!fields.length) return error('No fields to update. Provide at least one profile field.');

        updates.updated_at = new Date().toISOString();

        const { error: dbErr } = await sb.from('user_profiles').update(updates).eq('user_id', userId);
        if (dbErr) return error(`Database error: ${dbErr.message}`);

        return success({ updated: true, fields }, `Updated ${fields.join(', ')}.`);
      } catch (err: any) {
        return error(`Unexpected error: ${err.message}`);
      }
    },
  },
};

export function getToolDefinitions() {
  return Object.values(TOOL_HANDLERS).map((h) => h.definition);
}

export function getToolHandler(name: string): ToolHandler | undefined {
  return TOOL_HANDLERS[name];
}
