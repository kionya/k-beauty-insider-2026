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

  const body = await req.json().catch(() => null);
  const items = Array.isArray(body) ? body : body?.items;

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: 'Invalid body. Expect array or {items:[]}' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.from('procedures').insert(items).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
