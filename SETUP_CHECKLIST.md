# CollaBoard 프로젝트 설정 체크리스트

## 필수 설치 및 설정

### 1. Node.js 및 npm 확인
```bash
node --version  # v18 이상 권장
npm --version
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정 (필수)

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**중요**: 
- Supabase 프로젝트가 없으면 먼저 [Supabase](https://supabase.com)에서 프로젝트를 생성해야 합니다.
- 환경 변수가 없으면 애플리케이션이 실행되지 않습니다.

### 4. Supabase 데이터베이스 마이그레이션

Supabase 대시보드에서 SQL Editor로 이동하여 다음 마이그레이션 파일들을 순서대로 실행:

1. `supabase/migrations/20241222000000_initial_schema.sql`
2. `supabase/migrations/20241223000000_add_updated_at_to_boards.sql`
3. `supabase/migrations/20241224000000_complete_board_schema.sql`
4. `supabase/migrations/20241225000000_create_user_profiles.sql`
5. `supabase/migrations/20241226000000_optimize_indexes.sql`
6. `supabase/migrations/20241227000000_rename_user_profiles_to_users.sql`
7. `supabase/migrations/20241228000000_final_index_optimization.sql`
8. `supabase/migrations/20241229000000_add_invite_code.sql`
9. `supabase/migrations/20241229000000_update_board_elements_rls_for_owners.sql`
10. `supabase/migrations/20241230000001_set_replica_identity_full.sql`

### 5. Supabase Storage 설정

1. Supabase 대시보드 > Storage
2. 새 버킷 생성:
   - 이름: `board-image`
   - Public: false (private 버킷)
3. Storage Policies 설정:
   - Authenticated users can upload files
   - Authenticated users can read files
   - Authenticated users can delete their own files

### 6. Google OAuth 설정 (선택사항)

Google 로그인을 사용하려면:
1. Supabase 대시보드 > Authentication > Providers
2. Google OAuth 활성화
3. Client ID와 Client Secret 입력
4. Redirect URL 설정

## 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

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

### TypeScript 에러
```bash
# 타입 체크
npm run lint
```

## 현재 상태 확인

다음 명령어로 현재 상태를 확인할 수 있습니다:

```bash
# node_modules 확인
Test-Path node_modules

# .env.local 확인
Test-Path .env.local

# 의존성 확인
npm list --depth=0
```




