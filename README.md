# CollaBoard

아이디어를 실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드

## 주요 기능

- ✅ **실시간 협업**: 여러 사용자가 동시에 작업하고 변경사항이 즉시 반영
- ✅ **다크모드**: 라이트/다크 모드 전환 지원 (Tailwind CSS v4)
- ✅ **포스트잇**: 다양한 색상의 포스트잇 생성, 편집, 삭제
- ✅ **텍스트 요소**: 리치 텍스트 에디터 (굵게, 기울임, 밑줄, 취소선, 색상, 하이라이트)
- ✅ **이미지 업로드**: Supabase Storage를 이용한 이미지 업로드 및 관리
- ✅ **보드 관리**: 공개/비공개 보드 설정, 초대 링크 생성
- ✅ **실시간 커서 추적**: 다른 사용자의 커서 위치를 실시간으로 확인
- ✅ **미니맵**: 캔버스 전체를 한눈에 볼 수 있는 미니맵
- ✅ **무한 캔버스**: 드래그로 자유롭게 이동하는 무한 캔버스
- ✅ **Blob Cursor**: 랜딩 페이지에서만 활성화되는 부드러운 blob 형태의 커서

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **State Management**: Zustand
- **Backend**: Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Architecture**: Feature-Sliced Design (FSD)

## 프로젝트 구조

이 프로젝트는 [Feature-Sliced Design](https://feature-sliced.design/) 아키텍처를 따릅니다.

```
src/
├── app/          # App Layer (프로바이더)
├── pages/        # Pages Layer (페이지 컴포넌트)
├── widgets/      # Widgets Layer (복합 UI 블록)
├── features/     # Features Layer (비즈니스 기능)
├── entities/     # Entities Layer (비즈니스 엔티티)
└── shared/       # Shared Layer (공유 리소스)
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

자세한 문제 해결 방법은 [트러블슈팅 문서](./docs/TROUBLESHOOTING.md)를 참고하세요.
