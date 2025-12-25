# Collaboration Feature

실시간 협업 기능을 담당하는 feature입니다.

## 책임 범위

- 실시간 보드 업데이트 (Supabase Realtime)
- 다중 사용자 동기화
- 사용자 커서/선택 상태 표시
- 협업 관련 상태 관리

## 구조

```
collaboration/
├── ui/          # 협업 관련 UI 컴포넌트 (사용자 목록, 커서 표시 등)
├── model/       # 실시간 협업 상태 관리 (useCollaboration 훅 등)
├── api/         # Supabase Realtime 구독 및 이벤트 처리
└── lib/         # 협업 관련 유틸리티 함수 (충돌 해결 등)
```

## 사용 예시

```typescript
// 다른 레이어에서 사용
import { useCollaboration } from '@features/collaboration';
import { UserList } from '@features/collaboration';
```

## 주의사항

- 이 feature는 다른 feature들(board, content)과 독립적으로 동작합니다
- 실시간 업데이트는 Supabase Realtime을 통해 처리됩니다

