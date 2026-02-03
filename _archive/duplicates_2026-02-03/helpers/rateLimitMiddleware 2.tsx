/**
 * Rate Limit Middleware Helper
 * 
 * Per-category rate limiting with configurable windows and limits.
 * Uses in-memory store for development, Redis-compatible interface for production.
 */

import type { Context, Next } from "hono";
import { createRateLimitError } from "./errorTypes";

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export type RateLimitCategory =
  | "auth"
  | "export"
  | "import"
  | "share"
  | "crud"
  | "public"
  | "ai";

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
  increment(key: string): Promise<number>;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const RATE_LIMIT_CONFIGS: Record<RateLimitCategory, RateLimitConfig> = {
  auth: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 req/min
  export: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 req/min
  import: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 req/min
  share: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 req/min
  crud: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 req/min
  public: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 req/min per IP
  ai: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 req/min (AI is expensive)
};

// ============================================================================
// IN-MEMORY STORE (Development)
// ============================================================================

const memoryStore = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt < now) {
      memoryStore.delete(key);
    }
  }
}

// Cleanup every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 60 * 1000);
}

export const inMemoryStore: RateLimitStore = {
  async get(key: string) {
    const entry = memoryStore.get(key);
    if (!entry) {return null;}
    if (entry.resetAt < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return entry;
  },

  async set(key: string, entry: RateLimitEntry) {
    memoryStore.set(key, entry);
  },

  async increment(key: string) {
    const entry = memoryStore.get(key);
    if (entry && entry.resetAt > Date.now()) {
      entry.count++;
      return entry.count;
    }
    return 1;
  },
};

// ============================================================================
// RATE LIMIT CHECK
// ============================================================================

export async function checkRateLimit(
  store: RateLimitStore,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = now + config.windowMs;

  let entry = await store.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new window
    entry = { count: 1, resetAt };
    await store.set(key, entry, config.windowMs);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(resetAt),
      limit: config.maxRequests,
    };
  }

  // Increment existing window
  const newCount = await store.increment(key);
  const remaining = Math.max(0, config.maxRequests - newCount);

  return {
    allowed: newCount <= config.maxRequests,
    remaining,
    resetAt: new Date(entry.resetAt),
    limit: config.maxRequests,
  };
}

// ============================================================================
// KEY GENERATORS
// ============================================================================

function getUserId(c: Context): string | null {
  // Try to get user ID from context (set by auth middleware)
  const user = c.get("user");
  if (user && typeof user.id === "number") {
    return `user:${user.id}`;
  }
  return null;
}

function getClientIp(c: Context): string {
  // Check common headers for proxied requests
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = c.req.header("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback
  return "unknown";
}

export function generateRateLimitKey(
  c: Context,
  category: RateLimitCategory
): string {
  // For authenticated endpoints, use user ID
  const userId = getUserId(c);
  if (userId && category !== "public") {
    return `ratelimit:${category}:${userId}`;
  }

  // For public/unauthenticated, use IP
  const ip = getClientIp(c);
  return `ratelimit:${category}:ip:${ip}`;
}

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

export interface RateLimitMiddlewareOptions {
  category: RateLimitCategory;
  store?: RateLimitStore;
  config?: Partial<RateLimitConfig>;
  keyGenerator?: (c: Context) => string;
  skip?: (c: Context) => boolean;
}

export function rateLimitMiddleware(options: RateLimitMiddlewareOptions) {
  const {
    category,
    store = inMemoryStore,
    config = {},
    keyGenerator,
    skip,
  } = options;

  const finalConfig: RateLimitConfig = {
    ...RATE_LIMIT_CONFIGS[category],
    ...config,
  };

  return async (c: Context, next: Next) => {
    // Check if should skip
    if (skip && skip(c)) {
      await next();
      return;
    }

    // Generate key
    const key = keyGenerator
      ? keyGenerator(c)
      : generateRateLimitKey(c, category);

    // Check rate limit
    const result = await checkRateLimit(store, key, finalConfig);

    // Add rate limit headers
    c.header("X-RateLimit-Limit", result.limit.toString());
    c.header("X-RateLimit-Remaining", result.remaining.toString());
    c.header("X-RateLimit-Reset", Math.floor(result.resetAt.getTime() / 1000).toString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
      c.header("Retry-After", retryAfter.toString());

      const error = createRateLimitError(
        result.limit,
        result.remaining,
        result.resetAt
      );
      return c.json(error, 429);
    }

    await next();
  };
}

// ============================================================================
// PATH-BASED RATE LIMITER
// ============================================================================

export interface PathRateLimitRule {
  pattern: RegExp | string;
  category: RateLimitCategory;
  config?: Partial<RateLimitConfig>;
}

export function createPathBasedRateLimiter(rules: PathRateLimitRule[]) {
  return async (c: Context, next: Next) => {
    const path = c.req.path;

    // Find matching rule
    const rule = rules.find((r) => {
      if (typeof r.pattern === "string") {
        return path.startsWith(r.pattern);
      }
      return r.pattern.test(path);
    });

    if (!rule) {
      // No matching rule - allow through
      await next();
      return;
    }

    // Apply rate limit middleware
    const middleware = rateLimitMiddleware({
      category: rule.category,
      config: rule.config,
    });

    return middleware(c, next);
  };
}

// ============================================================================
// DEFAULT PATH RULES
// ============================================================================

export const DEFAULT_RATE_LIMIT_RULES: PathRateLimitRule[] = [
  { pattern: "/api/auth/", category: "auth" },
  { pattern: "/api/export/", category: "export" },
  { pattern: "/api/import/", category: "import" },
  { pattern: "/api/share", category: "share" },
  { pattern: "/api/public/", category: "public" },
  { pattern: "/api/ai/", category: "ai" },
  { pattern: "/api/", category: "crud" }, // Default for all other API routes
];

// ============================================================================
// TESTING HELPERS
// ============================================================================

export function createTestStore(): RateLimitStore & { clear(): void } {
  const store = new Map<string, RateLimitEntry>();

  return {
    async get(key: string) {
      return store.get(key) || null;
    },
    async set(key: string, entry: RateLimitEntry) {
      store.set(key, entry);
    },
    async increment(key: string) {
      const entry = store.get(key);
      if (entry) {
        entry.count++;
        return entry.count;
      }
      return 1;
    },
    clear() {
      store.clear();
    },
  };
}

/**
 * Simulate hitting rate limit for testing
 */
export async function simulateRateLimitExhaustion(
  store: RateLimitStore,
  key: string,
  config: RateLimitConfig
): Promise<void> {
  for (let i = 0; i < config.maxRequests + 1; i++) {
    await checkRateLimit(store, key, config);
  }
}
