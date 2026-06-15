import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/errands/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const errand = await prisma.errand.findUnique({
    where: { id },
  });

  if (!errand) {
    return NextResponse.json({ error: "Errand not found" }, { status: 404 });
  }

  return NextResponse.json(errand);
}

// PUT /api/errands/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, icon, color, date, time, completed, completedAt, note, archived, order } = body;

  try {
    const errand = await prisma.errand.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(date !== undefined && { date }),
        ...(time !== undefined && { time }),
        ...(completed !== undefined && { completed }),
        ...(completedAt !== undefined && { completedAt }),
        ...(note !== undefined && { note }),
        ...(archived !== undefined && { archived }),
        ...(order !== undefined && { order }),
      },
    });
    return NextResponse.json(errand);
  } catch {
    return NextResponse.json({ error: "Errand not found" }, { status: 404 });
  }
}

// DELETE /api/errands/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.errand.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errand not found" }, { status: 404 });
  }
}
