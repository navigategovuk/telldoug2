import { schema } from "./chat_POST.schema";
import { assembleUserContext } from "../../helpers/assembleUserContext";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { message, conversationHistory } = schema.parse(json);

    // Get workspace from session for proper scoping
    const session = await getServerUserSession(request);
    const workspaceId = (session as { workspaceId?: string } | null)?.workspaceId;

    const context = await assembleUserContext(undefined, workspaceId);

    const systemPrompt = `You are Tell Doug, an expert AI assistant for career management and professional development.

You have comprehensive access to the user's career data, including:
- Their CANONICAL PROFILE (professional record used for resumes and public profiles)
- Resume VARIANTS (different versions tailored for specific roles/industries)
- Career OS ENTITIES (jobs, skills, projects, goals, people network, achievements, learning, content, events, feedback)

Here is the user's complete career context:

${context}

CAPABILITIES:
1. Answer questions about their career history, skills, and experience
2. Help them understand their professional network and relationships
3. Assist with resume and profile optimization suggestions
4. Help identify skill gaps and learning opportunities
5. Support goal setting and career planning
6. Draft content (LinkedIn posts, professional bios, cover letters)
7. Prepare for meetings and interviews with context about relevant people/companies

GUIDELINES:
- Be concise but thorough
- When referencing specific data, cite where it comes from (profile vs career entities)
- If asked about something not in the context, acknowledge the limitation
- Proactively offer relevant insights when they might be helpful
- For resume-related questions, focus on the canonical profile and variants`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message },
    ];

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        stream: true,
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("OpenAI API Error:", errorText);
      return new Response(superjson.stringify({ error: "Failed to communicate with AI service" }), { status: 500 });
    }

    // Create a transform stream to process the SSE chunks from OpenAI
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openAiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {break;}

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine.startsWith("data: ")) {continue;}
              
              const data = trimmedLine.slice(6);
              if (data === "[DONE]") {continue;}

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || "";
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (e) {
                console.error("Error parsing stream chunk", e);
              }
            }
          }
        } catch (e) {
          console.error("Stream reading error", e);
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Chat endpoint error:", error);
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
