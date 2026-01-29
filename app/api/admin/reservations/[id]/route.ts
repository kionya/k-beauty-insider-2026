import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, supabaseAdmin } from '../../_supabase';

type Ctx = { params: { id: string } };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  // URL param은 항상 string으로 들어옵니다.
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('reservations').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// (선택) 상세 조회가 필요하면 GET도 동일 규격으로 추가 가능
export async function GET(req: NextRequest, { params }: Ctx) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
