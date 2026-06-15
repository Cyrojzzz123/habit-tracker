import { NextRequest, NextResponse } from "next/server";
import { habitsDb } from "@/lib/db-supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("archived") === "true";
  const habits = await habitsDb.getAll(includeArchived);
  return NextResponse.json(habits);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, icon, color, days, isTemplate, categoryId, startTime, endTime, timeSlots } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const habit = await habitsDb.create({
    name: name.trim(),
    description: description || undefined,
    icon: icon || undefined,
    color: color || undefined,
    days: days || undefined,
    isTemplate: isTemplate !== undefined ? isTemplate : undefined,
    categoryId: categoryId || undefined,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
    timeSlots: timeSlots || undefined,
  });

  return NextResponse.json(habit, { status: 201 });
}
