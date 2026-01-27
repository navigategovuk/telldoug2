import { z } from "zod";

export const schema = z.object({
  narrativeType: z.enum([
    "bio", 
    "linkedin_summary", 
    "resume_summary", 
    "cover_letter_intro", 
    "elevator_pitch"
  ]),
  targetRole: z.string().optional(),
  tone: z.enum(["professional", "conversational", "executive"]).default("professional"),
});

export type InputType = z.infer<typeof schema>;

// Streaming endpoint, so OutputType is technically a stream, 
// but for client-side typing we usually just expect text chunks.
export type OutputType = ReadableStream; 