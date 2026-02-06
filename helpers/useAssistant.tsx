import { useCallback, useRef, useState } from "react";
import { postAssistantStream, InputType } from "../endpoints/ai/assistant/stream_POST.schema";

export function useAssistant() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const askAssistant = useCallback(async (input: InputType) => {
    setContent("");
    setError(null);
    setIsLoading(true);

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await postAssistantStream(input, { signal: controller.signal });
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Assistant stream unavailable");
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setContent((prev) => prev + chunk);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Assistant request failed");
    } finally {
      setIsLoading(false);
      controllerRef.current = null;
    }
  }, []);

  return {
    content,
    isLoading,
    error,
    askAssistant,
  };
}
