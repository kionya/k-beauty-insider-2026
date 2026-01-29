// app/api/admin/procedures/[id]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, supabaseAdmin } from '../../_supabase';

async function readId(ctx: any) {
  const p = ctx?.params;
  const params = p && typeof p.then === 'function' ? await p : p;
  const id = params?.id;
  return String(id ?? '');
}

export async function PATCH(req: NextRequest, ctx: any) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  const id = await readId(ctx);
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const patch = await req.json().catch(() => null);
  if (!patch || typeof patch !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('procedures')
    .update(patch)
    .eq('id', Number(id))
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, ctx: any) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  const id = await readId(ctx);
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabaseAdmin.from('procedures').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
