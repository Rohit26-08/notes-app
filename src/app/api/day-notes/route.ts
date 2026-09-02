import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.dayNote.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, content } = await req.json();
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const note = await prisma.dayNote.upsert({
    where: { date_userId: { date, userId } },
    create: { date, content: content ?? "", userId },
    update: { content: content ?? "" },
  });
  return NextResponse.json(note);
}
