import { json, requireAdmin, handleRouteError, supabaseAdmin } from "../_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    const { data, error } = await supabaseAdmin
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + Math.max(1, limit) - 1);

    if (error) throw error;
    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
