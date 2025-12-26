/**
 * 익명 사용자 ID 생성 및 관리 유틸리티
 */

/**
 * 익명 사용자 ID를 생성하거나 localStorage에서 가져옵니다.
 * localStorage에 저장하여 일관성 유지
 * 
 * @returns 익명 사용자 ID (형식: 'anon_...')
 */
export function generateAnonymousUserId(): string {
  if (typeof window === 'undefined') return '';
  
  const stored = localStorage.getItem('anonymous_user_id');
  if (stored) return stored;
  
  // 간단한 UUID 생성 (crypto.randomUUID가 없을 경우 대비)
  const newId = 'anon_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  localStorage.setItem('anonymous_user_id', newId);
  return newId;
}

