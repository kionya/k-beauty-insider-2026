'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const run = async () => {
      // Supabase email confirmation / OAuth callback 에서 code가 내려옵니다.
      const code = searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace('/?auth=error');
          return;
        }
      }

      // 성공/실패와 관계없이 홈으로 이동 (원하면 /admin 등으로 변경 가능)
      router.replace('/?auth=success');
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Redirecting...
    </main>
  );
}
