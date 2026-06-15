import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/errands — list all errands (optionally by date range)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const includeArchived = searchParams.get("archived") === "true";

  const where: Record<string, unknown> = includeArchived ? {} : { archived: false };

  if (from && to) {
    where.date = { gte: from, lte: to };
  }

  const errands = await prisma.errand.findMany({
    where,
    orderBy: [{ date: "asc" }, { time: "asc" }, { order: "asc" }],
  });

  return NextResponse.json(errands);
}

// POST /api/errands — create a new errand
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, icon, color, date, time, note } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const maxOrder = await prisma.errand.aggregate({ _max: { order: true } });

  const errand = await prisma.errand.create({
    data: {
      name: name.trim(),
      description: description || null,
      icon: icon || "📌",
      color: color || "#F59E0B",
      date,
      time: time || null,
      note: note || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(errand, { status: 201 });
}
