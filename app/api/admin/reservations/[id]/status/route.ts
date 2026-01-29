import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '../../../_supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const status = String(body?.status ?? '');

  const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }

  const { error } = await gate.supabase
    .from('reservations')
    .update({ status })
    .eq('id', Number(params.id));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
