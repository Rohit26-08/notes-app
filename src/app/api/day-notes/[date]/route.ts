import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  await prisma.dayNote.delete({ where: { date } });
  return NextResponse.json({ ok: true });
}
