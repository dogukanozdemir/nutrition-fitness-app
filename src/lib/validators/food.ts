import { z } from "zod";

const nutrientValue = z.union([z.number(), z.null()]);
const rangeSchema = z.object({
  low: z.number().optional(),
  high: z.number().optional(),
}).optional();

export const foodItemSchema = z.object({
  name: z.string().optional(),
  brand: z.string().optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  nutrients: z.record(z.string(), nutrientValue).default({}),
  ranges: z.record(z.string(), rangeSchema).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
});

export const ingestFoodSchema = z.object({
  userEmail: z.string().email(),
  eatenAt: z.string().datetime(),
  mealType: z.string().default("snack"),
  rawText: z.string().optional(),
  totals: z.record(z.string(), nutrientValue).default({}),
  ranges: z.record(z.string(), rangeSchema).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  items: z.array(foodItemSchema).default([]),
});
