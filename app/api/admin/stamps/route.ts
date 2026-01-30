import { NextRequest } from "next/server";
import { json, requireAdmin, handleRouteError, supabaseAdmin } from "../_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { data, error } = await supabaseAdmin
      .from("stamps")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
