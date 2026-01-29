import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '../../_supabase';

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const reservation_id = Number(body?.reservation_id);

  if (!Number.isFinite(reservation_id)) {
    return NextResponse.json({ error: 'reservation_id required' }, { status: 400 });
  }

  // 예약 조회해서 guest 여부 확인(UX용) — 최종 강제는 DB 트리거가 함
  const { data: resv, error: resErr } = await gate.supabase
    .from('reservations')
    .select('id, user_id, status')
    .eq('id', reservation_id)
    .single();

  if (resErr || !resv) return NextResponse.json({ error: 'reservation not found' }, { status: 404 });
  if (!resv.user_id) return NextResponse.json({ error: 'guest reservation (no user_id)' }, { status: 400 });

  // ✅ user_id는 안 보내도 됨(트리거가 reservation.user_id로 맞춤)
  const { data, error } = await gate.supabase
    .from('stamps')
    .insert({ reservation_id, issued_by: gate.user.id })
    .select()
    .single();

  // 여기서 Completed 아니면 DB 트리거가 에러를 던짐
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}
