'use client';

import { supabase } from '@shared/api';
import type { User } from '@entities/user';
import {
  mapUserRowToUser,
  mapUserToUpdateRow,
  type UserRow,
} from '@entities/user/lib/user-mapper';

/**
 * 사용자 조회 (public.users 테이블)
 */
export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116: No rows found
    throw new Error(error.message);
  }

  if (!data) return null;

  return mapUserRowToUser(data as UserRow);
}

/**
 * 여러 사용자 조회 (public.users 테이블)
 */
export async function getUsers(userIds: string[]): Promise<User[]> {
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row) => mapUserRowToUser(row as UserRow));
}

/**
 * 현재 사용자 정보 업데이트 (public.users 테이블)
 */
export async function updateUser(updates: {
  displayName?: string;
  avatarUrl?: string;
  email?: string;
}): Promise<User> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const updateData = mapUserToUpdateRow(updates);

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapUserRowToUser(data as UserRow);
}

// Backward compatibility aliases
/**
 * @deprecated Use getUser instead
 */
export const getUserProfile = getUser;

/**
 * @deprecated Use getUsers instead
 */
export const getUserProfiles = getUsers;

/**
 * @deprecated Use updateUser instead
 */
export const updateUserProfile = updateUser;


