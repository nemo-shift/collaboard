/**
 * CollaBoard Design Tokens
 * 
 * 브랜드 컨셉:
 * - Light Mode: 오리지널 콜라 감성 (크림 화이트 + 코카콜라 레드)
 * - Dark Mode: 제로콜라 감성 (매트 블랙 + 화이트 + 라임 포인트)
 */

export const lightTheme = {
  // Base Colors
  base: {
    background: '#FFF9F2', // 크림 화이트 - 전체 배경
  },

  // Surface Colors
  surface: {
    default: '#FFFFFF', // 기본 카드/모달 배경
    subtle: '#FFEFE4', // 서브 섹션 배경
    hover: '#FFF5EB', // 호버 상태
  },

  // Border Colors
  border: {
    default: '#E7E2DD', // 기본 보더
    subtle: '#F5F0EB', // 연한 보더
    focus: '#FF2E2E', // 포커스 상태 (레드)
  },

  // Primary Colors (Coca Red)
  primary: {
    main: '#FF2E2E', // 메인 액션 버튼, 브랜드 포인트
    hover: '#E52525', // 호버 상태
    active: '#C91E1E', // 클릭/활성 상태
    tint: '#FFE2E2', // 배경 틴트, 배지 배경
    light: '#FFF0F0', // 매우 연한 배경
  },

  // Secondary Colors
  secondary: {
    main: '#5B9FFF', // 보조 액션, 링크
    hover: '#4A8FE6', // 호버 상태
    tint: '#E6F2FF', // 배경 틴트
  },

  // Text Colors
  text: {
    strong: '#111111', // 제목, 강조 텍스트
    body: '#3A3A3D', // 본문 텍스트
    muted: '#8A8F95', // 보조 텍스트, 플레이스홀더
    disabled: '#C4C4C7', // 비활성 텍스트
  },

  // Semantic Colors
  semantic: {
    success: '#10B981', // 성공 메시지
    warning: '#F59E0B', // 경고 메시지
    error: '#EF4444', // 에러 메시지
    info: '#5B9FFF', // 정보 메시지 (Secondary와 동일)
  },
} as const;

export const darkTheme = {
  // Base Colors
  base: {
    background: '#0A0A0C', // 매트 블랙 - 전체 배경
  },

  // Surface Colors
  surface: {
    default: '#131518', // 기본 카드/모달 배경
    elevated: '#1C1F24', // 상위 레이어 (드롭다운, 모달)
    hover: '#1A1D22', // 호버 상태
  },

  // Border Colors
  border: {
    default: '#2A2E33', // 기본 보더
    subtle: '#1F2327', // 연한 보더
    focus: '#9DFF4C', // 포커스 상태 (라임)
  },

  // Primary Colors (White)
  primary: {
    main: '#FFFFFF', // 메인 액션 버튼, 강조
    hover: '#EDEDED', // 호버 상태
    active: '#D4D4D4', // 클릭/활성 상태
    tint: '#2A2E33', // 배경 틴트
  },

  // Accent Colors (Lime - 실시간/퍼포먼스)
  accent: {
    lime: {
      main: '#9DFF4C', // 실시간 시그널, 활성 상태
      soft: '#8EDA3F', // 호버/서브 상태
      shock: '#B7FF63', // 강조/알림
      tint: '#1A2E0F', // 배경 틴트
    },
    blue: {
      main: '#4DA6FF', // 보조 액션, 링크
      hover: '#3D96EF', // 호버 상태
      tint: '#0F1F33', // 배경 틴트
    },
  },

  // Text Colors
  text: {
    strong: '#FFFFFF', // 제목, 강조 텍스트
    secondary: '#C5CAD1', // 본문 텍스트
    muted: '#9AA1A8', // 보조 텍스트, 플레이스홀더
    disabled: '#6B7280', // 비활성 텍스트
  },

  // Semantic Colors
  semantic: {
    success: '#10B981', // 성공 메시지
    warning: '#F59E0B', // 경고 메시지
    error: '#EF4444', // 에러 메시지
    info: '#4DA6FF', // 정보 메시지 (Accent Blue와 동일)
  },
} as const;

/**
 * Design Tokens 통합 객체
 */
export const designTokens = {
  light: lightTheme,
  dark: darkTheme,
} as const;

/**
 * Theme 타입
 */
export type ThemeMode = 'light' | 'dark';

/**
 * 현재 테마의 토큰을 가져오는 헬퍼 함수
 */
export function getThemeTokens(mode: ThemeMode) {
  return designTokens[mode];
}




