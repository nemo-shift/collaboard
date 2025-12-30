/**
 * 인증 관련 에러 메시지를 한국어로 변환하는 유틸리티
 */

/**
 * Supabase 인증 에러 메시지를 한국어로 변환
 */
export const translateAuthError = (errorMessage: string): string => {
  const message = errorMessage.toLowerCase();

  // 로그인 관련 에러
  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid_credentials') ||
    message.includes('invalid credentials')
  ) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }

  // 이메일 인증 관련
  if (
    message.includes('email not confirmed') ||
    message.includes('email_not_confirmed')
  ) {
    return '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.';
  }

  // 회원가입 관련 에러
  if (
    message.includes('user already registered') ||
    message.includes('user_already_registered') ||
    message.includes('already registered')
  ) {
    return '이미 등록된 이메일입니다.';
  }

  // 비밀번호 관련 에러
  if (
    message.includes('password should be at least') ||
    message.includes('password is too short')
  ) {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }

  if (message.includes('password is too weak')) {
    return '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.';
  }

  // 이메일 전송 제한
  if (
    message.includes('email rate limit') ||
    message.includes('too many requests')
  ) {
    return '이메일 전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.';
  }

  // 회원가입 비활성화
  if (
    message.includes('signup is disabled') ||
    message.includes('signup_disabled')
  ) {
    return '회원가입이 비활성화되어 있습니다.';
  }

  // 토큰 관련 에러
  if (
    message.includes('refresh token') ||
    message.includes('refresh_token') ||
    message.includes('token expired')
  ) {
    return '세션이 만료되었습니다. 다시 로그인해주세요.';
  }

  // 기타 알려진 에러는 원본 메시지 반환
  return errorMessage;
};

