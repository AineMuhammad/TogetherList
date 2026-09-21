"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ACTIVE_HOUSEHOLD_COOKIE } from "@/lib/constants";
import { createUniqueJoinCode, getMembership, requireUser } from "@/lib/household";
import { householdNameSchema, joinCodeSchema } from "@/lib/validation";
import { ShoppingDay } from "@/generated/prisma/enums";
import type { FormState } from "@/app/actions/auth";

async function setActive(householdId: string) {
  (await cookies()).set(ACTIVE_HOUSEHOLD_COOKIE, householdId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

async function requireOwner(householdId: string) {
  const user = await requireUser();
  const membership = await getMembership(user.id, householdId);
  if (membership?.role !== "OWNER")
    throw new Error("Only the household owner can do that.");
  return user;
}

export async function createHousehold(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const name = householdNameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };

  const household = await db.household.create({
    data: {
      name: name.data,
      joinCode: await createUniqueJoinCode(),
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  await setActive(household.id);
  redirect("/");
}

export async function joinHousehold(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const code = joinCodeSchema.safeParse(formData.get("code"));
  if (!code.success) return { error: code.error.issues[0].message };

  const household = await db.household.findUnique({ where: { joinCode: code.data } });
  if (!household) return { error: "No household found with that code." };

  await db.householdMember.upsert({
    where: { householdId_userId: { householdId: household.id, userId: user.id } },
    create: { householdId: household.id, userId: user.id, role: "MEMBER" },
    update: {},
  });
  await setActive(household.id);
  redirect("/");
}

export async function switchHousehold(householdId: string) {
  const user = await requireUser();
  if (!(await getMembership(user.id, householdId))) return;
  await setActive(householdId);
  revalidatePath("/", "layout");
}

export async function renameHousehold(
  householdId: string,
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOwner(householdId);
  const name = householdNameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };
  await db.household.update({ where: { id: householdId }, data: { name: name.data } });
  revalidatePath("/", "layout");
}

export async function setShoppingDay(householdId: string, day: string) {
  await requireOwner(householdId);
  const parsed = ShoppingDay[day as keyof typeof ShoppingDay];
  if (!parsed) return;
  await db.household.update({
    where: { id: householdId },
    data: { shoppingDay: parsed },
  });
  revalidatePath("/settings");
}

export async function removeMember(householdId: string, userId: string) {
  const owner = await requireOwner(householdId);
  if (userId === owner.id) return; // owners leave via leaveHousehold
  await db.householdMember.delete({
    where: { householdId_userId: { householdId, userId } },
  });
  revalidatePath("/settings");
}

export async function leaveHousehold(householdId: string) {
  const user = await requireUser();
  const membership = await getMembership(user.id, householdId);
  if (!membership) return;

  const others = await db.householdMember.findMany({
    where: { householdId, userId: { not: user.id } },
    orderBy: { joinedAt: "asc" },
  });

  if (others.length === 0) {
    await db.household.delete({ where: { id: householdId } }); // last member out
  } else {
    if (membership.role === "OWNER") {
      // Hand ownership to the longest-standing member.
      await db.householdMember.update({
        where: { id: others[0].id },
        data: { role: "OWNER" },
      });
    }
    await db.householdMember.delete({ where: { id: membership.id } });
  }

  (await cookies()).delete(ACTIVE_HOUSEHOLD_COOKIE);
  redirect("/");
}
