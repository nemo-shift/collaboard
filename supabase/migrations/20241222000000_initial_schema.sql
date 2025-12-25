-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Boards table
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Board elements table
CREATE TABLE board_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'image')),
  content TEXT NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  size JSONB NOT NULL DEFAULT '{"width": 200, "height": 200}',
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_elements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
CREATE POLICY "Users can view all boards"
  ON boards FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own boards"
  ON boards FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own boards"
  ON boards FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for board_elements
CREATE POLICY "Users can view all board elements"
  ON board_elements FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create board elements"
  ON board_elements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own board elements"
  ON board_elements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own board elements"
  ON board_elements FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_board_elements_board_id ON board_elements(board_id);
CREATE INDEX idx_board_elements_user_id ON board_elements(user_id);
CREATE INDEX idx_boards_owner_id ON boards(owner_id);

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE boards;
ALTER PUBLICATION supabase_realtime ADD TABLE board_elements;

