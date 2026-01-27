import { ResumeData } from "./exportTypes";

/**
 * Severity levels for quality checks
 */
export type QualitySeverity = "critical" | "warning" | "info";

/**
 * Individual quality check result
 */
export interface QualityCheck {
  id: string;
  severity: QualitySeverity;
  category: string;
  message: string;
  suggestion?: string;
  penalty: number;
}

/**
 * Overall quality analysis result
 */
export interface QualityAnalysisResult {
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  checks: QualityCheck[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  summary: string;
}

/**
 * Severity penalty values
 */
const SEVERITY_PENALTIES: Record<QualitySeverity, { min: number; max: number }> = {
  critical: { min: 15, max: 20 },
  warning: { min: 5, max: 10 },
  info: { min: 1, max: 5 },
};

/**
 * Grade thresholds
 */
const GRADE_THRESHOLDS = [
  { min: 90, grade: "A" },
  { min: 80, grade: "B" },
  { min: 70, grade: "C" },
  { min: 60, grade: "D" },
  { min: 0, grade: "F" },
];

/**
 * Analyzes resume data for quality issues and returns a score with recommendations.
 */
export function analyzeResumeQuality(data: ResumeData): QualityAnalysisResult {
  const checks: QualityCheck[] = [];
  const { basics, work, education, skills, projects } = data;

  // --- Basics Checks ---
  if (!basics?.name || basics.name.trim() === "") {
    checks.push({
      id: "basics-name-missing",
      severity: "critical",
      category: "Contact Info",
      message: "Name is missing",
      suggestion: "Add your full name to the basics section",
      penalty: 20,
    });
  }

  if (!basics?.email || basics.email.trim() === "") {
    checks.push({
      id: "basics-email-missing",
      severity: "critical",
      category: "Contact Info",
      message: "Email address is missing",
      suggestion: "Add a professional email address",
      penalty: 15,
    });
  }

  if (!basics?.phone || basics.phone.trim() === "") {
    checks.push({
      id: "basics-phone-missing",
      severity: "warning",
      category: "Contact Info",
      message: "Phone number is missing",
      suggestion: "Add a contact phone number",
      penalty: 5,
    });
  }

  if (!basics?.summary || basics.summary.trim() === "") {
    checks.push({
      id: "basics-summary-missing",
      severity: "warning",
      category: "Summary",
      message: "Professional summary is missing",
      suggestion: "Add a 2-3 sentence summary highlighting your key qualifications",
      penalty: 10,
    });
  } else if (basics.summary.length < 100) {
    checks.push({
      id: "basics-summary-short",
      severity: "info",
      category: "Summary",
      message: "Professional summary could be more detailed",
      suggestion: "Expand your summary to 100-300 characters for better impact",
      penalty: 3,
    });
  }

  // --- Work Experience Checks ---
  if (!work || work.length === 0) {
    checks.push({
      id: "work-missing",
      severity: "critical",
      category: "Experience",
      message: "No work experience listed",
      suggestion: "Add at least one work experience entry",
      penalty: 20,
    });
  } else {
    work.forEach((job, index) => {
      if (!job.highlights || job.highlights.length === 0) {
        checks.push({
          id: `work-${index}-no-highlights`,
          severity: "warning",
          category: "Experience",
          message: `"${job.position || job.name || `Job ${index + 1}`}" has no achievements listed`,
          suggestion: "Add 3-5 bullet points highlighting accomplishments with metrics",
          penalty: 8,
        });
      } else if (job.highlights.length < 3) {
        checks.push({
          id: `work-${index}-few-highlights`,
          severity: "info",
          category: "Experience",
          message: `"${job.position || job.name || `Job ${index + 1}`}" has few achievements`,
          suggestion: "Consider adding more bullet points (aim for 3-5 per role)",
          penalty: 3,
        });
      }

      // Check for metrics in highlights
      const hasMetrics = job.highlights?.some((h) =>
        /\d+%|\$[\d,]+|\d+ (users|customers|clients|projects)/i.test(h)
      );
      if (job.highlights && job.highlights.length > 0 && !hasMetrics) {
        checks.push({
          id: `work-${index}-no-metrics`,
          severity: "info",
          category: "Experience",
          message: `"${job.position || job.name || `Job ${index + 1}`}" lacks quantifiable metrics`,
          suggestion: "Add numbers, percentages, or dollar amounts to demonstrate impact",
          penalty: 5,
        });
      }
    });
  }

  // --- Education Checks ---
  if (!education || education.length === 0) {
    checks.push({
      id: "education-missing",
      severity: "warning",
      category: "Education",
      message: "No education listed",
      suggestion: "Add your educational background",
      penalty: 10,
    });
  }

  // --- Skills Checks ---
  if (!skills || skills.length === 0) {
    checks.push({
      id: "skills-missing",
      severity: "warning",
      category: "Skills",
      message: "No skills listed",
      suggestion: "Add relevant technical and soft skills",
      penalty: 10,
    });
  } else {
    const totalKeywords = skills.reduce(
      (acc, s) => acc + (s.keywords?.length || 0),
      0
    );
    if (totalKeywords < 5) {
      checks.push({
        id: "skills-few-keywords",
        severity: "info",
        category: "Skills",
        message: "Skills section has few keywords",
        suggestion: "Add more specific skills and technologies (aim for 10-20 total)",
        penalty: 5,
      });
    }
  }

  // --- Projects Checks (optional section) ---
  if (projects && projects.length > 0) {
    projects.forEach((proj, index) => {
      if (!proj.description && (!proj.highlights || proj.highlights.length === 0)) {
        checks.push({
          id: `project-${index}-no-details`,
          severity: "info",
          category: "Projects",
          message: `"${proj.name || `Project ${index + 1}`}" lacks description or highlights`,
          suggestion: "Add a description or bullet points explaining the project",
          penalty: 2,
        });
      }
    });
  }

  // --- Calculate Score ---
  const maxScore = 100;
  const totalPenalty = checks.reduce((acc, c) => acc + c.penalty, 0);
  const score = Math.max(0, maxScore - totalPenalty);
  const percentage = Math.round((score / maxScore) * 100);

  // Determine grade
  const gradeEntry = GRADE_THRESHOLDS.find((t) => percentage >= t.min);
  const grade = gradeEntry?.grade || "F";

  // Count by severity
  const criticalCount = checks.filter((c) => c.severity === "critical").length;
  const warningCount = checks.filter((c) => c.severity === "warning").length;
  const infoCount = checks.filter((c) => c.severity === "info").length;

  // Generate summary
  let summary = "";
  if (criticalCount > 0) {
    summary = `Your resume has ${criticalCount} critical issue${criticalCount > 1 ? "s" : ""} that need immediate attention.`;
  } else if (warningCount > 0) {
    summary = `Your resume is good but has ${warningCount} area${warningCount > 1 ? "s" : ""} for improvement.`;
  } else if (infoCount > 0) {
    summary = `Your resume is strong with ${infoCount} minor suggestion${infoCount > 1 ? "s" : ""} for polish.`;
  } else {
    summary = "Your resume is excellent and ready to submit!";
  }

  return {
    score,
    maxScore,
    percentage,
    grade,
    checks,
    criticalCount,
    warningCount,
    infoCount,
    summary,
  };
}

/**
 * Returns only checks of a specific severity
 */
export function filterChecksBySeverity(
  result: QualityAnalysisResult,
  severity: QualitySeverity
): QualityCheck[] {
  return result.checks.filter((c) => c.severity === severity);
}

/**
 * Returns checks grouped by category
 */
export function groupChecksByCategory(
  result: QualityAnalysisResult
): Record<string, QualityCheck[]> {
  return result.checks.reduce((acc, check) => {
    if (!acc[check.category]) {
      acc[check.category] = [];
    }
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, QualityCheck[]>);
}
