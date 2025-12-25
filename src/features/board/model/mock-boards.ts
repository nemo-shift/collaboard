import type { Board } from '@entities/board';

// Mock boards data for development
// 개발용 더미 보드 데이터
// 실제 Supabase 연동 후에는 주석 처리됨
/*
export const mockBoards: Board[] = [
  {
    id: '1',
    name: '프로젝트 계획',
    description: '2024년 프로젝트 계획 및 로드맵',
    ownerId: 'user-1',
    ownerName: '홍길동',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 전
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    elementCount: 5,
    myLastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isPublic: true,
    isStarred: true,
    isPinned: true,
  },
  {
    id: '2',
    name: '아이디어 정리',
    description: '새로운 기능 아이디어 모음',
    ownerId: 'user-1',
    ownerName: '홍길동',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6일 전
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6일 전
    elementCount: 3,
    myLastActivityAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    isPublic: false,
    isStarred: false,
    isPinned: false,
  },
  {
    id: '3',
    name: '팀 미팅 노트',
    description: '주간 팀 미팅 내용 정리',
    ownerId: 'user-1',
    ownerName: '홍길동',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전
    elementCount: 8,
    myLastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isPublic: true,
    isStarred: true,
    isPinned: false,
  },
  {
    id: '4',
    name: '디자인 시스템',
    description: '컴포넌트 및 스타일 가이드',
    ownerId: 'user-1',
    ownerName: '홍길동',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10일 전
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
    elementCount: 12,
    myLastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isPublic: true,
    isStarred: false,
    isPinned: true,
  },
  {
    id: '5',
    name: '새로운 기능 브레인스토밍',
    description: '향후 개발할 기능들에 대한 아이디어',
    ownerId: 'user-1',
    ownerName: '홍길동',
    createdAt: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(), // 오늘
    updatedAt: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(), // 오늘
    elementCount: 0,
    myLastActivityAt: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(),
    isPublic: false,
    isStarred: false,
    isPinned: false,
  },
];
*/

// 실제 데이터베이스 연동 후 사용
export const mockBoards: Board[] = [];

