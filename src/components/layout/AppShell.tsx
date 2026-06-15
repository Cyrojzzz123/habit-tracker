"use client";

import { Sidebar, BottomNav } from "@/components/layout/Nav";
import { QuickAddButton } from "@/components/QuickAddButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <QuickAddButton />
      <BottomNav />
    </div>
  );
}
