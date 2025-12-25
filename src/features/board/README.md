# Board Feature

보드 관리 기능을 담당하는 feature입니다.

## 책임 범위

- 보드 생성/삭제/수정
- 보드 목록 조회
- 보드 정보 관리
- 보드 관련 UI 컴포넌트

## 구조

```
board/
├── ui/          # 보드 관리 UI 컴포넌트 (보드 생성 폼, 보드 목록 등)
├── model/       # 보드 상태 관리 (useBoard 훅 등)
├── api/         # 보드 관련 Supabase API 호출
└── lib/         # 보드 관련 유틸리티 함수
```

## 사용 예시

```typescript
// 다른 레이어에서 사용
import { BoardList } from '@features/board';
import { useBoard } from '@features/board';
```

