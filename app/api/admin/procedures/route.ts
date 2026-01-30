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

    // Excel 업로드는 { items: [...] } 형태로 들어오는 케이스가 많음
    const items = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : null;

    if (items) {
      const { data, error } = await supabaseAdmin
        .from("procedures")
        .insert(items)
        .select("id");

      if (error) throw error;
      return json({ ok: true, inserted: data?.length ?? 0 }, 201);
    }

    // 단건 생성
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

