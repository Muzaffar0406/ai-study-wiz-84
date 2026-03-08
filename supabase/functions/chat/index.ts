import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are StudyPlanner AI — a friendly, encouraging study assistant for students. Your personality is warm, motivating, and knowledgeable.

Your capabilities:
- Explain complex topics in simple terms with examples and analogies
- Suggest effective study techniques (Pomodoro, spaced repetition, active recall, etc.)
- Help break down large assignments into manageable tasks
- Provide motivational support and combat procrastination
- Quiz students on topics they're studying
- Create study schedules and plans
- Suggest resources for learning
- Give personalized advice based on the student's current tasks and workload

Guidelines:
- Keep responses concise but helpful (aim for 2-4 paragraphs max unless explaining a complex topic)
- Use bullet points and formatting for clarity
- Be encouraging but realistic
- If asked about topics outside studying/academics, gently redirect to study-related help
- Use emojis sparingly for warmth 📚
- When suggesting tasks, be specific and actionable
- Reference the student's actual tasks when relevant to give personalized advice`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch user's tasks if authenticated
    let taskContext = "";
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: tasks } = await supabase
          .from("tasks")
          .select("title, subject, priority, due_time, completed")
          .order("created_at", { ascending: false })
          .limit(50);

        if (tasks && tasks.length > 0) {
          const pending = tasks.filter((t: any) => !t.completed);
          const completed = tasks.filter((t: any) => t.completed);
          taskContext = `\n\n--- STUDENT'S CURRENT TASKS ---
Pending tasks (${pending.length}):
${pending.map((t: any) => `- [${t.priority.toUpperCase()}] "${t.title}" (${t.subject || "No subject"})${t.due_time ? ` — due: ${t.due_time}` : ""}`).join("\n") || "None"}

Completed tasks (${completed.length}):
${completed.map((t: any) => `- ✅ "${t.title}" (${t.subject || "No subject"})`).join("\n") || "None"}

Use this task information to give personalized, contextual advice. Reference specific tasks when relevant.`;
        }
      } catch (e) {
        console.error("Failed to fetch tasks:", e);
      }
    }

    const systemPrompt = BASE_SYSTEM_PROMPT + taskContext;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-20),
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
