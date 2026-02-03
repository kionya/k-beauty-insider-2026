import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_requireAdmin';
import { supabaseAdmin } from '../_supabase';

export async function GET(req: NextRequest) {
  // admin 인증/인가
  await requireAdmin(req);

  const { data, error } = await supabaseAdmin
    .from('clinics')
    .select('id,name,category,district,location,rating,reviews,hero_image_url,price_from_usd,is_featured,is_freepass,sort_rank')
    .order('sort_rank', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  await requireAdmin(req);

  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!items.length) {
    return NextResponse.json({ error: 'No items' }, { status: 400 });
  }

  const payload = items
    .map((x: any) => ({
      name: String(x.name ?? '').trim(),
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

  const { data, error } = await supabaseAdmin.from('clinics').insert(payload).select('*');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
