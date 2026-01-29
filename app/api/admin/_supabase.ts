// app/api/admin/_supabase.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env vars (URL / ANON / SERVICE_ROLE).');
}

// 1) 토큰 검증용(anon)
export const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// 2) DB 쓰기/관리용(service role)
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export type AdminGateOk = { ok: true; userId: string };
export type AdminGateFail = { ok: false; res: NextResponse };

export async function requireAdmin(req: NextRequest): Promise<AdminGateOk | AdminGateFail> {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return { ok: false, res: NextResponse.json({ error: 'Missing Bearer token' }, { status: 401 }) };
  }

  const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);
  const user = userRes?.user;

  if (userErr || !user) {
    return { ok: false, res: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }

  // profiles.role 확인 (service role로 조회)
  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profErr || profile?.role !== 'admin') {
    return { ok: false, res: NextResponse.json({ error: 'Forbidden (admin only)' }, { status: 403 }) };
  }

  return { ok: true, userId: user.id };
}
