import { json, requireAdmin, handleRouteError, supabaseAdmin, HttpError } from "../../_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const id = params.id;

    const { data, error } = await supabaseAdmin
      .from("procedures")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const id = params.id;

    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("procedures")
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const id = params.id;

    const { error } = await supabaseAdmin.from("procedures").delete().eq("id", id);
    if (error) throw error;

    return json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
