-- Create tables for Habit Tracker

CREATE TABLE IF NOT EXISTS "Habit" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT DEFAULT 'check-circle',
  "color" TEXT DEFAULT '#6366F1',
  "days" TEXT DEFAULT '1,2,3,4,5,6,0',
  "isTemplate" BOOLEAN DEFAULT true,
  "archived" BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  "startTime" TEXT,
  "endTime" TEXT,
  "timeSlots" TEXT,
  "categoryId" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Entry" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "date" TEXT NOT NULL,
  "completed" BOOLEAN DEFAULT false,
  "note" TEXT,
  "habitId" TEXT NOT NULL REFERENCES "Habit"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("habitId", "date")
);

CREATE TABLE IF NOT EXISTS "Assignment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT DEFAULT '📋',
  "color" TEXT DEFAULT '#3B82F6',
  "startDate" TEXT NOT NULL,
  "dueDate" TEXT NOT NULL,
  "completed" BOOLEAN DEFAULT false,
  "completedAt" TEXT,
  "note" TEXT,
  "archived" BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Errand" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT DEFAULT '📌',
  "color" TEXT DEFAULT '#F59E0B',
  "date" TEXT NOT NULL,
  "time" TEXT,
  "completed" BOOLEAN DEFAULT false,
  "completedAt" TEXT,
  "note" TEXT,
  "archived" BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "icon" TEXT,
  "color" TEXT
);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE "Habit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Errand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for now)
CREATE POLICY "Allow all on Habit" ON "Habit" FOR ALL USING (true);
CREATE POLICY "Allow all on Entry" ON "Entry" FOR ALL USING (true);
CREATE POLICY "Allow all on Assignment" ON "Assignment" FOR ALL USING (true);
CREATE POLICY "Allow all on Errand" ON "Errand" FOR ALL USING (true);
CREATE POLICY "Allow all on Category" ON "Category" FOR ALL USING (true);
