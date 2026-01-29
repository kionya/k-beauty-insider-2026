// app/api/admin/stamps/issue/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, supabaseAdmin } from '../../_supabase';

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  const body = await req.json().catch(() => ({}));
  const reservation_id = Number(body?.reservation_id);

  if (!Number.isFinite(reservation_id)) {
    return NextResponse.json({ error: 'Invalid reservation_id' }, { status: 400 });
  }

  // 예약 상태/유저 체크
  const { data: resv, error: resvErr } = await supabaseAdmin
    .from('reservations')
    .select('id,user_id,status')
    .eq('id', reservation_id)
    .maybeSingle();

  if (resvErr) return NextResponse.json({ error: resvErr.message }, { status: 500 });
  if (!resv) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  if (!resv.user_id) return NextResponse.json({ error: 'Guest reservation: no user_id' }, { status: 400 });
  if (resv.status !== 'Completed') return NextResponse.json({ error: 'Only Completed can issue stamp' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('stamps')
    .insert({
      user_id: resv.user_id,
      reservation_id: resv.id,
      issued_by: gate.userId,
    })
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
