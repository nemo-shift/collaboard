# FSD 코딩 가이드

이 문서는 Vibe Board 프로젝트에서 Feature-Sliced Design (FSD) 아키텍처를 따르는 방법을 안내합니다.

## 빠른 참조 체크리스트

새로운 기능을 추가할 때 다음을 확인하세요:

### 1. 올바른 레이어 선택

- **`shared`**: 프로젝트 전반에서 사용되는 공통 리소스
- **`entities`**: 비즈니스 엔티티 (타입, 인터페이스)
- **`features`**: 비즈니스 기능 (UI 컴포넌트, 훅, API 호출)
- **`widgets`**: 복합 UI 블록 (여러 features를 조합)
- **`pages`**: 페이지 컴포넌트 (가벼운 조립만)

### 2. Import 규칙

```typescript
// ✅ 좋은 예
import { Button } from '@shared/ui';
import { useBoardContent } from '@features/content';
import { Board } from '@entities/board';

// ❌ 나쁜 예
import { Button } from '../../../shared/ui/button';
```

### 3. 파일 구조

각 feature/entity는 다음 구조를 따릅니다:

```
feature-name/
├── ui/          # UI 컴포넌트
├── model/       # 비즈니스 로직, 상태 관리 (훅)
├── api/         # API 호출 함수
├── lib/         # 유틸리티 함수
└── index.ts     # Public API
```

### 4. index.ts 패턴

모든 폴더에 `index.ts`를 생성하고 Public API를 export합니다:

```typescript
// src/features/content/model/index.ts
export { useBoardContent } from './use-board-content';
export { mockElements } from './mock-elements';
```

### 5. 모듈화 원칙

- **설정값은 상수로 분리**: `lib/constants.ts`
- **하드코딩 지양**: props로 주입 가능하게
- **재사용 가능한 훅**: 명확한 인터페이스와 반환 타입
- **독립적인 위젯**: props로 동작, 다른 곳에서도 사용 가능

## 예시: 새로운 기능 추가하기

### 예시 1: 새로운 Feature 추가

```typescript
// 1. src/features/new-feature/model/use-new-feature.ts 생성
'use client';

export const useNewFeature = () => {
  // 로직 구현
  return { data, handlers };
};

// 2. src/features/new-feature/model/index.ts 생성
export { useNewFeature } from './use-new-feature';

// 3. src/features/new-feature/index.ts 생성
export * from './model';

// 4. src/features/index.ts에 추가
export * from './new-feature';
```

### 예시 2: 새로운 Widget 추가

```typescript
// 1. src/widgets/new-widget/ui/new-widget.tsx 생성
'use client';

interface NewWidgetProps {
  // props 정의
}

export const NewWidget = ({ ... }: NewWidgetProps) => {
  // UI 구현
};

// 2. src/widgets/new-widget/ui/index.ts 생성
export { NewWidget } from './new-widget';

// 3. src/widgets/new-widget/index.ts 생성
export * from './ui';

// 4. src/widgets/index.ts에 추가
export * from './new-widget';
```

### 예시 3: Page에서 사용하기

```typescript
// src/pages/new-page/ui/new-page.tsx
'use client';

import { NewWidget } from '@widgets/new-widget';
import { useNewFeature } from '@features/new-feature';

export const NewPage = () => {
  const { data, handlers } = useNewFeature();
  
  return (
    <div>
      <NewWidget data={data} onAction={handlers.onAction} />
    </div>
  );
};
```

## 자주 하는 실수

### ❌ 실수 1: 잘못된 레이어에 배치

```typescript
// ❌ 나쁜 예: 비즈니스 로직이 pages에 있음
export const BoardPage = () => {
  const [elements, setElements] = useState([]);
  // ... 복잡한 로직
};

// ✅ 좋은 예: 로직은 features에, pages는 조립만
export const BoardPage = () => {
  const { elements, handlers } = useBoardContent({ boardId });
  // ... 가벼운 조립
};
```

### ❌ 실수 2: 상대 경로 사용

```typescript
// ❌ 나쁜 예
import { Button } from '../../../shared/ui/button';

// ✅ 좋은 예
import { Button } from '@shared/ui';
```

### ❌ 실수 3: 하드코딩된 값

```typescript
// ❌ 나쁜 예
const color = '#FFEB3B';

// ✅ 좋은 예
import { DEFAULT_NOTE_COLOR } from '@features/content/lib/constants';
const color = DEFAULT_NOTE_COLOR;
```

## ESLint 규칙

프로젝트의 ESLint 설정이 다음을 강제합니다:

1. **Import 순서**: FSD 레이어 순서대로 정렬
2. **경로 별칭 사용**: 상대 경로 사용 금지
3. **사용하지 않는 import**: 자동 제거

## 참고 자료

- `.cursorrules`: 프로젝트 전체 규칙
- `docs/FSD_CONVENTIONS.md`: FSD 컨벤션 상세 설명
- `eslint.config.mjs`: ESLint 설정

