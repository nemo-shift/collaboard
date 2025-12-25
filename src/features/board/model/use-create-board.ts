'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createBoard } from '@features/board/api';
import { useAuth } from '@features/auth';

interface UseCreateBoardReturn {
  createNewBoard: (data: { name: string; description?: string; isPublic: boolean }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useCreateBoard = (): UseCreateBoardReturn => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewBoard = useCallback(
    async (data: { name: string; description?: string; isPublic: boolean }) => {
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const newBoard = await createBoard({
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          ownerId: user.id,
        });

        // 보드 생성 후 해당 보드 페이지로 이동
        router.push(`/board/${newBoard.id}`);
        router.refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '보드 생성에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, router]
  );

  return {
    createNewBoard,
    isLoading,
    error,
  };
};


