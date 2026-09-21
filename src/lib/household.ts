import { randomInt } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ACTIVE_HOUSEHOLD_COOKIE } from "@/lib/constants";

// No 0/O/1/I/L to avoid confusion when reading a code aloud.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length = 6) {
  return Array.from(
    { length },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join("");
}

export async function createUniqueJoinCode() {
  for (let i = 0; i < 10; i++) {
    const code = generateJoinCode();
    const clash = await db.household.findUnique({ where: { joinCode: code } });
    if (!clash) return code;
  }
  throw new Error("Could not generate a unique join code");
}

export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return session.user;
});

export const getMemberships = cache(async (userId: string) =>
  db.householdMember.findMany({
    where: { userId },
    include: { household: true },
    orderBy: { joinedAt: "asc" },
  }),
);

/** The household the user is currently working in, or null if they have none. */
export const getActiveMembership = cache(async () => {
  const user = await requireUser();
  const memberships = await getMemberships(user.id);
  if (memberships.length === 0) return { user, memberships, active: null };
  const wanted = (await cookies()).get(ACTIVE_HOUSEHOLD_COOKIE)?.value;
  const active = memberships.find((m) => m.householdId === wanted) ?? memberships[0];
  return { user, memberships, active };
});

/** For pages that need a household; sends users without one to onboarding. */
export async function requireActiveMembership() {
  const ctx = await getActiveMembership();
  if (!ctx.active) redirect("/onboarding");
  return { ...ctx, active: ctx.active };
}

export async function getMembership(userId: string, householdId: string) {
  return db.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
}
