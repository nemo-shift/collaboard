/**
 * 사용자 ID를 기반으로 일관된 색상 생성
 * @param userId - 사용자 ID
 * @returns HEX 색상 코드
 */
export function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80'
  ];
  // userId를 기반으로 일관된 색상 선택
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

