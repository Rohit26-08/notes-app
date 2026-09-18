import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const GEMINI_MODEL = "gemini-2.0-flash";

function buildPrompt(action: string, text: string) {
  if (action === "grammar") {
    return (
      "Fix the grammar, spelling, and punctuation of the text below. " +
      "Keep the meaning, tone, and formatting the same. " +
      "Reply with ONLY the corrected text, no explanations, no quotes.\n\n" +
      text
    );
  }
  return (
    "Continue the text below naturally, in the same tone and style. " +
    "Reply with ONLY a short continuation (5-12 words), no explanations, no quotes. " +
    "Do not repeat the given text.\n\n" +
    text
  );
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI assist is not configured" }, { status: 501 });
  }

  const { action, text } = await req.json();
  if (!text || (action !== "grammar" && action !== "suggest")) {
    return NextResponse.json({ error: "action and text required" }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "text too long" }, { status: 400 });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(action, text) }] }],
        generationConfig: { temperature: action === "grammar" ? 0.2 : 0.7, maxOutputTokens: 200 },
      }),
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "AI provider error" }, { status: 502 });
  }

  const data = await res.json();
  const result: string = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return NextResponse.json({ result });
}
