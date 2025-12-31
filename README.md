# CollaBoard

아이디어를 실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드

> **최신 업데이트**: 2025년 1월 - 모바일 반응형 지원, SEO 최적화, 성능 개선 완료

## 주요 기능

- ✅ **실시간 협업**: 여러 사용자가 동시에 작업하고 변경사항이 즉시 반영
- ✅ **모바일 반응형**: 모바일 환경에서도 최적화된 UI/UX 제공
- ✅ **다크모드**: 라이트/다크 모드 전환 지원 (Tailwind CSS v4)
- ✅ **포스트잇**: 다양한 색상의 포스트잇 생성, 편집, 삭제
- ✅ **텍스트 요소**: 리치 텍스트 에디터 (굵게, 기울임, 밑줄, 취소선, 색상, 하이라이트)
- ✅ **이미지 업로드**: Supabase Storage를 이용한 이미지 업로드 및 관리
- ✅ **보드 관리**: 공개/비공개 보드 설정, 초대 링크 생성
- ✅ **실시간 커서 추적**: 다른 사용자의 커서 위치를 실시간으로 확인
- ✅ **미니맵**: 캔버스 전체를 한눈에 볼 수 있는 미니맵
- ✅ **무한 캔버스**: 드래그로 자유롭게 이동하는 무한 캔버스
- ✅ **Blob Cursor**: 랜딩 페이지에서만 활성화되는 부드러운 blob 형태의 커서
- ✅ **SEO 최적화**: OG 이미지, favicon, sitemap, robots.txt 설정 완료

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4
- **State Management**: Zustand
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Architecture**: Feature-Sliced Design (FSD)

## 최근 업데이트 (2025년 1월)

### 모바일 반응형 지원
- ✅ **모바일 UI 최적화**: 보드 툴바, 협업 위젯, 미니맵 모바일 레이아웃
- ✅ **터치 제스처**: 모바일에서 캔버스 패닝 지원 (터치 드래그)
- ✅ **더블 탭 편집**: 모바일에서 요소 더블 탭으로 편집 모드 진입
- ✅ **모바일 배너**: 모바일 환경 제한 사항 안내 배너
- ✅ **반응형 랜딩 페이지**: 메인 타이틀 및 화이트보드 데모 섹션 모바일 최적화

### SEO 및 메타데이터
- ✅ **OG 이미지**: 소셜 미디어 공유 시 미리보기 이미지
- ✅ **Favicon**: 다양한 디바이스 및 크기에 맞춘 28개 favicon 파일
- ✅ **Sitemap**: 검색 엔진 크롤링을 위한 동적 sitemap 생성
- ✅ **Robots.txt**: 검색 엔진 크롤러 가이드 설정
- ✅ **메타 태그**: Open Graph, Twitter Card 메타 태그 완비

### 코드 최적화
- ✅ **커스텀 훅 리팩토링**: `board-canvas.tsx`를 세 개의 훅으로 분리
  - `useCanvasPanning`: 캔버스 패닝 로직 (모바일 터치 지원)
  - `useElementInteraction`: 요소 드래그, 리사이즈, 선택 로직
  - `useElementEditing`: 요소 편집 로직 (더블 탭 지원)
- ✅ **타입 안정성 개선**: 모든 `any` 타입 제거, 엄격한 타입 체크
- ✅ **성능 최적화**: `React.memo`, `useMemo`, `useCallback` 적절히 사용
  - BoardStats 컴포넌트 메모이제이션
  - 아이콘 컴포넌트 분리 및 재사용
- ✅ **빌드 최적화**: Next.js 컴파일러 최적화 설정 추가

### UI/UX 개선
- ✅ **다크모드 개선**: 모달, 버튼 다크모드 스타일 일관성 개선
- ✅ **대시보드 통계**: 모바일에서 토글 버튼 형태로 표시
- ✅ **접근성**: `aria-label` 속성 추가로 스크린 리더 지원

### 주요 버그 수정
- ✅ **캔버스 패닝 문제 해결**: 훅 리팩토링 후 발생한 패닝 이슈 해결
- ✅ **타입 오류 수정**: 빌드 시 발생하던 모든 타입 오류 해결
- ✅ **인증 에러 메시지 한국어 번역**: 사용자 친화적인 에러 메시지 제공
- ✅ **Next.js 빌드 에러**: `pages` 디렉토리와 `app` 디렉토리 충돌 해결

## 프로젝트 구조

이 프로젝트는 [Feature-Sliced Design](https://feature-sliced.design/) 아키텍처를 따릅니다.

```
src/
├── app/              # App Layer (프로바이더)
├── page-components/  # Pages Layer (페이지 컴포넌트)
├── widgets/          # Widgets Layer (복합 UI 블록)
├── features/         # Features Layer (비즈니스 기능)
├── entities/         # Entities Layer (비즈니스 엔티티)
└── shared/           # Shared Layer (공유 리소스)
```

## 문서

### 개발 가이드
- [프로젝트 기획서](./docs/PROJECT_SPEC.md) - 전체 기능 및 사용자 플로우
- [FSD 컨벤션](./docs/FSD_CONVENTIONS.md) - 프로젝트 아키텍처 가이드
- [FSD 코딩 가이드](./docs/FSD_CODING_GUIDE.md) - 코딩 규칙 및 예시
- [트러블슈팅](./docs/TROUBLESHOOTING.md) - 개발 중 발생한 문제와 해결 방법

### 설정 가이드
- [Supabase 설정](./supabase/README.md) - 데이터베이스 및 Storage 설정
- [MCP 설정](./docs/MCP_SETUP.md) - Model Context Protocol 설정 가이드
- [설정 체크리스트](./SETUP_CHECKLIST.md) - 프로젝트 설정 단계별 가이드

### 기타
- [디자인 토큰 가이드](./docs/DESIGN_TOKENS_GUIDE.md) - 디자인 시스템 가이드

## 개발 가이드

### FSD 컨벤션

프로젝트의 코딩 규칙과 아키텍처 가이드는 [FSD 컨벤션 문서](./docs/FSD_CONVENTIONS.md)를 참고하세요.

주요 규칙:
- **index.ts 파일**: 필요할 때만 생성 (빈 파일 금지)
- **레이어 간 의존성**: 상위 레이어만 하위 레이어를 import
- **경로 별칭**: `@shared`, `@features`, `@entities` 등 사용

### 코드 품질 체크

프로젝트에는 ESLint가 설정되어 있어 FSD 컨벤션을 자동으로 체크합니다:

```bash
# Lint 확인
npm run lint

# 자동 수정
npm run lint:fix

# 엄격한 체크
npm run lint:strict
```

자동 체크 항목:
- Import 순서 및 경로 별칭 사용
- 사용하지 않는 import 감지
- FSD 레이어 구조 준수

## 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm, yarn, pnpm, 또는 bun
- Supabase 프로젝트

### 설치 및 설정

1. **의존성 설치**
```bash
npm install
```

2. **환경 변수 설정**

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**중요**: 
- Supabase 프로젝트가 없으면 먼저 [Supabase](https://supabase.com)에서 프로젝트를 생성해야 합니다.
- 환경 변수가 없으면 애플리케이션이 실행되지 않습니다.

3. **Supabase 데이터베이스 마이그레이션**

Supabase 대시보드에서 SQL Editor로 이동하여 `supabase/migrations/` 폴더의 마이그레이션 파일들을 순서대로 실행하세요.

자세한 내용은 [Supabase 설정 가이드](./supabase/README.md)를 참고하세요.

4. **Supabase Storage 설정**

이미지 업로드 기능을 사용하려면:
- Supabase 대시보드 > Storage
- 새 버킷 생성: `board-image` (Private)
- Storage Policies 설정 (인증된 사용자만 업로드/읽기/삭제 가능)

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

**빌드 최적화**:
- 프로덕션 빌드에서 `console.log` 자동 제거 (에러/경고 제외)
- Supabase 패키지 최적화 (`optimizePackageImports`)
- TypeScript 타입 체크 포함

### 코드 품질 체크

```bash
# Lint 확인
npm run lint

# 자동 수정
npm run lint:fix

# 엄격한 체크 (경고 없음)
npm run lint:strict
```

## 배포

### Vercel 배포 (권장)

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 배포 자동 완료

**배포 URL**: [https://go-collaboard.vercel.app](https://go-collaboard.vercel.app)

### SEO 최적화

프로젝트에는 다음 SEO 최적화가 포함되어 있습니다:
- ✅ **OG 이미지**: 소셜 미디어 공유 시 미리보기 (`/opengraph-image.png`)
- ✅ **Favicon**: 다양한 디바이스 지원 (28개 파일)
- ✅ **Sitemap**: 동적 sitemap 생성 (`/sitemap.xml`)
- ✅ **Robots.txt**: 검색 엔진 크롤러 가이드 (`/robots.txt`)
- ✅ **메타 태그**: Open Graph, Twitter Card 완비

### 다른 플랫폼 배포

Next.js를 지원하는 모든 플랫폼에서 배포 가능합니다:
- Netlify
- AWS Amplify
- Railway
- Render

환경 변수만 올바르게 설정하면 됩니다.

## 문제 해결

### 환경 변수 에러
- `.env.local` 파일이 있는지 확인
- 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 의존성 설치 에러
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 빌드 에러
```bash
# 타입 체크
npm run lint

# .next 폴더 삭제 후 재빌드
rm -rf .next
npm run build
```

**주요 빌드 에러 해결**:
- 타입 오류: TypeScript strict mode로 인한 타입 체크 실패
  - 해결: 모든 타입을 명시적으로 지정, `any` 타입 제거
- 환경 변수 누락: Supabase 설정이 없을 때 빌드 실패
  - 해결: `.env.local` 파일에 필수 환경 변수 추가

자세한 문제 해결 방법은 [트러블슈팅 문서](./docs/TROUBLESHOOTING.md)를 참고하세요.
