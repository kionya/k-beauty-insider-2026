import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const envRate = Number(process.env.EXCHANGE_RATE_KRW_PER_USD ?? 1400);
  const rate = Number.isFinite(envRate) && envRate > 0 ? envRate : 1400;

  return NextResponse.json({ rate }, { status: 200 });
}
