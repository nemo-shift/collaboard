'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBoards } from '@features/board/api';
import { useRealtimeSubscription } from '@shared/lib';
import type { Board } from '@entities/board';
import { useAuth } from '@features/auth';

interface UseBoardListReturn {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useBoardList = (): UseBoardListReturn => {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    if (!user) {
      setBoards([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedBoards = await getBoards(user.id);
      setBoards(fetchedBoards);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '보드 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Failed to fetch boards:', err);
      setBoards([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // 리얼타임 업데이트: user_board_preferences 변경 감지
  useRealtimeSubscription(
    {
      channelName: `user:${user?.id}:board-preferences`,
      table: 'user_board_preferences',
      filter: user ? `user_id=eq.${user.id}` : undefined,
      events: ['*'],
      enabled: !!user,
    },
    {
      onInsert: () => {
        // 참여 정보 변경 시 보드 목록 새로고침
        fetchBoards();
      },
      onUpdate: () => {
        // 참여 정보 변경 시 보드 목록 새로고침
        fetchBoards();
      },
      onDelete: () => {
        // 참여 정보 변경 시 보드 목록 새로고침
        fetchBoards();
      },
    }
  );

  return {
    boards,
    isLoading,
    error,
    refresh: fetchBoards,
  };
};


