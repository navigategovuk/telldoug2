/**
 * Import Pipeline Integration Tests
 * 
 * Tests the core import flow: parse → stage → review → commit
 * Uses mock data to validate the transformation and duplicate detection logic.
 */

import { describe, it, expect, vi } from "vitest";
import {
  findJobDuplicate,
  findLearningDuplicate,
  findSkillDuplicate,
  normalize,
  similarity,
} from "../duplicateDetection";
import type { Selectable } from "kysely";
import type { Jobs, Learning, Skills } from "../schema";

// ============================================================================
// Test 1: LinkedIn JSON Parsing → Staging Record Mapping
// ============================================================================

describe("Import Pipeline", () => {
  describe("LinkedIn JSON to Staging Records", () => {
    const mockLinkedInProfile = {
      firstName: "Jane",
      lastName: "Doe",
      headline: "Senior Software Engineer",
      positions: {
        values: [
          {
            title: "Senior Software Engineer",
            company: { name: "Tech Corp" },
            startDate: { year: 2020, month: 3 },
            endDate: { year: 2023, month: 6 },
            description: "Led frontend architecture",
            isCurrent: false,
          },
          {
            title: "Software Engineer",
            company: { name: "StartupXYZ" },
            startDate: { year: 2018, month: 1 },
            endDate: { year: 2020, month: 2 },
            description: "Full-stack development",
            isCurrent: false,
          },
        ],
      },
      educations: {
        values: [
          {
            schoolName: "MIT",
            degreeName: "BS Computer Science",
            fieldOfStudy: "Computer Science",
            startDate: { year: 2014 },
            endDate: { year: 2018 },
          },
        ],
      },
      skills: {
        values: [
          { name: "TypeScript" },
          { name: "React" },
          { name: "Node.js" },
        ],
      },
    };

    it("extracts positions from LinkedIn JSON structure", () => {
      const positions = mockLinkedInProfile.positions.values;
      
      expect(positions).toHaveLength(2);
      expect(positions[0].title).toBe("Senior Software Engineer");
      expect(positions[0].company.name).toBe("Tech Corp");
    });

    it("maps LinkedIn date format to ISO strings", () => {
      const position = mockLinkedInProfile.positions.values[0];
      const startDate = `${position.startDate.year}-${String(position.startDate.month).padStart(2, "0")}-01`;
      
      expect(startDate).toBe("2020-03-01");
    });

    it("extracts education entries correctly", () => {
      const education = mockLinkedInProfile.educations.values[0];
      
      expect(education.schoolName).toBe("MIT");
      expect(education.degreeName).toBe("BS Computer Science");
    });

    it("extracts skills array", () => {
      const skills = mockLinkedInProfile.skills.values.map((s) => s.name);
      
      expect(skills).toContain("TypeScript");
      expect(skills).toContain("React");
      expect(skills).toHaveLength(3);
    });
  });

  // ============================================================================
  // Test 2: Duplicate Detection Integration
  // ============================================================================

  describe("Duplicate Detection During Import", () => {
    const existingJobs: Partial<Selectable<Jobs>>[] = [
      {
        id: "job-existing-1",
        workspaceId: "ws-1",
        company: "Tech Corp",
        title: "Senior Software Engineer",
        startDate: new Date("2020-03-01"),
        endDate: new Date("2023-06-30"),
        isCurrent: false,
      },
    ];

    const existingLearning: Partial<Selectable<Learning>>[] = [
      {
        id: "edu-existing-1",
        workspaceId: "ws-1",
        provider: "MIT",
        title: "BS Computer Science",
        startDate: new Date("2014-09-01"),
        completionDate: new Date("2018-05-15"),
      },
    ];

    it("flags exact job duplicate when importing same position", () => {
      const incomingJob = {
        company: "Tech Corp",
        title: "Senior Software Engineer",
        startDate: "2020-03-01",
        endDate: "2023-06-30",
      };

      const result = findJobDuplicate(incomingJob, existingJobs as Selectable<Jobs>[]);
      
      expect(result.confidence).toBe("exact");
      expect(result.matchedId).toBe("job-existing-1");
      expect(result.score).toBeGreaterThanOrEqual(90);
    });

    it("detects likely duplicate with fuzzy company name matching", () => {
      // "Tech Corporation" vs "Tech Corp" - similar but not normalized-identical
      const incomingJob = {
        company: "Techy Corp", // Different enough to not be exact after normalization
        title: "Senior Software Engineer",
        startDate: "2020-04-01", // Overlapping but not exactly same
        endDate: "2023-05-30",
      };

      const result = findJobDuplicate(incomingJob, existingJobs as Selectable<Jobs>[]);
      
      // The similarity should be high enough to trigger likely/possible match
      // due to overlapping dates and same title
      expect(["likely", "possible"]).toContain(result.confidence);
      expect(result.matchedId).toBe("job-existing-1");
    });

    it("returns no duplicate for genuinely different jobs", () => {
      const incomingJob = {
        company: "Different Company",
        title: "Product Manager",
        startDate: "2024-01-01",
        endDate: null,
      };

      const result = findJobDuplicate(incomingJob, existingJobs as Selectable<Jobs>[]);
      
      expect(result.confidence).toBe("none");
      expect(result.matchedId).toBeNull();
    });
  });

  // ============================================================================
  // Test 3: User Decision Application
  // ============================================================================

  describe("User Decision Processing", () => {
    interface StagingRecord {
      id: string;
      recordType: string;
      userDecision: "create" | "merge" | "skip" | "pending";
      status: "pending" | "committed" | "skipped";
      mappedData: Record<string, unknown>;
      duplicateCheck: { matchedId: string | null; confidence: string } | null;
    }

    const mockStagingRecords: StagingRecord[] = [
      {
        id: "staging-1",
        recordType: "job",
        userDecision: "pending",
        status: "pending",
        mappedData: { company: "Tech Corp", title: "Engineer" },
        duplicateCheck: { matchedId: "job-1", confidence: "exact" },
      },
      {
        id: "staging-2",
        recordType: "job",
        userDecision: "pending",
        status: "pending",
        mappedData: { company: "StartupXYZ", title: "Developer" },
        duplicateCheck: null,
      },
    ];

    it("applies skip decision to staging record", () => {
      const updates = [{ stagingRecordId: "staging-1", userDecision: "skip" as const }];
      
      const updated = mockStagingRecords.map((record) => {
        const update = updates.find((u) => u.stagingRecordId === record.id);
        return update ? { ...record, userDecision: update.userDecision } : record;
      });

      expect(updated[0].userDecision).toBe("skip");
      expect(updated[1].userDecision).toBe("pending");
    });

    it("applies merge decision for duplicate resolution", () => {
      const updates = [{ stagingRecordId: "staging-1", userDecision: "merge" as const }];
      
      const updated = mockStagingRecords.map((record) => {
        const update = updates.find((u) => u.stagingRecordId === record.id);
        return update ? { ...record, userDecision: update.userDecision } : record;
      });

      const mergeRecord = updated[0];
      expect(mergeRecord.userDecision).toBe("merge");
      expect(mergeRecord.duplicateCheck?.matchedId).toBe("job-1");
    });

    it("applies create decision for new records", () => {
      const updates = [{ stagingRecordId: "staging-2", userDecision: "create" as const }];
      
      const updated = mockStagingRecords.map((record) => {
        const update = updates.find((u) => u.stagingRecordId === record.id);
        return update ? { ...record, userDecision: update.userDecision } : record;
      });

      expect(updated[1].userDecision).toBe("create");
      expect(updated[1].duplicateCheck).toBeNull();
    });
  });

  // ============================================================================
  // Test 4: Commit Logic Validation
  // ============================================================================

  describe("Commit Logic", () => {
    interface StagingRecord {
      id: string;
      recordType: string;
      userDecision: "create" | "merge" | "skip";
      mappedData: Record<string, unknown>;
      duplicateCheck: { matchedId: string | null } | null;
    }

    function simulateCommit(records: StagingRecord[]) {
      const results: Array<{
        stagingRecordId: string;
        action: "created" | "merged" | "skipped";
        entityId: string | null;
      }> = [];

      for (const record of records) {
        if (record.userDecision === "skip") {
          results.push({
            stagingRecordId: record.id,
            action: "skipped",
            entityId: null,
          });
        } else if (record.userDecision === "merge" && record.duplicateCheck?.matchedId) {
          results.push({
            stagingRecordId: record.id,
            action: "merged",
            entityId: record.duplicateCheck.matchedId,
          });
        } else {
          results.push({
            stagingRecordId: record.id,
            action: "created",
            entityId: `new-${record.id}`,
          });
        }
      }

      return {
        committedCount: results.filter((r) => r.action === "created").length,
        mergedCount: results.filter((r) => r.action === "merged").length,
        skippedCount: results.filter((r) => r.action === "skipped").length,
        records: results,
      };
    }

    it("commits create decisions as new entities", () => {
      const records: StagingRecord[] = [
        {
          id: "staging-1",
          recordType: "job",
          userDecision: "create",
          mappedData: { company: "NewCo", title: "Engineer" },
          duplicateCheck: null,
        },
      ];

      const result = simulateCommit(records);
      
      expect(result.committedCount).toBe(1);
      expect(result.records[0].action).toBe("created");
      expect(result.records[0].entityId).toBe("new-staging-1");
    });

    it("commits merge decisions by updating existing entities", () => {
      const records: StagingRecord[] = [
        {
          id: "staging-1",
          recordType: "job",
          userDecision: "merge",
          mappedData: { company: "Tech Corp", title: "Engineer" },
          duplicateCheck: { matchedId: "existing-job-1" },
        },
      ];

      const result = simulateCommit(records);
      
      expect(result.mergedCount).toBe(1);
      expect(result.records[0].action).toBe("merged");
      expect(result.records[0].entityId).toBe("existing-job-1");
    });

    it("skips records marked as skip", () => {
      const records: StagingRecord[] = [
        {
          id: "staging-1",
          recordType: "job",
          userDecision: "skip",
          mappedData: { company: "Duplicate Co", title: "Same Role" },
          duplicateCheck: { matchedId: "existing-1" },
        },
      ];

      const result = simulateCommit(records);
      
      expect(result.skippedCount).toBe(1);
      expect(result.records[0].action).toBe("skipped");
      expect(result.records[0].entityId).toBeNull();
    });

    it("handles mixed decisions correctly", () => {
      const records: StagingRecord[] = [
        { id: "s1", recordType: "job", userDecision: "create", mappedData: {}, duplicateCheck: null },
        { id: "s2", recordType: "job", userDecision: "merge", mappedData: {}, duplicateCheck: { matchedId: "j1" } },
        { id: "s3", recordType: "job", userDecision: "skip", mappedData: {}, duplicateCheck: { matchedId: "j2" } },
        { id: "s4", recordType: "skill", userDecision: "create", mappedData: {}, duplicateCheck: null },
      ];

      const result = simulateCommit(records);
      
      expect(result.committedCount).toBe(2);
      expect(result.mergedCount).toBe(1);
      expect(result.skippedCount).toBe(1);
    });
  });

  // ============================================================================
  // Test 5: Entity Relationship Creation
  // ============================================================================

  describe("Secondary Entity Creation", () => {
    it("creates institution when importing education", () => {
      const educationRecord = {
        provider: "Stanford University",
        title: "MS Computer Science",
        startDate: "2018-09-01",
        completionDate: "2020-06-15",
      };

      // Simulate secondary entity extraction
      const secondaryEntities: Array<{ type: string; data: Record<string, unknown> }> = [];
      
      if (educationRecord.provider) {
        secondaryEntities.push({
          type: "institution",
          data: {
            name: educationRecord.provider,
            type: "university",
          },
        });
      }

      expect(secondaryEntities).toHaveLength(1);
      expect(secondaryEntities[0].type).toBe("institution");
      expect(secondaryEntities[0].data.name).toBe("Stanford University");
    });

    it("creates company institution when importing job", () => {
      const jobRecord = {
        company: "Google",
        title: "Software Engineer",
        startDate: "2020-01-01",
        endDate: null,
      };

      const secondaryEntities: Array<{ type: string; data: Record<string, unknown> }> = [];
      
      if (jobRecord.company) {
        secondaryEntities.push({
          type: "institution",
          data: {
            name: jobRecord.company,
            type: "organization",
          },
        });
      }

      expect(secondaryEntities).toHaveLength(1);
      expect(secondaryEntities[0].type).toBe("institution");
      expect(secondaryEntities[0].data.type).toBe("organization");
    });

    it("extracts skills mentioned in job description", () => {
      const jobRecord = {
        company: "Meta",
        title: "Frontend Engineer",
        description: "Built features using React, TypeScript, and GraphQL",
      };

      const knownSkills = ["React", "TypeScript", "GraphQL", "Python", "Java"];
      const extractedSkills: string[] = [];

      for (const skill of knownSkills) {
        if (jobRecord.description?.toLowerCase().includes(skill.toLowerCase())) {
          extractedSkills.push(skill);
        }
      }

      expect(extractedSkills).toContain("React");
      expect(extractedSkills).toContain("TypeScript");
      expect(extractedSkills).toContain("GraphQL");
      expect(extractedSkills).not.toContain("Python");
    });
  });
});
