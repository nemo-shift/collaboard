# User Entity

사용자 엔티티를 정의하는 레이어입니다.

## 책임 범위

- 사용자 타입 정의
- 사용자 관련 모델/인터페이스
- 사용자 관련 유틸리티 함수

## 구조

```
user/
├── model/       # 사용자 타입, 인터페이스 정의
└── lib/         # 사용자 관련 유틸리티 함수
```

## 사용 예시

```typescript
// 다른 레이어에서 사용
import type { User } from '@entities/user';
import { formatUserName } from '@entities/user';
```

