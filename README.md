# Vibe Board

아이디어를 실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
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

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
