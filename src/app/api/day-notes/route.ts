import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const notes = await prisma.dayNote.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const { date, content } = await req.json();
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const note = await prisma.dayNote.upsert({
    where: { date },
    create: { date, content: content ?? "" },
    update: { content: content ?? "" },
  });
  return NextResponse.json(note);
}
