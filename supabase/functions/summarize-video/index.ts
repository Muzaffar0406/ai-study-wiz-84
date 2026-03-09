import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "A valid URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch the video page HTML
    console.log("Fetching URL:", url);
    const pageResp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Lovable/1.0)",
        Accept: "text/html",
      },
    });

    if (!pageResp.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL (status ${pageResp.status})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await pageResp.text();

    // 2. Extract meaningful text from HTML
    // Remove scripts, styles, and HTML tags
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000); // Limit to avoid token overflow

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
    const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
    const title = ogTitleMatch?.[1] || titleMatch?.[1] || "Unknown";
    const description = ogDescMatch?.[1] || "";

    // 3. Summarize with Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a video content summarizer. Given the page content of a video URL, produce a comprehensive summary. Structure your response with:
1. **Title** of the video
2. **Key Points** — bullet list of main topics covered
3. **Summary** — 2-3 paragraph overview
4. **Takeaways** — actionable insights or key lessons

If you can't determine the video content, say so and summarize whatever page info is available. Be concise but thorough.`,
          },
          {
            role: "user",
            content: `Summarize this video page:\n\nTitle: ${title}\nDescription: ${description}\nURL: ${url}\n\nPage content:\n${cleaned}`,
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      throw new Error("AI summarization failed");
    }

    const aiData = await aiResp.json();
    const summary = aiData.choices?.[0]?.message?.content || "Could not generate summary.";

    return new Response(
      JSON.stringify({ summary, title, description, url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("summarize-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
