import { NextRequest, NextResponse } from "next/server";
import { errandsDb } from "@/lib/db-supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const includeArchived = searchParams.get("archived") === "true";

  if (from && to) {
    const errands = await errandsDb.getByDateRange(from, to);
    return NextResponse.json(errands);
  }

  const errands = await errandsDb.getAll(includeArchived);
  return NextResponse.json(errands);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, icon, color, date, time, note } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const errand = await errandsDb.create({
    name: name.trim(),
    description: description || undefined,
    icon: icon || undefined,
    color: color || undefined,
    date,
    time: time || undefined,
    note: note || undefined,
  });

  return NextResponse.json(errand, { status: 201 });
}
