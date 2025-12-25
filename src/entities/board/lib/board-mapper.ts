// Board database mapping utilities
// 데이터베이스 Row와 TypeScript Board 타입 간 변환 유틸리티

import type { Board } from '../model';

/**
 * 데이터베이스 boards 테이블 Row 타입
 */
export interface BoardRow {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  invite_code?: string | null; // 옵셔널로 변경 (마이그레이션 전 호환성)
}

/**
 * 조인된 데이터를 포함한 Board Row 타입
 */
export interface BoardRowWithJoins extends BoardRow {
  owner_name?: string | null; // auth.users에서 조인
  element_count?: number; // COUNT(board_elements)
  is_starred?: boolean; // user_board_preferences에서 조인
  is_pinned?: boolean; // user_board_preferences에서 조인
  my_last_activity_at?: string | null; // 현재 사용자의 최근 활동
}

/**
 * 데이터베이스 Row를 Board 타입으로 변환
 */
export function mapBoardRowToBoard(row: BoardRowWithJoins): Board {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    ownerId: row.owner_id,
    ownerName: row.owner_name || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    elementCount: row.element_count,
    myLastActivityAt: row.my_last_activity_at || undefined,
    isPublic: row.is_public,
    isStarred: row.is_starred ?? false,
    isPinned: row.is_pinned ?? false,
    inviteCode: row.invite_code || undefined,
  };
}

/**
 * Board 타입을 데이터베이스 Insert용 Row로 변환
 */
export function mapBoardToInsertRow(board: Omit<Board, 'id' | 'createdAt' | 'updatedAt' | 'ownerName' | 'elementCount' | 'myLastActivityAt' | 'isStarred' | 'isPinned' | 'inviteCode'>): Omit<BoardRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: board.name,
    description: board.description || null,
    owner_id: board.ownerId,
    is_public: board.isPublic,
    invite_code: null, // 초대코드는 API에서 생성
  };
}

/**
 * Board 타입을 데이터베이스 Update용 Row로 변환
 */
export function mapBoardToUpdateRow(board: Partial<Pick<Board, 'name' | 'description' | 'isPublic'>>): Partial<Pick<BoardRow, 'name' | 'description' | 'is_public'>> {
  const updateRow: Partial<Pick<BoardRow, 'name' | 'description' | 'is_public'>> = {};
  
  if (board.name !== undefined) {
    updateRow.name = board.name;
  }
  if (board.description !== undefined) {
    updateRow.description = board.description || null;
  }
  if (board.isPublic !== undefined) {
    updateRow.is_public = board.isPublic;
  }
  
  return updateRow;
}


