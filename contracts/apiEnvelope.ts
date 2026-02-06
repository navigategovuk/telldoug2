export type ApiSuccessEnvelope<T> = {
  data: T;
  correlationId: string;
};

export type ApiErrorDetail = {
  code: string;
  message: string;
};

export type ApiErrorEnvelope = {
  error: ApiErrorDetail;
  correlationId: string;
};

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;
