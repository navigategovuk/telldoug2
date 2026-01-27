/**
 * Tests for linkedInParser helper
 * Tests the actual exported API from linkedInParser.tsx
 */

import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_FILE_TYPES,
  getRecordTypeLabel,
  getEntityTypeLabel,
  getRecordTypeIcon,
  type LinkedInRecordType,
  type TellDougEntityType,
} from '../linkedInParser';

describe('linkedInParser', () => {
  describe('SUPPORTED_FILE_TYPES', () => {
    it('includes expected LinkedIn file types', () => {
      expect(SUPPORTED_FILE_TYPES).toContain('position');
      expect(SUPPORTED_FILE_TYPES).toContain('education');
      expect(SUPPORTED_FILE_TYPES).toContain('skill');
      expect(SUPPORTED_FILE_TYPES).toContain('profile');
    });

    it('is an array of strings', () => {
      expect(Array.isArray(SUPPORTED_FILE_TYPES)).toBe(true);
      SUPPORTED_FILE_TYPES.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('getRecordTypeLabel', () => {
    it('returns human-readable labels for record types', () => {
      expect(getRecordTypeLabel('position')).toBe('Work Experience');
      expect(getRecordTypeLabel('education')).toBe('Education');
      expect(getRecordTypeLabel('skill')).toBe('Skill');
      expect(getRecordTypeLabel('profile')).toBe('Profile');
    });

    it('handles all supported record types', () => {
      const types: LinkedInRecordType[] = [
        'profile',
        'position',
        'education',
        'skill',
        'project',
        'connection',
        'certification',
        'endorsement',
      ];
      types.forEach(type => {
        const label = getRecordTypeLabel(type);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getEntityTypeLabel', () => {
    it('returns human-readable labels for entity types', () => {
      expect(getEntityTypeLabel('job')).toBe('Job');
      expect(getEntityTypeLabel('learning')).toBe('Education');
      expect(getEntityTypeLabel('skill')).toBe('Skill');
      expect(getEntityTypeLabel('person')).toBe('Person');
    });

    it('handles all TellDoug entity types', () => {
      const types: TellDougEntityType[] = [
        'profile',
        'job',
        'learning',
        'skill',
        'project',
        'person',
        'relationship',
        'achievement',
        'institution',
      ];
      types.forEach(type => {
        const label = getEntityTypeLabel(type);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getRecordTypeIcon', () => {
    it('returns icon strings for record types', () => {
      const icon = getRecordTypeIcon('position');
      expect(typeof icon).toBe('string');
    });

    it('handles all supported record types', () => {
      const types: LinkedInRecordType[] = [
        'profile',
        'position',
        'education',
        'skill',
        'project',
        'connection',
        'certification',
        'endorsement',
      ];
      types.forEach(type => {
        const icon = getRecordTypeIcon(type);
        expect(typeof icon).toBe('string');
      });
    });
  });
});
