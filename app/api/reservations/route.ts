import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const customer_name = String(body?.customer_name ?? '').trim();
    const contact_info = String(body?.contact_info ?? '').trim();
    const messenger_type = String(body?.messenger_type ?? '').trim();
    const procedure_name = String(body?.procedure_name ?? '').trim();

    if (!customer_name || !contact_info || !messenger_type || !procedure_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: 'Server env missing (check SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 500 }
      );
    }

    // ✅ (선택) 로그인한 유저라면 bearer 토큰으로 user_id 확인
    let user_id: string | null = null;
    const authHeader = req.headers.get('authorization') ?? '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      const supabaseAnon = createClient(supabaseUrl, anonKey);
      const { data, error } = await supabaseAnon.auth.getUser(token);
      if (!error) user_id = data.user?.id ?? null;
    }

    // ✅ insert는 service role로 수행 (RLS 영향 없음)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { error: insertError } = await supabaseAdmin.from('reservations').insert({
      user_id,
      customer_name,
      contact_info,
      messenger_type,
      procedure_name,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
