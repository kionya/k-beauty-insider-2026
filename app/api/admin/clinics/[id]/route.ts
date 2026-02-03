import { supabaseAdmin, json, requireAdmin, handleRouteError } from "../../_supabase";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);

    const id = Number(params.id);
    if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);

    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") return json({ error: "Invalid body" }, 400);

    const { data, error } = await supabaseAdmin
      .from("clinics")
      .update(body)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);

    const id = Number(params.id);
    if (!Number.isFinite(id)) return json({ error: "Invalid id" }, 400);

    const { error } = await supabaseAdmin.from("clinics").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
