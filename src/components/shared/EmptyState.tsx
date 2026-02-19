import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-muted/30 py-12 px-6",
        className
      )}
    >
      <Icon className="mb-3 h-12 w-12 text-muted-foreground/60" />
      <p className="font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-center text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
