/**
 * Share Link & Access Types for Resume Builder
 * 
 * Public share links allow controlled external access to resume variants.
 * Access logs track views for analytics and security.
 */

// ============================================================================
// PUBLIC SHARE LINKS
// ============================================================================

export interface ShareLink {
  id: string;
  resumeVariantId: string;
  token: string;
  label?: string | null;
  isLive?: boolean | null;
  isRevoked?: boolean | null;
  expiresAt?: Date | null;
  passwordHash?: string | null;
  snapshotId?: string | null;
  viewCount?: number | null;
  lastViewedAt?: Date | null;
  createdAt?: Date | null;
}

export interface ShareLinkWithVariant extends ShareLink {
  variant?: {
    id: string;
    name: string;
    profileId: string;
  } | null;
}

// ============================================================================
// ACCESS LOG
// ============================================================================

export interface AccessLogEntry {
  id: string;
  shareLinkId: string;
  accessedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  duration?: number | null;
  sectionsViewed?: string[] | null;
}

export interface AccessLogSummary {
  shareLinkId: string;
  totalViews: number;
  uniqueIPs: number;
  lastAccessedAt?: Date | null;
  avgDuration?: number | null;
  topReferrers: Array<{ referrer: string; count: number }>;
  viewsByDate: Array<{ date: string; count: number }>;
}

// ============================================================================
// SHARE LINK CONFIGURATION
// ============================================================================

export type ShareLinkMode = "live" | "snapshot";

export interface ShareLinkConfig {
  mode: ShareLinkMode;
  snapshotId?: string;
  expiresIn?: ShareLinkExpiry;
  password?: string;
  trackAnalytics?: boolean;
}

export type ShareLinkExpiry =
  | "1h"
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "never";

export const EXPIRY_DURATIONS: Record<ShareLinkExpiry, number | null> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  "never": null,
};

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ShareLinkCreateInput {
  variantId: string;
  label?: string;
  mode?: ShareLinkMode;
  snapshotId?: string;
  expiresIn?: ShareLinkExpiry;
  password?: string;
}

export interface ShareLinkUpdateInput {
  label?: string;
  isLive?: boolean;
  expiresAt?: string | null;
  snapshotId?: string | null;
}

export interface ShareLinkRevokeInput {
  reason?: string;
}

// ============================================================================
// PUBLIC ACCESS TYPES
// ============================================================================

export interface PublicResumeRequest {
  token: string;
  password?: string;
}

export interface PublicResumeResponse {
  success: boolean;
  requiresPassword?: boolean;
  resume?: {
    name: string;
    label?: string;
    data: unknown;
  };
  error?: string;
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export interface ShareLinkQueryOptions {
  workspaceId?: string;
  variantId?: string;
  includeRevoked?: boolean;
  includeExpired?: boolean;
}

export interface AccessLogQueryOptions {
  shareLinkId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface ShareLinkAnalytics {
  link: ShareLink;
  summary: AccessLogSummary;
  recentAccess: AccessLogEntry[];
}

export interface WorkspaceShareAnalytics {
  totalLinks: number;
  activeLinks: number;
  totalViews: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  topLinks: Array<{
    link: ShareLink;
    views: number;
  }>;
}

// ============================================================================
// SECURITY TYPES
// ============================================================================

export interface ShareLinkSecurityEvent {
  type: "created" | "accessed" | "revoked" | "expired" | "password_failed";
  shareLinkId: string;
  timestamp: Date;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}
