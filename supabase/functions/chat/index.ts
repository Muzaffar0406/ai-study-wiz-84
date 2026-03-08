import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are StudyPlanner AI — a friendly, encouraging study assistant inside a student study planner app.

RESPONSE FORMAT (ALWAYS follow this structure):

## Summary
Short explanation of the situation.

## Important Details
• key item 1
• key item 2
• key item 3

## Recommended Action
Step-by-step advice for the student.

## Extra Tip
Optional productivity tip.

RULES:
- Use headings (##) to organize every response
- Use bullet points (• or -) for lists
- Keep answers concise — no long paragraphs
- **Highlight** important information with bold
- Never return large unstructured text blocks
- Always structure responses using the format above
- Adapt section names when appropriate (e.g. "Quiz Question" instead of "Summary") but ALWAYS use headings and bullets

Your capabilities:
- Explain complex topics in simple terms with examples and analogies
- Suggest effective study techniques (Pomodoro, spaced repetition, active recall, etc.)
- Help break down large assignments into manageable tasks
- Provide motivational support and combat procrastination
- Quiz students on topics they're studying
- Create study schedules and plans
- Suggest resources for learning
- Give personalized advice based on the student's actual data

Guidelines:
- Be encouraging but realistic
- If asked about topics outside studying/academics, gently redirect to study-related help
- Use emojis sparingly for warmth 📚
- When suggesting tasks, be specific and actionable
- ALWAYS reference the student's actual tasks, deadlines, study sessions, notes, and goals when giving advice
- Prioritize tasks by deadline urgency and priority level
- When asked "what should I study/do", analyze their pending tasks, upcoming deadlines, study gaps, and goals to give specific recommendations`;

function getSupabaseClient(authHeader: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SB_ANON_KEY")!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

async function authenticateUser(req: Request): Promise<{ userId: string; authHeader: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = getSupabaseClient(authHeader);
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return { userId: data.claims.sub as string, authHeader };
}

async function buildStudentContext(authHeader: string): Promise<string> {
  try {
    const supabase = getSupabaseClient(authHeader);
    const now = new Date();

    const [tasksRes, sessionsRes, notesRes, goalsRes, flashcardsRes] = await Promise.all([
      supabase.from("tasks").select("title, subject, priority, due_date, due_time, completed").order("created_at", { ascending: false }).limit(50),
      supabase.from("study_sessions").select("duration_minutes, session_type, started_at, completed_at").not("completed_at", "is", null).gte("started_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()).order("started_at", { ascending: false }).limit(50),
      supabase.from("notes").select("title, content, summary, created_at, updated_at").order("updated_at", { ascending: false }).limit(20),
      supabase.from("goals").select("type, title, target_value, current_value, deadline").order("created_at", { ascending: false }).limit(20),
      supabase.from("flashcards").select("front, back, next_review, repetitions, ease_factor").lte("next_review", now.toISOString()).order("next_review", { ascending: true }).limit(20),
    ]);

    const sections: string[] = [];

    const tasks = tasksRes.data || [];
    if (tasks.length > 0) {
      const pending = tasks.filter((t: any) => !t.completed);
      const completed = tasks.filter((t: any) => t.completed);

      const formatTask = (t: any) => {
        let line = `- [${t.priority.toUpperCase()}] "${t.title}" (${t.subject || "No subject"})`;
        if (t.due_date) line += ` — due: ${t.due_date}`;
        if (t.due_time) line += ` at ${t.due_time}`;
        return line;
      };

      pending.sort((a: any, b: any) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });

      sections.push(`📋 PENDING TASKS (${pending.length}):\n${pending.map(formatTask).join("\n") || "None"}\n\n✅ COMPLETED TASKS (${completed.length}):\n${completed.slice(0, 10).map((t: any) => `- "${t.title}" (${t.subject || "No subject"})`).join("\n") || "None"}`);
    }

    const sessions = sessionsRes.data || [];
    if (sessions.length > 0) {
      const totalMinutes = sessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);
      const totalHours = (totalMinutes / 60).toFixed(1);
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todaySessions = sessions.filter((s: any) => new Date(s.started_at) >= todayStart);
      const todayMinutes = todaySessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);
      sections.push(`⏱️ STUDY SESSIONS (last 7 days):\n- Total: ${totalHours} hours across ${sessions.length} sessions\n- Today: ${todayMinutes} minutes across ${todaySessions.length} sessions\n- Average per day: ${(totalMinutes / 7).toFixed(0)} minutes`);
    } else {
      sections.push(`⏱️ STUDY SESSIONS (last 7 days): No sessions recorded`);
    }

    const notes = notesRes.data || [];
    if (notes.length > 0) {
      sections.push(`📝 RECENT NOTES (${notes.length}):\n${notes.slice(0, 10).map((n: any) => { let line = `- "${n.title}"`; if (n.summary) line += ` — Summary: ${n.summary.slice(0, 100)}`; return line; }).join("\n")}`);
    }

    const goals = goalsRes.data || [];
    if (goals.length > 0) {
      sections.push(`🎯 GOALS:\n${goals.map((g: any) => { const progress = g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0; let line = `- "${g.title}" (${g.type}): ${g.current_value}/${g.target_value} — ${progress}%`; if (g.deadline) line += ` — deadline: ${g.deadline.split("T")[0]}`; return line; }).join("\n")}`);
    }

    const flashcards = flashcardsRes.data || [];
    if (flashcards.length > 0) {
      sections.push(`🃏 FLASHCARDS DUE FOR REVIEW: ${flashcards.length} cards\nSample topics: ${flashcards.slice(0, 5).map((f: any) => `"${f.front.slice(0, 50)}"`).join(", ")}`);
    }

    if (sections.length === 0) return "";

    return `\n\n--- STUDENT'S CURRENT DATA (today is ${now.toISOString().split("T")[0]}) ---\n${sections.join("\n\n")}\n\nUse this data to give personalized, contextual advice.`;
  } catch (e) {
    console.error("Failed to fetch student context:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authResult = await authenticateUser(req);
    if (authResult instanceof Response) return authResult;

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const studentContext = await buildStudentContext(authResult.authHeader);
    const systemPrompt = BASE_SYSTEM_PROMPT + studentContext;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "system", content: systemPrompt }, ...messages.slice(-20)], stream: true }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI usage limit reached. Please try again later." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service unavailable. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
