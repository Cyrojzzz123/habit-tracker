import { NextRequest, NextResponse } from "next/server";
import { entriesDb } from "@/lib/db-supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (date) {
    const entries = await entriesDb.getByDate(date);
    return NextResponse.json(entries);
  }

  if (from && to) {
    const entries = await entriesDb.getByDateRange(from, to);
    return NextResponse.json(entries);
  }

  return NextResponse.json({ error: "Provide ?date= or ?from=&to=" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { habitId, date, completed, note } = body;

  if (!habitId || !date) {
    return NextResponse.json({ error: "habitId and date are required" }, { status: 400 });
  }

  const entry = await entriesDb.upsert(habitId, date, completed !== undefined ? completed : true, note);
  return NextResponse.json(entry);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, completed, note } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const data: { completed?: boolean; note?: string } = {};
    if (completed !== undefined) data.completed = completed;
    if (note !== undefined) data.note = note;
    const entry = await entriesDb.update(id, data);
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
}
