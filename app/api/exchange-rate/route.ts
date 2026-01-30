import { NextRequest } from "next/server";
import { json, handleRouteError, supabaseAdmin } from "../admin/_supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 우선순위:
 * 1) ENV: EXCHANGE_RATE_USD_KRW
 * 2) settings 테이블: key = 'exchange_rate_usd_krw'
 */
export async function GET(req: NextRequest) {
  try {
    const envRate = process.env.EXCHANGE_RATE_USD_KRW;
    if (envRate) {
      const rate = Number(envRate);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("Invalid EXCHANGE_RATE_USD_KRW");
      return json({ rate, source: "env" });
    }

    // settings: { key: text, value: text } 가정
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "exchange_rate_usd_krw")
      .single();

    if (error) throw error;

    const rate = Number(data?.value);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("Invalid settings.exchange_rate_usd_krw");

    return json({ rate, source: "db" });
  } catch (e) {
    return handleRouteError(e);
  }
}
