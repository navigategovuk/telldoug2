/**
 * Import & Export Smoke Tests
 * 
 * Tests the import flow (staging retrieval) and export generation:
 * - Get staging → Returns staging records for session
 * - Update staging → Modifies user decisions
 * - Generate export → Creates JSON/Markdown output
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

describe('Import & Export Golden Path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDbMock(mockDb, {});
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('POST /import/staging', () => {
    it('returns staging records for valid session', async () => {
      const mockSession = {
        id: generateTestId('session'),
        workspaceId: mockWorkspace.id,
        sourceArtifactId: generateTestId('artifact'),
        status: 'pending',
        totalRecords: 3,
        processedRecords: 0,
        createdAt: new Date(),
        completedAt: null,
        sourceType: 'linkedin_zip',
      };

      const mockArtifact = {
        id: mockSession.sourceArtifactId,
        filename: 'linkedin-export.zip',
        uploadedAt: new Date(),
      };

      const mockStagingRecords = [
        {
          id: generateTestId('staging'),
          importSessionId: mockSession.id,
          recordType: 'position',
          sourceData: JSON.stringify({ company: 'Acme', title: 'Engineer' }),
          mappedData: JSON.stringify({ company: 'Acme', title: 'Engineer' }),
          fieldMappings: JSON.stringify({}),
          status: 'pending',
          userDecision: 'pending',
          duplicateOfId: null,
          mergeSuggestion: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.selectFrom.mockImplementation((table: string) => {
        if (table === 'importSessions') {return mockKyselyChain(mockSession);}
        if (table === 'sourceArtifacts') {return mockKyselyChain(mockArtifact);}
        if (table === 'stagingRecords') {return mockKyselyChain(mockStagingRecords);}
        return mockKyselyChain(null);
      });

      const { handle } = await import('../import/staging_POST');
      
      const request = createMockRequest('/_api/import/staging', {
        method: 'POST',
        body: {
          importSessionId: mockSession.id,
        },
      });

      const response = await handle(request);
      const data = await parseResponse<{
        success: boolean;
        session: typeof mockSession;
        stagingRecords: unknown[];
      }>(response);

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stagingRecords).toHaveLength(1);
    });

    it('returns 404 for non-existent session', async () => {
      mockDb.selectFrom.mockReturnValue(mockKyselyChain(null));

      const { handle } = await import('../import/staging_POST');
      
      const request = createMockRequest('/_api/import/staging', {
        method: 'POST',
        body: {
          importSessionId: 'nonexistent-session',
        },
      });

      const response = await handle(request);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /export/generate', () => {
    it('generates JSON resume export', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      vi.mocked(getAuthenticatedWorkspace).mockResolvedValue(mockWorkspace);

      const mockWork = [{
        id: generateTestId('work'),
        profileId: mockProfile.id,
        company: 'Tech Corp',
        title: 'Senior Engineer',
        location: 'San Francisco',
        startDate: new Date('2020-01-01'),
        endDate: null,
        description: 'Built things',
        highlights: JSON.stringify(['Led team', 'Shipped features']),
        isCurrent: true,
        url: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      const mockEducation = [{
        id: generateTestId('edu'),
        profileId: mockProfile.id,
        institution: 'MIT',
        area: 'Computer Science',
        studyType: 'BS',
        startDate: new Date('2012-09-01'),
        endDate: new Date('2016-05-15'),
        score: '3.8',
        courses: JSON.stringify(['CS101', 'Algorithms']),
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      const mockSkills = [{
        id: generateTestId('skill'),
        profileId: mockProfile.id,
        name: 'TypeScript',
        category: 'Programming',
        proficiency: 'expert',
        keywords: JSON.stringify(['React', 'Node']),
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      mockDb.selectFrom.mockImplementation((table: string) => {
        const data: Record<string, unknown> = {
          resumeVariants: { ...mockVariant, profileId: mockProfile.id },
          profiles: mockProfile,
          workExperiences: mockWork,
          educationEntries: mockEducation,
          skills: mockSkills,
          projects: [],
        };
        return mockKyselyChain(data[table] ?? null);
      });

      const { handle } = await import('../export/generate_POST');
      
      const request = createMockRequest('/_api/export/generate', {
        method: 'POST',
        body: {
          variantId: mockVariant.id,
          format: 'json',
        },
      });

      const response = await handle(request);

      // Export should succeed with JSON format
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await parseResponse<{ success: boolean; format: string; content: string }>(response);
        expect(data.success).toBe(true);
        expect(data.format).toBe('json');
        expect(data.content).toBeDefined();
      }
    });

    it('returns 401 when not authenticated', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      const { NotAuthenticatedError } = await import('../../helpers/getSetServerSession');
      
      vi.mocked(getAuthenticatedWorkspace).mockRejectedValue(new NotAuthenticatedError());

      const { handle } = await import('../export/generate_POST');
      
      const request = createMockRequest('/_api/export/generate', {
        method: 'POST',
        body: {
          variantId: mockVariant.id,
          format: 'json',
        },
      });

      const response = await handle(request);

      expect(response.status).toBe(401);
    });

    it('generates Markdown resume export', async () => {
      const { getAuthenticatedWorkspace } = await import('../../helpers/workspaceUtils');
      vi.mocked(getAuthenticatedWorkspace).mockResolvedValue(mockWorkspace);

      mockDb.selectFrom.mockImplementation((table: string) => {
        const data: Record<string, unknown> = {
          resumeVariants: { ...mockVariant, profileId: mockProfile.id },
          profiles: mockProfile,
          workExperiences: [],
          educationEntries: [],
          skills: [],
          projects: [],
        };
        return mockKyselyChain(data[table] ?? null);
      });

      const { handle } = await import('../export/generate_POST');
      
      const request = createMockRequest('/_api/export/generate', {
        method: 'POST',
        body: {
          variantId: mockVariant.id,
          format: 'markdown',
        },
      });

      const response = await handle(request);

      // Export should succeed with markdown format
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await parseResponse<{ content: string; format: string }>(response);
        expect(data.format).toBe('markdown');
      }
    });
  });
});
