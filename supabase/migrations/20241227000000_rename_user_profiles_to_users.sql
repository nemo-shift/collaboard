-- Rename user_profiles to users and update foreign keys
-- user_profiles 테이블을 users로 리네이밍하고 Foreign Key 관계 변경

-- 1. 기존 Foreign Key 제약 조건 제거 (다른 테이블에서 user_profiles를 참조하는 경우)
-- boards, board_elements, user_board_preferences는 현재 auth.users를 참조하므로 변경 필요

-- 2. user_profiles 테이블을 users로 리네이밍
ALTER TABLE IF EXISTS user_profiles RENAME TO users;

-- 3. 트리거 함수 업데이트 (user_profiles → users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 트리거 이름은 그대로 유지 (auth.users에 대한 트리거이므로)

-- 5. updated_at 트리거 업데이트
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS Policies 업데이트
DROP POLICY IF EXISTS "Anyone can view profiles" ON users;
CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 7. 인덱스 리네이밍
DROP INDEX IF EXISTS idx_user_profiles_id;
DROP INDEX IF EXISTS idx_user_profiles_display_name;
DROP INDEX IF EXISTS idx_user_profiles_email;

CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 8. Foreign Key 변경: boards.owner_id → users.id
ALTER TABLE boards
  DROP CONSTRAINT IF EXISTS boards_owner_id_fkey;

ALTER TABLE boards
  ADD CONSTRAINT boards_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

-- 9. Foreign Key 변경: board_elements.user_id → users.id
ALTER TABLE board_elements
  DROP CONSTRAINT IF EXISTS board_elements_user_id_fkey;

ALTER TABLE board_elements
  ADD CONSTRAINT board_elements_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 10. Foreign Key 변경: user_board_preferences.user_id → users.id
ALTER TABLE user_board_preferences
  DROP CONSTRAINT IF EXISTS user_board_preferences_user_id_fkey;

ALTER TABLE user_board_preferences
  ADD CONSTRAINT user_board_preferences_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


