import { z } from "zod";

const setSchema = z.object({
  reps: z.number().optional(),
  weightKg: z.number().optional(),
  durationSeconds: z.number().optional(),
});

const strengthEntrySchema = z.object({
  type: z.literal("strength"),
  exercise: z.string().optional(),
  sets: z.array(setSchema).default([]),
});

const cardioEntrySchema = z.object({
  type: z.literal("cardio"),
  activity: z.string().optional(),
  durationMinutes: z.number().optional(),
  distanceKm: z.number().optional(),
  caloriesBurned: z.number().optional(),
});

export const workoutEntrySchema = z.discriminatedUnion("type", [
  strengthEntrySchema,
  cardioEntrySchema,
]);

export const ingestWorkoutSchema = z.object({
  userEmail: z.string().email(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  title: z.string().default("Workout"),
  notes: z.string().optional(),
  entries: z.array(workoutEntrySchema).default([]),
});
