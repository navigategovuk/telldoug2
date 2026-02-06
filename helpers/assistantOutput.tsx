export interface AssistantOutputView {
  plainText: string;
  citations: string[];
  includesRefusal: boolean;
}

const citationPattern = /\[(?:Policy|Source|Guidance):\s*([^\]]+)\]/gi;
const refusalPattern =
  /\b(cannot|can't|unable)\b[\s\S]{0,80}\b(final|legal|eligibility)\b|\bcaseworker\b[\s\S]{0,40}\b(decision|review)\b/i;

export function parseAssistantOutput(content: string): AssistantOutputView {
  const safeContent = content ?? "";
  const citations = Array.from(safeContent.matchAll(citationPattern))
    .map((match) => String(match[1]).trim())
    .filter((item) => item.length > 0);

  return {
    plainText: safeContent,
    citations: Array.from(new Set(citations)),
    includesRefusal: refusalPattern.test(safeContent),
  };
}
