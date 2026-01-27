import { schema, OutputType } from "./meeting-brief_POST.schema";
import { assembleUserContext } from "../../helpers/assembleUserContext";
import { db } from "../../helpers/db";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { personId } = schema.parse(json);

    // 1. Get person details for the name
    const person = await db
      .selectFrom("people")
      .select("name")
      .where("id", "=", personId)
      .executeTakeFirst();

    if (!person) {
      return new Response(superjson.stringify({ error: "Person not found" }), { status: 404 });
    }

    // 2. Assemble context
    const context = await assembleUserContext(personId);

    // 3. Call OpenAI
    const systemPrompt = `You are an expert executive assistant. Generate a concise meeting preparation brief for meeting with this person based on the provided data.
    
    Include these sections:
    1) Quick background summary (Role, Company, etc.)
    2) Relationship history and last interaction
    3) Key talking points based on shared projects/interactions (if any)
    4) Suggested follow-up topics
    
    Be concise, actionable, and professional. Use Markdown formatting.`;

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the data for ${person.name}:\n\n${context}` },
        ],
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("OpenAI API Error:", errorText);
      throw new Error("Failed to generate brief");
    }

    const aiData = await openAiResponse.json();
    const brief = aiData.choices[0]?.message?.content || "No brief generated.";

    return new Response(superjson.stringify({ 
      brief, 
      personName: person.name 
    } satisfies OutputType));

  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}