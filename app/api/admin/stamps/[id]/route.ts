import { NextRequest } from "next/server";
import { json, requireAdmin, handleRouteError, supabaseAdmin } from "../../_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("stamps")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("stamps")
      .update(body)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const { error } = await supabaseAdmin.from("stamps").delete().eq("id", id);
    if (error) throw error;

    return json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
