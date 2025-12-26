'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      // 초기 resolvedTheme 계산
      const initialTheme: Theme = 'system';
      const initialResolvedTheme = getResolvedTheme(initialTheme);

      return {
        theme: initialTheme,
        resolvedTheme: initialResolvedTheme,
        setTheme: (theme: Theme) => {
          const resolvedTheme = getResolvedTheme(theme);
          set({ theme, resolvedTheme });
          
          // DOM에 클래스 적용 (즉시 실행)
          if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            // 기존 클래스 제거
            root.classList.remove('light', 'dark');
            // 새 클래스 추가
            root.classList.add(resolvedTheme);
            // 강제로 리플로우 트리거 (브라우저 캐시 방지)
            void root.offsetHeight;
          }
        },
        toggleTheme: () => {
          const current = get().resolvedTheme;
          const newTheme: Theme = current === 'dark' ? 'light' : 'dark';
          get().setTheme(newTheme);
        },
      };
    },
    {
      name: 'vibe-board-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }), // resolvedTheme은 저장하지 않음 (계산값)
      onRehydrateStorage: () => (state) => {
        // 저장된 상태 복원 후 DOM에 적용
        if (state) {
          const resolvedTheme = getResolvedTheme(state.theme);
          if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(resolvedTheme);
          }
          state.resolvedTheme = resolvedTheme;
        }
      },
    }
  )
);

// 시스템 테마 변경 감지는 ThemeProvider에서 처리

