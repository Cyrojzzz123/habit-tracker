import { NextRequest, NextResponse } from "next/server";
import { errandsDb } from "@/lib/db-supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const errands = await errandsDb.getAll(true);
    const errand = errands.find((e: { id: string }) => e.id === id);
    if (!errand) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(errand);
  } catch {
    return NextResponse.json({ error: "Errand not found" }, { status: 404 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  try {
    const errand = await errandsDb.update(id, body);
    return NextResponse.json(errand);
  } catch {
    return NextResponse.json({ error: "Errand not found" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await errandsDb.delete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errand not found" }, { status: 404 });
  }
}
