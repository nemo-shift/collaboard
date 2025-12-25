# Supabase 설정 가이드

## 데이터베이스 마이그레이션

이 프로젝트는 Supabase를 백엔드로 사용합니다. 데이터베이스 스키마를 설정하려면 다음 단계를 따르세요:

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 다음 정보를 확인합니다:
   - Project URL
   - Anon (public) key

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 데이터베이스 마이그레이션 실행

Supabase 대시보드에서:

1. SQL Editor로 이동
2. `supabase/migrations/20241222000000_initial_schema.sql` 파일의 내용을 복사하여 실행
3. 또는 Supabase CLI를 사용하여 마이그레이션 실행:
   ```bash
   supabase db push
   ```

### 4. Storage 설정 (이미지 업로드용)

Supabase 대시보드에서:

1. Storage 섹션으로 이동
2. 새 버킷 생성:
   - 이름: `board-images`
   - Public: true (공개 접근 허용)
3. Storage Policies 설정:
   - Authenticated users can upload files
   - Authenticated users can update their own files
   - Authenticated users can delete their own files

### 5. 인증 설정

1. Authentication > Providers에서 Google OAuth 설정:
   - Google OAuth 활성화
   - Client ID와 Client Secret 입력
   - Redirect URL 설정: `https://your-project-url.supabase.co/auth/v1/callback`

## 테이블 구조

### boards
- `id`: UUID (기본 키)
- `name`: TEXT (보드 이름)
- `owner_id`: UUID (생성자 ID, auth.users 참조)
- `created_at`: TIMESTAMPTZ

### board_elements
- `id`: UUID (기본 키)
- `board_id`: UUID (보드 ID, boards 참조)
- `user_id`: UUID (생성자 ID, auth.users 참조)
- `type`: TEXT ('note' 또는 'image')
- `content`: TEXT (포스트잇 텍스트 또는 이미지 URL)
- `position`: JSONB (위치 좌표: {x, y})
- `size`: JSONB (크기: {width, height})
- `color`: TEXT (포스트잇 색상, nullable)
- `created_at`: TIMESTAMPTZ

## Realtime 설정

`boards`와 `board_elements` 테이블에 대해 Realtime이 활성화되어 있어, 실시간 협업이 가능합니다.

