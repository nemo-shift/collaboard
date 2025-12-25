# invite_code 컬럼 추가 마이그레이션 실행 가이드

## 현재 상황
- `invite_code` 컬럼이 `boards` 테이블에 없어서 초대 기능이 작동하지 않습니다.
- 마이그레이션 파일은 이미 준비되어 있습니다: `supabase/migrations/20241229000000_add_invite_code.sql`

## 실행 방법

### 방법 1: Supabase 대시보드에서 직접 실행 (가장 간단하고 권장)

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. 아래 SQL을 복사하여 붙여넣기:

```sql
-- 보드에 초대코드 필드 추가
ALTER TABLE boards 
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- 초대코드 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_boards_invite_code ON boards(invite_code);

-- 초대코드 생성 함수 (8자리 랜덤 문자열)
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 기존 public 보드에 초대코드 자동 생성
UPDATE boards 
SET invite_code = generate_invite_code()
WHERE is_public = true AND invite_code IS NULL;
```

6. **Run** 버튼 클릭하여 실행
7. 성공 메시지 확인

### 방법 2: Supabase CLI 사용

```bash
# Supabase CLI 설치 (아직 설치하지 않은 경우)
npm install -g supabase

# Supabase 로그인
supabase login

# 프로젝트 연결 (프로젝트 참조 ID 필요)
# Supabase 대시보드 > Settings > General > Reference ID에서 확인
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

## 마이그레이션 확인

마이그레이션이 성공적으로 실행되었는지 확인:

1. Supabase 대시보드 > **Table Editor** > **boards** 테이블 선택
2. `invite_code` 컬럼이 있는지 확인
3. 또는 SQL Editor에서 다음 쿼리 실행:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'boards' AND column_name = 'invite_code';
```

결과가 나오면 마이그레이션이 성공한 것입니다.

## 문제 해결

### 에러: "column already exists"
- 이미 마이그레이션이 실행된 것입니다. 무시하고 진행하세요.

### 에러: "permission denied"
- Supabase 프로젝트의 관리자 권한이 필요합니다.
- 프로젝트 소유자로 로그인했는지 확인하세요.

### 여전히 에러가 발생하는 경우
- Supabase 대시보드를 새로고침하세요.
- 브라우저 캐시를 지우고 다시 시도하세요.
- 몇 분 기다린 후 다시 시도하세요 (스키마 캐시 업데이트 시간 필요).

