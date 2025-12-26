'use client';

import { useThemeStore } from './use-theme-store';

/**
 * 다크모드 테마 훅
 * 테마 상태와 공통 클래스를 제공
 */
export const useTheme = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  // 공통 배경 클래스
  const bgClass = 'bg-white dark:bg-gray-900';
  const bgSecondaryClass = 'bg-gray-50 dark:bg-gray-800';
  const bgTertiaryClass = 'bg-gray-100 dark:bg-gray-700';
  
  // 공통 텍스트 클래스
  const textClass = 'text-gray-900 dark:text-gray-100';
  const textSecondaryClass = 'text-gray-600 dark:text-gray-300';
  const textTertiaryClass = 'text-gray-500 dark:text-gray-400';
  
  // 공통 보더 클래스
  const borderClass = 'border-gray-200 dark:border-gray-700';
  const borderSecondaryClass = 'border-gray-300 dark:border-gray-600';

  return {
    theme,
    resolvedTheme,
    isDark,
    setTheme,
    toggleTheme,
    // 공통 클래스
    classes: {
      bg: bgClass,
      bgSecondary: bgSecondaryClass,
      bgTertiary: bgTertiaryClass,
      text: textClass,
      textSecondary: textSecondaryClass,
      textTertiary: textTertiaryClass,
      border: borderClass,
      borderSecondary: borderSecondaryClass,
    },
  };
};

