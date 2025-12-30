'use client';

import { getUsers, getUserProfiles } from '@features/auth/api';
import { logger } from './logger';

/**
 * 사용자 정보 조회 및 이름 추출
 */
export async function fetchUserName(userId: string): Promise<string | undefined> {
  try {
    const users = await getUsers([userId]);
    const user = users[0];
    return user?.displayName || user?.email?.split('@')[0] || undefined;
  } catch (error) {
    logger.error('Failed to fetch user name:', error);
    return undefined;
  }
}

/**
 * 여러 사용자 정보 조회 및 이름 맵 생성
 */
export async function fetchUserNamesMap(userIds: string[]): Promise<Map<string, string | undefined>> {
  const namesMap = new Map<string, string | undefined>();
  
  if (userIds.length === 0) return namesMap;
  
  try {
    const users = await getUsers(userIds);
    users.forEach((user) => {
      const userName = user?.displayName || user?.email?.split('@')[0] || undefined;
      if (user?.id) {
        namesMap.set(user.id, userName);
      }
    });
  } catch (error) {
    logger.error('Failed to fetch user names:', error);
  }
  
  return namesMap;
}

/**
 * 소유자 이름 조회 (보드용)
 */
export async function fetchOwnerName(
  ownerId: string,
  currentUserId?: string
): Promise<string | undefined> {
  // 현재 사용자가 소유자인 경우
  if (currentUserId && ownerId === currentUserId) {
    return '나';
  }
  
  try {
    const profiles = await getUserProfiles([ownerId]);
    const profile = profiles[0];
    return profile?.displayName || profile?.email?.split('@')[0] || undefined;
  } catch (error) {
    logger.error('Failed to fetch owner name:', error);
    return undefined;
  }
}


