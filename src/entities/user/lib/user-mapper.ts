// User database mapping utilities
// 데이터베이스 Row와 TypeScript User 타입 간 변환 유틸리티

import type { User } from '../model';

/**
 * 데이터베이스 users 테이블 Row 타입
 */
export interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 데이터베이스 Row를 User 타입으로 변환
 */
export function mapUserRowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email || '',
    displayName: row.display_name || undefined,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * User 타입을 데이터베이스 Insert용 Row로 변환
 */
export function mapUserToInsertRow(
  user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
): Omit<UserRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    display_name: user.displayName || null,
    avatar_url: user.avatarUrl || null,
    email: user.email || null,
  };
}

/**
 * User 타입을 데이터베이스 Update용 Row로 변환
 */
export function mapUserToUpdateRow(
  user: Partial<Pick<User, 'displayName' | 'avatarUrl' | 'email'>>
): Partial<Pick<UserRow, 'display_name' | 'avatar_url' | 'email'>> {
  const updateRow: Partial<Pick<UserRow, 'display_name' | 'avatar_url' | 'email'>> = {};

  if (user.displayName !== undefined) {
    updateRow.display_name = user.displayName || null;
  }
  if (user.avatarUrl !== undefined) {
    updateRow.avatar_url = user.avatarUrl || null;
  }
  if (user.email !== undefined) {
    updateRow.email = user.email || null;
  }

  return updateRow;
}

// Backward compatibility aliases
/**
 * @deprecated Use mapUserRowToUser instead
 */
export const mapUserProfileRowToUserProfile = mapUserRowToUser;

/**
 * @deprecated Use mapUserToInsertRow instead
 */
export const mapUserProfileToInsertRow = mapUserToInsertRow;

/**
 * @deprecated Use mapUserToUpdateRow instead
 */
export const mapUserProfileToUpdateRow = mapUserToUpdateRow;

/**
 * @deprecated Use UserRow instead
 */
export type UserProfileRow = UserRow;


