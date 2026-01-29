// app/api/admin/reservations/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin, supabaseAdmin } from '../_supabase';

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.res;

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
