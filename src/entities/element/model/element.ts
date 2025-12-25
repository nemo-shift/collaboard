// Board element model types and interfaces
// 보드 요소 타입, 인터페이스 정의

export interface BoardElement {
  id: string;
  boardId: string;
  userId: string;
  userName?: string; // 작성자 이름 (익명일 수 있음)
  type: 'note' | 'image';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color?: string;
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

