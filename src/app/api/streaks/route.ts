import { NextResponse } from "next/server";
import { getAllStreaks } from "@/lib/streaks";

export async function GET() {
  try {
    const streaks = await getAllStreaks();
    return NextResponse.json(streaks);
  } catch (err) {
    console.error("Failed to get streaks:", err);
    return NextResponse.json({}, { status: 500 });
  }
}
