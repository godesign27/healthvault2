// Explicit columns prevent future credentials/internal fields from leaking into exports.
// Every query runs as the authenticated user AND has an explicit ownership filter.
export const EXPORT_TABLES: Record<string, string> = {
  account_deletion_requests: 'id,user_id,status,requested_at,resolved_at,user_message',
  user_profiles: 'id,user_id,first_name,last_name,email,created_at,updated_at,date_of_birth,phone,address_line1,address_line2,city,state,postal_code,country,last4_ssn,phone_verified,email_verified,identity_verified,onboarding_complete',
  patient_profiles: 'id,user_id,name,birth_date,contact_email,contact_phone,blood_type,organ_donor,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship,height_cm,weight_kg,created_at,updated_at',
  user_addresses: 'id,user_id,address_type,label,address_line1,address_line2,city,state,postal_code,country,is_active,created_at,updated_at',
  user_preferences: 'id,user_id,help_with_labs,help_with_forms,help_with_providers,help_with_wellness_suggestions,created_at,updated_at',
  conditions: 'id,user_id,name,diagnosed_on,status,managing_physician,notes,created_at,updated_at',
  medications: 'id,user_id,name,dosage,frequency,prescribed_by,start_date,end_date,notes,refills_total,refills_remaining,created_at,updated_at',
  allergies: 'id,user_id,allergen,reaction,severity,diagnosed_on,notes,created_at,updated_at',
  immunizations: 'id,user_id,vaccine,administered_on,provider,lot_number,next_dose,notes,created_at,updated_at',
  encounters: 'id,user_id,title,encounter_date,provider_name,location,encounter_type,description,notes,created_at,updated_at',
  appointments: 'id,user_id,provider_name,provider_id,appointment_type,scheduled_at,location,status,notes,created_at,updated_at',
  care_team: 'id,user_id,name,title,specialty,organization,email,phone,is_primary,notes,created_at,updated_at',
  preventive_care: 'id,user_id,item_name,category,status,recommended_date,completed_date,next_due_date,frequency,provider,notes,source,created_at,updated_at',
  providers: 'id,user_id,npi,name,specialty,clinic,phone,email,address,relationship,connection_source,last_visit_date,in_network,notes,created_at,updated_at',
  pharmacies: 'id,user_id,name,chain,phone,address,preferred,delivery_options,in_network,notes,created_at,updated_at',
  insurance_coverages: 'id,user_id,provider_id,plan_name,member_id,member_id_hash,group_number,bin,pcn,relationship,effective_start,effective_end,is_primary,verification_status,last_verified_at,source,coverage_status,stopped_at,created_at,updated_at',
  insurance_policies: 'id,user_id,carrier_name,member_id,group_number,plan_type,claims_phone,is_primary,created_at,updated_at',
  claims: 'id,user_id,coverage_id,claim_number,provider_name,service_date,billed_amount,allowed_amount,patient_responsibility,status,description,created_at,updated_at',
  health_records: 'id,user_id,kind,title,provider_name,provider_id,service_date,received_at,source,file_type,file_size_bytes,ai_summary,tags,created_at,updated_at',
  health_record_requests: 'id,user_id,provider_name,provider_id,record_types,date_range_start,date_range_end,status,notes,provider_email,doctor_name,message,patient_name,urgency,expires_at,opened_at,submitted_at,created_at,updated_at',
  medical_form_uploads: 'id,user_id,patient_id,title,notes,original_filename,mime_type,size_bytes,status,created_at,updated_at',
  provider_connections: 'id,user_id,provider_organization_id,connection_method,status,last_synced_at,ehr_source,created_at,updated_at',
  diet_log_entries: 'id,user_id,meal_type,consumed_at,items,water_ml,notes,source,confirmation_status,created_at,updated_at',
  life_signal_entries: 'id,user_id,energy,sleep,mood,stress,pain,note,recorded_at,source,confirmation_status,created_at,updated_at',
  vital_measurements: 'id,user_id,metric,value,secondary_value,unit,observed_at,source_kind,source_name,device_name,created_at',
  connected_health_records: 'id,user_id,record_type,title,code,status,effective_date,provider_name,details,source_kind,source_name,created_at',
  wellness_check_ins: 'id,user_id,partner_key,questionnaire_version,answers,skipped_questions,answered_count,status,completed_at,created_at,updated_at',
  wellness_insights: 'id,user_id,partner_key,version,status,insight,source_kinds,safety_flags,generated_at,created_at',
  wellness_insight_feedback: 'id,user_id,insight_id,target,rating,created_at,updated_at',
  wellness_partner_enrollments: 'id,user_id,partner_key,active,consent_version,opted_in_at,opted_in_source,snoozed_until,opted_out_at,created_at,updated_at',
};

const PAGE_SIZE = 250;
const MAX_ROWS = 50_000;
const MAX_BYTES = 40 * 1024 * 1024;
type Row = Record<string, unknown>;

export async function collectAccountExport(client: any, userId: string, now = new Date()) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) throw new Error('Authentication required.');
  const tables: Record<string, Row[]> = {};
  let total = 0; let bytes = 0;
  async function read(table: string, columns: string, ownerColumn: string, owners: string[]) {
    if (!owners.length) { tables[table] = []; return; }
    const rows: Row[] = []; let expected: number | undefined;
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error, count } = await client.from(table).select(columns, { count: 'exact' })
        .in(ownerColumn, owners).order('id').range(offset, offset + PAGE_SIZE - 1);
      if (error || !Array.isArray(data) || typeof count !== 'number') throw new Error(`Unable to export ${table}. No download was created.`);
      if (expected !== undefined && count !== expected) throw new Error('Your data changed during export. Please try again.');
      expected = count;
      if (total + count > MAX_ROWS) throw new Error('This account exceeds the download size limit. Contact support for an assisted export.');
      for (const row of data) {
        if (!owners.includes(String(row[ownerColumn]))) throw new Error('Export ownership check failed.');
        // Defensive projection also protects against unexpected API/mock columns.
        const projected = Object.fromEntries(columns.split(',').map(key => [key, row[key]]));
        bytes += new TextEncoder().encode(JSON.stringify(projected)).length;
        if (bytes > MAX_BYTES) throw new Error('This account exceeds the download size limit. Contact support for an assisted export.');
        rows.push(projected);
      }
      if (rows.length >= count) break;
      if (!data.length) throw new Error('Export was incomplete. Please try again.');
    }
    if (rows.length !== expected || new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('Your data changed during export. Please try again.');
    total += rows.length; tables[table] = rows;
  }
  // Sequential reads bound load and memory; a failure aborts the entire download.
  for (const [table, columns] of Object.entries(EXPORT_TABLES)) await read(table, columns, 'user_id', [userId]);
  const patients = tables.patient_profiles.map(row => String(row.id));
  await read('form_responses', 'id,patient_id,template_id,answers_json,fhir_qr_json,status,signed_at,created_at,updated_at', 'patient_id', patients);
  await read('share_events', 'id,patient_id,form_response_ids,method,recipient,status,sent_at,opened_at,revoked_at,is_revoked,note,created_at,expires_at', 'patient_id', [userId, ...patients]);
  await read('patient_clinical_records', 'id,consumer_principal_id,resource_type,title,occurred_at,provider_name,payload,released_at', 'consumer_principal_id', [userId]);
  await read('provider_access_grants', 'id,consumer_principal_id,scope,purpose,consent_version,status,effective_at,expires_at,granted_at,revoked_at,created_at', 'consumer_principal_id', [userId]);
  return {
    format: 'health-vault-personal-data', version: 1, exportedAt: now.toISOString(), accountId: userId,
    scope: 'Personal structured Vault data visible to your account. Not a full database backup.',
    exclusions: ['Original uploaded files, images and generated PDFs (download separately from their record or form).', 'Passwords, session credentials, provider tokens and bearer share links.', 'Internal audit/security logs, unfinished tool proposals and provider-managed administrative records.'],
    consistency: 'Records are read sequentially; avoid editing while downloading. This is not a transaction snapshot.',
    counts: Object.fromEntries(Object.entries(tables).map(([key, rows]) => [key, rows.length])), tables,
  };
}
