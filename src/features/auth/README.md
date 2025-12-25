# Auth Feature

인증 관련 기능을 담당하는 feature입니다.

## 책임 범위

- 사용자 로그인/로그아웃
- Google OAuth 인증
- 인증 상태 관리
- 인증 관련 UI 컴포넌트

## 구조

```
auth/
├── ui/          # 인증 관련 UI 컴포넌트 (로그인 폼, 로그아웃 버튼 등)
├── model/       # 인증 상태 관리 (useAuth 훅 등)
├── api/         # Supabase 인증 API 호출
└── lib/         # 인증 관련 유틸리티 함수
```

## 사용 예시

```typescript
// 다른 레이어에서 사용
import { LoginForm } from '@features/auth';
import { useAuth } from '@features/auth';
```

