"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

interface FoodEntryFormProps {
  date: Date;
  onSuccess?: () => void;
  labels?: {
    addFood?: string;
    logFood?: string;
    whatAte?: string;
    mealType?: string;
    optionalMacros?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    save?: string;
    saving?: string;
  };
}

export function FoodEntryForm({ date, onSuccess, labels }: FoodEntryFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawText, setRawText] = useState("");
  const [mealType, setMealType] = useState("snack");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!rawText.trim()) {
      setError("Description is required");
      return;
    }
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const eatenAt = `${dateStr}T12:00:00.000Z`;
      const res = await fetch("/api/v1/food/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eatenAt,
          mealType,
          rawText: rawText.trim(),
          calories: calories ? parseFloat(calories) : undefined,
          protein: protein ? parseFloat(protein) : undefined,
          carbs: carbs ? parseFloat(carbs) : undefined,
          fat: fat ? parseFloat(fat) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setOpen(false);
      setRawText("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      toast.success("Food added");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          {labels?.addFood ?? "Add food"}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{labels?.logFood ?? "Log food"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rawText">{labels?.whatAte ?? "What did you eat?"} *</Label>
            <Input
              id="rawText"
              placeholder="e.g. Grilled chicken with rice"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{labels?.mealType ?? "Meal type"}</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">{labels?.optionalMacros ?? "Macros (optional)"}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={labels?.calories ?? "Calories"}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="rounded-xl"
              />
              <Input
                type="number"
                placeholder={labels?.protein ?? "Protein (g)"}
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="rounded-xl"
              />
              <Input
                type="number"
                placeholder={labels?.carbs ?? "Carbs (g)"}
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="rounded-xl"
              />
              <Input
                type="number"
                placeholder={labels?.fat ?? "Fat (g)"}
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? (labels?.saving ?? "Saving...") : (labels?.save ?? "Save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
