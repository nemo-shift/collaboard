-- Complete Board Schema Migration
-- 보드 관련 모든 필드와 테이블을 포함한 완전한 스키마

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Boards table (기존 테이블이 있으면 필드 추가, 없으면 생성)
DO $$ 
BEGIN
  -- 테이블이 없으면 생성
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'boards') THEN
    CREATE TABLE boards (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      is_public BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ELSE
    -- 테이블이 있으면 필드 추가
    ALTER TABLE boards 
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    
    -- 기존 데이터의 updated_at 설정
    UPDATE boards 
    SET updated_at = created_at 
    WHERE updated_at IS NULL OR updated_at < created_at;
  END IF;
END $$;

-- 2. Board elements table (기존 테이블이 있으면 필드 추가, 없으면 생성)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'board_elements') THEN
    CREATE TABLE board_elements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('note', 'image')),
      content TEXT NOT NULL,
      position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
      size JSONB NOT NULL DEFAULT '{"width": 200, "height": 200}',
      color TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ELSE
    -- updated_at 필드 추가
    ALTER TABLE board_elements 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    
    -- 기존 데이터의 updated_at 설정
    UPDATE board_elements 
    SET updated_at = created_at 
    WHERE updated_at IS NULL OR updated_at < created_at;
  END IF;
END $$;

-- 3. User board preferences table (사용자별 star/pin 관리)
CREATE TABLE IF NOT EXISTS user_board_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, board_id)
);

-- 4. Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_boards_updated_at ON boards;
CREATE TRIGGER update_boards_updated_at 
BEFORE UPDATE ON boards 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_board_elements_updated_at ON board_elements;
CREATE TRIGGER update_board_elements_updated_at 
BEFORE UPDATE ON board_elements 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_board_preferences_updated_at ON user_board_preferences;
CREATE TRIGGER update_user_board_preferences_updated_at 
BEFORE UPDATE ON user_board_preferences 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable Row Level Security
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_board_preferences ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for boards
DROP POLICY IF EXISTS "Users can view all boards" ON boards;
CREATE POLICY "Users can view all boards"
  ON boards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create their own boards" ON boards;
CREATE POLICY "Users can create their own boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own boards" ON boards;
CREATE POLICY "Users can update their own boards"
  ON boards FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own boards" ON boards;
CREATE POLICY "Users can delete their own boards"
  ON boards FOR DELETE
  USING (auth.uid() = owner_id);

-- 8. RLS Policies for board_elements
DROP POLICY IF EXISTS "Users can view all board elements" ON board_elements;
CREATE POLICY "Users can view all board elements"
  ON board_elements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create board elements" ON board_elements;
CREATE POLICY "Authenticated users can create board elements"
  ON board_elements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own board elements" ON board_elements;
CREATE POLICY "Users can update their own board elements"
  ON board_elements FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own board elements" ON board_elements;
CREATE POLICY "Users can delete their own board elements"
  ON board_elements FOR DELETE
  USING (auth.uid() = user_id);

-- 9. RLS Policies for user_board_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_board_preferences;
CREATE POLICY "Users can view their own preferences"
  ON user_board_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_board_preferences;
CREATE POLICY "Users can manage their own preferences"
  ON user_board_preferences FOR ALL
  USING (auth.uid() = user_id);

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_board_elements_board_id ON board_elements(board_id);
CREATE INDEX IF NOT EXISTS idx_board_elements_user_id ON board_elements(user_id);
CREATE INDEX IF NOT EXISTS idx_board_elements_updated_at ON board_elements(updated_at);
CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_board_preferences_user_id ON user_board_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_board_preferences_board_id ON user_board_preferences(board_id);
CREATE INDEX IF NOT EXISTS idx_user_board_preferences_user_board ON user_board_preferences(user_id, board_id);

-- 11. Enable Realtime for tables
-- Realtime은 이미 초기 스키마에서 설정되어 있을 수 있으므로 조건부로 추가
DO $$ 
BEGIN
  -- boards 테이블이 Realtime에 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'boards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE boards;
  END IF;
  
  -- board_elements 테이블이 Realtime에 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'board_elements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE board_elements;
  END IF;
  
  -- user_board_preferences 테이블이 Realtime에 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_board_preferences'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_board_preferences;
  END IF;
END $$;

