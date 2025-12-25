// User name formatting utility
// 사용자 이름 포맷팅 유틸리티

export const formatUserName = (userName: string | null | undefined): string => {
  if (!userName || userName.trim() === '') {
    return 'Anonymous';
  }
  return userName;
};

