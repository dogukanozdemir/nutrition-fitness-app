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
import { Plus, Trash2, Dumbbell, Activity } from "lucide-react";
import { toast } from "sonner";

type EntryType = "strength" | "cardio";

interface StrengthEntry {
  type: "strength";
  exercise: string;
  sets: Array<{ reps: string; weightKg: string }>;
}

interface CardioEntry {
  type: "cardio";
  activity: string;
  durationMinutes: string;
  distanceKm: string;
}

type ExerciseEntry = StrengthEntry | CardioEntry;

interface WorkoutFormProps {
  onSuccess?: () => void;
  labels?: {
    addWorkout?: string;
    logWorkout?: string;
    title?: string;
    sessionName?: string;
    date?: string;
    notes?: string;
    exercises?: string;
    addStrength?: string;
    addCardio?: string;
    exerciseName?: string;
    sets?: string;
    reps?: string;
    weight?: string;
    addSet?: string;
    activity?: string;
    duration?: string;
    distance?: string;
    save?: string;
    saving?: string;
  };
}

export function WorkoutForm({ onSuccess, labels }: WorkoutFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);

  function addStrength() {
    setEntries((e) => [
      ...e,
      { type: "strength", exercise: "", sets: [{ reps: "", weightKg: "" }] },
    ]);
  }

  function addCardio() {
    setEntries((e) => [
      ...e,
      { type: "cardio", activity: "", durationMinutes: "", distanceKm: "" },
    ]);
  }

  function removeEntry(i: number) {
    setEntries((e) => e.filter((_, idx) => idx !== i));
  }

  function updateStrength(i: number, field: keyof StrengthEntry, value: string | StrengthEntry["sets"]) {
    setEntries((e) => {
      const copy = [...e];
      const entry = copy[i];
      if (entry?.type === "strength") {
        if (field === "exercise") copy[i] = { ...entry, exercise: value as string };
        else if (field === "sets") copy[i] = { ...entry, sets: value as StrengthEntry["sets"] };
      }
      return copy;
    });
  }

  function updateCardio(i: number, field: keyof CardioEntry, value: string) {
    setEntries((e) => {
      const copy = [...e];
      const entry = copy[i];
      if (entry?.type === "cardio") {
        copy[i] = { ...entry, [field]: value };
      }
      return copy;
    });
  }

  function addSet(i: number) {
    setEntries((e) => {
      const copy = [...e];
      const entry = copy[i];
      if (entry?.type === "strength") {
        copy[i] = { ...entry, sets: [...entry.sets, { reps: "", weightKg: "" }] };
      }
      return copy;
    });
  }

  function removeSet(entryIdx: number, setIdx: number) {
    setEntries((e) => {
      const copy = [...e];
      const entry = copy[entryIdx];
      if (entry?.type === "strength" && entry.sets.length > 1) {
        copy[entryIdx] = { ...entry, sets: entry.sets.filter((_, i) => i !== setIdx) };
      }
      return copy;
    });
  }

  function updateSet(entryIdx: number, setIdx: number, field: "reps" | "weightKg", value: string) {
    setEntries((e) => {
      const copy = [...e];
      const entry = copy[entryIdx];
      if (entry?.type === "strength") {
        const newSets = [...entry.sets];
        newSets[setIdx] = { ...newSets[setIdx], [field]: value };
        copy[entryIdx] = { ...entry, sets: newSets };
      }
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Session name is required");
      return;
    }
    setLoading(true);
    try {
      const startedAt = `${date}T12:00:00.000Z`;
      let totalMins = 0;
      const apiEntries = entries.map((entry) => {
        if (entry.type === "strength") {
          const sets = entry.sets
            .filter((s) => s.reps || s.weightKg)
            .map((s) => ({
              reps: s.reps ? parseInt(s.reps, 10) : undefined,
              weightKg: s.weightKg ? parseFloat(s.weightKg) : undefined,
            }));
          return {
            type: "strength" as const,
            exercise: entry.exercise.trim() || undefined,
            sets,
          };
        } else {
          const mins = entry.durationMinutes ? parseInt(entry.durationMinutes, 10) : 0;
          totalMins += mins;
          return {
            type: "cardio" as const,
            activity: entry.activity.trim() || undefined,
            durationMinutes: mins || undefined,
            distanceKm: entry.distanceKm ? parseFloat(entry.distanceKm) : undefined,
          };
        }
      });
      const endedAt =
        totalMins > 0
          ? new Date(new Date(startedAt).getTime() + totalMins * 60000).toISOString()
          : undefined;

      const res = await fetch("/api/v1/workouts/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startedAt,
          endedAt,
          title: title.trim(),
          notes: notes.trim() || undefined,
          entries: apiEntries,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setOpen(false);
      setTitle("");
      setNotes("");
      setEntries([]);
      toast.success("Workout added");
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
          {labels?.addWorkout ?? "Add workout"}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{labels?.logWorkout ?? "Log workout session"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{labels?.sessionName ?? "Session name"} *</Label>
            <Input
              id="title"
              placeholder="e.g. Pull day, Push day, Legs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">{labels?.date ?? "Date"}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>{labels?.exercises ?? "Exercises"}</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={addStrength}>
                <Dumbbell className="mr-1 h-4 w-4" />
                {labels?.addStrength ?? "Add strength"}
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={addCardio}>
                <Activity className="mr-1 h-4 w-4" />
                {labels?.addCardio ?? "Add cardio"}
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <div key={i} className="rounded-xl border border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {entry.type === "strength" ? "Strength" : "Cardio"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-destructive"
                    onClick={() => removeEntry(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {entry.type === "strength" ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">{labels?.exerciseName ?? "Exercise / Machine"}</Label>
                      <Input
                        placeholder="e.g. Shoulder press, Lat pulldown"
                        value={entry.exercise}
                        onChange={(e) => updateStrength(i, "exercise", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{labels?.sets ?? "Sets"}</Label>
                      {entry.sets.map((set, j) => (
                        <div key={j} className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder={labels?.reps ?? "Reps"}
                            value={set.reps}
                            onChange={(e) => updateSet(i, j, "reps", e.target.value)}
                            className="rounded-xl flex-1"
                          />
                          <Input
                            type="number"
                            step="0.5"
                            placeholder={labels?.weight ?? "kg"}
                            value={set.weightKg}
                            onChange={(e) => updateSet(i, j, "weightKg", e.target.value)}
                            className="rounded-xl w-20"
                          />
                          {entry.sets.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeSet(i, j)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => addSet(i)}
                      >
                        + {labels?.addSet ?? "Add set"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{labels?.activity ?? "Activity"}</Label>
                      <Input
                        placeholder="e.g. Run, Bike"
                        value={entry.activity}
                        onChange={(e) => updateCardio(i, "activity", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{labels?.duration ?? "Duration (min)"}</Label>
                      <Input
                        type="number"
                        placeholder="30"
                        value={entry.durationMinutes}
                        onChange={(e) => updateCardio(i, "durationMinutes", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">{labels?.distance ?? "Distance (km)"}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="5"
                        value={entry.distanceKm}
                        onChange={(e) => updateCardio(i, "distanceKm", e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{labels?.notes ?? "Notes"}</Label>
            <Input
              id="notes"
              placeholder="How did it feel?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? (labels?.saving ?? "Saving...") : (labels?.save ?? "Save session")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
