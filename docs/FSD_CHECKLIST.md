# FSD 구조 체크리스트

이 문서는 프로젝트의 FSD 구조 준수 여부를 확인하는 체크리스트입니다.

## ✅ 확인 완료 항목

### 1. 올바른 레이어에 배치 ✅

#### Pages 레이어 (가벼운 조립만)
- ✅ `src/pages/board/ui/board-page.tsx` - 로직 없이 조립만 담당
- ✅ `src/pages/dashboard/ui/dashboard-page.tsx` - 로직 없이 조립만 담당
- ✅ `src/pages/landing/ui/landing-page.tsx` - 로직 없이 조립만 담당
- ✅ `src/pages/auth/ui/auth-page.tsx` - 로직 없이 조립만 담당

#### Widgets 레이어 (복합 UI 블록)
- ✅ `src/widgets/board-canvas` - 보드 캔버스 위젯
- ✅ `src/widgets/board-toolbar` - 보드 툴바 위젯
- ✅ `src/widgets/board-stats` - 보드 통계 위젯
- ✅ `src/widgets/collaborators-list` - 협업자 목록 위젯
- ✅ `src/widgets/header` - 헤더 위젯

#### Features 레이어 (비즈니스 로직)
- ✅ `src/features/content/model/use-board-content.ts` - 콘텐츠 관리 로직
- ✅ `src/features/collaboration/model/use-collaboration.ts` - 협업 로직
- ✅ `src/features/board/model/use-board-actions.ts` - 보드 액션 로직
- ✅ `src/features/board/model/use-board-stats.ts` - 보드 통계 로직

#### Entities 레이어 (비즈니스 엔티티)
- ✅ `src/entities/board/model/board.ts` - Board 타입 정의
- ✅ `src/entities/element/model/element.ts` - BoardElement, CursorPosition 타입 정의
- ✅ `src/entities/user` - User 타입 정의 (준비됨)

#### Shared 레이어 (공유 리소스)
- ✅ `src/shared/ui/components` - 공유 UI 컴포넌트
- ✅ `src/shared/lib` - 공유 유틸리티 함수
- ✅ `src/shared/api` - Supabase 클라이언트

### 2. index.ts 파일 생성 ✅

모든 주요 폴더에 `index.ts` 파일이 생성되어 있습니다:

#### Features
- ✅ `src/features/index.ts`
- ✅ `src/features/content/index.ts`
- ✅ `src/features/content/model/index.ts`
- ✅ `src/features/content/lib/index.ts`
- ✅ `src/features/content/ui/index.ts`
- ✅ `src/features/content/api/index.ts`
- ✅ `src/features/board/index.ts`
- ✅ `src/features/board/model/index.ts`
- ✅ `src/features/board/ui/index.ts`
- ✅ `src/features/collaboration/index.ts`
- ✅ `src/features/collaboration/model/index.ts`
- ✅ `src/features/auth/index.ts`

#### Widgets
- ✅ `src/widgets/index.ts`
- ✅ `src/widgets/board-canvas/index.ts`
- ✅ `src/widgets/board-canvas/ui/index.ts`
- ✅ `src/widgets/board-toolbar/index.ts`
- ✅ `src/widgets/board-toolbar/ui/index.ts`
- ✅ `src/widgets/board-stats/index.ts`
- ✅ `src/widgets/board-stats/ui/index.ts`
- ✅ `src/widgets/collaborators-list/index.ts`
- ✅ `src/widgets/collaborators-list/ui/index.ts`
- ✅ `src/widgets/header/index.ts`
- ✅ `src/widgets/header/ui/index.ts`

#### Entities
- ✅ `src/entities/index.ts`
- ✅ `src/entities/board/index.ts`
- ✅ `src/entities/board/model/index.ts`
- ✅ `src/entities/element/index.ts`
- ✅ `src/entities/element/model/index.ts`
- ✅ `src/entities/user/index.ts`

#### Pages
- ✅ `src/pages/index.ts`
- ✅ `src/pages/board/index.ts`
- ✅ `src/pages/board/ui/index.ts`
- ✅ `src/pages/dashboard/index.ts`
- ✅ `src/pages/dashboard/ui/index.ts`
- ✅ `src/pages/landing/index.ts`
- ✅ `src/pages/landing/ui/index.ts`
- ✅ `src/pages/auth/index.ts`
- ✅ `src/pages/auth/ui/index.ts`

#### Shared
- ✅ `src/shared/index.ts`
- ✅ `src/shared/ui/index.ts`
- ✅ `src/shared/ui/components/index.ts`
- ✅ `src/shared/lib/index.ts`
- ✅ `src/shared/api/index.ts`

### 3. 설정값을 lib/constants.ts에 분리 ✅

#### Content Feature
- ✅ `src/features/content/lib/constants.ts`
  - `DEFAULT_NOTE_COLOR` - 기본 포스트잇 색상
  - `DEFAULT_NOTE_SIZE` - 기본 포스트잇 크기
  - `MAX_IMAGE_SIZE` - 최대 이미지 크기

#### Shared
- ✅ `src/shared/lib/constants.ts`
  - `DEFAULT_BACKGROUND_COLOR` - 기본 배경색
  - `CURRENT_USER_COLOR` - 현재 사용자 색상

- ✅ `src/shared/ui/components/constants.ts`
  - `POSTIT_COLORS` - 포스트잇 색상 팔레트
  - `DEFAULT_POSTIT_COLOR` - 기본 포스트잇 색상

#### 사용 위치
- ✅ `src/widgets/board-canvas/ui/board-canvas.tsx` - 상수 사용
- ✅ `src/widgets/collaborators-list/ui/collaborators-list.tsx` - 상수 사용
- ✅ `src/shared/ui/components/color-picker.tsx` - 상수 사용
- ✅ `src/features/content/model/mock-elements.ts` - 상수 사용

## 📋 체크리스트 사용법

새로운 기능을 추가할 때 이 체크리스트를 확인하세요:

1. **올바른 레이어에 배치했는가?**
   - Pages: 가벼운 조립만
   - Widgets: 복합 UI 블록
   - Features: 비즈니스 로직
   - Entities: 타입 정의
   - Shared: 공유 리소스

2. **index.ts 파일을 생성했는가?**
   - 모든 폴더에 `index.ts` 생성
   - Public API만 export
   - 주석으로 미구현 항목 표시

3. **설정값은 lib/constants.ts에 분리했는가?**
   - 하드코딩된 색상, 크기 등 상수로 분리
   - Feature별로 `lib/constants.ts` 생성
   - Shared 상수는 `src/shared/lib/constants.ts`에

## 🔍 정기 점검

이 체크리스트는 프로젝트 진행 중 정기적으로 확인하여 FSD 구조를 유지해야 합니다.

