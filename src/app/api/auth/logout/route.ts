import { clearSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  await clearSession();
  return Response.json({ success: true });
}
