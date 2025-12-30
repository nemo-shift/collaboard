'use client';

import { useCallback } from 'react';
import { useRealtimeSubscription, fetchOwnerName } from '@shared/lib';
import { supabase } from '@shared/api';
import type { Board } from '@entities/board';
import { mapBoardRowToBoard } from '@entities/board/lib/board-mapper';

interface UseBoardRealtimeUpdatesProps {
  boardId: string;
  board: Board | null;
  setBoard: (board: Board) => void;
}

/**
 * 보드 정보 Realtime 업데이트 훅
 * 
 * 보드 이름, 설명, 공개/비공개 변경 등을 실시간으로 감지하고 업데이트합니다.
 */
export const useBoardRealtimeUpdates = ({
  boardId,
  board,
  setBoard,
}: UseBoardRealtimeUpdatesProps): void => {
  const handleRealtimeBoardUpdate = useCallback(
    async (payload: { new: unknown; old: unknown }) => {
      const updatedRow = payload.new as {
        id: string;
        name: string;
        description?: string | null;
        owner_id: string;
        created_at: string;
        updated_at: string;
        is_public: boolean;
        invite_code?: string | null;
      };

      // 현재 사용자 정보
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      // 소유자 이름 조회
      const ownerName = await fetchOwnerName(updatedRow.owner_id, currentUser?.id);

      // 사용자 선호도 조회 (기존 board에서 가져오기)
      const effectiveUserId = currentUser?.id || undefined;
      let isStarred = false;
      let isPinned = false;
      if (effectiveUserId && !effectiveUserId.startsWith('anon_')) {
        try {
          const { data: preferences } = await supabase
            .from('user_board_preferences')
            .select('is_starred, is_pinned')
            .eq('board_id', boardId)
            .eq('user_id', effectiveUserId)
            .maybeSingle();

          if (preferences) {
            isStarred = preferences.is_starred || false;
            isPinned = preferences.is_pinned || false;
          }
        } catch (err) {
          // 에러 무시 (익명 사용자 등)
        }
      }

      // 요소 개수는 기존 board에서 가져오기
      const elementCount = board?.elementCount || 0;

      const boardRow = {
        id: updatedRow.id,
        name: updatedRow.name,
        description: updatedRow.description,
        owner_id: updatedRow.owner_id,
        created_at: updatedRow.created_at,
        updated_at: updatedRow.updated_at,
        is_public: updatedRow.is_public,
        owner_name: ownerName,
        element_count: elementCount,
        is_starred: isStarred,
        is_pinned: isPinned,
        my_last_activity_at: board?.myLastActivityAt,
        invite_code: updatedRow.invite_code || undefined,
      };

      const updatedBoard = mapBoardRowToBoard(boardRow);

      // 보드 정보 업데이트
      setBoard(updatedBoard);
    },
    [boardId, board, setBoard]
  );

  useRealtimeSubscription(
    {
      channelName: `board:${boardId}:info`,
      table: 'boards',
      filter: `id=eq.${boardId}`,
      events: ['UPDATE'],
      enabled: !!boardId,
    },
    {
      onUpdate: handleRealtimeBoardUpdate,
    }
  );
};

