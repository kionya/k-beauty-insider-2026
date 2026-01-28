import './globals.css';
import type { Metadata } from 'next';

// 1. SEO & Open Graph 설정 (마케팅 문구 적용)
export const metadata: Metadata = {
  // 브라우저 탭 이름
  title: 'K-Beauty Insider | 강남 시술 가격비교 & 리워드',
  description: '외국인도 모르는 강남 현지 가격. 호갱 탈출하고 최대 50만원 혜택 받으세요.',
  
  // 카카오톡/페이스북 공유 설정 (Open Graph)
  openGraph: {
    title: 'K-Beauty Insider | 강남 시술 가격비교 & 리워드',
    description: '외국인도 모르는 강남 현지 가격 정보. 투명한 정가제 확인하고 무료 시술권 받으세요.',
    url: 'https://k-beauty-insider-2026.vercel.app', // (본인 배포 주소로 자동 연결됨)
    siteName: 'K-Beauty Insider',
    images: [
      {
        url: '/og-image.png', // public 폴더에 넣은 이미지 파일명
        width: 1200,
        height: 630,
        alt: 'K-Beauty Price Comparison Dashboard',
      },
    ],
    locale: 'en_US', // 타겟에 따라 'ko_KR'로 변경 가능
    type: 'website',
  },

  // 트위터 카드 설정
  twitter: {
    card: 'summary_large_image',
    title: 'K-Beauty Insider | Price Comparison',
    description: 'Real prices from Gangnam clinics.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'XO6iCCPRtNaESiPjpDjLSC6nTkVojbv9DvblIu0sGJ8>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+KR:wght@300;400;500;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        
        {/* Icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}