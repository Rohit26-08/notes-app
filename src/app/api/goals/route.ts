import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekStart = req.nextUrl.searchParams.get("weekStart");
  const goals = await prisma.goal.findMany({
    where: { userId, ...(weekStart ? { weekStart } : {}) },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weekStart, text } = await req.json();
  if (!weekStart || !text) {
    return NextResponse.json({ error: "weekStart and text required" }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: { weekStart, text, userId },
  });
  return NextResponse.json(goal);
}
