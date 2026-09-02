import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  const logs = await prisma.hourLog.findMany({
    where: { userId, ...(date ? { date } : {}) },
    orderBy: [{ date: "desc" }, { hour: "asc" }],
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, hour, content } = await req.json();
  if (!date || hour === undefined) {
    return NextResponse.json({ error: "date and hour required" }, { status: 400 });
  }

  const log = await prisma.hourLog.upsert({
    where: { date_hour_userId: { date, hour, userId } },
    create: { date, hour, content: content ?? "", userId },
    update: { content: content ?? "" },
  });
  return NextResponse.json(log);
}
