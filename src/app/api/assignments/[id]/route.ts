import { NextRequest, NextResponse } from "next/server";
import { assignmentsDb } from "@/lib/db-supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const assignments = await assignmentsDb.getAll(true);
    const assignment = assignments.find((a: { id: string }) => a.id === id);
    if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(assignment);
  } catch {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  try {
    const assignment = await assignmentsDb.update(id, body);
    return NextResponse.json(assignment);
  } catch {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await assignmentsDb.delete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
}
