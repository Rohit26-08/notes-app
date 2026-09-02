import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const goal = await prisma.goal.update({
    where: { id, userId },
    data: {
      ...(body.text !== undefined && { text: body.text }),
      ...(body.description !== undefined && { description: body.description }),
    },
    include: { checks: true },
  });
  return NextResponse.json(goal);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.goal.delete({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
