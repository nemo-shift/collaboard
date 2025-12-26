'use client';

import { useTheme } from '@shared/lib';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  className?: string;
}

/**
 * 통계 카드 컴포넌트
 * 대시보드의 통계 정보를 표시하는 재사용 가능한 카드
 */
export const StatCard = ({ icon, value, label, className = '' }: StatCardProps) => {
  const { classes } = useTheme();

  return (
    <div
      className={`${classes.bg} rounded-2xl ${classes.border} shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-lg ${classes.bgSecondary} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className={`text-3xl font-bold ${classes.text} mb-1`}>{value}</div>
      <div className={`text-sm ${classes.textSecondary}`}>{label}</div>
    </div>
  );
};

