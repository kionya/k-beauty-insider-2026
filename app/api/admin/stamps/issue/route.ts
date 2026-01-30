import { json, requireAdmin, handleRouteError, supabaseAdmin, HttpError } from "../../_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * body 예시:
 * { reservation_id: string, ... (스탬프에 필요한 컬럼들) }
 *
 * 최종 강제는 DB 트리거가 수행:
 * - reservation.status != 'Completed' 이면 insert 실패
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    if (!body?.reservation_id) throw new HttpError(400, "Missing reservation_id");

    const { data, error } = await supabaseAdmin
      .from("stamps")
      .insert(body)
      .select("*")
      .single();

    // 트리거가 막으면 여기서 error로 떨어짐 (원하는 동작)
    if (error) throw error;

    return json({ data }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
