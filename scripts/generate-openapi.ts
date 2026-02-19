import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z, toJSONSchema } from "zod";
import YAML from "yaml";
import {
  ingestFoodSchema,
  foodItemSchema,
} from "../src/lib/validators/food";
import { ingestBodySchema } from "../src/lib/validators/body";
import {
  ingestWorkoutSchema,
  strengthEntrySchema,
  cardioEntrySchema,
} from "../src/lib/validators/workout";

const toSchema = (schema: z.ZodType) =>
  toJSONSchema(schema, { target: "openapi-3.0", io: "input" }) as Record<string, unknown>;

const foodItemJson = toSchema(foodItemSchema);
const ingestFoodJson = toSchema(ingestFoodSchema);
const ingestBodyJson = toSchema(ingestBodySchema);
const ingestWorkoutJson = toSchema(ingestWorkoutSchema);
const strengthEntryJson = toSchema(strengthEntrySchema);
const cardioEntryJson = toSchema(cardioEntrySchema);

const ingestFoodProps = (ingestFoodJson as { properties?: Record<string, unknown> })
  .properties ?? {};
const ingestFoodWithRefs = {
  type: "object",
  ...ingestFoodJson,
  properties: {
    ...ingestFoodProps,
    items: {
      type: "array",
      description:
        "Food items with nutrients per item. Totals are computed server-side. If empty, an empty log is created.",
      items: foodItemJson,
    },
  },
};

const ingestWorkoutProps = (
  ingestWorkoutJson as { properties?: Record<string, unknown> }
).properties ?? {};
const workoutEntrySchema = {
  oneOf: [
    strengthEntryJson,
    cardioEntryJson,
  ],
  discriminator: { propertyName: "type" },
};
const ingestWorkoutWithRefs = {
  type: "object",
  ...ingestWorkoutJson,
  properties: {
    ...ingestWorkoutProps,
    entries: {
      type: "array",
      default: [],
      description: "Strength and/or cardio exercises in this session",
      items: workoutEntrySchema,
    },
  },
};

const ingestFoodRequest = ingestFoodWithRefs;
const ingestBodyRequest = {
  type: "object",
  ...ingestBodyJson,
};
const ingestWorkoutRequest = ingestWorkoutWithRefs;

const openapi = {
  openapi: "3.1.1",
  info: {
    title: "Nutrition & Fitness App API",
    description: `API for the Nutrition & Fitness PWA. Use these endpoints to ingest food logs,
    body metrics, and workouts from a Custom GPT or other integrations.

    Note: The schema is publicly accessible. Sending requests requires the
    X-API-KEY header (shared key) and userEmail in the body.`,
    version: "1.0.0",
  },
  servers: [
    {
      url: "https://nutrition-fitness-app-nine.vercel.app",
      description: "Production",
    },
  ],
  security: [{ apiKeyAuth: [] }],
  paths: {
    "/api/v1/ingest/food": {
      post: {
        summary: "Ingest food log",
        description: `Log a meal or food entry. Supports full nutrient profiles including macros,
        fiber, vitamins, minerals, and electrolytes. Send items with nutrients per
        food item; totals are computed server-side.`,
        operationId: "ingestFood",
        tags: ["Ingest"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: ingestFoodRequest,
            },
          },
        },
        responses: {
          "200": {
            description: "Food log created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      format: "uuid",
                      description: "ID of the created food log",
                    },
                    ok: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          "400": {
            description:
              "Validation failed (invalid body) or User not found",
          },
          "401": { description: "Invalid or missing API key" },
          "500": { description: "Server error" },
        },
      },
    },
    "/api/v1/ingest/body": {
      post: {
        summary: "Ingest body metrics",
        description: `Log a body measurement (weight, body fat, etc.). At minimum, weight in kg
        and measuredAt timestamp are required.`,
        operationId: "ingestBody",
        tags: ["Ingest"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: ingestBodyRequest,
            },
          },
        },
        responses: {
          "200": {
            description: "Body metric created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      format: "uuid",
                      description: "ID of the created body metric",
                    },
                    ok: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed or User not found",
          },
          "401": { description: "Invalid or missing API key" },
          "500": { description: "Server error" },
        },
      },
    },
    "/api/v1/ingest/workout": {
      post: {
        summary: "Ingest workout",
        description: `Log a workout session. Can include strength exercises (with sets, reps,
        weight) and/or cardio activities (duration, distance, calories burned).`,
        operationId: "ingestWorkout",
        tags: ["Ingest"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: ingestWorkoutRequest,
            },
          },
        },
        responses: {
          "200": {
            description: "Workout created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      format: "uuid",
                      description: "ID of the created workout",
                    },
                    ok: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed or User not found",
          },
          "401": { description: "Invalid or missing API key" },
          "500": { description: "Server error" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-KEY",
        description:
          "Shared API key for authentication. Configure this in the app settings and add it to your GPT Action.",
      },
    },
    schemas: {
      IngestFoodRequest: ingestFoodRequest,
      FoodItem: foodItemJson,
      IngestBodyRequest: ingestBodyRequest,
      IngestWorkoutRequest: ingestWorkoutRequest,
      WorkoutEntry: workoutEntrySchema,
      StrengthEntry: strengthEntryJson,
      CardioEntry: cardioEntryJson,
    },
  },
};

const yamlStr = YAML.stringify(JSON.parse(JSON.stringify(openapi)), {
  lineWidth: 0,
  defaultStringType: "QUOTE_DOUBLE",
});
const outPath = resolve(process.cwd(), "public/openapi.yaml");
writeFileSync(outPath, yamlStr, "utf-8");
console.log(`Generated ${outPath}`);
