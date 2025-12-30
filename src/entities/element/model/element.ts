// Board element model types and interfaces
// 보드 요소 타입, 인터페이스 정의

export interface TextStyle {
  fontSize?: number; // 폰트 크기 (px)
  fontWeight?: 'normal' | 'bold'; // 볼드
  fontStyle?: 'normal' | 'italic'; // 기울임
  textDecoration?: 'none' | 'underline' | 'line-through'; // 밑줄, 취소선
  color?: string; // 텍스트 색상
  backgroundColor?: string; // 하이라이트 색상
  heading?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'; // 헤딩 레벨
}

export interface BoardElement {
  id: string;
  boardId: string;
  userId: string;
  userName?: string; // 작성자 이름 (익명일 수 있음)
  type: 'note' | 'image' | 'text';
  content: string; // 텍스트의 경우 HTML 또는 일반 텍스트
  position: { x: number; y: number };
  size: { width: number; height: number };
  color?: string; // 포스트잇의 경우 배경색, 텍스트의 경우 기본 텍스트 색상
  textStyle?: TextStyle; // 텍스트 요소의 스타일 정보
  zIndex?: number; // 요소의 z-index (깊이 순서)
  createdAt: string;
  updatedAt: string; // 수정 날짜
}

export interface CursorPosition {
  userId: string;
  userName: string | null; // 익명 사용자는 null
  x: number;
  y: number;
  color: string;
}

