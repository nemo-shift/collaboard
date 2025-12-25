-- Final Index Optimization Migration
-- 최종 인덱스 최적화 및 중복 인덱스 정리

-- 1. boards.created_at 인덱스 추가 (생성일순 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON boards(created_at DESC);

-- 2. boards.name 인덱스 추가 (이름순 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_boards_name ON boards(name);

-- 3. 중복 인덱스 정리
-- user_board_preferences의 (user_id, board_id) 복합 인덱스는 
-- UNIQUE(user_id, board_id) 제약조건이 자동으로 인덱스를 생성하므로
-- 별도 복합 인덱스는 중복됨 - 제거
DROP INDEX IF EXISTS idx_user_board_preferences_user_board;

-- 4. users.email 인덱스 확인 (이미 20241226000000에서 추가됨, users로 리네이밍 확인)
-- 만약 user_profiles_email 인덱스가 남아있다면 제거
DROP INDEX IF EXISTS idx_user_profiles_email;

