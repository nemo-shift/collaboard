'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Board } from '@entities/board';
import { formatDate, useTheme } from '@shared/lib';
import { StatCard } from '@shared/ui';

interface BoardStatsProps {
  totalBoards: number;
  totalElements: number;
  recentActivity: Board | null;
  todayBoards: number;
}

type StatItem = 
  | {
      id: string;
      icon: React.ReactNode;
      value: number;
      label: string;
    }
  | {
      id: string;
      icon: React.ReactNode;
      getValue: (isSelected: boolean) => React.ReactNode;
      label: string;
    };

// 아이콘 컴포넌트들을 메모이제이션하여 재사용
const BoardIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ElementIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const LightningIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export const BoardStats = ({
  totalBoards,
  totalElements,
  recentActivity,
  todayBoards,
}: BoardStatsProps) => {
  const [selectedStats, setSelectedStats] = useState<Set<string>>(new Set());
  const { classes } = useTheme();

  const toggleStat = useCallback((id: string) => {
    setSelectedStats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // 최근 활동 value 생성 함수 (PC용)
  const getRecentActivityValue = useMemo(() => {
    if (!recentActivity) {
      return <span className="text-[var(--color-text-muted)]">활동 없음</span>;
    }
    return (
      <>
        <div className="text-lg font-semibold text-[var(--color-text-strong)] mb-1 line-clamp-1">
          {recentActivity.name}
        </div>
        <div className="text-[var(--color-text-muted)] text-xs">
          {formatDate(recentActivity.updatedAt)}
        </div>
      </>
    );
  }, [recentActivity]);

  // 모바일용 stats 배열 메모이제이션
  const stats = useMemo<StatItem[]>(() => [
    {
      id: 'totalBoards' as const,
      icon: <BoardIcon />,
      value: totalBoards,
      label: '총 보드',
    },
    {
      id: 'totalElements' as const,
      icon: <ElementIcon />,
      value: totalElements,
      label: '총 요소',
    },
    {
      id: 'todayBoards' as const,
      icon: <PlusIcon />,
      value: todayBoards,
      label: '오늘 생성',
    },
    {
      id: 'recentActivity' as const,
      icon: <LightningIcon />,
      getValue: (isSelected: boolean) => {
        if (!recentActivity) {
          return <span className={isSelected ? 'text-white dark:text-[#1a1a1a]' : 'text-[var(--color-text-muted)]'}>활동 없음</span>;
        }
        return (
          <>
            <div className={`text-sm font-semibold mb-0.5 line-clamp-1 ${isSelected ? 'text-white dark:text-[#1a1a1a]' : 'text-[var(--color-text-strong)]'}`}>
              {recentActivity.name}
            </div>
            <div className={`text-xs ${isSelected ? 'text-white/90 dark:text-[#1a1a1a]/90' : 'text-[var(--color-text-muted)]'}`}>
              {formatDate(recentActivity.updatedAt)}
            </div>
          </>
        );
      },
      label: '최근 활동',
    },
  ], [totalBoards, totalElements, todayBoards, recentActivity]);

  return (
    <>
      {/* PC 버전: 기존 StatCard 사용 */}
      <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-10">
        <StatCard
          icon={<BoardIcon />}
          value={totalBoards}
          label="총 보드"
        />
        <StatCard
          icon={<ElementIcon />}
          value={totalElements}
          label="총 요소"
        />
        <StatCard
          icon={<PlusIcon />}
          value={todayBoards}
          label="오늘 생성"
        />
        <StatCard
          icon={<LightningIcon />}
          value={getRecentActivityValue}
          label="최근 활동"
        />
      </div>

      {/* 모바일 버전: 토글 버튼 */}
      <div className="flex sm:hidden gap-2 mb-10">
        {stats.map((stat) => {
          const isSelected = selectedStats.has(stat.id);
          
          return (
            <button
              key={stat.id}
              onClick={() => toggleStat(stat.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all ${
                isSelected
                  ? `${classes.primary} text-white dark:text-[#1a1a1a] border-[var(--color-primary-action)]`
                  : `${classes.bgSurface} ${classes.border} ${classes.textBody} hover:bg-[var(--color-surface-hover)]`
              }`}
            >
              <div className={`${isSelected ? 'text-white dark:text-[#1a1a1a]' : classes.textMuted}`}>
                {stat.icon}
              </div>
              {isSelected ? (
                <div className={`text-lg font-bold ${isSelected ? 'text-white dark:text-[#1a1a1a]' : classes.text}`}>
                  {'getValue' in stat
                    ? stat.getValue(isSelected)
                    : stat.value}
                </div>
              ) : (
                <div className={`text-xs ${classes.textMuted}`}>
                  {stat.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

