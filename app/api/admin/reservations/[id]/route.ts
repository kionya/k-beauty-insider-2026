import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '../../_supabase';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status });

  const { error } = await gate.supabase
    .from('reservations')
    .delete()
    .eq('id', Number(params.id));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
