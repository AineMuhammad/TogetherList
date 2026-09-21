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
