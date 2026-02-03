import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_requireAdmin';
import { supabaseAdmin } from '../../_supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin(req);

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));

  const { data, error } = await supabaseAdmin
    .from('clinics')
    .update(body)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAdmin(req);

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { error } = await supabaseAdmin.from('clinics').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
