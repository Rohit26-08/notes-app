import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const drafts = await prisma.draft.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(drafts);
}

export async function POST(req: NextRequest) {
  const { title, type, content } = await req.json();
  const draft = await prisma.draft.create({
    data: { title: title ?? "", type: type ?? "article", content: content ?? "" },
  });
  return NextResponse.json(draft);
}
