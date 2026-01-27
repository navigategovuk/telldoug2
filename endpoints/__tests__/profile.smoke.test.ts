/**
 * Profile & Variant Smoke Tests
 * 
 * Tests the profile and resume variant management flows:
 * - Get profile → Returns profile data
 * - Create variant → New variant created
 * - Set primary → Variant marked as primary
 * - List variants → All variants returned
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createMockRequest, 
  createMockWorkspace,
  createMockProfile,
  createMockVariant,
  parseResponse,
  generateTestId 
} from '../../helpers/__tests__/testUtils';
import { mockKyselyChain, createMockDb, setupDbMock } from '../../helpers/__mocks__/db';

// Create mock instances
const mockDb = createMockDb();
const mockWorkspace = createMockWorkspace();
const mockProfile = createMockProfile({ workspaceId: mockWorkspace.id });
const mockVariant = createMockVariant({ 
  profileId: mockProfile.id, 
  workspaceId: mockWorkspace.id 
});

// Mock modules
vi.mock('../../helpers/db', () => ({
  db: mockDb,
}));

vi.mock('../../helpers/workspaceUtils', () => ({
  getAuthenticatedWorkspace: vi.fn(),
}));

vi.mock('../../helpers/getSetServerSession', () => ({
  NotAuthenticatedError: class NotAuthenticatedError extends Error {
    constructor() {
      super('Not authenticated');
      this.name = 'NotAuthenticatedError';
    }
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('mock-nanoid-123'),
}));

describe('Profile & Variant Golden Path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDbMock(mockDb, {});
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('GET /profile', () => {
    it('returns profile with work, education, skills, projects', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      vi.mocked(getAuthenticatedWorkspace).mockResolvedValue(mockWorkspace);

      // Setup table data
      const mockWork = [{ id: 'work-1', profileId: mockProfile.id, company: 'Acme', title: 'Engineer' }];
      const mockEducation = [{ id: 'edu-1', profileId: mockProfile.id, school: 'MIT' }];
      const mockSkills = [{ id: 'skill-1', profileId: mockProfile.id, name: 'TypeScript' }];
      const mockProjects = [{ id: 'proj-1', profileId: mockProfile.id, name: 'App' }];

      mockDb.selectFrom.mockImplementation((table: string) => {
        const data: Record<string, unknown> = {
          profiles: mockProfile,
          workExperiences: mockWork,
          educationEntries: mockEducation,
          skills: mockSkills,
          projects: mockProjects,
        };
        return mockKyselyChain(data[table] ?? null);
      });

      const { handle } = await import('../profile/get_GET');
      
      const request = createMockRequest('/_api/profile');
      const response = await handle(request);
      const data = await parseResponse<{
        profile: typeof mockProfile;
        work: typeof mockWork;
        education: typeof mockEducation;
        skills: typeof mockSkills;
        projects: typeof mockProjects;
      }>(response);

      expect(response.status).toBe(200);
      expect(data.profile).toBeDefined();
      expect(data.profile.fullName).toBe(mockProfile.fullName);
      expect(data.work).toHaveLength(1);
      expect(data.skills).toHaveLength(1);
    });

    it('returns empty data when no profile exists', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      vi.mocked(getAuthenticatedWorkspace).mockResolvedValue(mockWorkspace);

      // No profile found
      mockDb.selectFrom.mockReturnValue(mockKyselyChain(null));

      const { handle } = await import('../profile/get_GET');
      
      const request = createMockRequest('/_api/profile');
      const response = await handle(request);
      const data = await parseResponse<{ profile: null }>(response);

      expect(response.status).toBe(200);
      expect(data.profile).toBeNull();
    });

    it('returns 401 when not authenticated', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      const { NotAuthenticatedError } = await import('../../helpers/getSetServerSession');
      
      vi.mocked(getAuthenticatedWorkspace).mockRejectedValue(new NotAuthenticatedError());

      const { handle } = await import('../profile/get_GET');
      
      const request = createMockRequest('/_api/profile');
      const response = await handle(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /variants/create', () => {
    it('creates new resume variant', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      vi.mocked(getAuthenticatedWorkspace).mockResolvedValue(mockWorkspace);

      const newVariant = createMockVariant({
        id: 'mock-nanoid-123',
        profileId: mockProfile.id,
        workspaceId: mockWorkspace.id,
        name: 'Tech Resume',
        targetRole: 'Senior Engineer',
      });

      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {return mockKyselyChain(mockProfile);}
        if (table === 'resumeVariants') {return mockKyselyChain(newVariant);}
        return mockKyselyChain(null);
      });

      mockDb.insertInto.mockReturnValue(mockKyselyChain(newVariant));
      mockDb.updateTable.mockReturnValue(mockKyselyChain(newVariant));

      const { handle } = await import('../variants/create_POST');
      
      const request = createMockRequest('/_api/variants/create', {
        method: 'POST',
        body: {
          name: 'Tech Resume',
          targetRole: 'Senior Engineer',
        },
      });

      const response = await handle(request);
      const data = await parseResponse<{ variant: typeof newVariant; created: boolean }>(response);

      expect(response.status).toBe(200);
      expect(data.variant).toBeDefined();
      expect(data.variant.name).toBe('Tech Resume');
      expect(data.created).toBe(true);
    });

    it('returns error when no profile exists', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      vi.mocked(getAuthenticatedWorkspace).mockResolvedValue(mockWorkspace);

      // No profile found
      mockDb.selectFrom.mockReturnValue(mockKyselyChain(null));

      const { handle } = await import('../variants/create_POST');
      
      const request = createMockRequest('/_api/variants/create', {
        method: 'POST',
        body: {
          name: 'Tech Resume',
        },
      });

      const response = await handle(request);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /variants/setPrimary', () => {
    it('sets variant as primary and unsets others', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      vi.mocked(getAuthenticatedWorkspace).mockResolvedValue(mockWorkspace);

      const existingVariant = createMockVariant({
        id: 'variant-1',
        profileId: mockProfile.id,
        workspaceId: mockWorkspace.id,
        isPrimary: false,
      });

      const previousPrimaryVariant = createMockVariant({
        id: 'variant-old',
        profileId: mockProfile.id,
        isPrimary: true,
      });

      const updatedVariant = { ...existingVariant, isPrimary: true };

      let callCount = 0;
      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'resumeVariants') {
          callCount++;
          // First call: get existing variant
          if (callCount === 1) {return mockKyselyChain(existingVariant);}
          // Second call: find current primary
          if (callCount === 2) {return mockKyselyChain(previousPrimaryVariant);}
          // Third call: get updated variant
          return mockKyselyChain(updatedVariant);
        }
        return mockKyselyChain(null);
      });

      mockDb.updateTable.mockReturnValue(mockKyselyChain(updatedVariant));

      const { handle } = await import('../variants/setDefault_POST');
      
      const request = createMockRequest('/_api/variants/setPrimary', {
        method: 'POST',
        body: {
          id: 'variant-1',
        },
      });

      const response = await handle(request);
      const data = await parseResponse<{ variant: typeof updatedVariant; previousPrimary: string | null }>(response);

      expect(response.status).toBe(200);
      expect(data.variant.isPrimary).toBe(true);
      expect(data.previousPrimary).toBe('variant-old');
    });

    it('returns 404 when variant not found', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      vi.mocked(getAuthenticatedWorkspace).mockResolvedValue(mockWorkspace);

      // No variant found
      mockDb.selectFrom.mockReturnValue(mockKyselyChain(null));

      const { handle } = await import('../variants/setDefault_POST');
      
      const request = createMockRequest('/_api/variants/setPrimary', {
        method: 'POST',
        body: {
          id: 'nonexistent-variant',
        },
      });

      const response = await handle(request);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /variants/list', () => {
    it('returns all variants for workspace', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      vi.mocked(getAuthenticatedWorkspace).mockResolvedValue(mockWorkspace);

      const variants = [
        createMockVariant({ id: 'v1', name: 'Resume 1', workspaceId: mockWorkspace.id }),
        createMockVariant({ id: 'v2', name: 'Resume 2', workspaceId: mockWorkspace.id }),
      ];

      mockDb.selectFrom.mockReturnValue(mockKyselyChain(variants));

      const { handle } = await import('../variants/list_GET');
      
      const request = createMockRequest('/_api/variants/list');
      const response = await handle(request);
      const data = await parseResponse<{ variants: typeof variants }>(response);

      expect(response.status).toBe(200);
      expect(data.variants).toHaveLength(2);
    });
  });
});
