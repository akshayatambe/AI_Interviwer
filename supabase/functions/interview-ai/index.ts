import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, interviewType, difficulty, questionNumber, previousQuestions, question, answer, responses } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate_question") {
      systemPrompt = "You are a professional technical interviewer. Generate interview questions that are clear, specific, and appropriate for the given difficulty level. Return ONLY the question text, nothing else.";
      userPrompt = `Generate question #${questionNumber} for a ${difficulty} ${interviewType.replace('_', ' ')} interview.\n\nPrevious questions asked (avoid repeating): ${previousQuestions.join('; ') || 'None'}\n\nReturn only the question text.`;
    } else if (action === "evaluate_answer") {
      systemPrompt = `You are a professional interview evaluator. Evaluate the candidate's answer and return a JSON object with exactly these fields:
- score (number 1-10)
- feedback (string, 2-3 sentences)
- strengths (array of 1-3 strings)
- weaknesses (array of 1-3 strings)  
- follow_up_question (string, optional follow-up)
- confidence_score (number 1-10 based on answer quality/depth)

Return ONLY valid JSON, no markdown.`;
      userPrompt = `Interview type: ${interviewType}, Difficulty: ${difficulty}\n\nQuestion: ${question}\n\nCandidate's answer: ${answer || "(No answer provided)"}\n\nEvaluate this response.`;
    } else if (action === "generate_summary") {
      systemPrompt = "You are a professional interview evaluator. Write a comprehensive interview performance summary in 3-4 paragraphs. Be constructive and specific.";
      userPrompt = `Interview type: ${interviewType}\n\nResponses:\n${responses.map((r: any, i: number) => `Q${i+1}: ${r.question}\nA: ${r.answer}\nScore: ${r.score}/10\nFeedback: ${r.feedback}`).join('\n\n')}\n\nWrite a professional summary.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    if (action === "generate_question") {
      return new Response(JSON.stringify({ question: content.trim() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else if (action === "evaluate_answer") {
      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({
          score: 5, feedback: content, strengths: ["Attempted the question"], weaknesses: ["Could not parse evaluation"], confidence_score: 5
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      return new Response(JSON.stringify({ summary: content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
