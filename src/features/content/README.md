# Content Feature

콘텐츠 생성 기능을 담당하는 feature입니다.

## 책임 범위

- 포스트잇 생성/수정/삭제
- 이미지 업로드 및 관리
- 콘텐츠 위치 및 크기 조절
- 콘텐츠 관련 UI 컴포넌트

## 구조

```
content/
├── ui/          # 콘텐츠 생성 UI 컴포넌트 (포스트잇 에디터, 이미지 업로더 등)
├── model/       # 콘텐츠 상태 관리 (useContent 훅 등)
├── api/         # 콘텐츠 관련 Supabase API 호출
└── lib/         # 콘텐츠 관련 유틸리티 함수 (드래그 앤 드롭 등)
```

## 사용 예시

```typescript
// 다른 레이어에서 사용
import { PostItEditor } from '@features/content';
import { ImageUploader } from '@features/content';
import { useContent } from '@features/content';
```

