import { schema, OutputType } from "./draft-content_POST.schema";
import { assembleUserContext } from "../../helpers/assembleUserContext";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { content_type, topic, context_notes } = schema.parse(json);

    // 1. Assemble global context (no personId passed)
    const context = await assembleUserContext();

    // 2. Build system prompt based on content type
    let systemPrompt = "";
    switch (content_type) {
      case "linkedin_post":
        systemPrompt = `You are an expert social media manager. Write a professional LinkedIn post about the following topic. 
        It should be engaging, 150-300 words, and include relevant hashtags. 
        Use the provided user context to make it personal and authentic to the user's career history.`;
        break;
      case "article":
        systemPrompt = `You are an expert content writer. Write a professional article or blog post about the following topic. 
        It should be well-structured with an introduction, body paragraphs, and a conclusion. Length: 500-800 words. 
        Use the provided user context to align with the user's experience, skills, and voice.`;
        break;
      case "email":
        systemPrompt = `You are an expert executive assistant. Draft a professional email about the following topic. 
        Provide a clear, compelling subject line suggestion and a concise body. 
        Use the provided user context to ensure tone and details are accurate.`;
        break;
      default:
        systemPrompt = "You are a helpful professional assistant. Draft content based on the user's request.";
    }

    // 3. Call OpenAI
    const userMessage = `Topic: ${topic}\n\nAdditional Notes: ${context_notes || "None"}\n\nUSER CONTEXT:\n${context}`;

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
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("OpenAI API Error:", errorText);
      throw new Error("Failed to generate content draft");
    }

    const aiData = await openAiResponse.json();
    const draft = aiData.choices[0]?.message?.content || "No draft generated.";

    return new Response(superjson.stringify({ 
      draft, 
      contentType: content_type 
    } satisfies OutputType));

  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}