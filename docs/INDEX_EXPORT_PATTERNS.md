# Index.ts Export 패턴 가이드

이 문서는 프로젝트의 index.ts 파일을 통한 export/import 패턴을 설명합니다.

## ✅ 활성화된 최상위 레이어

### Entities 레이어 (`@entities`)

```typescript
// src/entities/index.ts
export * from './board';   // Board 타입
export * from './element'; // BoardElement, CursorPosition 타입
// export * from './user'; // 아직 내용 없음
```

**사용 예시:**

```typescript
// ✅ 옵션 1: 최상위에서 한 번에 import
import type { Board, BoardElement, CursorPosition } from '@entities';

// ✅ 옵션 2: 개별 경로로 import (기존 방식, 여전히 작동)
import type { Board } from '@entities/board';
import type { BoardElement } from '@entities/element';
```

### Features 레이어 (`@features`)

```typescript
// src/features/index.ts
export * from './board';        // BoardCard, useBoardActions, useBoardStats 등
export * from './content';      // useBoardContent 등
export * from './collaboration'; // useCollaboration 등
// export * from './auth';      // 아직 내용 없음
```

**사용 예시:**

```typescript
// ✅ 옵션 1: 최상위에서 한 번에 import
import { 
  useBoardContent, 
  useCollaboration, 
  useBoardActions,
  BoardCard 
} from '@features';

// ✅ 옵션 2: 개별 경로로 import (기존 방식, 여전히 작동)
import { useBoardContent } from '@features/content';
import { useCollaboration } from '@features/collaboration';
```

## Export 패턴 종류

### 1. 계층별 Re-export (최상위 레이어)

```typescript
// src/entities/index.ts
export * from './board';
export * from './element';
```

**장점:**
- 한 곳에서 모든 엔티티 import 가능
- IDE 자동완성 향상
- 코드 일관성 향상

### 2. 도메인별 Export (도메인 레벨)

```typescript
// src/entities/board/index.ts
export * from './model';
export * from './lib';
```

**장점:**
- 도메인별로 그룹화된 export
- 내부 구조 변경 시 import 경로 유지

### 3. 명시적 API Export (세그먼트 레벨)

```typescript
// src/features/content/model/index.ts
export { useBoardContent } from './use-board-content';
export { mockElements } from './mock-elements';
```

**장점:**
- Public API만 명확히 노출
- 내부 구현 세부사항 숨김
- 리팩토링 용이

### 4. 컴포넌트 Export (UI 컴포넌트)

```typescript
// src/shared/ui/components/index.ts
export { Button } from './button';
export { ColorPicker } from './color-picker';
export * from './constants';
```

**장점:**
- 컴포넌트와 상수 분리
- 명시적 export로 의도 명확

## 실제 사용 예시

### Before (개별 경로)

```typescript
import type { Board } from '@entities/board';
import type { BoardElement } from '@entities/element';
import { useBoardContent } from '@features/content';
import { useCollaboration } from '@features/collaboration';
import { useBoardActions } from '@features/board';
```

### After (최상위 레이어 활용)

```typescript
// 더 깔끔한 import
import type { Board, BoardElement } from '@entities';
import { 
  useBoardContent, 
  useCollaboration, 
  useBoardActions 
} from '@features';
```

## 이점 요약

### 1. Clean Imports ✅
- 깔끔한 import 구문
- 중복 경로 제거

### 2. API 통제 ✅
- 각 모듈의 공개 인터페이스 명확히 관리
- Public API만 노출

### 3. 리팩토링 용이 ✅
- 내부 구조 변경 시 import 경로 유지
- 파일 이동/이름 변경 시 영향 최소화

### 4. 의존성 명확화 ✅
- 계층간 의존성 규칙 강제 (ESLint)
- 상대 경로 사용 금지

### 5. 개발자 경험 ✅
- IDE 자동완성 향상
- 코드 탐색 용이
- 타입 안정성 향상

## 주의사항

### 순환 참조 방지

```typescript
// ❌ 나쁜 예: 순환 참조 발생 가능
// entities/board/index.ts
export * from '../element'; // board가 element를 참조

// entities/element/index.ts  
export * from '../board'; // element가 board를 참조
```

### 명시적 Export 권장

```typescript
// ✅ 좋은 예: 명시적 export
export { useBoardContent } from './use-board-content';

// ⚠️ 주의: export *는 모든 것을 export
export * from './use-board-content'; // 내부 함수도 노출될 수 있음
```

## 체크리스트

새로운 모듈을 추가할 때:

- [ ] 최상위 레이어 index.ts에 추가했는가?
- [ ] 도메인별 index.ts에 추가했는가?
- [ ] 세그먼트별 index.ts에 추가했는가?
- [ ] Public API만 export하는가?
- [ ] 주석으로 미구현 항목을 표시했는가?


