import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import {
  ResumeData,
  ExportOptions,
  ExportResult,
  getFilename,
  formatDateRange,
} from "./exportTypes";
import { formatEducationDegree, formatWorkHeader } from "./exportPdfHelpers";

// Initialize virtual file system for fonts
(pdfMake as any).addVirtualFileSystem(pdfFonts);

/**
 * Generates a PDF export of the resume data using pdfmake.
 * Creates a clean, ATS-friendly layout.
 */
export function generatePDF(
  data: ResumeData,
  options: ExportOptions
): Promise<ExportResult> {
  return new Promise((resolve, reject) => {
    try {
      const { basics, work, education, skills, projects } = data;

      const docDefinition: any = {
        content: [],
        styles: {
          header: { fontSize: 24, bold: true, margin: [0, 0, 0, 5] },
          subheader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5] },
          jobTitle: { fontSize: 11, bold: true },
          jobMeta: { fontSize: 10, italics: true, color: "#555555" },
          bodyText: { fontSize: 10, lineHeight: 1.3 },
          smallText: { fontSize: 9, color: "#666666" },
        },
        defaultStyle: {
          font: "Roboto",
          fontSize: 10,
          color: "#222222",
        },
        pageMargins: [40, 40, 40, 40],
      };

      // --- Header Section ---
      if (basics) {
        docDefinition.content.push({
          text: basics.name || "",
          style: "header",
          alignment: "center",
        });

        if (basics.label) {
          docDefinition.content.push({
            text: basics.label,
            alignment: "center",
            fontSize: 12,
            margin: [0, 0, 0, 10],
            color: "#444444",
          });
        }

        // Contact Info Line
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
          docDefinition.content.push({
            text: contactInfo.join("  •  "),
            alignment: "center",
            style: "smallText",
            margin: [0, 0, 0, 15],
          });
        }

        if (basics.summary) {
          docDefinition.content.push({
            text: basics.summary,
            style: "bodyText",
            margin: [0, 0, 0, 10],
          });
        }
      }

      // --- Experience Section ---
      if (work && work.length > 0) {
        docDefinition.content.push({
          text: "EXPERIENCE",
          style: "subheader",
        });
        docDefinition.content.push({
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
          margin: [0, 0, 0, 10],
        });

        work.forEach((job) => {
          const dateRange = formatDateRange(job.startDate, job.endDate);
          const workHeader = formatWorkHeader(job);
          
          // Job Header Row
          docDefinition.content.push({
            columns: [
              { text: workHeader || "Company", style: "jobTitle", width: "*" },
              { text: dateRange, style: "jobMeta", alignment: "right", width: "auto" },
            ],
            margin: [0, 0, 0, 2],
          });

          // Position Row
          if (job.position) {
            docDefinition.content.push({
              text: job.position,
              italics: true,
              fontSize: 10,
              margin: [0, 0, 0, 5],
            });
          }

          // Summary
          if (job.summary) {
            docDefinition.content.push({
              text: job.summary,
              style: "bodyText",
              margin: [0, 0, 0, 5],
            });
          }

          // Highlights
          if (job.highlights && job.highlights.length > 0) {
            docDefinition.content.push({
              ul: job.highlights,
              style: "bodyText",
              margin: [10, 0, 0, 10],
            });
          } else {
            docDefinition.content.push({ text: "", margin: [0, 0, 0, 10] });
          }
        });
      }

      // --- Education Section ---
      if (education && education.length > 0) {
        docDefinition.content.push({
          text: "EDUCATION",
          style: "subheader",
        });
        docDefinition.content.push({
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
          margin: [0, 0, 0, 10],
        });

        education.forEach((edu) => {
          const dateRange = formatDateRange(edu.startDate, edu.endDate);
          const degreeLine = formatEducationDegree(edu);

          docDefinition.content.push({
            columns: [
              { text: edu.institution || "Institution", style: "jobTitle", width: "*" },
              { text: dateRange, style: "jobMeta", alignment: "right", width: "auto" },
            ],
          });

          if (degreeLine) {
            docDefinition.content.push({
              text: degreeLine,
              style: "bodyText",
              margin: [0, 2, 0, 8],
            });
          }
        });
      }

      // --- Skills Section ---
      if (skills && skills.length > 0) {
        docDefinition.content.push({
          text: "SKILLS",
          style: "subheader",
        });
        docDefinition.content.push({
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
          margin: [0, 0, 0, 10],
        });

        const skillLines = skills.map((s) => {
          const name = s.name ? `${s.name}: ` : "";
          const keywords = s.keywords ? s.keywords.join(", ") : "";
          return {
            text: [
              { text: name, bold: true },
              { text: keywords },
            ],
            margin: [0, 0, 0, 3],
            style: "bodyText",
          };
        });

        docDefinition.content.push(...skillLines);
      }

      // --- Projects Section ---
      if (projects && projects.length > 0) {
        docDefinition.content.push({
          text: "PROJECTS",
          style: "subheader",
          margin: [0, 15, 0, 5],
        });
        docDefinition.content.push({
          canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
          margin: [0, 0, 0, 10],
        });

        projects.forEach((proj) => {
          const dateRange = formatDateRange(proj.startDate, proj.endDate);
          
          docDefinition.content.push({
            columns: [
              { text: proj.name || "Project", style: "jobTitle", width: "*" },
              { text: dateRange, style: "jobMeta", alignment: "right", width: "auto" },
            ],
            margin: [0, 0, 0, 2],
          });

          if (proj.description) {
            docDefinition.content.push({
              text: proj.description,
              style: "bodyText",
              margin: [0, 0, 0, 5],
            });
          }

          if (proj.highlights && proj.highlights.length > 0) {
            docDefinition.content.push({
              ul: proj.highlights,
              style: "bodyText",
              margin: [10, 0, 0, 10],
            });
          }
        });
      }

      // Generate PDF
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBlob((blob: Blob) => {
        const filename = getFilename(
          basics?.name || "resume",
          "pdf",
          options.variantName
        );
        resolve({
          buffer: blob,
          filename,
          mimeType: "application/pdf",
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}
