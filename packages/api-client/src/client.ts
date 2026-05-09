import type {
  HealthRecord,
  PendingRequest,
  EHRConnection,
  VaultStats,
  PaginatedResponse,
  UploadedFile,
  RecordKind,
} from "@health-vault/types";

export interface ClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  getAccessToken: () => string | null;
}

export class HealthVaultClient {
  private readonly restBase: string;
  private readonly fnBase: string;

  constructor(private readonly config: ClientConfig) {
    this.restBase = `${config.supabaseUrl}/rest/v1`;
    this.fnBase = `${config.supabaseUrl}/functions/v1`;
  }

  private authHeaders(): Record<string, string> {
    const token = this.config.getAccessToken();
    return {
      apikey: this.config.supabaseAnonKey,
      ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${this.config.supabaseAnonKey}` }),
    };
  }

  private async restGet<T>(table: string, params: Record<string, string> = {}): Promise<T[]> {
    const qs = new URLSearchParams({
      ...params,
      order: params.order ?? "created_at.desc",
    }).toString();
    const res = await fetch(`${this.restBase}/${table}?${qs}`, {
      headers: {
        ...this.authHeaders(),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? `GET ${table} failed (${res.status})`);
    }
    return res.json();
  }

  private async fn<T>(name: string, body?: unknown, method = "POST"): Promise<T> {
    const res = await fetch(`${this.fnBase}/${name}`, {
      method,
      headers: {
        ...this.authHeaders(),
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `${name} failed (${res.status})`);
    return json as T;
  }

  // ── Records ─────────────────────────────────────────────────────────────────

  async listRecords(opts: {
    kind?: RecordKind;
    source?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PaginatedResponse<HealthRecord>> {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const params: Record<string, string> = {
      select: "*",
      limit: String(pageSize),
      offset: String(offset),
    };
    if (opts.kind) params["kind"] = `eq.${opts.kind}`;
    if (opts.source) params["source"] = `eq.${opts.source}`;

    const rows = await this.restGet<Record<string, unknown>>("health_records", params);

    const items: HealthRecord[] = rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      providerName: (r.provider_name as string) ?? null,
      serviceDate: (r.service_date as string) ?? null,
      kind: r.kind as RecordKind,
      source: r.source as "connected" | "shared" | "uploaded",
      fileType: (r.file_type as string) ?? null,
      fileSizeBytes: (r.file_size_bytes as number) ?? null,
      previewUrl: (r.preview_url as string) ?? null,
      tags: (r.tags as string[]) ?? [],
      aiSummary: (r.ai_summary as string) ?? null,
      fhirRef: (r.fhir_ref as Record<string, unknown>) ?? null,
      createdAt: r.created_at as string,
    }));

    return { items, total: items.length, page, pageSize };
  }

  async getRecord(id: string): Promise<HealthRecord | null> {
    const rows = await this.restGet<Record<string, unknown>>("health_records", {
      select: "*",
      id: `eq.${id}`,
      limit: "1",
    });
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id as string,
      title: r.title as string,
      providerName: (r.provider_name as string) ?? null,
      serviceDate: (r.service_date as string) ?? null,
      kind: r.kind as RecordKind,
      source: r.source as "connected" | "shared" | "uploaded",
      fileType: (r.file_type as string) ?? null,
      fileSizeBytes: (r.file_size_bytes as number) ?? null,
      previewUrl: (r.preview_url as string) ?? null,
      tags: (r.tags as string[]) ?? [],
      aiSummary: (r.ai_summary as string) ?? null,
      fhirRef: (r.fhir_ref as Record<string, unknown>) ?? null,
      createdAt: r.created_at as string,
    };
  }

  async analyzeRecord(recordId: string): Promise<{ recordId: string; summary: string }> {
    return this.fn("analyze-record", { recordId });
  }

  async shareRecord(recordId: string, recipientEmail: string): Promise<{ shared: boolean; shareId: string }> {
    return this.fn("share", { recordId, recipientEmail });
  }

  // ── Requests ─────────────────────────────────────────────────────────────────

  async listRecordRequests(): Promise<PendingRequest[]> {
    const rows = await this.restGet<Record<string, unknown>>("health_record_requests", {
      select: "id,provider_name,provider_email,doctor_name,record_types,status,created_at,opened_at,submitted_at,expires_at",
    });
    return rows.map((r) => ({
      id: r.id as string,
      providerName: r.provider_name as string,
      providerEmail: (r.provider_email as string) ?? "",
      doctorName: (r.doctor_name as string) ?? null,
      recordTypes: (r.record_types as string[]) ?? [],
      status: r.status as PendingRequest["status"],
      createdAt: r.created_at as string,
      openedAt: (r.opened_at as string) ?? null,
      submittedAt: (r.submitted_at as string) ?? null,
      expiresAt: (r.expires_at as string) ?? null,
    }));
  }

  async requestRecord(params: {
    providerName: string;
    providerEmail: string;
    doctorName?: string;
    recordTypes?: string[];
    message?: string;
  }): Promise<{ requestId: string; emailSent: boolean }> {
    return this.fn("record-request", params);
  }

  // ── EHR / Sync ────────────────────────────────────────────────────────────────

  async listEHRConnections(): Promise<EHRConnection[]> {
    const rows = await this.restGet<Record<string, unknown>>("provider_connections", {
      select: "id,ehr_source,fhir_patient_id,status,last_synced_at",
      connection_method: "eq.keragon",
    });
    return rows.map((r) => ({
      id: r.id as string,
      ehrSource: r.ehr_source as string,
      ehrPatientId: (r.fhir_patient_id as string) ?? null,
      providerName: r.ehr_source as string,
      status: r.status as EHRConnection["status"],
      lastSyncedAt: (r.last_synced_at as string) ?? null,
    }));
  }

  async triggerSync(connectionId: string): Promise<{ triggered: boolean; message: string }> {
    return this.fn("trigger-ehr-fetch", { connectionId });
  }

  async connectEHR(params: {
    ehrSource: string;
    ehrPatientId: string;
    ehrDepartmentId?: string;
    providerName: string;
  }): Promise<{ connectionId: string; fetchTriggered: boolean }> {
    return this.fn("trigger-ehr-fetch", params);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  async getStats(): Promise<VaultStats> {
    return this.fn("vault-stats", undefined, "GET");
  }

  // ── File Upload ───────────────────────────────────────────────────────────────

  async uploadRecord(params: {
    file: Blob;
    fileName: string;
    kind: RecordKind;
    title?: string;
  }): Promise<UploadedFile> {
    const token = this.config.getAccessToken();
    const formData = new FormData();
    formData.append("file", params.file, params.fileName);
    formData.append("kind", params.kind);
    if (params.title) formData.append("title", params.title);

    const res = await fetch(`${this.fnBase}/inbound-records/upload`, {
      method: "POST",
      headers: {
        apikey: this.config.supabaseAnonKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
    return json as UploadedFile;
  }
}
