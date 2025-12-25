import type { BoardElement } from '@entities/element';
import { DEFAULT_NOTE_SIZE } from '../lib/constants';

// Mock board elements data for development
// 개발용 더미 보드 요소 데이터
// 주석 처리됨 (실제 API 사용)
export const mockElements: BoardElement[] = [
  // {
  //   id: '1',
  //   boardId: 'board-1',
  //   userId: 'user-1',
  //   userName: '사용자 1',
  //   type: 'note',
  //   content: '첫 번째 포스트잇\n아이디어를 자유롭게 작성해보세요',
  //   position: { x: 100, y: 100 },
  //   size: DEFAULT_NOTE_SIZE,
  //   createdAt: new Date().toISOString(),
  // },
  // {
  //   id: '2',
  //   boardId: 'board-1',
  //   userId: 'user-2',
  //   userName: '팀원 1',
  //   type: 'note',
  //   content: '두 번째 포스트잇\n팀과 함께 협업하세요',
  //   position: { x: 350, y: 200 },
  //   size: DEFAULT_NOTE_SIZE,
  //   createdAt: new Date().toISOString(),
  // },
  // {
  //   id: '3',
  //   boardId: 'board-1',
  //   userId: 'user-3',
  //   userName: undefined, // 익명 사용자
  //   type: 'note',
  //   content: '익명 포스트잇',
  //   position: { x: 500, y: 100 },
  //   size: DEFAULT_NOTE_SIZE,
  //   createdAt: new Date().toISOString(),
  // },
];
