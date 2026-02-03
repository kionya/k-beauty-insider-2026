import { supabaseAdmin, json, handleRouteError } from "../admin/_supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const featured = searchParams.get("featured") === "1";
    const freepass = searchParams.get("freepass") === "1";

    let q = supabaseAdmin
      .from("clinics")
      .select(
        "id,name,category,district,location,rating,reviews,hero_image_url,price_from_usd,is_featured,is_freepass,sort_rank"
      )
      .order("sort_rank", { ascending: true });

    if (featured) q = q.eq("is_featured", true);
    if (freepass) q = q.eq("is_freepass", true);

    const { data, error } = await q;
    if (error) return json({ error: error.message }, 500);

    return json({ data });
  } catch (e) {
    return handleRouteError(e);
  }
}
