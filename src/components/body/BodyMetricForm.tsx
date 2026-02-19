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

interface BodyMetricFormProps {
  onSuccess?: () => void;
  labels?: {
    addEntry?: string;
    logMetrics?: string;
    date?: string;
    weight?: string;
    bodyFat?: string;
    leanMass?: string;
    waist?: string;
  };
}

export function BodyMetricForm({ onSuccess, labels }: BodyMetricFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [measuredAt, setMeasuredAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weightKg, setWeightKg] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [leanMassKg, setLeanMassKg] = useState("");
  const [waistCm, setWaistCm] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0) {
      setError("Weight is required");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/v1/body/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measuredAt: `${measuredAt}T12:00:00.000Z`,
          weightKg: weight,
          bodyFatPercent: bodyFatPercent ? parseFloat(bodyFatPercent) : undefined,
          leanMassKg: leanMassKg ? parseFloat(leanMassKg) : undefined,
          waistCm: waistCm ? parseFloat(waistCm) : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to add");
      }
      setOpen(false);
      setWeightKg("");
      setBodyFatPercent("");
      setLeanMassKg("");
      setWaistCm("");
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
        <Button className="rounded-xl">{labels?.addEntry ?? "Add entry"}</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-border/50">
        <DialogHeader>
          <DialogTitle>{labels?.logMetrics ?? "Log body metrics"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">{labels?.date ?? "Date"}</Label>
            <Input
              id="date"
              type="date"
              value={measuredAt}
              onChange={(e) => setMeasuredAt(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">{labels?.weight ?? "Weight (kg)"} *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="70"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bodyFat">{labels?.bodyFat ?? "Body fat (%)"}</Label>
            <Input
              id="bodyFat"
              type="number"
              step="0.1"
              placeholder="20"
              value={bodyFatPercent}
              onChange={(e) => setBodyFatPercent(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leanMass">{labels?.leanMass ?? "Lean mass (kg)"}</Label>
            <Input
              id="leanMass"
              type="number"
              step="0.1"
              placeholder="56"
              value={leanMassKg}
              onChange={(e) => setLeanMassKg(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waist">{labels?.waist ?? "Waist (cm)"}</Label>
            <Input
              id="waist"
              type="number"
              step="0.1"
              placeholder="80"
              value={waistCm}
              onChange={(e) => setWaistCm(e.target.value)}
              className="rounded-xl"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
