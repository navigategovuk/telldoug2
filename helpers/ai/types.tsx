export interface AiModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
}

export interface EligibilityPrecheckResult {
  provisionalOutcome: "likely_eligible" | "uncertain" | "likely_ineligible";
  confidence: number;
  missingEvidence: string[];
  nextSteps: string[];
  rationale: string;
}

export interface DocumentExtractionResult {
  summary: string;
  extractedFields: Record<string, string>;
  confidence: number;
}

export interface AiProvider {
  name: string;
  model: string;
  moderateText(input: { text: string }): Promise<AiModerationResult>;
  eligibilityPrecheck(input: {
    profile: Record<string, unknown>;
    application: Record<string, unknown>;
  }): Promise<EligibilityPrecheckResult>;
  extractDocument(input: {
    documentText: string;
    documentType?: string;
  }): Promise<DocumentExtractionResult>;
  assistantReply(input: {
    prompt: string;
    contextDocuments: Array<{ title: string; content: string; sourceUrl?: string | null }>;
  }): Promise<ReadableStream<Uint8Array>>;
}
