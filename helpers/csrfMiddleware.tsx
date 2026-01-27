/**
 * CSRF Middleware Helper
 * 
 * Implements double-submit cookie pattern for CSRF protection.
 * Token in cookie + token in header must match for state-changing requests.
 */

import { nanoid } from "nanoid";
import type { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { createApiError, type ApiError } from "./errorTypes";

// ============================================================================
// CONSTANTS
// ============================================================================

// Use __Host- prefix only in production (requires Secure cookie)
const CSRF_COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-csrf" : "csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

// Methods that require CSRF protection
const PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Paths exempt from CSRF (public endpoints)
const EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/oauth/callback",
  "/api/public",
]);

// ============================================================================
// TOKEN GENERATION
// ============================================================================

export function generateCsrfToken(): string {
  return nanoid(CSRF_TOKEN_LENGTH);
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export interface CsrfMiddlewareOptions {
  exemptPaths?: string[];
  cookieName?: string;
  headerName?: string;
  secure?: boolean;
}

export function csrfMiddleware(options: CsrfMiddlewareOptions = {}) {
  const {
    exemptPaths = [],
    cookieName = CSRF_COOKIE_NAME,
    headerName = CSRF_HEADER_NAME,
    secure = process.env.NODE_ENV === "production",
  } = options;

  const allExemptPaths = new Set([...EXEMPT_PATHS, ...exemptPaths]);

  return async (c: Context, next: Next) => {
    const method = c.req.method;
    const path = c.req.path;

    // Check if path is exempt
    const isExempt = Array.from(allExemptPaths).some((exempt) =>
      path.startsWith(exempt)
    );

    // GET/HEAD/OPTIONS don't need CSRF protection
    if (!PROTECTED_METHODS.has(method) || isExempt) {
      // Ensure CSRF cookie exists for subsequent requests
      let csrfToken = getCookie(c, cookieName);
      
      if (!csrfToken) {
        csrfToken = generateCsrfToken();
        setCookie(c, cookieName, csrfToken, {
          httpOnly: false, // Client needs to read this
          secure,
          sameSite: "Lax",
          path: "/",
          maxAge: CSRF_COOKIE_MAX_AGE,
        });
      }

      // Add token to response header for client convenience
      c.header("X-CSRF-Token", csrfToken);
      
      await next();
      return;
    }

    // Validate CSRF token for protected methods
    const cookieToken = getCookie(c, cookieName);
    const headerToken = c.req.header(headerName);

    if (!cookieToken) {
      const error = createApiError(
        "CSRF_TOKEN_MISSING",
        "CSRF cookie not found. Please refresh the page and try again."
      );
      return c.json(error, 403);
    }

    if (!headerToken) {
      const error = createApiError(
        "CSRF_TOKEN_MISSING",
        `CSRF token header (${headerName}) is required for ${method} requests.`
      );
      return c.json(error, 403);
    }

    if (cookieToken !== headerToken) {
      const error = createApiError(
        "CSRF_TOKEN_INVALID",
        "CSRF token mismatch. Please refresh the page and try again."
      );
      return c.json(error, 403);
    }

    // CSRF valid - proceed
    await next();
  };
}

// ============================================================================
// CLIENT HELPERS
// ============================================================================

/**
 * Client-side helper to get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") {return null;}
  
  const match = document.cookie.match(
    new RegExp(`(^| )${CSRF_COOKIE_NAME}=([^;]+)`)
  );
  return match ? match[2] : null;
}

/**
 * Client-side helper to add CSRF token to fetch headers
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfTokenFromCookie();
  if (!token) {return headers;}

  if (headers instanceof Headers) {
    headers.set(CSRF_HEADER_NAME, token);
    return headers;
  }

  if (Array.isArray(headers)) {
    return [...headers, [CSRF_HEADER_NAME, token]];
  }

  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  };
}

/**
 * Client-side wrapper for fetch with CSRF token
 */
export async function csrfFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = addCsrfHeader(init?.headers || {});
  return fetch(input, { ...init, headers });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Manual CSRF validation for use outside middleware
 */
export function validateCsrfToken(
  cookieToken: string | undefined,
  headerToken: string | undefined
): { valid: boolean; error?: ApiError } {
  if (!cookieToken) {
    return {
      valid: false,
      error: createApiError(
        "CSRF_TOKEN_MISSING",
        "CSRF cookie not found"
      ),
    };
  }

  if (!headerToken) {
    return {
      valid: false,
      error: createApiError(
        "CSRF_TOKEN_MISSING",
        "CSRF header token not found"
      ),
    };
  }

  if (cookieToken !== headerToken) {
    return {
      valid: false,
      error: createApiError(
        "CSRF_TOKEN_INVALID",
        "CSRF token mismatch"
      ),
    };
  }

  return { valid: true };
}

// ============================================================================
// TESTING HELPERS
// ============================================================================

/**
 * Generate matching cookie/header tokens for testing
 */
export function createTestCsrfTokens(): {
  cookie: string;
  header: string;
  cookieName: string;
  headerName: string;
} {
  const token = generateCsrfToken();
  return {
    cookie: token,
    header: token,
    cookieName: CSRF_COOKIE_NAME,
    headerName: CSRF_HEADER_NAME,
  };
}
