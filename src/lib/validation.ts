import { z } from "zod";
import { GroceryCategory } from "@/generated/prisma/enums";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const householdNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a household name")
  .max(60, "Household name is too long");

export const joinCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/, "Join codes are 6 letters or numbers");

export const groceryItemSchema = z.object({
  name: z.string().trim().min(1, "Enter an item").max(100, "Item name is too long"),
  quantity: z
    .string()
    .trim()
    .max(40, "Quantity is too long")
    .transform((q) => q || null),
  category: z.enum(GroceryCategory).nullable(),
});

export const recipeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a recipe name")
    .max(100, "Recipe name is too long"),
  // One ingredient per line in the form; stored as a string array.
  ingredients: z
    .string()
    .transform((text) =>
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.string().max(120, "Each ingredient line must be under 120 characters"))
        .min(1, "Add at least one ingredient")
        .max(60, "Too many ingredients (max 60)"),
    ),
  instructions: z
    .string()
    .trim()
    .max(10000, "Instructions are too long")
    .transform((text) => text || null),
});
