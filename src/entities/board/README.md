# Board Entity

보드 엔티티를 정의하는 레이어입니다.

## 책임 범위

- 보드 타입 정의
- 보드 관련 모델/인터페이스
- 보드 관련 유틸리티 함수

## 구조

```
board/
├── model/       # 보드 타입, 인터페이스 정의
└── lib/         # 보드 관련 유틸리티 함수
```

## 사용 예시

```typescript
// 다른 레이어에서 사용
import type { Board } from '@entities/board';
import { validateBoardName } from '@entities/board';
```

