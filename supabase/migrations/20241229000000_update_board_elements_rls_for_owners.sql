-- 보드 소유자가 모든 요소를 수정/삭제할 수 있도록 RLS 정책 업데이트

-- 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Users can update their own board elements" ON board_elements;

-- 새로운 UPDATE 정책: 자신이 만든 요소이거나 보드 소유자인 경우 수정 가능
CREATE POLICY "Users can update their own board elements or board owner can update any"
  ON board_elements FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 
      FROM boards 
      WHERE boards.id = board_elements.board_id 
      AND boards.owner_id = auth.uid()
    )
  );

-- 기존 DELETE 정책 삭제
DROP POLICY IF EXISTS "Users can delete their own board elements" ON board_elements;

-- 새로운 DELETE 정책: 자신이 만든 요소이거나 보드 소유자인 경우 삭제 가능
CREATE POLICY "Users can delete their own board elements or board owner can delete any"
  ON board_elements FOR DELETE
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 
      FROM boards 
      WHERE boards.id = board_elements.board_id 
      AND boards.owner_id = auth.uid()
    )
  );


