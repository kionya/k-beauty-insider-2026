// app/api/admin/_supabase.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ✅ Service role (RLS 우회용) — 서버에서만 사용
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ✅ Admin gate: Authorization Bearer 토큰 기반
export async function requireAdmin(req: NextRequest): Promise<
  | { ok: true; userId: string }
  | { ok: false; res: NextResponse<{ error: string }> }
> {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      return { ok: false, res: NextResponse.json({ error: 'Missing Authorization token' }, { status: 401 }) };
    }

    // ✅ 토큰 검증은 anon client로
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userRes?.user?.id) {
      return { ok: false, res: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
    }

    const uid = userRes.user.id;

    // ✅ role 확인은 service role로 (RLS 영향 없이 확인)
    const { data: prof, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', uid)
      .single();

    if (profErr) {
      return { ok: false, res: NextResponse.json({ error: profErr.message }, { status: 500 }) };
    }

    if (prof?.role !== 'admin') {
      return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }

    return { ok: true, userId: uid };
  } catch (e: any) {
    return { ok: false, res: NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 }) };
  }
}
