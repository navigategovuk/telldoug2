import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel as _HeadingLevel,
  AlignmentType,
  BorderStyle,
  TabStopPosition,
  TabStopType,
} from "docx";
import {
  ResumeData,
  ExportOptions,
  ExportResult,
  getFilename,
  formatDateRange,
} from "./exportTypes";
import { formatEducationDegree, formatWorkHeader } from "./exportPdfHelpers";

/**
 * Generates a DOCX export of the resume data using the docx library.
 * Creates an ATS-friendly layout compatible with Microsoft Word.
 */
export async function generateDOCX(
  data: ResumeData,
  options: ExportOptions
): Promise<ExportResult> {
  const { basics, work, education, skills, projects } = data;

  const children: Paragraph[] = [];

  // --- Header Section ---
  if (basics) {
    // Name
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: basics.name || "",
            bold: true,
            size: 48, // 24pt
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );

    // Label/Title
    if (basics.label) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: basics.label,
              size: 24, // 12pt
              color: "444444",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    }

    // Contact Info
    const contactInfo = [];
    if (basics.email) {contactInfo.push(basics.email);}
    if (basics.phone) {contactInfo.push(basics.phone);}
    if (basics.url) {contactInfo.push(basics.url);}
    if (basics.location?.city) {
      contactInfo.push(
        [basics.location.city, basics.location.region]
          .filter(Boolean)
          .join(", ")
      );
    }

    if (contactInfo.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: contactInfo.join("  •  "),
              size: 18, // 9pt
              color: "666666",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        })
      );
    }

    // Summary
    if (basics.summary) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: basics.summary,
              size: 20, // 10pt
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }

  // --- Experience Section ---
  if (work && work.length > 0) {
    children.push(createSectionHeader("EXPERIENCE"));

    work.forEach((job) => {
      const dateRange = formatDateRange(job.startDate, job.endDate);
      const workHeader = formatWorkHeader(job);

      // Company and Date Row
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: workHeader || "Company",
              bold: true,
              size: 22, // 11pt
            }),
            new TextRun({
              text: "\t" + dateRange,
              italics: true,
              size: 20,
              color: "555555",
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { before: 150, after: 50 },
        })
      );

      // Position
      if (job.position) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.position,
                italics: true,
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      // Summary
      if (job.summary) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: job.summary,
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      // Highlights
      if (job.highlights && job.highlights.length > 0) {
        job.highlights.forEach((highlight) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: highlight,
                  size: 20,
                }),
              ],
              bullet: { level: 0 },
              spacing: { after: 50 },
            })
          );
        });
      }
    });
  }

  // --- Education Section ---
  if (education && education.length > 0) {
    children.push(createSectionHeader("EDUCATION"));

    education.forEach((edu) => {
      const dateRange = formatDateRange(edu.startDate, edu.endDate);
      const degreeLine = formatEducationDegree(edu);

      // Institution and Date Row
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.institution || "Institution",
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: "\t" + dateRange,
              italics: true,
              size: 20,
              color: "555555",
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { before: 150, after: 50 },
        })
      );

      // Degree Line
      if (degreeLine) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: degreeLine,
                size: 20,
              }),
            ],
            spacing: { after: 150 },
          })
        );
      }
    });
  }

  // --- Skills Section ---
  if (skills && skills.length > 0) {
    children.push(createSectionHeader("SKILLS"));

    skills.forEach((skill) => {
      const name = skill.name || "";
      const keywords = skill.keywords ? skill.keywords.join(", ") : "";

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: name ? `${name}: ` : "",
              bold: true,
              size: 20,
            }),
            new TextRun({
              text: keywords,
              size: 20,
            }),
          ],
          spacing: { after: 60 },
        })
      );
    });
  }

  // --- Projects Section ---
  if (projects && projects.length > 0) {
    children.push(createSectionHeader("PROJECTS"));

    projects.forEach((proj) => {
      const dateRange = formatDateRange(proj.startDate, proj.endDate);

      // Project Name and Date Row
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proj.name || "Project",
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: "\t" + dateRange,
              italics: true,
              size: 20,
              color: "555555",
            }),
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          spacing: { before: 150, after: 50 },
        })
      );

      // Description
      if (proj.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: proj.description,
                size: 20,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      // Highlights
      if (proj.highlights && proj.highlights.length > 0) {
        proj.highlights.forEach((highlight) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: highlight,
                  size: 20,
                }),
              ],
              bullet: { level: 0 },
              spacing: { after: 50 },
            })
          );
        });
      }
    });
  }

  // Build Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  // Generate DOCX blob
  const buffer = await Packer.toBlob(doc);
  const filename = getFilename(
    basics?.name || "resume",
    "docx",
    options.variantName
  );

  return {
    buffer,
    filename,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}

/**
 * Creates a section header paragraph with an underline.
 */
function createSectionHeader(title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 28, // 14pt
      }),
    ],
    border: {
      bottom: {
        color: "000000",
        style: BorderStyle.SINGLE,
        size: 6, // 1/2pt
      },
    },
    spacing: { before: 300, after: 200 },
  });
}
