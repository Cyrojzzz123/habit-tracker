import { prisma } from "@/lib/db";

export async function getStreak(habitId: string): Promise<{ current: number; longest: number }> {
  const entries = await prisma.entry.findMany({
    where: { habitId, completed: true },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (entries.length === 0) return { current: 0, longest: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Calculate current streak
  let currentStreak = 0;
  const checkDate = new Date(today);

  // Check if today is completed
  const todayEntry = entries.find((e) => e.date === todayStr);
  if (!todayEntry) {
    // Check yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const entry = entries.find((e) => e.date === dateStr);
    if (entry) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = entries.map((e) => e.date).sort();

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

export async function getAllStreaks(): Promise<Record<string, { current: number; longest: number }>> {
  const habits = await prisma.habit.findMany({
    where: { archived: false, isTemplate: true },
    select: { id: true },
  });

  const streaks: Record<string, { current: number; longest: number }> = {};

  for (const habit of habits) {
    streaks[habit.id] = await getStreak(habit.id);
  }

  return streaks;
}
