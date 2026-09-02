import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { day, done } = await req.json();
  if (day === undefined || done === undefined) {
    return NextResponse.json({ error: "day and done required" }, { status: 400 });
  }

  const goal = await prisma.goal.findUnique({ where: { id, userId } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const check = await prisma.goalCheck.upsert({
    where: { goalId_day: { goalId: id, day } },
    create: { goalId: id, day, done, userId },
    update: { done },
  });
  return NextResponse.json(check);
}
