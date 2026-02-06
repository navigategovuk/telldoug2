import { AiProvider } from "./types";
import { openAiProvider } from "./openaiProvider";

let provider: AiProvider = openAiProvider;

export function getAiProvider(): AiProvider {
  return provider;
}

export function setAiProvider(nextProvider: AiProvider) {
  provider = nextProvider;
}
