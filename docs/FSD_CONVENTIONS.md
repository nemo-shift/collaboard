# FSD 아키텍처 컨벤션 가이드

이 문서는 Vibe Board 프로젝트에서 Feature-Sliced Design (FSD) 아키텍처를 사용하는 방법과 규칙을 정의합니다.

## 목차

1. [index.ts 파일 규칙](#indexts-파일-규칙)
2. [레이어별 가이드라인](#레이어별-가이드라인)
3. [Import 규칙](#import-규칙)
4. [파일 구조 규칙](#파일-구조-규칙)

---

## index.ts 파일 규칙 (Barrel Exports Pattern)

### 핵심 원칙

**✅ 모든 폴더에 index.ts 생성**
- 각 폴더마다 `index.ts` 파일을 생성하여 모듈의 공개 API를 관리합니다
- 내용이 없으면 주석으로 표시합니다 (빈 파일이 아님)

**✅ 계층별 Re-export 패턴**
- 하위 폴더의 내용을 상위 폴더의 `index.ts`에서 re-export합니다
- 계층별로 구조화된 export를 통해 깔끔한 import를 제공합니다

**✅ Public API만 export**
- 외부 레이어에서 사용할 것만 export합니다
- 내부 구현 세부사항은 숨깁니다

**✅ 주석 처리 방식**
- 아직 내용이 없으면 주석으로 표시합니다
- 나중에 주석을 해제하여 활성화합니다

### 구조 예시

```
features/auth/
├── ui/
│   ├── components/
│   │   └── login-form.tsx
│   └── index.ts          # export { LoginForm } from './components/login-form';
├── api/
│   └── index.ts          # export { loginUser } from './supabase/login';
├── model/
│   └── index.ts          # export { useAuth } from './use-auth';
└── index.ts              # export * from './ui'; export * from './api';
```

### 언제 주석을 해제할까?

**활성화 예시:**
```typescript
// src/features/auth/ui/index.ts
// 컴포넌트를 만들기 전 (주석 처리)
// export { LoginForm } from './components/login-form';

// 컴포넌트를 만든 후 (주석 해제)
export { LoginForm } from './components/login-form';
```

**상위 index.ts에서 활성화:**
```typescript
// src/features/auth/index.ts
// UI 컴포넌트가 생기면 주석 해제
export * from './ui'; // 활성화됨
// export * from './api'; // 아직 없음 (주석 유지)
```

### 예시 시나리오

**시나리오 1: 컴포넌트를 만들었을 때**
```typescript
// 1. 컴포넌트 생성
// src/widgets/header/ui/header.tsx
export const Header = () => { ... }

// 2. 세그먼트 index.ts에서 주석 해제
// src/widgets/header/ui/index.ts
export { Header } from './header'; // 주석 해제

// 3. 위젯 index.ts에서 주석 해제
// src/widgets/header/index.ts
export * from './ui'; // 주석 해제
```

**시나리오 2: 여러 컴포넌트가 있을 때**
```typescript
// src/features/auth/ui/index.ts
export { LoginForm } from './components/login-form';
export { SignupForm } from './components/signup-form';
export { LogoutButton } from './components/logout-button';

// src/features/auth/index.ts
export * from './ui'; // 모든 UI 컴포넌트가 한 번에 export됨
```

---

## 레이어별 가이드라인

### 📁 shared (공유 레이어)
- **index.ts 활용 권장**: 자주 사용되므로 통합 export 유용
- 예: `@shared/api`, `@shared/ui`, `@shared/types`

### 📦 entities (엔티티 레이어)
- **모델/타입을 export할 때만**: 다른 레이어에서 타입을 참조할 때
- 예: `@entities/user`, `@entities/board`

### ⚡ features (기능 레이어)
- **UI 컴포넌트나 훅을 export할 때만**: 위젯이나 페이지에서 사용할 때
- 예: `@features/auth`, `@features/board`

### 🧩 widgets (위젯 레이어)
- **위젯 컴포넌트를 export할 때만**: 페이지에서 사용할 때
- 예: `@widgets/header`, `@widgets/board-canvas`

### 📄 pages (페이지 레이어)
- **페이지 컴포넌트를 export할 때만**: App Router에서 사용할 때
- 예: `@pages/landing`, `@pages/dashboard`

---

## Import 규칙

### 경로 별칭 사용

FSD 경로 별칭을 사용하여 깔끔한 import를 작성합니다:

```typescript
// ✅ 좋은 예
import { supabase } from '@shared/api';
import { Header } from '@widgets/header';
import { LoginForm } from '@features/auth';

// ❌ 나쁜 예 (상대 경로)
import { supabase } from '../../../shared/api/supabase/client';
```

#### 경로 별칭 종류

프로젝트에는 두 가지 경로 별칭이 있습니다:

1. **Next.js 기본 별칭**: `@/*` → `./*` (루트 전체)
   - Next.js 기본 설정으로 유지됩니다
   - FSD 레이어 간 import에는 사용하지 않습니다

2. **FSD 레이어 별칭**: 
   - `@app/*` → `./src/app/*`
   - `@pages/*` → `./src/pages/*`
   - `@widgets/*` → `./src/widgets/*`
   - `@features/*` → `./src/features/*`
   - `@entities/*` → `./src/entities/*`
   - `@shared/*` → `./src/shared/*`

**중요**: FSD 레이어 간 import는 반드시 FSD 레이어 별칭(`@shared`, `@features` 등)을 사용하세요. `@/*`는 Next.js 기본 기능용으로만 사용합니다.

### 레이어 간 의존성 규칙

FSD의 핵심 원칙: **상위 레이어만 하위 레이어를 import**

```
app → pages → widgets → features → entities → shared
```

```typescript
// ✅ 올바른 의존성
// pages/dashboard에서
import { Header } from '@widgets/header';  // ✅
import { BoardList } from '@features/board';  // ✅
import { supabase } from '@shared/api';  // ✅

// ❌ 잘못된 의존성
// shared/lib에서
import { DashboardPage } from '@pages/dashboard';  // ❌ 위반!
```

---

## 파일 구조 규칙

### 각 슬라이스(폴더) 내부 구조

FSD 슬라이스는 다음과 같은 내부 구조를 가질 수 있습니다:

```
feature-name/
├── ui/          # UI 컴포넌트
├── model/       # 비즈니스 로직, 상태 관리
├── api/         # API 호출
├── lib/         # 유틸리티 함수
└── index.ts     # Public API (필요할 때만)
```

### 예시: auth feature (완전한 구조)

```
features/auth/
├── ui/
│   ├── components/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   └── index.ts          # export { LoginForm, SignupForm }
├── model/
│   ├── use-auth.ts
│   └── index.ts          # export { useAuth }
├── api/
│   ├── supabase/
│   │   ├── login.ts
│   │   └── register.ts
│   └── index.ts          # export { loginUser, registerUser }
├── lib/
│   ├── validate-email.ts
│   └── index.ts          # export { validateEmail }
└── index.ts              # export * from './ui'; export * from './api';
```

### Import 사용 예시

```typescript
// 깔끔한 import (계층별 re-export 덕분)
import { LoginForm, loginUser, useAuth } from '@features/auth';

// 또는 개별적으로
import { LoginForm } from '@features/auth';
import { loginUser } from '@features/auth';
```

---

## 체크리스트

새로운 슬라이스를 만들 때:

- [ ] 올바른 레이어에 배치했는가?
- [ ] 상위 레이어에서만 import하는가?
- [ ] 모든 폴더에 `index.ts`를 생성했는가?
- [ ] 세그먼트별 `index.ts`를 생성했는가? (ui/, api/, model/, lib/)
- [ ] 상위 `index.ts`에서 하위를 re-export하는가?
- [ ] 아직 내용이 없으면 주석으로 표시했는가?
- [ ] 경로 별칭(`@shared`, `@features` 등)을 사용하는가?

---

## ESLint 자동 체크

프로젝트에는 FSD 컨벤션을 자동으로 체크하는 ESLint 규칙이 설정되어 있습니다.

### 설정된 규칙

1. **Import 순서 자동 정렬**
   - FSD 경로 별칭(`@shared`, `@features` 등) 우선순위 적용
   - 알파벳 순으로 자동 정렬

2. **경로 별칭 사용 권장**
   - 상대 경로(`../../../`) 사용 시 경고
   - FSD 경로 별칭 사용 권장

3. **사용하지 않는 import 자동 감지**
   - 사용하지 않는 import 경고
   - 자동 제거 가능

4. **Import 그룹 분리**
   - 외부 라이브러리와 내부 모듈 자동 분리

### 사용 방법

```bash
# Lint 확인
npm run lint

# 자동 수정
npm run lint:fix

# 엄격한 체크 (경고도 에러로 처리)
npm run lint:strict
```

### IDE 통합

VS Code나 다른 IDE에서 ESLint 확장을 설치하면 실시간으로 컨벤션을 체크할 수 있습니다.

---

## 참고 자료

- [Feature-Sliced Design 공식 문서](https://feature-sliced.design/)
- [FSD Best Practices](https://feature-sliced.design/docs/get-started/overview)

---

## 질문이나 제안이 있나요?

이 컨벤션에 대한 질문이나 개선 제안이 있으면 이슈를 생성해주세요!

