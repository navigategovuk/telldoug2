import { schema } from "./career-narrative_POST.schema";
import { assembleUserContext } from "../../helpers/assembleUserContext";
import superjson from 'superjson';

export async function handle(request: Request) {
  try {
    const json = await request.json();
    const { narrativeType, targetRole, tone } = schema.parse(json);

    // 1. Get full career context
    const context = await assembleUserContext();

    // 2. Define prompt instructions based on type
    let typeInstructions = "";
    switch (narrativeType) {
      case "bio":
        typeInstructions = "Write a professional bio (2-3 paragraphs) suitable for a personal website or conference speaking engagement. Focus on expertise, key achievements, and current focus.";
        break;
      case "linkedin_summary":
        typeInstructions = "Write a LinkedIn 'About' section summary. It should be engaging, use first-person perspective, and highlight unique value proposition. Keep it under 2600 characters but make it substantial.";
        break;
      case "resume_summary":
        typeInstructions = "Write a concise professional summary for a resume (3-4 sentences). Focus on years of experience, core skills, and major impact. Use strong action verbs.";
        break;
      case "cover_letter_intro":
        typeInstructions = "Write a compelling opening paragraph for a cover letter. Hook the reader immediately with passion and relevance.";
        break;
      case "elevator_pitch":
        typeInstructions = "Write a 30-second verbal elevator pitch script. It should sound natural when spoken, covering who you are, what you do, and the value you bring.";
        break;
    }

    // 3. Define tone instructions
    let toneInstructions = "";
    switch (tone) {
      case "professional":
        toneInstructions = "Use a standard professional, polished, and objective tone.";
        break;
      case "conversational":
        toneInstructions = "Use a friendly, approachable, and authentic tone. It's okay to show personality.";
        break;
      case "executive":
        toneInstructions = "Use a high-level, strategic, and authoritative tone. Focus on leadership and business impact.";
        break;
    }

    // 4. Target role tailoring
    const roleInstruction = targetRole 
      ? `Tailor this narrative specifically for a target role of: "${targetRole}". Highlight relevant experience and skills for this position.` 
      : "";

    const systemPrompt = `You are an expert career coach and copywriter. 
    
    Your task is to generate a specific career narrative based on the user's career data.
    
    DATA CONTEXT:
    ${context}
    
    INSTRUCTIONS:
    1. ${typeInstructions}
    2. ${toneInstructions}
    3. ${roleInstruction}
    
    Do not invent facts. Use the provided data. If specific details are missing, generalize gracefully.
    Output in Markdown format.`;

    // 5. Call OpenAI with streaming
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
        ],
        stream: true,
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error("OpenAI API Error:", errorText);
      return new Response(superjson.stringify({ error: "Failed to communicate with AI service" }), { status: 500 });
    }

    // 6. Stream response
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
    console.error("Career Narrative endpoint error:", error);
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}