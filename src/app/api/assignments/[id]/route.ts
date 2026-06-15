import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/assignments/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  return NextResponse.json(assignment);
}

// PUT /api/assignments/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, icon, color, startDate, dueDate, completed, completedAt, note, archived, order } = body;

  try {
    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(startDate !== undefined && { startDate }),
        ...(dueDate !== undefined && { dueDate }),
        ...(completed !== undefined && { completed }),
        ...(completedAt !== undefined && { completedAt }),
        ...(note !== undefined && { note }),
        ...(archived !== undefined && { archived }),
        ...(order !== undefined && { order }),
      },
    });
    return NextResponse.json(assignment);
  } catch {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
}

// DELETE /api/assignments/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
}
