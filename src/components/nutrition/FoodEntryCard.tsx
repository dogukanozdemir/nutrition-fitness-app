"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FoodEntryCardProps {
  entry: {
    id: string;
    rawText: string;
    nutrients: Record<string, number>;
  };
}

export function FoodEntryCard({ entry }: FoodEntryCardProps) {
  const calories = entry.nutrients?.calories ?? 0;

  return (
    <Link href={`/food/${entry.id}`}>
      <motion.div whileTap={{ scale: 0.98 }} className="block">
        <Card className="rounded-2xl border-border/50 shadow-sm transition-colors hover:bg-accent/50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{entry.rawText || "Food entry"}</p>
              <p className="text-sm text-muted-foreground">
                {calories > 0 ? `${Math.round(calories)} kcal` : "—"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
