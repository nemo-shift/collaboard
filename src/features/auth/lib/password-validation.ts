// 비밀번호 유효성 검사 유틸리티

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 비밀번호 유효성 검사
 * 최소 조건:
 * - 8자 이상
 * - 특수문자 포함
 * - 영문자 포함 (대소문자 구분 없음)
 * - 숫자 포함
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('비밀번호는 8자 이상이어야 합니다');
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('영문자를 포함해야 합니다');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 비밀번호 일치 여부 확인
 */
export function checkPasswordMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0;
}

