import { NextRequest } from "next/server";
import { json, requireAdmin, handleRouteError, supabaseAdmin, HttpError } from "../../../_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * body: { status: string }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const body = await req.json();
    if (!body?.status) throw new HttpError(400, "Missing status");

    const { data, error } = await supabaseAdmin
      .from("reservations")
      .update({ status: body.status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
