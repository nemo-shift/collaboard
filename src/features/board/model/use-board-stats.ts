'use client';

import { useMemo } from 'react';
import type { Board } from '@entities/board';

interface UseBoardStatsProps {
  boards: Board[];
}

interface UseBoardStatsReturn {
  totalBoards: number;
  totalElements: number;
  recentActivity: Board | null;
  todayBoards: number;
}

export const useBoardStats = ({ boards }: UseBoardStatsProps): UseBoardStatsReturn => {
  const stats = useMemo(() => {
    const totalBoards = boards.length;
    const totalElements = boards.reduce((sum, board) => sum + (board.elementCount || 0), 0);
    const recentActivity = [...boards].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0] || null;
    const todayBoards = boards.filter((board) => {
      const boardDate = new Date(board.createdAt);
      const today = new Date();
      return (
        boardDate.getDate() === today.getDate() &&
        boardDate.getMonth() === today.getMonth() &&
        boardDate.getFullYear() === today.getFullYear()
      );
    }).length;

    return {
      totalBoards,
      totalElements,
      recentActivity,
      todayBoards,
    };
  }, [boards]);

  return stats;
};

