// app/auth/error/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickFirst(v: string | string[] | undefined) {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function AuthErrorPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const reason = pickFirst(sp.reason) ?? "unknown_error";

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        로그인 처리 중 문제가 발생했습니다
      </h1>

      <p style={{ marginBottom: 16, opacity: 0.9 }}>
        다시 시도해 주세요. 문제가 지속되면 관리자에게 문의해 주세요.
      </p>

      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          background: "rgba(0,0,0,0.03)",
          wordBreak: "break-word",
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>reason</div>
        <code style={{ fontSize: 13 }}>{reason}</code>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/login"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "black",
            color: "white",
            textDecoration: "none",
          }}
        >
          로그인 페이지로
        </Link>

        <Link
          href="/"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.2)",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
