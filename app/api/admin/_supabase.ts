// app/api/admin/_supabase.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type AdminGateOk = { ok: true; user: User; userId: string; token: string };
type AdminGateFail = { ok: false; res: NextResponse };
export type AdminGate = AdminGateOk | AdminGateFail;

export async function requireAdmin(req: NextRequest): Promise<AdminGate> {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);

  if (!m) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'Missing Bearer token' }, { status: 401 }),
    };
  }

  const token = m[1];

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;

  if (error || !user) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
    };
  }

  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr || profile?.role !== 'admin') {
    return {
      ok: false,
      res: NextResponse.json({ error: 'Forbidden (admin only)' }, { status: 403 }),
    };
  }

  return { ok: true, user, userId: user.id, token };
}
