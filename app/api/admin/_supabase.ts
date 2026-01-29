import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

export async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: 'Missing Authorization token' }, { status: 401 }),
    };
  }

  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(token);
  const user = userData?.user;

  if (userErr || !user) {
    return {
      ok: false as const,
      res: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
    };
  }

  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profErr || profile?.role !== 'admin') {
    return {
      ok: false as const,
      res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}
export const __DEBUG_REQUIRE_ADMIN_EXISTS__ = true;