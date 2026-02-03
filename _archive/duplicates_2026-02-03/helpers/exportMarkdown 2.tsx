import {
  ResumeData,
  ExportOptions,
  ExportResult,
  getFilename,
  formatDateRange,
} from "./exportTypes";
import { formatEducationDegree, formatWorkHeader } from "./exportPdfHelpers";

/**
 * Generates a Markdown export of the resume data.
 * Includes YAML frontmatter with metadata.
 */
export function generateMarkdown(
  data: ResumeData,
  options: ExportOptions
): ExportResult {
  const { basics, work, education, skills, projects } = data;
  const lines: string[] = [];

  // YAML Frontmatter
  lines.push("---");
  lines.push(`title: "${basics?.name || "Resume"}"`);
  if (basics?.label) {
    lines.push(`subtitle: "${basics.label}"`);
  }
  if (options.variantName) {
    lines.push(`variant: "${options.variantName}"`);
  }
  lines.push(`generated: "${new Date().toISOString()}"`);
  lines.push("---");
  lines.push("");

  // Header Section
  if (basics) {
    lines.push(`# ${basics.name || "Resume"}`);
    lines.push("");

    if (basics.label) {
      lines.push(`**${basics.label}**`);
      lines.push("");
    }

    // Contact Info
    const contactParts: string[] = [];
    if (basics.email) {contactParts.push(`📧 ${basics.email}`);}
    if (basics.phone) {contactParts.push(`📱 ${basics.phone}`);}
    if (basics.url) {contactParts.push(`🌐 [${basics.url}](${basics.url})`);}
    if (basics.location?.city) {
      const loc = [basics.location.city, basics.location.region]
        .filter(Boolean)
        .join(", ");
      contactParts.push(`📍 ${loc}`);
    }

    if (contactParts.length > 0) {
      lines.push(contactParts.join(" | "));
      lines.push("");
    }

    if (basics.summary) {
      lines.push(basics.summary);
      lines.push("");
    }
  }

  // Experience Section
  if (work && work.length > 0) {
    lines.push("## Experience");
    lines.push("");

    work.forEach((job) => {
      const dateRange = formatDateRange(job.startDate, job.endDate);
      const workHeader = formatWorkHeader(job);

      lines.push(`### ${workHeader || "Position"}`);
      lines.push(`*${job.position || ""}* | ${dateRange}`);
      lines.push("");

      if (job.summary) {
        lines.push(job.summary);
        lines.push("");
      }

      if (job.highlights && job.highlights.length > 0) {
        job.highlights.forEach((h) => {
          lines.push(`- ${h}`);
        });
        lines.push("");
      }
    });
  }

  // Education Section
  if (education && education.length > 0) {
    lines.push("## Education");
    lines.push("");

    education.forEach((edu) => {
      const dateRange = formatDateRange(edu.startDate, edu.endDate);
      const degreeLine = formatEducationDegree(edu);

      lines.push(`### ${edu.institution || "Institution"}`);
      lines.push(`*${degreeLine}* | ${dateRange}`);
      lines.push("");
    });
  }

  // Skills Section
  if (skills && skills.length > 0) {
    lines.push("## Skills");
    lines.push("");

    skills.forEach((skill) => {
      const name = skill.name || "Skills";
      const keywords = skill.keywords ? skill.keywords.join(", ") : "";
      lines.push(`- **${name}:** ${keywords}`);
    });
    lines.push("");
  }

  // Projects Section
  if (projects && projects.length > 0) {
    lines.push("## Projects");
    lines.push("");

    projects.forEach((proj) => {
      const dateRange = formatDateRange(proj.startDate, proj.endDate);

      lines.push(`### ${proj.name || "Project"}`);
      if (dateRange) {
        lines.push(`*${dateRange}*`);
      }
      lines.push("");

      if (proj.description) {
        lines.push(proj.description);
        lines.push("");
      }

      if (proj.highlights && proj.highlights.length > 0) {
        proj.highlights.forEach((h) => {
          lines.push(`- ${h}`);
        });
        lines.push("");
      }
    });
  }

  const content = lines.join("\n");
  const filename = getFilename(
    basics?.name || "resume",
    "md",
    options.variantName
  );

  return {
    buffer: new Blob([content], { type: "text/markdown" }),
    filename,
    mimeType: "text/markdown",
  };
}
