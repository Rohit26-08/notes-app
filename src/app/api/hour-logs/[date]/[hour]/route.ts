import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ date: string; hour: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, hour } = await params;
  await prisma.hourLog.deleteMany({ where: { date, hour: Number(hour), userId } });
  return NextResponse.json({ ok: true });
}
