import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://k-beauty-insider-2026.vercel.app'; // 본인 배포 주소로 수정!

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // 나중에 상세 페이지가 생기면 여기에 자동으로 추가하는 코드를 짤 수 있습니다.
  ];
}