import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const customer_name = String(body?.customer_name ?? '').trim();
    const contact_info = String(body?.contact_info ?? '').trim();
    const messenger_type = String(body?.messenger_type ?? '').trim();
    const procedure_name = String(body?.procedure_name ?? '').trim();
    const user_id = body?.user_id ? String(body.user_id) : null;

    if (!customer_name || !contact_info || !messenger_type || !procedure_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization') ?? '';

    // anon client + (optional) bearer forwarded to apply RLS with user context
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const { error } = await supabase.from('reservations').insert({
      user_id,
      customer_name,
      contact_info,
      messenger_type,
      procedure_name,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
