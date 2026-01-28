import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*', // 모든 로봇 허용
      allow: '/',     // 모든 페이지 접근 허용
      disallow: '/admin', // 단, 관리자 페이지는 긁어가지 마! (비밀이니까)
    },
    sitemap: 'https://k-beauty-insider-2026.vercel.app/sitemap.xml', // 본인 배포 주소로 수정해주세요!
  };
}