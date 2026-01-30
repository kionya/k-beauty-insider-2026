// app/api/admin/_supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Role = "admin" | "staff" | "user" | string;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
if (!SUPABASE_ANON_KEY) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

// 서버 전용(절대 클라이언트로 노출 금지): service role
export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

// 요청의 Bearer token으로 유저 컨텍스트 클라이언트 생성(검증용)
export function supabaseUser(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function getBearerToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!auth) throw new HttpError(401, "Missing Bearer token");
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m?.[1]) throw new HttpError(401, "Invalid Authorization header");
  return m[1].trim();
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, init?: number | ResponseInit) {
  if (typeof init === "number") return NextResponse.json(data, { status: init });
  return NextResponse.json(data, init);
}

/**
 * admin gate
 * - Bearer token 파싱
 * - token으로 유저 확인 (supabase auth)
 * - profiles.role이 admin인지 확인 (service-role로 조회)
 */
export async function requireAdmin(req: Request): Promise<{ userId: string; role: Role }> {
  const token = getBearerToken(req);

  const sbUser = supabaseUser(token);
  const { data: userData, error: userErr } = await sbUser.auth.getUser();
  if (userErr || !userData?.user) throw new HttpError(401, "Invalid session");
  const userId = userData.user.id;

  // profiles 테이블은 RLS 때문에 깨질 수 있으므로 service-role로 조회
  const { data: profile, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profErr) throw new HttpError(403, "Forbidden (profile not found)");
  if (!profile?.role) throw new HttpError(403, "Forbidden (no role)");
  if (profile.role !== "admin") throw new HttpError(403, "Forbidden (admin only)");

  return { userId, role: profile.role };
}

/**
 * 공통 에러 핸들러(각 route.ts에서 try/catch로 사용)
 */
export function handleRouteError(e: unknown) {
  if (e instanceof HttpError) return json({ error: e.message }, e.status);
  const msg = e instanceof Error ? e.message : "Unknown error";
  return json({ error: msg }, 500);
}
