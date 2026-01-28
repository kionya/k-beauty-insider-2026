import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'K-Beauty Price Insider | Compare & Earn Rewards',
  description: 'K-Beauty Price Comparison & Loyalty Program. Compare Gangnam clinic prices and earn free procedures.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Fonts: Noto Sans KR, Inter, Playfair Display */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Noto+Sans+KR:wght@300;400;500;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        
        {/* Font Awesome Icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}