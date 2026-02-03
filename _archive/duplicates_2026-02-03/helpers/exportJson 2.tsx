import * as jsYaml from "js-yaml";
import { ResumeData, ExportOptions, ExportResult, getFilename } from "./exportTypes";

/**
 * Generates a JSON export of the resume data.
 * Uses JSON Resume schema format.
 */
export function generateJSON(
  data: ResumeData,
  options: ExportOptions
): ExportResult {
  const jsonData = {
    $schema: "https://json.schemastore.org/resume",
    basics: data.basics,
    work: data.work,
    education: data.education,
    skills: data.skills,
    projects: data.projects,
    meta: {
      version: "1.0.0",
      variant: options.variantName || null,
      generated: new Date().toISOString(),
    },
  };

  const content = JSON.stringify(jsonData, null, 2);
  const filename = getFilename(
    data.basics?.name || "resume",
    "json",
    options.variantName
  );

  return {
    buffer: new Blob([content], { type: "application/json" }),
    filename,
    mimeType: "application/json",
  };
}

/**
 * Generates a YAML export of the resume data.
 * Uses JSON Resume schema format in YAML syntax.
 */
export function generateYAML(
  data: ResumeData,
  options: ExportOptions
): ExportResult {
  const yamlData = {
    basics: data.basics,
    work: data.work,
    education: data.education,
    skills: data.skills,
    projects: data.projects,
    meta: {
      version: "1.0.0",
      variant: options.variantName || null,
      generated: new Date().toISOString(),
    },
  };

  const content = jsYaml.dump(yamlData, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
  });

  const filename = getFilename(
    data.basics?.name || "resume",
    "yaml",
    options.variantName
  );

  return {
    buffer: new Blob([content], { type: "text/yaml" }),
    filename,
    mimeType: "text/yaml",
  };
}
