import { NextRequest, NextResponse } from "next/server";
import { assignmentsDb } from "@/lib/db-supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const includeArchived = searchParams.get("archived") === "true";

  if (from && to) {
    const assignments = await assignmentsDb.getByDateRange(from, to);
    return NextResponse.json(assignments);
  }

  const assignments = await assignmentsDb.getAll(includeArchived);
  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, icon, color, startDate, dueDate, note } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!startDate || !dueDate) {
    return NextResponse.json({ error: "Start date and due date are required" }, { status: 400 });
  }

  const assignment = await assignmentsDb.create({
    name: name.trim(),
    description: description || undefined,
    icon: icon || undefined,
    color: color || undefined,
    startDate,
    dueDate,
    note: note || undefined,
  });

  return NextResponse.json(assignment, { status: 201 });
}
