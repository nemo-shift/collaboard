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
  title: "CollaBoard - 아이디어를 실시간으로 공유하는 화이트보드",
  description: "아이디어를 실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
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
