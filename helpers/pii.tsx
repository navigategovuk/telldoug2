export interface PiiFinding {
  type: string;
  match: string;
}

const PII_PATTERNS: Array<{ type: string; regex: RegExp }> = [
  { type: "email", regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { type: "phone", regex: /\b(?:\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}\b/g },
  { type: "ni_number", regex: /\b(?!BG|GB|KN|NK|NT|TN|ZZ)[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b/gi },
  { type: "postcode", regex: /\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/gi },
];

export function scanPii(text: string): PiiFinding[] {
  const findings: PiiFinding[] = [];
  for (const pattern of PII_PATTERNS) {
    const matches = text.match(pattern.regex) ?? [];
    for (const match of matches) {
      findings.push({ type: pattern.type, match });
    }
  }
  return findings;
}

export function redactPii(text: string): string {
  let redacted = text;
  for (const pattern of PII_PATTERNS) {
    redacted = redacted.replace(pattern.regex, `[REDACTED_${pattern.type.toUpperCase()}]`);
  }
  return redacted;
}
