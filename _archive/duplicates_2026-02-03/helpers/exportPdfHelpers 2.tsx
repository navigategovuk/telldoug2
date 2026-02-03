import { ResumeEducation, ResumeWork } from "./exportTypes";

/**
 * Formats the education degree line using granular fields.
 * Format: "[degreeType] in [area], Minor in [minor]"
 */
export function formatEducationDegree(edu: ResumeEducation): string {
  const degreePart = edu.degreeType || edu.studyType;
  const areaPart = edu.area;
  
  let degreeLine = "";
  if (degreePart && areaPart) {
    degreeLine = `${degreePart} in ${areaPart}`;
  } else if (degreePart || areaPart) {
    degreeLine = (degreePart || areaPart) as string;
  }

  if (edu.minor) {
    degreeLine += degreeLine ? `, Minor in ${edu.minor}` : `Minor in ${edu.minor}`;
  }

  return degreeLine;
}

/**
 * Formats the work header line with department and employment type.
 */
export function formatWorkHeader(job: ResumeWork): string {
  const parts: string[] = [];
  
  if (job.name) {
    parts.push(job.name);
  }

  if (job.department) {
    parts.push(`${job.department} Department`);
  }

  if (job.employmentType) {
    parts.push(`(${job.employmentType})`);
  }

  return parts.join(", ");
}
