// app/api/admin/procedures/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, supabaseAdmin } from '../_supabase';

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  const { data, error } = await supabaseAdmin
    .from('procedures')
    .select('*')
    .order('rank', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body?.items) ? body.items : null;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'items[] required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('procedures').insert(items);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
