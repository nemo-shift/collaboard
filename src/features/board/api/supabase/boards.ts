'use client';

import { supabase } from '@shared/api';
import { logger } from '@shared/lib';
import type { Board } from '@entities/board';
import { mapBoardRowToBoard, type BoardRowWithJoins } from '@entities/board/lib/board-mapper';
import { getUserProfiles } from '@features/auth/api';

/**
 * 초대코드 생성 함수
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 보드 생성
 */
export async function createBoard(data: {
  name: string;
  description?: string;
  isPublic?: boolean;
  ownerId: string;
}): Promise<Board> {
  // 초대코드 생성 (public 보드만)
  let inviteCode: string | null = null;
  if (data.isPublic) {
    inviteCode = generateInviteCode();
  }

  // 소유자 정보 조회 (users 테이블에서) - 먼저 조회하여 ownerName 계산
  const ownerProfiles = await getUserProfiles([data.ownerId]);
  const ownerProfile = ownerProfiles[0];

  // 현재 사용자 정보 (자신의 보드는 "나"로 표시)
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const ownerName = currentUser?.id === data.ownerId
    ? '나'
    : (ownerProfile?.displayName || ownerProfile?.email?.split('@')[0] || undefined);

  // invite_code가 있는 경우에만 포함 (마이그레이션 전 호환성)
  const insertData: Record<string, unknown> = {
    name: data.name,
    description: data.description || null,
    owner_id: data.ownerId,
    is_public: data.isPublic ?? false,
  };
  
  // invite_code 컬럼이 존재하는 경우에만 추가
  if (inviteCode !== null) {
    insertData.invite_code = inviteCode;
  }

  const { data: boardData, error } = await supabase
    .from('boards')
    .insert(insertData)
    .select('*')
    .single();

  if (error) {
    // invite_code 컬럼이 없는 경우 에러 처리
    if (error.message?.includes('invite_code') || error.code === '42703') {
      // invite_code 없이 재시도
      const insertDataWithoutInvite = { ...insertData };
      delete insertDataWithoutInvite.invite_code;
      
      const { data: retryData, error: retryError } = await supabase
        .from('boards')
        .insert(insertDataWithoutInvite)
        .select('*')
        .single();

      if (retryError) {
        throw new Error(retryError.message);
      }

      // invite_code 없이 반환 (마이그레이션 전 호환성)
      return mapBoardRowToBoard({
        ...retryData,
        owner_name: ownerName,
        is_starred: false,
        is_pinned: false,
      });
    }
    throw new Error(error.message);
  }

  // 기본값으로 변환
  return mapBoardRowToBoard({
    ...boardData,
    owner_name: ownerName,
    is_starred: false,
    is_pinned: false,
  });
}

/**
 * 단일 보드 조회
 */
export async function getBoard(boardId: string, userId?: string): Promise<Board | null> {
  // invite_code 컬럼이 없을 수 있으므로 먼저 *로 시도
  const { data: board, error } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    throw new Error(error.message);
  }

  if (!board) {
    return null;
  }

  // 소유자 정보 조회
  const ownerProfiles = await getUserProfiles([board.owner_id]);
  const ownerProfile = ownerProfiles[0];

  // 현재 사용자 정보
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const ownerName = currentUser?.id === board.owner_id
    ? '나'
    : (ownerProfile?.displayName || ownerProfile?.email?.split('@')[0] || undefined);

  // 사용자 선호도 조회 (익명 사용자는 UUID가 아니므로 조회하지 않음)
  let isStarred = false;
  let isPinned = false;
  if (userId && !userId.startsWith('anon_')) {
    // UUID 형식인 경우에만 조회 (익명 사용자 ID는 'anon_'으로 시작)
    try {
      const { data: preference, error: prefError } = await supabase
        .from('user_board_preferences')
        .select('is_starred, is_pinned')
        .eq('user_id', userId)
        .eq('board_id', boardId)
        .maybeSingle(); // .single() 대신 .maybeSingle() 사용 (406 에러 방지)

      // maybeSingle()은 결과가 없으면 null을 반환하고 에러를 발생시키지 않음
      if (preference) {
        isStarred = preference.is_starred;
        isPinned = preference.is_pinned;
      }
      // 에러가 발생한 경우 (RLS 정책 위반 등)
      if (prefError) {
        // 406 에러나 PGRST301은 정상적인 경우 (선호도가 없거나 RLS 정책으로 접근 불가)
        if (prefError.code === 'PGRST116' || prefError.code === 'PGRST301' || prefError.message?.includes('406')) {
          // 선호도가 없는 경우 (정상)
          // isStarred, isPinned는 기본값 false 유지
        } else {
          // 다른 에러는 경고만 출력
          logger.warn('Failed to fetch user preferences:', prefError);
        }
      }
    } catch (error: unknown) {
      // 네트워크 에러나 기타 예외 처리
      const err = error as { message?: string; code?: string };
      if (err?.message?.includes('406') || err?.code === 'PGRST301') {
        // 406 에러는 선호도가 없는 경우로 처리
      } else {
        logger.warn('Failed to fetch user preferences:', error);
      }
    }
  }

  const boardRow: BoardRowWithJoins = {
    ...board,
    owner_name: ownerName,
    is_starred: isStarred,
    is_pinned: isPinned,
  };

  return mapBoardRowToBoard(boardRow);
}

/**
 * 사용자의 보드 목록 조회 (조인 포함)
 * 소유한 보드 + 참여한 보드 모두 반환
 */
export async function getBoards(userId?: string): Promise<Board[]> {
  if (!userId || userId.startsWith('anon_')) {
    // 익명 사용자는 보드 목록 조회 불가
    return [];
  }

  try {
    // 1. 소유한 보드 ID 조회
    const { data: ownedBoards, error: ownedError } = await supabase
      .from('boards')
      .select('id')
      .eq('owner_id', userId);

    if (ownedError) {
      logger.error('[getBoards] 소유한 보드 조회 실패:', ownedError);
      throw new Error(`소유한 보드 조회 실패: ${ownedError.message}`);
    }

    // 2. 참여한 보드 ID 조회 (user_board_preferences)
    const { data: participatedBoards, error: participatedError } = await supabase
      .from('user_board_preferences')
      .select('board_id')
      .eq('user_id', userId);

    if (participatedError) {
      // PGRST116, PGRST301은 데이터가 없는 경우 (정상)
      if (participatedError.code === 'PGRST116' || participatedError.code === 'PGRST301') {
        // 참여한 보드가 없는 경우 - 빈 배열로 처리
      } else {
        logger.error('[getBoards] 참여한 보드 조회 실패:', participatedError);
        throw new Error(`참여한 보드 조회 실패: ${participatedError.message}`);
      }
    }

    // 3. 소유한 보드 ID + 참여한 보드 ID 합치기
    const ownedBoardIds = (ownedBoards || []).map((b) => b.id);
    const participatedBoardIds = (participatedBoards || []).map((p) => p.board_id);
    const allBoardIds = [...new Set([...ownedBoardIds, ...participatedBoardIds])];

    if (allBoardIds.length === 0) {
      return [];
    }

    // 4. 해당 보드들의 전체 데이터 조회
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('*')
      .in('id', allBoardIds)
      .order('updated_at', { ascending: false });

    if (boardsError) {
      logger.error('[getBoards] 보드 데이터 조회 실패:', boardsError);
      // 네트워크 에러인 경우 더 명확한 메시지
      if (boardsError.message?.includes('fetch') || boardsError.message?.includes('network')) {
        throw new Error('네트워크 연결을 확인해주세요. Supabase 서버에 연결할 수 없습니다.');
      }
      throw new Error(`보드 데이터 조회 실패: ${boardsError.message}`);
    }

  if (!boards || boards.length === 0) {
    return [];
  }

  const boardIds = boards.map((b) => b.id);

    // 요소 개수 조회 (각 보드별로 집계)
    const { data: elementCounts, error: countError } = await supabase
      .from('board_elements')
      .select('board_id')
      .in('board_id', boardIds);

    if (countError) {
      logger.error('[getBoards] 요소 개수 조회 실패:', countError);
      // 요소 개수 조회 실패는 치명적이지 않으므로 빈 맵으로 처리
    }

    // 요소 개수 집계
    const elementCountMap = elementCounts?.reduce((acc, el) => {
      acc[el.board_id] = (acc[el.board_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 사용자별 선호도 조회 (익명 사용자는 UUID가 아니므로 조회하지 않음)
    let preferencesMap: Record<string, { is_starred: boolean; is_pinned: boolean }> = {};
    if (userId && !userId.startsWith('anon_')) {
    try {
      const { data: preferences, error: prefError } = await supabase
        .from('user_board_preferences')
        .select('board_id, is_starred, is_pinned')
        .eq('user_id', userId)
        .in('board_id', boardIds);

      // 406 에러나 PGRST301은 정상적인 경우 (선호도가 없는 경우)
      if (prefError) {
        if (prefError.code === 'PGRST116' || prefError.code === 'PGRST301' || prefError.message?.includes('406')) {
          // 선호도가 없는 경우 (정상) - 빈 맵 유지
        } else {
          throw new Error(prefError.message);
        }
      } else if (preferences) {
        preferencesMap = (preferences || []).reduce((acc, pref) => {
          acc[pref.board_id] = {
            is_starred: pref.is_starred,
            is_pinned: pref.is_pinned,
          };
          return acc;
        }, {} as Record<string, { is_starred: boolean; is_pinned: boolean }>);
      }
    } catch (error: unknown) {
      // 네트워크 에러나 기타 예외 처리
      const err = error as { message?: string; code?: string };
      if (err?.message?.includes('406') || err?.code === 'PGRST301') {
        // 406 에러는 선호도가 없는 경우로 처리
      } else {
        logger.warn('Failed to fetch user preferences:', error);
      }
    }
  }

    // 사용자별 최근 활동 조회
    let activityMap: Record<string, string> = {};
    if (userId) {
      const { data: activities, error: activityError } = await supabase
        .from('board_elements')
        .select('board_id, updated_at')
        .eq('user_id', userId)
        .in('board_id', boardIds)
        .order('updated_at', { ascending: false });

      if (activityError) {
        logger.error('[getBoards] 활동 조회 실패:', activityError);
        // 활동 조회 실패는 치명적이지 않으므로 빈 맵으로 처리
      } else {
        // 각 보드별 최신 활동만 추출
        activityMap = (activities || []).reduce((acc, activity) => {
          if (!acc[activity.board_id] || new Date(activity.updated_at) > new Date(acc[activity.board_id])) {
            acc[activity.board_id] = activity.updated_at;
          }
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // 소유자 정보 조회 (users 테이블에서 조인)
    const ownerIds = [...new Set(boards.map((b) => b.owner_id))];
    const ownerProfiles = await getUserProfiles(ownerIds);

    // 소유자 정보 매핑
    const ownerMap = ownerProfiles.reduce((acc, profile) => {
      acc[profile.id] = profile.displayName || profile.email?.split('@')[0] || '알 수 없음';
      return acc;
    }, {} as Record<string, string>);

    // 현재 사용자 정보 (자신의 보드는 "나"로 표시)
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 데이터 변환
    return boards.map((row) => {
    // 현재 사용자가 소유자면 "나"로 표시, 아니면 프로필에서 가져온 이름
    let ownerName: string | undefined = undefined;
    if (currentUser && row.owner_id === currentUser.id) {
      ownerName = '나';
    } else {
      ownerName = ownerMap[row.owner_id] || undefined;
    }

    const boardRow: BoardRowWithJoins = {
      id: row.id,
      name: row.name,
      description: row.description,
      owner_id: row.owner_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_public: row.is_public,
      owner_name: ownerName,
      element_count: elementCountMap[row.id] || 0,
      is_starred: preferencesMap[row.id]?.is_starred || false,
      is_pinned: preferencesMap[row.id]?.is_pinned || false,
      my_last_activity_at: activityMap[row.id] || undefined,
    };

      return mapBoardRowToBoard(boardRow);
    });
  } catch (error: unknown) {
    // 네트워크 에러나 기타 예외 처리
    logger.error('[getBoards] 전체 에러:', error);
    const err = error as { message?: string };
    if (err?.message?.includes('fetch') || err?.message?.includes('network') || err?.message?.includes('Failed to fetch')) {
      throw new Error('네트워크 연결을 확인해주세요. Supabase 서버에 연결할 수 없습니다.');
    }
    // 이미 처리된 에러는 그대로 throw
    throw error;
  }
}

/**
 * 보드 업데이트
 */
export async function updateBoard(
  boardId: string,
  updates: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }
): Promise<Board> {
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description || null;
  
  if (updates.isPublic !== undefined) {
    updateData.is_public = updates.isPublic;
    // public으로 변경 시 초대코드 생성
    // private으로 변경 시에도 초대코드는 유지 (기존 링크가 계속 작동하도록)
    // invite_code 컬럼이 존재하는 경우에만 업데이트
    if (updates.isPublic) {
      // 공개로 변경 시: 초대코드가 없으면 생성, 있으면 유지
      const { data: currentBoard } = await supabase
        .from('boards')
        .select('invite_code')
        .eq('id', boardId)
        .single();
      
      if (!currentBoard?.invite_code) {
        // 초대코드가 없으면 새로 생성
        updateData.invite_code = generateInviteCode();
      }
      // 초대코드가 있으면 그대로 유지 (업데이트하지 않음)
    }
    // 비공개로 변경 시: 초대코드는 유지 (null로 설정하지 않음)
    // 이렇게 하면 공개 → 비공개로 변경해도 기존 초대 링크가 작동함
  }

  const { data, error } = await supabase
    .from('boards')
    .update(updateData)
    .eq('id', boardId)
    .select('*') // 모든 컬럼 선택 (invite_code 포함, 있으면)
    .single();

  if (error) {
    // invite_code 컬럼이 없는 경우 에러 처리
    if (error.message?.includes('invite_code') || error.code === '42703') {
      // invite_code 컬럼이 없으면 다시 시도 (invite_code 제외)
      const updateDataWithoutInvite = { ...updateData };
      delete updateDataWithoutInvite.invite_code;
      
      const { data: retryData, error: retryError } = await supabase
        .from('boards')
        .update(updateDataWithoutInvite)
        .eq('id', boardId)
        .select('*')
        .single();

      if (retryError) {
        throw new Error(retryError.message);
      }

      // invite_code 없이 반환
      return mapBoardRowToBoard({
        ...retryData,
        is_starred: false,
        is_pinned: false,
      });
    }
    throw new Error(error.message);
  }

  return mapBoardRowToBoard({
    ...data,
    is_starred: false,
    is_pinned: false,
  });
}

/**
 * 초대코드로 보드 조회
 */
export async function getBoardByInviteCode(inviteCode: string): Promise<Board | null> {
  try {
    // 초대코드로 보드 조회 (공개/비공개 모두 조회 가능)
    // 초대코드가 있다는 것은 원래 공개 보드였거나, 공개에서 비공개로 변경된 경우
    const { data: board, error } = await supabase
      .from('boards')
      .select('*')
      .eq('invite_code', inviteCode)
      // .eq('is_public', true) 제거 - 초대코드가 있으면 공개/비공개 모두 조회 가능
      .single();

    if (error) {
      // 406 에러는 보통 RLS 정책 문제이거나 보드가 비공개로 변경된 경우
      // PGRST116: No rows found
      // PGRST301: Not Acceptable (RLS 정책 위반 등)
      if (error.code === 'PGRST116' || error.code === 'PGRST301') {
        // 보드가 비공개로 변경되었거나 접근 불가
        return null;
      }
      // HTTP 상태 코드로도 체크 (Supabase 클라이언트가 status를 제공하는 경우)
      const errorMessage = error.message || '';
      if (errorMessage.includes('406') || errorMessage.includes('Not Acceptable')) {
        return null;
      }
      throw new Error(error.message);
    }

    if (!board) {
      return null;
    }

    // 소유자 정보 조회
    const ownerProfiles = await getUserProfiles([board.owner_id]);
    const ownerProfile = ownerProfiles[0];

    // 현재 사용자 정보
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const ownerName = currentUser?.id === board.owner_id
      ? '나'
      : (ownerProfile?.displayName || ownerProfile?.email?.split('@')[0] || undefined);

    const boardRow: BoardRowWithJoins = {
      ...board,
      owner_name: ownerName,
      is_starred: false,
      is_pinned: false,
    };

    return mapBoardRowToBoard(boardRow);
  } catch (error: unknown) {
    // 네트워크 에러나 기타 예외 처리
    // 406 에러나 RLS 정책 위반의 경우 null 반환
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes('406') || 
        err?.message?.includes('Not Acceptable') ||
        err?.code === 'PGRST301') {
      return null;
    }
    // 다른 에러는 재throw
    throw error;
  }
}

/**
 * 보드 참여 (자동으로 user_board_preferences에 추가)
 */
export async function joinBoard(boardId: string, userId: string): Promise<void> {
  // 이미 참여한 경우 확인
  const { data: existing } = await supabase
    .from('user_board_preferences')
    .select('id')
    .eq('user_id', userId)
    .eq('board_id', boardId)
    .single();

  if (existing) {
    // 이미 참여한 경우 아무것도 하지 않음
    return;
  }

  // 참여 정보 추가 (is_starred는 false, is_pinned는 false로 시작)
  const { error } = await supabase
    .from('user_board_preferences')
    .insert({
      user_id: userId,
      board_id: boardId,
      is_starred: false,
      is_pinned: false,
    });

  if (error) {
    // UNIQUE 제약조건 위반은 이미 참여한 것으로 간주
    if (error.code === '23505') {
      return;
    }
    throw new Error(error.message);
  }
}

/**
 * 보드 삭제
 */
export async function deleteBoard(boardId: string): Promise<void> {
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('id', boardId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * 보드 즐겨찾기 토글
 */
export async function toggleBoardStar(boardId: string, userId: string): Promise<boolean> {
  // 현재 상태 확인
  const { data: existing } = await supabase
    .from('user_board_preferences')
    .select('is_starred')
    .eq('user_id', userId)
    .eq('board_id', boardId)
    .single();

  const newStarred = !existing?.is_starred;

  if (existing) {
    // 업데이트
    const { error } = await supabase
      .from('user_board_preferences')
      .update({ is_starred: newStarred })
      .eq('user_id', userId)
      .eq('board_id', boardId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    // 생성
    const { error } = await supabase
      .from('user_board_preferences')
      .insert({
        user_id: userId,
        board_id: boardId,
        is_starred: newStarred,
        is_pinned: false,
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  return newStarred;
}

/**
 * 보드 고정 토글
 */
export async function toggleBoardPin(boardId: string, userId: string): Promise<boolean> {
  // 현재 상태 확인
  const { data: existing } = await supabase
    .from('user_board_preferences')
    .select('is_pinned')
    .eq('user_id', userId)
    .eq('board_id', boardId)
    .single();

  const newPinned = !existing?.is_pinned;

  if (existing) {
    // 업데이트
    const { error } = await supabase
      .from('user_board_preferences')
      .update({ is_pinned: newPinned })
      .eq('user_id', userId)
      .eq('board_id', boardId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    // 생성
    const { error } = await supabase
      .from('user_board_preferences')
      .insert({
        user_id: userId,
        board_id: boardId,
        is_starred: false,
        is_pinned: newPinned,
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  return newPinned;
}

