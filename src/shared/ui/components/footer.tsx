'use client';

import { useTheme } from '@shared/lib';

export const Footer = () => {
  const { classes } = useTheme();

  return (
    <footer className={`border-t ${classes.border}`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className={`text-sm ${classes.textSecondary}`}>© 2024 Vibe Board. All rights reserved.</p>
          <div className={`flex gap-6 text-sm ${classes.textSecondary}`}>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              이용약관
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

