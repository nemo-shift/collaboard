-- Index Optimization Migration
-- 성능 최적화를 위한 추가 인덱스 생성

-- users.email 인덱스 추가 (이메일 검색 최적화)
-- Note: user_profiles는 users로 리네이밍됨
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- boards.updated_at 인덱스 추가 (정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_boards_updated_at ON boards(updated_at);

-- boards.created_at 인덱스 추가 (생성일순 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON boards(created_at DESC);

-- boards.name 인덱스 추가 (이름순 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_boards_name ON boards(name);

