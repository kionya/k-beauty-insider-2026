// app/api/admin/stamps/[id]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, supabaseAdmin } from '../../_supabase';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  const { id } = await ctx.params; // stamp uuid
  const { error } = await supabaseAdmin.from('stamps').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
