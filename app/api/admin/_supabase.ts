import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Role = "admin" | "staff" | "user" | string;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
if (!SUPABASE_ANON_KEY) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// 서버 전용(절대 클라이언트로 노출 금지): service role client
export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

// Bearer token 기반 유저 컨텍스트 클라이언트(유저 검증용)
export function supabaseUser(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
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

export function json(data: unknown, init?: number | ResponseInit) {
  if (typeof init === "number") return NextResponse.json(data, { status: init });
  return NextResponse.json(data, init);
}

export async function requireAdmin(req: Request): Promise<{ userId: string; role: Role }> {
  const token = getBearerToken(req);

  // 1) token으로 유저 확인
  const sbUser = supabaseUser(token);
  const { data: userData, error: userErr } = await sbUser.auth.getUser();
  if (userErr || !userData?.user) throw new HttpError(401, "Invalid session");
  const userId = userData.user.id;

  // 2) profiles.role 확인(service-role로 조회)
  // - 스키마 차이 대응: id 또는 user_id
  // - 컬럼 차이 대응: role(text) 또는 is_admin(boolean)
  const { data: profile, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("role, is_admin")
    .or(`id.eq.${userId},user_id.eq.${userId}`)
    .maybeSingle();

  if (profErr) throw new HttpError(403, "Forbidden (profile lookup failed)");
  if (!profile) throw new HttpError(403, "Forbidden (profile not found)");

  const role = (profile as any).role as Role | undefined;
  const isAdminFlag = Boolean((profile as any).is_admin);

  const isAdmin = role === "admin" || isAdminFlag === true;
  if (!isAdmin) throw new HttpError(403, "Forbidden (admin only)");

  return { userId, role: role ?? (isAdminFlag ? "admin" : "user") };
}

export function handleRouteError(e: unknown) {
  if (e instanceof HttpError) return json({ error: e.message }, e.status);

  // Supabase error 등 Error 타입
  if (e instanceof Error) return json({ error: e.message }, 500);

  return json({ error: "Unknown error" }, 500);
}
