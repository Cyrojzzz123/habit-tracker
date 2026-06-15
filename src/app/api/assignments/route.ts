import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/assignments — list all assignments (optionally by date range)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const includeArchived = searchParams.get("archived") === "true";

  const where: Record<string, unknown> = includeArchived ? {} : { archived: false };

  if (from && to) {
    // Get assignments that overlap with the date range
    // An assignment overlaps if: startDate <= to AND dueDate >= from
    where.AND = [
      { startDate: { lte: to } },
      { dueDate: { gte: from } },
    ];
  }

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { order: "asc" },
  });

  return NextResponse.json(assignments);
}

// POST /api/assignments — create a new assignment
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, icon, color, startDate, dueDate, note } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!startDate || !dueDate) {
    return NextResponse.json({ error: "Start date and due date are required" }, { status: 400 });
  }

  const maxOrder = await prisma.assignment.aggregate({ _max: { order: true } });

  const assignment = await prisma.assignment.create({
    data: {
      name: name.trim(),
      description: description || null,
      icon: icon || "📋",
      color: color || "#3B82F6",
      startDate,
      dueDate,
      note: note || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
