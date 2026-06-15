import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/habits — list all habits (optionally include archived)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("archived") === "true";

  const habits = await prisma.habit.findMany({
    where: includeArchived ? {} : { archived: false },
    orderBy: { order: "asc" },
    include: { category: true },
  });

  return NextResponse.json(habits);
}

// POST /api/habits — create a new habit
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, icon, color, days, isTemplate, categoryId, startTime, endTime, timeSlots } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const maxOrder = await prisma.habit.aggregate({ _max: { order: true } });

  const habit = await prisma.habit.create({
    data: {
      name: name.trim(),
      description: description || null,
      icon: icon || "💪",
      color: color || "#6366F1",
      days: days || "1,2,3,4,5,6,0",
      isTemplate: isTemplate !== undefined ? isTemplate : true,
      order: (maxOrder._max.order ?? -1) + 1,
      categoryId: categoryId || null,
      startTime: startTime || null,
      endTime: endTime || null,
      timeSlots: timeSlots || null,
    },
  });

  return NextResponse.json(habit, { status: 201 });
}
