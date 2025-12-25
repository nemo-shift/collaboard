'use client';

import { supabase } from '@shared/api';
import type { BoardElement } from '@entities/element';
import {
  mapElementRowToElement,
  mapElementToInsertRow,
  mapElementToUpdateRow,
  type BoardElementRowWithJoins,
} from '@entities/element/lib/element-mapper';
import { getUsers } from '@features/auth/api';

/**
 * 보드의 모든 요소 조회
 */
export async function getBoardElements(boardId: string): Promise<BoardElement[]> {
  const { data: elements, error } = await supabase
    .from('board_elements')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!elements || elements.length === 0) {
    return [];
  }

  // 사용자 정보 조회 (user_name을 위해)
  const userIds = [...new Set(elements.map((el) => el.user_id))];
  const users = await getUsers(userIds);
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user.displayName || user.email?.split('@')[0] || undefined;
    return acc;
  }, {} as Record<string, string | undefined>);

  // 데이터 변환
  return elements.map((row) => {
    const elementRow: BoardElementRowWithJoins = {
      ...row,
      user_name: userMap[row.user_id],
    };
    return mapElementRowToElement(elementRow);
  });
}

/**
 * 보드 요소 생성
 */
export async function createBoardElement(
  element: Omit<BoardElement, 'id' | 'createdAt' | 'updatedAt' | 'userName'>
): Promise<BoardElement> {
  const insertRow = mapElementToInsertRow(element);

  const { data, error } = await supabase
    .from('board_elements')
    .insert(insertRow)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // 사용자 정보 조회
  const users = await getUsers([element.userId]);
  const user = users[0];
  const userName = user?.displayName || user?.email?.split('@')[0] || undefined;

  const elementRow: BoardElementRowWithJoins = {
    ...data,
    user_name: userName,
  };

  return mapElementRowToElement(elementRow);
}

/**
 * 보드 요소 업데이트
 */
export async function updateBoardElement(
  elementId: string,
  updates: Partial<Pick<BoardElement, 'content' | 'position' | 'size' | 'color'>>
): Promise<BoardElement> {
  const updateRow = mapElementToUpdateRow(updates);

  const { data, error } = await supabase
    .from('board_elements')
    .update(updateRow)
    .eq('id', elementId)
    .select()
    .single();

  if (error) {
    // PGRST116: No rows found (RLS 정책으로 인해 업데이트 불가)
    // "Cannot coerce the result to a single JSON object" 에러 처리
    if (error.code === 'PGRST116' || error.message?.includes('Cannot coerce')) {
      throw new Error('요소를 업데이트할 수 없습니다. 권한이 없거나 요소가 존재하지 않습니다.');
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('요소를 업데이트할 수 없습니다. 요소가 존재하지 않습니다.');
  }

  // 사용자 정보 조회
  const users = await getUsers([data.user_id]);
  const user = users[0];
  const userName = user?.displayName || user?.email?.split('@')[0] || undefined;

  const elementRow: BoardElementRowWithJoins = {
    ...data,
    user_name: userName,
  };

  return mapElementRowToElement(elementRow);
}

/**
 * 보드 요소 삭제
 */
export async function deleteBoardElement(elementId: string): Promise<void> {
  const { error } = await supabase
    .from('board_elements')
    .delete()
    .eq('id', elementId);

  if (error) {
    throw new Error(error.message);
  }
}


