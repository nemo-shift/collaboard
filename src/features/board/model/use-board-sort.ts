'use client';

import { useMemo } from 'react';
import type { Board } from '@entities/board';

export type SortOption = 'recent' | 'name' | 'created' | 'updated' | 'activity' | 'starred';

interface UseBoardSortProps {
  boards: Board[];
  sortBy: SortOption;
}

/**
 * 보드 목록 정렬 훅
 * @param boards - 정렬할 보드 목록
 * @param sortBy - 정렬 기준 ('recent' | 'name' | 'created' | 'updated' | 'activity' | 'pinned' | 'starred')
 * @returns 정렬된 보드 목록
 */
export const useBoardSort = ({ boards, sortBy }: UseBoardSortProps): Board[] => {
  return useMemo(() => {
    const sorted = [...boards];

    switch (sortBy) {
      case 'recent':
        // 최신순 (updatedAt 기준 내림차순)
        return sorted.sort((a, b) => {
          const dateA = new Date(b.updatedAt).getTime();
          const dateB = new Date(a.updatedAt).getTime();
          return dateA - dateB;
        });
      case 'name':
        // 이름순 (가나다순)
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'created':
        // 생성일순 (createdAt 기준 내림차순)
        return sorted.sort((a, b) => {
          const dateA = new Date(b.createdAt).getTime();
          const dateB = new Date(a.createdAt).getTime();
          return dateA - dateB;
        });
      case 'updated':
        // 수정일순 (updatedAt 기준 내림차순)
        return sorted.sort((a, b) => {
          const dateA = new Date(b.updatedAt).getTime();
          const dateB = new Date(a.updatedAt).getTime();
          return dateA - dateB;
        });
      case 'activity':
        // 내 활동순 (myLastActivityAt 기준 내림차순)
        return sorted.sort((a, b) => {
          const dateA = a.myLastActivityAt ? new Date(a.myLastActivityAt).getTime() : 0;
          const dateB = b.myLastActivityAt ? new Date(b.myLastActivityAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'starred':
        // 즐겨찾기 필터링은 대시보드에서 처리하므로 여기서는 정렬만 수행
        // (이 케이스는 실제로 사용되지 않지만 타입 호환성을 위해 유지)
        return sorted.sort((a, b) => {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      default:
        return sorted;
    }
  }, [boards, sortBy]);
};

