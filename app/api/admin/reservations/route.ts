import { NextRequest } from "next/server";
import { json, requireAdmin, handleRouteError, supabaseAdmin } from "../_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;
    const safeOffset = Number.isFinite(offset) ? Math.max(offset, 0) : 0;

    const { data, error } = await supabaseAdmin
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1);

    if (error) throw error;
    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
