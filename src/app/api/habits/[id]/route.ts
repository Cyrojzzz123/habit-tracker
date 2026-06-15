import { NextRequest, NextResponse } from "next/server";
import { habitsDb } from "@/lib/db-supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const habit = await habitsDb.getById(id);
    return NextResponse.json(habit);
  } catch {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, icon, color, days, isTemplate, archived, order, categoryId, startTime, endTime, timeSlots } = body;

  try {
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (icon !== undefined) data.icon = icon;
    if (color !== undefined) data.color = color;
    if (days !== undefined) data.days = days;
    if (isTemplate !== undefined) data.isTemplate = isTemplate;
    if (archived !== undefined) data.archived = archived;
    if (order !== undefined) data.order = order;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (startTime !== undefined) data.startTime = startTime;
    if (endTime !== undefined) data.endTime = endTime;
    if (timeSlots !== undefined) data.timeSlots = timeSlots;

    const habit = await habitsDb.update(id, data);
    return NextResponse.json(habit);
  } catch {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await habitsDb.delete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }
}
