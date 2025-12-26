'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@shared/lib';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // 초기 마운트 시 테마 강제 적용
  useEffect(() => {
    setMounted(true);
    
    // localStorage에서 직접 읽어서 즉시 적용
    try {
      const stored = localStorage.getItem('vibe-board-theme');
      if (stored) {
        const parsed = JSON.parse(stored);
        const savedTheme = parsed.state?.theme || 'system';
        let resolved: 'light' | 'dark';
        
        if (savedTheme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          resolved = savedTheme;
        }
        
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);
        
        // 스토어 상태도 동기화
        const store = useThemeStore.getState();
        if (store.resolvedTheme !== resolved) {
          store.setTheme(savedTheme);
        }
      } else {
        // 저장된 값이 없으면 시스템 테마 사용
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
      }
    } catch (e) {
      // 에러 발생 시 기본값 사용
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add('light');
    }
  }, []);

  // resolvedTheme 변경 시 DOM 업데이트
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    const currentClass = root.classList.contains('dark') ? 'dark' : 'light';
    
    if (currentClass !== resolvedTheme) {
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
    }
  }, [resolvedTheme, mounted]);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const store = useThemeStore.getState();
      if (store.theme === 'system') {
        // setTheme을 호출하여 resolvedTheme 업데이트
        setTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, setTheme, mounted]);

  // 마운트 전에는 빈 내용 반환 (hydration mismatch 방지)
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

