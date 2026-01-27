/**
 * Tests for duplicateDetection helper
 * Tests the actual exported API from duplicateDetection.tsx
 */

import { describe, it, expect } from 'vitest';
import {
  similarity,
  normalize,
  datesOverlap,
  datesApproxEqual,
  findJobDuplicate,
  type DuplicateCheck as _DuplicateCheck,
} from '../duplicateDetection';

describe('duplicateDetection', () => {
  describe('normalize', () => {
    it('trims whitespace', () => {
      expect(normalize('  hello world  ')).toBe('hello world');
    });

    it('collapses multiple spaces', () => {
      expect(normalize('hello    world')).toBe('hello world');
    });

    it('handles null/undefined', () => {
      expect(normalize(null)).toBe('');
      expect(normalize(undefined)).toBe('');
    });

    it('removes common company suffixes', () => {
      expect(normalize('Google Inc.')).toBe('google');
      expect(normalize('Microsoft Corporation')).toBe('microsoft');
      expect(normalize('Apple LLC')).toBe('apple');
    });

    it('lowercases text', () => {
      expect(normalize('HELLO WORLD')).toBe('hello world');
    });
  });

  describe('similarity', () => {
    it('returns 1.0 for identical strings', () => {
      expect(similarity('hello world', 'hello world')).toBe(1.0);
    });

    it('returns low similarity for completely different strings', () => {
      const sim = similarity('abc', 'xyz');
      expect(sim).toBeLessThan(0.5);
    });

    it('returns high similarity for similar strings', () => {
      const sim = similarity('Software Engineer', 'Senior Software Engineer');
      expect(sim).toBeGreaterThan(0.6);
    });

    it('is case insensitive', () => {
      expect(similarity('Hello', 'hello')).toBe(1.0);
    });

    it('handles empty strings', () => {
      expect(similarity('', '')).toBe(1.0);
      expect(similarity('test', '')).toBe(0);
    });

    it('handles company name variations', () => {
      // Should recognize these as the same company
      expect(similarity('Google Inc.', 'Google')).toBeGreaterThan(0.9);
      expect(similarity('Microsoft Corporation', 'Microsoft')).toBeGreaterThan(0.9);
    });
  });

  describe('datesOverlap', () => {
    it('detects overlapping date ranges', () => {
      expect(datesOverlap('2020-01-01', '2020-12-31', '2020-06-01', '2021-06-01')).toBe(true);
    });

    it('returns false for non-overlapping ranges', () => {
      expect(datesOverlap('2019-01-01', '2019-12-31', '2021-01-01', '2021-12-31')).toBe(false);
    });

    it('handles null dates', () => {
      expect(datesOverlap(null, '2020-12-31', '2020-06-01', '2021-06-01')).toBe(false);
      expect(datesOverlap('2020-01-01', '2020-12-31', null, '2021-06-01')).toBe(false);
    });

    it('handles open-ended ranges (null end date)', () => {
      expect(datesOverlap('2020-01-01', null, '2021-06-01', '2022-06-01')).toBe(true);
    });
  });

  describe('datesApproxEqual', () => {
    it('returns true for same dates', () => {
      expect(datesApproxEqual('2020-01-15', '2020-01-15')).toBe(true);
    });

    it('returns true for dates within tolerance', () => {
      expect(datesApproxEqual('2020-01-01', '2020-02-15')).toBe(true);
    });

    it('returns false for dates outside tolerance', () => {
      expect(datesApproxEqual('2020-01-01', '2020-06-01')).toBe(false);
    });

    it('handles null dates', () => {
      expect(datesApproxEqual(null, '2020-01-01')).toBe(false);
      expect(datesApproxEqual('2020-01-01', null)).toBe(false);
    });
  });

  describe('findJobDuplicate', () => {
    const existingJobs = [
      {
        id: 'job-1',
        workspaceId: 'ws-1',
        company: 'Google',
        title: 'Software Engineer',
        startDate: '2020-01-01',
        endDate: '2022-12-31',
        description: 'Building search',
        location: 'Mountain View',
        isCurrent: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'job-2',
        workspaceId: 'ws-1',
        company: 'Microsoft',
        title: 'Product Manager',
        startDate: '2018-06-01',
        endDate: '2019-12-31',
        description: 'Product stuff',
        location: 'Seattle',
        isCurrent: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    it('detects exact duplicate jobs', () => {
      const result = findJobDuplicate(
        {
          company: 'Google',
          title: 'Software Engineer',
          startDate: '2020-01-01',
          endDate: '2022-12-31',
        },
        existingJobs as unknown as Parameters<typeof findJobDuplicate>[1]
      );
      expect(result.confidence).toBe('exact');
      expect(result.matchedId).toBe('job-1');
      expect(result.score).toBeGreaterThan(90);
    });

    it('detects likely duplicate with similar data', () => {
      const result = findJobDuplicate(
        {
          company: 'Google Inc.',
          title: 'Software Engineer',
          startDate: '2020-01-15',
          endDate: '2022-12-31',
        },
        existingJobs as unknown as Parameters<typeof findJobDuplicate>[1]
      );
      expect(['exact', 'likely']).toContain(result.confidence);
      expect(result.matchedId).toBe('job-1');
    });

    it('returns no duplicate for different jobs', () => {
      const result = findJobDuplicate(
        {
          company: 'Amazon',
          title: 'Data Scientist',
          startDate: '2023-01-01',
          endDate: null,
        },
        existingJobs as unknown as Parameters<typeof findJobDuplicate>[1]
      );
      expect(result.confidence).toBe('none');
      expect(result.matchedId).toBeNull();
    });

    it('handles empty existing jobs array', () => {
      const result = findJobDuplicate(
        {
          company: 'Google',
          title: 'Software Engineer',
          startDate: '2020-01-01',
          endDate: '2022-12-31',
        },
        []
      );
      expect(result.confidence).toBe('none');
      expect(result.matchedId).toBeNull();
    });
  });
});
