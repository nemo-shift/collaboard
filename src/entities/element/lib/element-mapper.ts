// Board element database mapping utilities
// 데이터베이스 Row와 TypeScript BoardElement 타입 간 변환 유틸리티

import type { BoardElement, TextStyle } from '../model';

/**
 * 데이터베이스 board_elements 테이블 Row 타입
 */
export interface BoardElementRow {
  id: string;
  board_id: string;
  user_id: string;
  type: 'note' | 'image' | 'text';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string | null;
  text_style?: TextStyle | null; // JSONB 필드
  z_index?: number | null; // z-index 필드
  created_at: string;
  updated_at: string;
}

/**
 * 조인된 데이터를 포함한 BoardElement Row 타입
 */
export interface BoardElementRowWithJoins extends BoardElementRow {
  user_name?: string | null; // auth.users에서 조인
}

/**
 * 데이터베이스 Row를 BoardElement 타입으로 변환
 */
export function mapElementRowToElement(row: BoardElementRowWithJoins): BoardElement {
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    userName: row.user_name || undefined,
    type: row.type,
    content: row.content,
    position: row.position,
    size: row.size,
    color: row.color || undefined,
    textStyle: row.text_style || undefined,
    zIndex: row.z_index ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * BoardElement 타입을 데이터베이스 Insert용 Row로 변환
 */
export function mapElementToInsertRow(
  element: Omit<BoardElement, 'id' | 'createdAt' | 'updatedAt' | 'userName'>
): Omit<BoardElementRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    board_id: element.boardId,
    user_id: element.userId,
    type: element.type,
    content: element.content,
    position: element.position,
    size: element.size,
    color: element.color || null,
    text_style: element.textStyle || null,
    z_index: element.zIndex ?? null,
  };
}

/**
 * BoardElement 타입을 데이터베이스 Update용 Row로 변환
 */
export function mapElementToUpdateRow(
  element: Partial<Pick<BoardElement, 'content' | 'position' | 'size' | 'color' | 'textStyle' | 'zIndex'>>
): Partial<Pick<BoardElementRow, 'content' | 'position' | 'size' | 'color' | 'text_style' | 'z_index'>> {
  const updateRow: Partial<Pick<BoardElementRow, 'content' | 'position' | 'size' | 'color' | 'text_style' | 'z_index'>> = {};
  
  if (element.content !== undefined) {
    updateRow.content = element.content;
  }
  if (element.position !== undefined) {
    updateRow.position = element.position;
  }
  if (element.size !== undefined) {
    updateRow.size = element.size;
  }
  if (element.color !== undefined) {
    updateRow.color = element.color || null;
  }
  if (element.textStyle !== undefined) {
    updateRow.text_style = element.textStyle || null;
  }
  if (element.zIndex !== undefined) {
    updateRow.z_index = element.zIndex ?? null;
  }
  
  return updateRow;
}


