// app/api/exchange-rate/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../admin/_supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'exchange_rate')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rate = Number(data?.value);
  return NextResponse.json({ rate: Number.isFinite(rate) && rate > 0 ? rate : 1400 });
}
