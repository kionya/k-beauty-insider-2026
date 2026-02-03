import { supabaseAdmin, json, requireAdmin, handleRouteError } from "../_supabase";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const { data, error } = await supabaseAdmin
      .from("clinics")
      .select(
        "id,name,category,district,location,rating,reviews,hero_image_url,price_from_usd,is_featured,is_freepass,sort_rank,created_at"
      )
      .order("sort_rank", { ascending: true });

    if (error) return json({ error: error.message }, 500);
    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);

    const body = await req.json().catch(() => ({}));
    const itemsRaw = Array.isArray(body?.items) ? body.items : body ? [body] : [];

    if (!itemsRaw.length) return json({ error: "No items" }, 400);

    const payload = itemsRaw
      .map((x: any) => ({
        name: String(x.name ?? "").trim(),
        category: x.category ?? null,
        district: x.district ?? null,
        location: x.location ?? null,
        rating: x.rating ?? null,
        reviews: x.reviews ?? null,
        hero_image_url: x.hero_image_url ?? null,
        price_from_usd: x.price_from_usd ?? null, // ✅ 핵심
        is_featured: !!x.is_featured,
        is_freepass: !!x.is_freepass,
        sort_rank: Number.isFinite(Number(x.sort_rank)) ? Number(x.sort_rank) : 999,
      }))
      .filter((x: any) => x.name);

    if (!payload.length) return json({ error: "No valid items" }, 400);

    const { data, error } = await supabaseAdmin.from("clinics").insert(payload).select("*");
    if (error) return json({ error: error.message }, 500);

    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
