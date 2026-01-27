/**
 * API Error Handler Helper
 * 
 * Consistent error handling for all API endpoints.
 * Converts various error types to standardized API responses.
 */

import type { Context } from "hono";
import { ZodError } from "zod";
import {
  createApiError,
  createValidationError,
  getHttpStatusForError,
  type ApiError,
  type ApiErrorCode,
  type ValidationErrorDetail,
  type ErrorLogContext,
} from "./errorTypes";

// ============================================================================
// ERROR CONVERSION
// ============================================================================

/**
 * Convert Zod validation errors to API validation errors
 */
export function zodErrorToApiError(error: ZodError): ApiError {
  const details: ValidationErrorDetail[] = error.errors.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
    received: "received" in issue ? issue.received : undefined,
    expected: "expected" in issue ? String(issue.expected) : undefined,
  }));

  return createValidationError(details);
}

/**
 * Convert database errors to API errors
 */
export function dbErrorToApiError(error: Error): ApiError {
  const message = error.message.toLowerCase();

  // Unique constraint violation
  if (message.includes("unique") || message.includes("duplicate")) {
    return createApiError(
      "DUPLICATE_ENTRY",
      "A record with this value already exists",
      { originalMessage: error.message }
    );
  }

  // Foreign key violation
  if (message.includes("foreign key") || message.includes("violates")) {
    return createApiError(
      "CONFLICT",
      "Referenced record does not exist or cannot be modified",
      { originalMessage: error.message }
    );
  }

  // Connection errors
  if (message.includes("connection") || message.includes("timeout")) {
    return createApiError(
      "DATABASE_ERROR",
      "Database connection error. Please try again.",
      { originalMessage: error.message }
    );
  }

  // Default database error
  return createApiError(
    "DATABASE_ERROR",
    "An unexpected database error occurred",
    { originalMessage: error.message }
  );
}

/**
 * Convert any error to an API error
 */
export function toApiError(error: unknown): ApiError {
  // Already an API error
  if (isApiError(error)) {
    return error;
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return zodErrorToApiError(error);
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for known error types by name
    if (error.name === "NotFoundError") {
      return createApiError("NOT_FOUND", error.message);
    }

    if (error.name === "UnauthorizedError") {
      return createApiError("UNAUTHORIZED", error.message);
    }

    if (error.name === "ForbiddenError") {
      return createApiError("FORBIDDEN", error.message);
    }

    // Database-like errors
    if (
      error.message.includes("database") ||
      error.message.includes("sql") ||
      error.message.includes("query")
    ) {
      return dbErrorToApiError(error);
    }

    // Generic error
    return createApiError("INTERNAL_ERROR", error.message);
  }

  // Unknown error type
  return createApiError(
    "INTERNAL_ERROR",
    "An unexpected error occurred",
    { rawError: String(error) }
  );
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === false &&
    "error" in value &&
    typeof (value as ApiError).error.code === "string"
  );
}

// ============================================================================
// ERROR RESPONSE HELPERS
// ============================================================================

/**
 * Send an API error response
 */
export function sendError(c: Context, error: ApiError): Response {
  const status = getHttpStatusForError(error.error.code);
  return c.json(error, status as any);
}

/**
 * Send a specific error code
 */
export function sendErrorCode(
  c: Context,
  code: ApiErrorCode,
  message?: string,
  details?: Record<string, unknown>
): Response {
  const error = createApiError(code, message || code, details);
  return sendError(c, error);
}

/**
 * Common error response shortcuts
 */
export const errorResponses = {
  notFound: (c: Context, resource = "Resource") =>
    sendErrorCode(c, "NOT_FOUND", `${resource} not found`),

  unauthorized: (c: Context, message = "Authentication required") =>
    sendErrorCode(c, "UNAUTHORIZED", message),

  forbidden: (c: Context, message = "Access denied") =>
    sendErrorCode(c, "FORBIDDEN", message),

  badRequest: (c: Context, message = "Invalid request") =>
    sendErrorCode(c, "INVALID_INPUT", message),

  conflict: (c: Context, message = "Resource conflict") =>
    sendErrorCode(c, "CONFLICT", message),

  internal: (c: Context, message = "Internal server error") =>
    sendErrorCode(c, "INTERNAL_ERROR", message),
};

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * Global error handler middleware
 */
export function errorHandlerMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      await next();
    } catch (error) {
      // Log error
      console.error("[API Error]", error);

      // Convert to API error
      const apiError = toApiError(error);

      // Add request context if available
      if (apiError.error.details) {
        apiError.error.details.path = c.req.path;
        apiError.error.details.method = c.req.method;
      }

      return sendError(c, apiError);
    }
  };
}

// ============================================================================
// TRY-CATCH WRAPPER
// ============================================================================

type AsyncHandler = (c: Context) => Promise<Response>;

/**
 * Wrap an async handler with error handling
 */
export function withErrorHandling(handler: AsyncHandler): AsyncHandler {
  return async (c: Context) => {
    try {
      return await handler(c);
    } catch (error) {
      console.error("[Handler Error]", error);
      const apiError = toApiError(error);
      return sendError(c, apiError);
    }
  };
}

// ============================================================================
// VALIDATION WRAPPER
// ============================================================================

import { z } from "zod";

/**
 * Validate request body with Zod schema
 */
export async function validateBody<T extends z.ZodType>(
  c: Context,
  schema: T
): Promise<z.infer<T> | Response> {
  try {
    const body = await c.req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(c, zodErrorToApiError(error));
    }
    if (error instanceof SyntaxError) {
      return sendErrorCode(c, "INVALID_INPUT", "Invalid JSON in request body");
    }
    throw error;
  }
}

/**
 * Validate query params with Zod schema
 */
export function validateQuery<T extends z.ZodType>(
  c: Context,
  schema: T
): z.infer<T> | Response {
  try {
    const query = c.req.query();
    return schema.parse(query);
  } catch (error) {
    if (error instanceof ZodError) {
      return sendError(c, zodErrorToApiError(error));
    }
    throw error;
  }
}

// ============================================================================
// LOGGING
// ============================================================================

export interface ErrorLogger {
  error(context: ErrorLogContext): void;
  warn(context: ErrorLogContext): void;
}

const defaultLogger: ErrorLogger = {
  error(context) {
    console.error("[ERROR]", JSON.stringify(context));
  },
  warn(context) {
    console.warn("[WARN]", JSON.stringify(context));
  },
};

let logger: ErrorLogger = defaultLogger;

export function setErrorLogger(newLogger: ErrorLogger): void {
  logger = newLogger;
}

export function logError(
  error: ApiError,
  context: Partial<ErrorLogContext> = {}
): void {
  const logContext: ErrorLogContext = {
    code: error.error.code,
    message: error.error.message,
    requestId: error.error.requestId,
    ...context,
  };

  // Log based on severity
  const status = getHttpStatusForError(error.error.code);
  if (status >= 500) {
    logger.error(logContext);
  } else {
    logger.warn(logContext);
  }
}
