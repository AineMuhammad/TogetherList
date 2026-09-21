import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMembership } from "@/lib/household";
import { getGroceryItems } from "@/lib/grocery";

export const dynamic = "force-dynamic";

// Polled every few seconds by the client (SWR) to keep all devices in sync.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ householdId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { householdId } = await params;
  if (!(await getMembership(session.user.id, householdId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await getGroceryItems(householdId);
  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
}
