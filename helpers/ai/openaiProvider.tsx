import { AiProvider, AiModerationResult, EligibilityPrecheckResult, DocumentExtractionResult } from "./types";

const OPENAI_URL = "https://api.openai.com/v1";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return key;
}

async function openAiJson(path: string, body: unknown) {
  const response = await fetch(`${OPENAI_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  return response.json();
}

function mapModerationResponse(payload: any): AiModerationResult {
  const result = payload?.results?.[0] ?? {};
  return {
    flagged: Boolean(result.flagged),
    categories: result.categories ?? {},
    categoryScores: result.category_scores ?? {},
  };
}

export const openAiProvider: AiProvider = {
  name: "openai",
  model: "gpt-4o-mini",

  async moderateText(input) {
    const payload = await openAiJson("/moderations", {
      model: "omni-moderation-latest",
      input: input.text,
    });
    return mapModerationResponse(payload);
  },

  async eligibilityPrecheck(input) {
    const payload = await openAiJson("/chat/completions", {
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a UK affordable housing precheck assistant. Return only JSON with keys provisionalOutcome, confidence, missingEvidence, nextSteps, rationale. Outcome must be likely_eligible, uncertain, or likely_ineligible.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });

    const content = payload?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");

    const result: EligibilityPrecheckResult = {
      provisionalOutcome:
        parsed.provisionalOutcome === "likely_eligible" ||
        parsed.provisionalOutcome === "likely_ineligible"
          ? parsed.provisionalOutcome
          : "uncertain",
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.5))),
      missingEvidence: Array.isArray(parsed.missingEvidence)
        ? parsed.missingEvidence.map(String)
        : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
      rationale: String(parsed.rationale ?? "AI-assisted provisional precheck."),
    };

    return result;
  },

  async extractDocument(input) {
    const payload = await openAiJson("/chat/completions", {
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract key structured fields from UK housing support documents. Return only JSON with summary, extractedFields (object), confidence (0-1).",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });

    const content = payload?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");

    const result: DocumentExtractionResult = {
      summary: String(parsed.summary ?? "No summary generated."),
      extractedFields:
        parsed.extractedFields && typeof parsed.extractedFields === "object"
          ? parsed.extractedFields
          : {},
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.5))),
    };

    return result;
  },

  async assistantReply(input) {
    const response = await fetch(`${OPENAI_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        stream: true,
        messages: [
          {
            role: "system",
            content:
              "You are a UK housing support assistant. Use only provided context docs. Always cite source titles in brackets like [Policy: X]. If asked to make final legal/eligibility decisions, refuse and direct to caseworker review.",
          },
          {
            role: "user",
            content: JSON.stringify({
              prompt: input.prompt,
              contextDocuments: input.contextDocuments,
            }),
          },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to stream assistant response");
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = response.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed?.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // Ignore partial chunks
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return stream;
  },
};
