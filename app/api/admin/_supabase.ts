// app/api/admin/_supabase.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// DB 작업은 service role로 (RLS 우회)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 요청의 Bearer 토큰으로 "로그인 유저" 확인용 클라이언트
function supabaseUserClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Missing Bearer token' }, { status: 401 });
  }

  // 1) 토큰이 유효한지(로그인 유저인지) 확인
  const userClient = supabaseUserClient(token);
  const { data: userData, error: userErr } = await userClient.auth.getUser();

  const user = userData?.user;
  if (userErr || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  // 2) profiles에서 role 확인 (service role로 조회: RLS 영향 제거)
  const { data: profile, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profErr || profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden (admin only)' }, { status: 403 });
  }

  return { user, userId: user.id, token };
}
