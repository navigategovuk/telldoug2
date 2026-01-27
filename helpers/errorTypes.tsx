/**
 * Standardized API Error Types
 * 
 * Consistent error shapes across all endpoints for predictable
 * client-side error handling and observability.
 */

// ============================================================================
// ERROR CODES
// ============================================================================

export type ApiErrorCode =
  // Authentication errors (401)
  | "UNAUTHORIZED"
  | "SESSION_EXPIRED"
  | "INVALID_TOKEN"
  // Authorization errors (403)
  | "FORBIDDEN"
  | "WORKSPACE_ACCESS_DENIED"
  | "RESOURCE_ACCESS_DENIED"
  // Not found errors (404)
  | "NOT_FOUND"
  | "PROFILE_NOT_FOUND"
  | "VARIANT_NOT_FOUND"
  | "SNAPSHOT_NOT_FOUND"
  | "SHARE_LINK_NOT_FOUND"
  | "WORKSPACE_NOT_FOUND"
  // Validation errors (400)
  | "VALIDATION_ERROR"
  | "INVALID_INPUT"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_FORMAT"
  // Conflict errors (409)
  | "CONFLICT"
  | "DUPLICATE_ENTRY"
  | "RESOURCE_MODIFIED"
  | "OPTIMISTIC_LOCK_FAILED"
  // Rate limiting (429)
  | "RATE_LIMITED"
  | "TOO_MANY_REQUESTS"
  // Server errors (500)
  | "INTERNAL_ERROR"
  | "DATABASE_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  // CSRF errors (403)
  | "CSRF_TOKEN_MISSING"
  | "CSRF_TOKEN_INVALID";

// ============================================================================
// ERROR RESPONSE STRUCTURE
// ============================================================================

export interface ApiError {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
    field?: string;
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============================================================================
// VALIDATION ERROR DETAILS
// ============================================================================

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  received?: unknown;
  expected?: string;
}

export interface ValidationError extends ApiError {
  error: ApiError["error"] & {
    code: "VALIDATION_ERROR";
    details: {
      errors: ValidationErrorDetail[];
    };
  };
}

// ============================================================================
// RATE LIMIT ERROR DETAILS
// ============================================================================

export interface RateLimitError extends ApiError {
  error: ApiError["error"] & {
    code: "RATE_LIMITED" | "TOO_MANY_REQUESTS";
    details: {
      limit: number;
      remaining: number;
      resetAt: string;
      retryAfter: number;
    };
  };
}

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

let requestIdCounter = 0;

function generateRequestId(): string {
  return `req_${Date.now()}_${++requestIdCounter}`;
}

export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
  field?: string
): ApiError {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      field,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };
}

export function createValidationError(
  errors: ValidationErrorDetail[]
): ValidationError {
  return {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: `Validation failed: ${errors.length} error(s)`,
      details: { errors },
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };
}

export function createRateLimitError(
  limit: number,
  remaining: number,
  resetAt: Date
): RateLimitError {
  const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
  return {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      details: {
        limit,
        remaining,
        resetAt: resetAt.toISOString(),
        retryAfter,
      },
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };
}

export function createSuccessResponse<T>(
  data: T,
  meta?: ApiSuccess<T>["meta"]
): ApiSuccess<T> {
  return {
    success: true,
    data,
    meta,
  };
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === false &&
    "error" in response
  );
}

export function isValidationError(error: ApiError): error is ValidationError {
  return error.error.code === "VALIDATION_ERROR";
}

export function isRateLimitError(error: ApiError): error is RateLimitError {
  return error.error.code === "RATE_LIMITED" || error.error.code === "TOO_MANY_REQUESTS";
}

// ============================================================================
// HTTP STATUS MAPPING
// ============================================================================

export const ERROR_CODE_TO_STATUS: Record<ApiErrorCode, number> = {
  // 400 Bad Request
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_REQUIRED_FIELD: 400,
  INVALID_FORMAT: 400,
  
  // 401 Unauthorized
  UNAUTHORIZED: 401,
  SESSION_EXPIRED: 401,
  INVALID_TOKEN: 401,
  
  // 403 Forbidden
  FORBIDDEN: 403,
  WORKSPACE_ACCESS_DENIED: 403,
  RESOURCE_ACCESS_DENIED: 403,
  CSRF_TOKEN_MISSING: 403,
  CSRF_TOKEN_INVALID: 403,
  
  // 404 Not Found
  NOT_FOUND: 404,
  PROFILE_NOT_FOUND: 404,
  VARIANT_NOT_FOUND: 404,
  SNAPSHOT_NOT_FOUND: 404,
  SHARE_LINK_NOT_FOUND: 404,
  WORKSPACE_NOT_FOUND: 404,
  
  // 409 Conflict
  CONFLICT: 409,
  DUPLICATE_ENTRY: 409,
  RESOURCE_MODIFIED: 409,
  OPTIMISTIC_LOCK_FAILED: 409,
  
  // 429 Too Many Requests
  RATE_LIMITED: 429,
  TOO_MANY_REQUESTS: 429,
  
  // 500 Internal Server Error
  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  EXTERNAL_SERVICE_ERROR: 500,
};

export function getHttpStatusForError(code: ApiErrorCode): number {
  return ERROR_CODE_TO_STATUS[code] ?? 500;
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

export interface ErrorLogContext {
  code: ApiErrorCode;
  message: string;
  requestId?: string;
  userId?: number;
  workspaceId?: string;
  path?: string;
  method?: string;
  duration?: number;
  stack?: string;
}

export function formatErrorForLogging(
  error: ApiError,
  context?: Partial<ErrorLogContext>
): ErrorLogContext {
  return {
    code: error.error.code,
    message: error.error.message,
    requestId: error.error.requestId,
    ...context,
  };
}
