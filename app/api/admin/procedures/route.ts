import { NextRequest } from "next/server";
import { json, requireAdmin, handleRouteError, supabaseAdmin } from "../_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { data, error } = await supabaseAdmin
      .from("procedures")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("procedures")
      .insert(body)
      .select("*")
      .single();

    if (error) throw error;
    return json({ data }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
