export interface ApiResponseMeta {
  durationMs: number;
  timestamp: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessEnvelope<TData> {
  ok: true;
  requestId: string;
  data: TData;
  meta: ApiResponseMeta;
}

export interface ApiErrorEnvelope {
  ok: false;
  requestId: string;
  error: ApiErrorPayload;
  meta: ApiResponseMeta;
}

export type ApiEnvelope<TData> = ApiSuccessEnvelope<TData> | ApiErrorEnvelope;
