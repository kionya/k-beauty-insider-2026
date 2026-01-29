// app/api/admin/reservations/[id]/status/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, supabaseAdmin } from '../../../_supabase';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params;
  const rid = Number(id);
  if (!Number.isFinite(rid)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const status = String(body?.status ?? '');

  const allowed = new Set(['Pending', 'Confirmed', 'Completed', 'Cancelled']);
  if (!allowed.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update({ status })
    .eq('id', rid)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
