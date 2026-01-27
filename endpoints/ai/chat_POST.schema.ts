import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  message: z.string(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ).optional(),
});

export type InputType = z.infer<typeof schema>;

// Streaming endpoint doesn't have a standard OutputType in the same way
// But we can define what the chunks might look like if we were parsing them, 
// though here we just return a stream.
export type OutputType = ReadableStream; 

// We don't export a helper function here because streaming requires special handling 
// on the client side (reading the stream) which is different from the standard 
// request/response pattern of other endpoints.