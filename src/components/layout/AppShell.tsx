"use client";

import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 pb-24 pt-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
