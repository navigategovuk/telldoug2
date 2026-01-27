/**
 * Test Utilities for Smoke Tests
 * 
 * Provides helpers for creating mock requests, sessions, and test data.
 */

import { vi } from 'vitest';
import superjson from 'superjson';

/**
 * Creates a mock Request object for endpoint testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
): Request {
  const { method = 'GET', body, headers = {}, cookies = {} } = options;
  
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  if (cookieHeader) {
    finalHeaders['Cookie'] = cookieHeader;
  }
  
  const requestInit: RequestInit = {
    method,
    headers: finalHeaders,
  };
  
  if (body !== undefined) {
    requestInit.body = superjson.stringify(body);
  }
  
  return new Request(`http://test${url}`, requestInit);
}

/**
 * Creates a mock cookie session (for getServerSessionOrThrow)
 * This is the raw session stored in the cookie with numeric timestamps
 */
export function createMockCookieSession(overrides: Partial<{
  id: string;
  createdAt: number;
  lastAccessed: number;
  passwordChangeRequired?: boolean;
}> = {}) {
  const now = Date.now();
  return {
    id: overrides.id ?? 'test-session-id-' + now,
    createdAt: overrides.createdAt ?? now,
    lastAccessed: overrides.lastAccessed ?? now,
    ...(overrides.passwordChangeRequired !== undefined && { 
      passwordChangeRequired: overrides.passwordChangeRequired 
    }),
  };
}

/**
 * Creates a mock authenticated session data (for getServerUserSession)
 * This is the session object returned after DB lookup:
 * - createdAt is number (from original cookie session)
 * - lastAccessed is Date (overwritten in getServerUserSession)
 */
export function createMockSession(overrides: Partial<{
  id: string;
  createdAt: number;
  lastAccessed: Date;
}> = {}) {
  const now = Date.now();
  return {
    id: overrides.id ?? 'test-session-id-' + now,
    createdAt: overrides.createdAt ?? now,
    lastAccessed: overrides.lastAccessed ?? new Date(),
  };
}

/**
 * Creates a mock user object
 */
export function createMockUser(overrides: Partial<{
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'user' | 'admin' | 'owner';
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  const now = new Date();
  return {
    id: overrides.id ?? 123,
    email: overrides.email ?? 'test@example.com',
    displayName: overrides.displayName ?? 'Test User',
    avatarUrl: overrides.avatarUrl ?? null,
    role: overrides.role ?? 'user',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

import type { Json } from '../schema';

/**
 * Creates a mock workspace object
 * Note: settings type matches Selectable<Workspaces> which is Json | null
 */
export function createMockWorkspace(overrides: Partial<{
  id: string;
  name: string;
  settings: Json | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}> = {}): {
  id: string;
  name: string;
  settings: Json | null;
  createdAt: Date | null;
  updatedAt: Date | null;
} {
  const now = new Date();
  return {
    id: overrides.id ?? 'workspace-test-123',
    name: overrides.name ?? 'Test Workspace',
    settings: overrides.settings ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

/**
 * Creates a mock profile object
 */
export function createMockProfile(overrides: Partial<{
  id: string;
  workspaceId: string;
  fullName: string;
  label: string;
  email: string;
  phone: string | null;
  url: string | null;
  summary: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  const now = new Date();
  return {
    id: overrides.id ?? 'profile-test-123',
    workspaceId: overrides.workspaceId ?? 'workspace-test-123',
    fullName: overrides.fullName ?? 'John Doe',
    label: overrides.label ?? 'Software Engineer',
    email: overrides.email ?? 'john@example.com',
    phone: overrides.phone ?? null,
    url: overrides.url ?? null,
    summary: overrides.summary ?? 'Experienced software engineer.',
    location: overrides.location ?? 'San Francisco, CA',
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

/**
 * Creates a mock variant object
 */
export function createMockVariant(overrides: Partial<{
  id: string;
  profileId: string;
  workspaceId: string;
  name: string;
  description: string | null;
  targetRole: string | null;
  isPrimary: boolean | null;
  viewDefinitionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  const now = new Date();
  return {
    id: overrides.id ?? 'variant-test-123',
    profileId: overrides.profileId ?? 'profile-test-123',
    workspaceId: overrides.workspaceId ?? 'workspace-test-123',
    name: overrides.name ?? 'Main Resume',
    description: overrides.description ?? null,
    targetRole: overrides.targetRole ?? 'Senior Engineer',
    isPrimary: overrides.isPrimary ?? false,
    viewDefinitionId: overrides.viewDefinitionId ?? null,
    canonicalDataHash: null,
    compiledAt: null,
    compiledData: null,
    lastCanonicalChange: null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

/**
 * Generates a unique ID for test data
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Parse superjson response body
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return superjson.parse<T>(text);
  } catch {
    // Fallback to regular JSON parse
    return JSON.parse(text) as T;
  }
}
