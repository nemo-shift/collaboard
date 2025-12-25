// Board entity type definition
// 보드 엔티티 타입 정의

export interface Board {
  id: string;
  name: string;
  description?: string; // 보드 설명
  ownerId: string;
  ownerName?: string; // 보드 생성자 이름
  createdAt: string;
  updatedAt: string;
  elementCount?: number; // 보드 요소 개수 (포스트잇 + 이미지)
  myLastActivityAt?: string; // 나의 최근 활동 날짜
  isPublic: boolean; // 공개/비공개
  isStarred: boolean; // 즐겨찾기 (star)
  isPinned: boolean; // 고정 (pin)
  inviteCode?: string; // 초대코드 (public 보드만)
}

