# Board Element Entity

보드 요소(포스트잇, 이미지 등) 엔티티를 정의하는 레이어입니다.

## 책임 범위

- 보드 요소 타입 정의 (포스트잇, 이미지 등)
- 요소 관련 모델/인터페이스
- 요소 관련 유틸리티 함수

## 구조

```
element/
├── model/       # 요소 타입, 인터페이스 정의 (Note, Image 등)
└── lib/         # 요소 관련 유틸리티 함수 (위치 계산, 크기 조절 등)
```

## 사용 예시

```typescript
// 다른 레이어에서 사용
import type { BoardElement, Note, Image } from '@entities/element';
import { calculatePosition } from '@entities/element';
```

