import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider, ThemeProvider } from '@app/providers';
import { Header } from '@widgets/header';
import { BlobCursorWrapper } from '@app/providers/blob-cursor-wrapper';
import { ErrorBoundary } from '@shared/ui';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://go-collaboard.vercel.app'),
  title: "CollaBoard 실시간 협업보드",
  description: "아이디어를 실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드",
  keywords: ['화이트보드', '협업', '아이디어', '실시간', '온라인', 'whiteboard', 'collaboration', 'collaboard'],
  authors: [{ name: 'CollaBoard' }],
  creator: 'CollaBoard',
  publisher: 'CollaBoard',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/icons/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/icons/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/icons/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/icons/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icons/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/icons/android-icon-192x192.png',
      },
    ],
  },
  manifest: '/icons/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CollaBoard',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://go-collaboard.vercel.app',
    siteName: 'CollaBoard',
    title: "CollaBoard 실시간 협업보드",
    description: '아이디어를 실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'CollaBoard - 아이디어를 실시간으로 공유하는 화이트보드',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CollaBoard 실시간으로 협업보드',
    description: '아이디어를 실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드',
    images: ['/opengraph-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console 인증을 위해 필요시 추가
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="manifest" href="/icons/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/icons/ms-icon-144x144.png" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="theme-color" content="#ffffff" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('collaboard-theme');
                  if (theme) {
                    const parsed = JSON.parse(theme);
                    const savedTheme = parsed.state?.theme || 'system';
                    let resolvedTheme = savedTheme;
                    if (savedTheme === 'system') {
                      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(resolvedTheme);
                  } else {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(systemTheme);
                  }
                } catch (e) {
                  // 에러 발생 시 기본값 사용
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-200`}
        style={{
          backgroundColor: 'var(--color-base-bg)',
          color: 'var(--color-text-strong)',
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <BlobCursorWrapper />
              <Header />
              {children}
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
