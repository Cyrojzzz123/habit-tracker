import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/entries?date=YYYY-MM-DD  or  ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (date) {
    const entries = await prisma.entry.findMany({
      where: { date },
      include: { habit: true },
    });
    return NextResponse.json(entries);
  }

  if (from && to) {
    const entries = await prisma.entry.findMany({
      where: { date: { gte: from, lte: to } },
      include: { habit: true },
    });
    return NextResponse.json(entries);
  }

  return NextResponse.json({ error: "Provide ?date= or ?from=&to=" }, { status: 400 });
}

// POST /api/entries — create or toggle an entry
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { habitId, date, completed, note } = body;

  if (!habitId || !date) {
    return NextResponse.json({ error: "habitId and date are required" }, { status: 400 });
  }

  // Upsert: create if doesn't exist, update if it does
  const entry = await prisma.entry.upsert({
    where: {
      habitId_date: { habitId, date },
    },
    create: {
      habitId,
      date,
      completed: completed !== undefined ? completed : true,
      note: note || null,
    },
    update: {
      ...(completed !== undefined && { completed }),
      ...(note !== undefined && { note }),
    },
  });

  return NextResponse.json(entry);
}

// PUT /api/entries — update an entry's note or completed status
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, completed, note } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const entry = await prisma.entry.update({
      where: { id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(note !== undefined && { note }),
      },
    });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
}
