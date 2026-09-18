import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Unofficial proxy (encryptarun/qwen-api) in front of chat.qwen.ai's web session.
// QWEN_API_KEY must be YOUR OWN chat.qwen.ai access_token, not the shared token
// from the repo's README — that one is shared publicly and gets rate-limited/revoked.
const QWEN_MODEL = "qwen3.5-plus";
const QWEN_ENDPOINT = "https://qwen.aikit.club/v1/chat/completions";

const REFUSAL_PATTERNS = [
  /random characters/i,
  /does not appear to/i,
  /no meaningful/i,
  /cannot (assist|help|understand)/i,
  /as an ai/i,
  /i'm sorry/i,
  /i am sorry/i,
  /doesn'?t (make sense|appear)/i,
];

function cleanResult(raw: string | undefined): string {
  if (!raw) return "";
  // Strip qwen-api's trailing <!-- qwen_metadata: {...} --> and any other HTML comments.
  const text = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
  if (!text) return "";
  if (REFUSAL_PATTERNS.some(p => p.test(text))) return "";
  return text;
}

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
    "Reply with ONLY a short continuation (3-8 words), no explanations, no quotes. " +
    "Do not repeat the given text. If the text is too short or unclear to continue, reply with an empty string.\n\n" +
    text
  );
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.QWEN_API_KEY;
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

  const res = await fetch(QWEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages: [{ role: "user", content: buildPrompt(action, text) }],
      temperature: action === "grammar" ? 0.2 : 0.7,
      max_tokens: 120,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "AI provider error" }, { status: 502 });
  }

  const data = await res.json();
  const result = cleanResult(data?.choices?.[0]?.message?.content);
  return NextResponse.json({ result });
}
