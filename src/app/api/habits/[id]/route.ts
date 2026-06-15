import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/habits/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const habit = await prisma.habit.findUnique({
    where: { id },
    include: { entries: { orderBy: { date: "desc" } }, category: true },
  });

  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  return NextResponse.json(habit);
}

// PUT /api/habits/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, icon, color, days, isTemplate, archived, order, categoryId, startTime, endTime, timeSlots } = body;

  try {
    const habit = await prisma.habit.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(days !== undefined && { days }),
        ...(isTemplate !== undefined && { isTemplate }),
        ...(archived !== undefined && { archived }),
        ...(order !== undefined && { order }),
        ...(categoryId !== undefined && { categoryId }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(timeSlots !== undefined && { timeSlots }),
      },
    });
    return NextResponse.json(habit);
  } catch {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }
}

// DELETE /api/habits/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.habit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }
}
