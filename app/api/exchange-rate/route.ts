import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const envRate = Number(process.env.EXCHANGE_RATE_KRW_PER_USD ?? 1400);
  const fallback = Number.isFinite(envRate) && envRate > 0 ? envRate : 1400;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ rate: fallback }, { status: 200 });
  }

  try {
    const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data, error } = await sb
      .from('settings')
      .select('value')
      .eq('key', 'EXCHANGE_RATE_KRW_PER_USD')
      .single();

    if (error || !data?.value) {
      return NextResponse.json({ rate: fallback }, { status: 200 });
    }

    const dbRate = Number(data.value);
    const rate = Number.isFinite(dbRate) && dbRate > 0 ? dbRate : fallback;

    return NextResponse.json({ rate }, { status: 200 });
  } catch {
    return NextResponse.json({ rate: fallback }, { status: 200 });
  }
}
