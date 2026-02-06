import React, { useState } from "react";
import { useAssistant } from "../helpers/useAssistant";
import { useCurrentApplication } from "../helpers/useApplications";
import { parseAssistantOutput } from "../helpers/assistantOutput";

export default function ApplicantAssistantPage() {
  const { data: appData } = useCurrentApplication();
  const { content, error, isLoading, askAssistant } = useAssistant();
  const [prompt, setPrompt] = useState("");
  const output = parseAssistantOutput(content);

  const handleAsk = async () => {
    await askAssistant({
      prompt,
      applicationId: appData?.application?.id,
    });
  };

  return (
    <div style={{ maxWidth: 920 }}>
      <h1>AI Assistant</h1>
      <p>
        AI-assisted guidance only. Final legal and eligibility decisions are always made by your
        authority.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleAsk();
        }}
      >
        <label htmlFor="assistant-prompt">Ask a question</label>
        <textarea
          id="assistant-prompt"
          aria-describedby="assistant-help"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          style={{ width: "100%" }}
          placeholder="Ask about required evidence, next steps, or process timelines"
        />
        <p id="assistant-help" style={{ marginTop: 8 }}>
          Include only what is needed. Avoid unnecessary personal details.
        </p>
        <button type="submit" disabled={isLoading || !prompt.trim()}>
          Ask Assistant
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true" style={{ marginTop: 12 }}>
        {isLoading ? <p>Generating response...</p> : null}
        {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      </div>

      {output.plainText ? (
        <section style={{ marginTop: 12 }} aria-labelledby="assistant-response-heading">
          <h2 id="assistant-response-heading">Assistant response</h2>
          {output.includesRefusal ? (
            <p role="alert" style={{ color: "#92400e" }}>
              This response includes a refusal for a final decision request. A caseworker must
              make the final determination.
            </p>
          ) : null}
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{output.plainText}</pre>
          <h3 style={{ marginTop: 12 }}>Citations</h3>
          {output.citations.length > 0 ? (
            <ul>
              {output.citations.map((citation) => (
                <li key={citation}>{citation}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#92400e" }}>
              No policy citation was returned. Treat this as non-authoritative and request
              caseworker clarification.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
