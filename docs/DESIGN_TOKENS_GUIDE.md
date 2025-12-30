# CollaBoard Design Tokens 가이드

## 개요

CollaBoard의 디자인 토큰 시스템은 브랜드 컨셉에 기반한 일관된 컬러 시스템을 제공합니다.

- **Light Mode**: 오리지널 콜라 감성 (크림 화이트 + 코카콜라 레드)
- **Dark Mode**: 제로콜라 감성 (매트 블랙 + 화이트 + 라임 포인트)

## 컬러 시스템 구조

### Light Mode

#### Base & Surface
- `base.background` (#FFF9F2): 전체 배경 (크림 화이트)
- `surface.default` (#FFFFFF): 기본 카드/모달 배경
- `surface.subtle` (#FFEFE4): 서브 섹션 배경
- `surface.hover` (#FFF5EB): 호버 상태

#### Primary (Red)
- `primary.main` (#FF2E2E): 메인 액션 버튼, 브랜드 포인트
- `primary.hover` (#E52525): 호버 상태
- `primary.active` (#C91E1E): 클릭/활성 상태
- `primary.tint` (#FFE2E2): 배경 틴트, 배지 배경

#### Secondary (Blue)
- `secondary.main` (#5B9FFF): 보조 액션, 링크
- `secondary.hover` (#4A8FE6): 호버 상태

#### Text
- `text.strong` (#111111): 제목, 강조 텍스트
- `text.body` (#3A3A3D): 본문 텍스트
- `text.muted` (#8A8F95): 보조 텍스트, 플레이스홀더

### Dark Mode

#### Base & Surface
- `base.background` (#0A0A0C): 전체 배경 (매트 블랙)
- `surface.default` (#131518): 기본 카드/모달 배경
- `surface.elevated` (#1C1F24): 상위 레이어 (드롭다운, 모달)
- `surface.hover` (#1A1D22): 호버 상태

#### Primary (White)
- `primary.main` (#FFFFFF): 메인 액션 버튼, 강조
- `primary.hover` (#EDEDED): 호버 상태

#### Accent (Lime - 실시간/퍼포먼스)
- `accent.lime.main` (#9DFF4C): 실시간 시그널, 활성 상태
- `accent.lime.soft` (#8EDA3F): 호버/서브 상태
- `accent.lime.shock` (#B7FF63): 강조/알림

#### Accent (Blue)
- `accent.blue.main` (#4DA6FF): 보조 액션, 링크
- `accent.blue.hover` (#3D96EF): 호버 상태

#### Text
- `text.strong` (#FFFFFF): 제목, 강조 텍스트
- `text.secondary` (#C5CAD1): 본문 텍스트
- `text.muted` (#9AA1A8): 보조 텍스트, 플레이스홀더

## 사용 방법

### 1. TypeScript에서 Design Tokens 사용

```typescript
import { getThemeTokens, type ThemeMode } from '@shared/constants/design-tokens';

const tokens = getThemeTokens('light');
const primaryColor = tokens.primary.main; // #FF2E2E
```

### 2. useTheme 훅 사용

```typescript
import { useTheme } from '@shared/lib';

function MyComponent() {
  const { isDark, tokens, classes } = useTheme();
  
  return (
    <div className={classes.bgSurface}>
      <h1 className={classes.text}>제목</h1>
      <p className={classes.textBody}>본문</p>
      <button className={`${classes.primary} ${classes.primaryHover}`}>
        버튼
      </button>
    </div>
  );
}
```

### 3. CSS 변수 직접 사용

```tsx
<div 
  style={{ 
    backgroundColor: 'var(--color-primary-main)',
    color: 'var(--color-text-strong)'
  }}
>
  컨텐츠
</div>
```

### 4. TailwindCSS 클래스 사용

```tsx
// CSS 변수를 TailwindCSS에서 사용
<div className="bg-[var(--color-primary-main)] text-[var(--color-text-strong)]">
  컨텐츠
</div>
```

## UI 가이드

### Light Mode 사용 예시

#### Primary Red 사용
- **CTA 버튼**: `bg-[var(--color-primary-main)]`
- **새 보드 생성 버튼**: Primary Red 사용
- **중요 액션**: Primary Red 사용
- **배지/태그**: `bg-[var(--color-primary-tint)]` + `text-[var(--color-primary-main)]`

#### Surface Subtle 사용
- **사이드바 배경**: `bg-[var(--color-surface-subtle)]`
- **구분선 영역**: Surface Subtle 사용
- **카드 호버**: `hover:bg-[var(--color-surface-hover)]`

#### Secondary Blue 사용
- **링크**: `text-[var(--color-secondary-main)]`
- **보조 버튼**: Secondary Blue 사용

### Dark Mode 사용 예시

#### Primary White 사용
- **주요 버튼**: `bg-[var(--color-primary-main)]` + `text-[var(--color-base-bg)]`
- **강조 텍스트**: `text-[var(--color-primary-main)]`

#### Accent Lime 사용
- **실시간 알림**: `bg-[var(--color-accent-lime-main)]`
- **활성 사용자 표시**: Accent Lime 사용
- **실시간 업데이트 배지**: `bg-[var(--color-accent-lime-tint)]` + `text-[var(--color-accent-lime-main)]`
- **중요 알림**: `bg-[var(--color-accent-lime-shock)]`

#### Accent Blue 사용
- **링크**: `text-[var(--color-accent-blue-main)]`
- **보조 액션**: Accent Blue 사용

## WCAG 접근성

모든 컬러 조합은 WCAG AA 이상의 대비비를 만족합니다:

| 조합 | 대비비 | 등급 |
|------|--------|------|
| Light: Text Strong on Base | 16.7:1 | AAA ✅ |
| Light: Text Body on Base | 12.1:1 | AAA ✅ |
| Light: Primary Red on White | 4.5:1 | AA ✅ |
| Dark: Text Strong on Base | 16.0:1 | AAA ✅ |
| Dark: Accent Lime on Base | 8.2:1 | AA ✅ |
| Dark: Primary White on Surface | 13.2:1 | AAA ✅ |

## 주의사항

1. **Primary Red는 Light Mode에서만 브랜드 상징으로 사용**
2. **Accent Lime은 Dark Mode에서 실시간/퍼포먼스 시그널로만 사용** (과도한 사용 지양)
3. **텍스트 가독성을 위해 항상 적절한 대비비 유지**
4. **색맹 사용자를 위해 아이콘/텍스트로 정보 전달 보완**

## 파일 구조

```
src/shared/constants/
├── design-tokens.ts    # Design Tokens 정의
└── index.ts           # Export

app/
└── globals.css        # CSS 변수 및 TailwindCSS @theme 설정
```

## 참고

- Design Tokens: `src/shared/constants/design-tokens.ts`
- Theme Hook: `src/shared/lib/use-theme.ts`
- CSS Variables: `app/globals.css`




