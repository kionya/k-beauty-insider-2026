import { NextRequest } from "next/server";
import { json, requireAdmin, handleRouteError } from "../_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin gate 디버그/확인용
 * - admin이면 { ok: true, userId, role }
 * - 아니면 401/403
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await requireAdmin(req);
    return json({ ok: true, userId, role });
  } catch (e) {
    return handleRouteError(e);
  }
}
