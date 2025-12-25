'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { BoardCanvas } from '@widgets/board-canvas';
import { BoardToolbar } from '@widgets/board-toolbar';
import { CollaborationWidget } from '@widgets/collaboration-widget';
import { SignupRequiredModal, PrivateBoardModal, ToastContainer, type ToastType } from '@shared/ui';
import { useBoardContent } from '@features/content';
import { useCollaboration } from '@features/collaboration';
import { useBoardActions } from '@features/board';
import { useAuth } from '@features/auth';
import { getBoard, updateBoard } from '@features/board/api';
import { useRealtimeSubscription, fetchOwnerName } from '@shared/lib';
import { supabase } from '@shared/api';
import type { Board } from '@entities/board';
import { mapBoardRowToBoard } from '@entities/board/lib/board-mapper';

// 어나니머스 사용자 ID 생성 함수
function generateAnonymousUserId(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem('anonymous_user_id');
  if (stored) return stored;
  // 간단한 UUID 생성 (crypto.randomUUID가 없을 경우 대비)
  const newId = 'anon_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  localStorage.setItem('anonymous_user_id', newId);
  return newId;
}

export const BoardPage = () => {
  const params = useParams();
  const boardId = (params?.boardId as string) || '';
  const { user, userProfile, isAnonymous } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isPrivateBoardModalOpen, setIsPrivateBoardModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: ToastType; duration?: number }>>([]);

  // 어나니머스 사용자 ID (localStorage에 저장하여 일관성 유지)
  const anonymousUserId = useMemo(() => generateAnonymousUserId(), []);

  // 안정적인 userId 값 (dependency array 크기 일정하게 유지)
  const userId = useMemo(() => user?.id ?? '', [user?.id]);

  // 현재 사용자 정보
  const currentUser = useMemo(
    () => {
      if (isAnonymous || !user) {
        return {
          userId: anonymousUserId,
          userName: null, // 어나니머스는 null
        };
      }
      return {
        userId: user.id,
        userName: userProfile?.displayName || userProfile?.email?.split('@')[0] || '나',
      };
    },
    [isAnonymous, user, userProfile, anonymousUserId]
  );

  // 보드 정보 로드 및 페이지 스크롤 초기화
  useEffect(() => {
    // 페이지 상단으로 스크롤
    window.scrollTo(0, 0);

    if (!boardId) {
      setIsLoadingBoard(false);
      return;
    }

    const loadBoard = async () => {
      try {
        setIsLoadingBoard(true);
        // 어나니머스 사용자도 userId 전달 (빈 문자열이 아닌 실제 ID)
        const effectiveUserId = currentUser.userId || undefined;
        const fetchedBoard = await getBoard(boardId, effectiveUserId);
        setBoard(fetchedBoard);
        
        // 비공개 보드이고 소유자가 아닌 경우 접근 차단
        if (fetchedBoard && !fetchedBoard.isPublic) {
          // 로그인한 사용자의 실제 ID 사용 (익명 사용자 ID가 아닌)
          // user?.id가 없으면 currentUser.userId도 확인 (익명 사용자가 아닌 경우)
          const actualUserId = user?.id || (currentUser.userId && !currentUser.userId.startsWith('anon_') ? currentUser.userId : undefined);
          const isOwnerCheck = fetchedBoard.ownerId === actualUserId;
          
          // 디버깅: 소유자 확인 로그
          if (process.env.NODE_ENV === 'development') {
            console.log('비공개 보드 체크:', {
              boardId: fetchedBoard.id,
              boardOwnerId: fetchedBoard.ownerId,
              actualUserId,
              userObject: user,
              userObjectId: user?.id,
              currentUserId: currentUser.userId,
              isPublic: fetchedBoard.isPublic,
              isOwnerCheck,
              isAnonymous,
            });
          }
          
          // 소유자가 아닌 경우 모달 표시 (비로그인 유저 포함)
          if (!isOwnerCheck) {
            setIsPrivateBoardModalOpen(true);
          }
        }
      } catch (error) {
        console.error('Failed to load board:', error);
      } finally {
        setIsLoadingBoard(false);
      }
    };

    loadBoard();
  }, [boardId, currentUser.userId, user]);

  // 보드 정보 Realtime 구독 (이름, 설명, 공개/비공개 변경 감지)
  const handleRealtimeBoardUpdate = useCallback(async (payload: { new: any; old: any }) => {
    const updatedRow = payload.new as any;
    
    // 현재 사용자 정보
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // 소유자 이름 조회
    const ownerName = await fetchOwnerName(updatedRow.owner_id, currentUser?.id);

    // 사용자 선호도 조회 (기존 board에서 가져오기)
    const effectiveUserId = currentUser?.id || undefined;
    let isStarred = false;
    let isPinned = false;
    if (effectiveUserId && !effectiveUserId.startsWith('anon_')) {
      try {
        const { data: preferences } = await supabase
          .from('user_board_preferences')
          .select('is_starred, is_pinned')
          .eq('board_id', boardId)
          .eq('user_id', effectiveUserId)
          .maybeSingle();
        
        if (preferences) {
          isStarred = preferences.is_starred || false;
          isPinned = preferences.is_pinned || false;
        }
      } catch (err) {
        // 에러 무시 (익명 사용자 등)
      }
    }

    // 요소 개수는 기존 board에서 가져오기
    const elementCount = board?.elementCount || 0;

    const boardRow = {
      id: updatedRow.id,
      name: updatedRow.name,
      description: updatedRow.description,
      owner_id: updatedRow.owner_id,
      created_at: updatedRow.created_at,
      updated_at: updatedRow.updated_at,
      is_public: updatedRow.is_public,
      owner_name: ownerName,
      element_count: elementCount,
      is_starred: isStarred,
      is_pinned: isPinned,
      my_last_activity_at: board?.myLastActivityAt,
      invite_code: updatedRow.invite_code || undefined,
    };

    const updatedBoard = mapBoardRowToBoard(boardRow);
    
    // 보드 정보 업데이트
    setBoard(updatedBoard);
  }, [boardId, board]);

  useRealtimeSubscription(
    {
      channelName: `board:${boardId}:info`,
      table: 'boards',
      filter: `id=eq.${boardId}`,
      events: ['UPDATE'],
      enabled: !!boardId,
    },
    {
      onUpdate: handleRealtimeBoardUpdate,
    }
  );

  // 현재 사용자가 보드 소유자인지 확인 (메모이제이션)
  const isOwner = useMemo(() => {
    return board?.ownerId === currentUser.userId;
  }, [board?.ownerId, currentUser.userId]);

  // boardOwnerId를 안정화 (메모이제이션)
  const boardOwnerId = useMemo(() => {
    return board?.ownerId || '';
  }, [board?.ownerId]);

  // 현재 사용자 정보를 안정적인 값으로 추출
  const currentUserId = useMemo(() => currentUser.userId, [currentUser.userId]);
  const currentUserName = useMemo(() => currentUser.userName, [currentUser.userName]);

  // 협업 로직 (커서)
  const { cursors } = useCollaboration({
    boardId,
    currentUserId,
    currentUserName,
  });

  // 토스트 표시 함수
  const showToast = useCallback((message: string, type: ToastType = 'warning', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // 콘텐츠 관리 로직 (포스트잇, 이미지)
  const { elements, handlers } = useBoardContent({
    boardId,
    currentUserId,
    currentUserName,
    boardOwnerId,
    isOwner,
    onPermissionDenied: showToast,
  });

  // 보드 액션 로직 (툴바, 파일 업로드)
  const {
    addMode,
    setAddMode,
    fileInputRef,
    handleImageButtonClick,
    handleFileSelect,
    handleAddImageWithFile,
  } = useBoardActions();

  // 이미지 추가 핸들러 래핑
  const handleAddImageWithFileWrapper = (position: { x: number; y: number }) => {
    handleAddImageWithFile(position, handlers.onAddImage);
  };

  // 보드 업데이트 핸들러
  const handleBoardUpdate = async (updates: { name?: string; description?: string; isPublic?: boolean }) => {
    if (!boardId) return;
    
    try {
      const updatedBoard = await updateBoard(boardId, updates);
      setBoard(updatedBoard);
      
      // isPublic이 변경된 경우 보드 정보 다시 로드 (inviteCode 반영)
      if (updates.isPublic !== undefined) {
        const effectiveUserId = currentUser.userId || undefined;
        const refreshedBoard = await getBoard(boardId, effectiveUserId);
        if (refreshedBoard) {
          setBoard(refreshedBoard);
        }
      }
    } catch (error) {
      console.error('Failed to update board:', error);
      throw error;
    }
  };

  // 익명 사용자가 작업 시도 시 체크 (모든 보드에서 익명 사용자는 작업 불가)
  const checkCanEdit = useCallback(() => {
    if (isAnonymous) {
      setIsSignupModalOpen(true);
      return false;
    }
    return true;
  }, [isAnonymous]);

  // 작업 핸들러 래핑
  const handleAddNote = useCallback((position: { x: number; y: number }) => {
    if (!checkCanEdit()) return;
    handlers.onAddNote(position);
    setAddMode(null);
  }, [checkCanEdit, handlers, setAddMode]);

  const handleAddImage = useCallback((position: { x: number; y: number }) => {
    if (!checkCanEdit()) return;
    handleAddImageWithFileWrapper(position);
  }, [checkCanEdit, handleAddImageWithFileWrapper]);

  const handleElementMove = useCallback((elementId: string, position: { x: number; y: number }, isDragging?: boolean) => {
    if (!checkCanEdit()) return;
    handlers.onElementMove(elementId, position, isDragging);
  }, [checkCanEdit, handlers]);

  const handleElementResize = useCallback((elementId: string, size: { width: number; height: number }) => {
    if (!checkCanEdit()) return;
    handlers.onElementResize(elementId, size);
  }, [checkCanEdit, handlers]);

  const handleElementUpdate = useCallback((elementId: string, content: string) => {
    if (!checkCanEdit()) return;
    handlers.onElementUpdate(elementId, content);
  }, [checkCanEdit, handlers]);

  const handleElementColorChange = useCallback((elementId: string, color: string) => {
    if (!checkCanEdit()) return;
    handlers.onElementColorChange(elementId, color);
  }, [checkCanEdit, handlers]);

  const handleElementDelete = useCallback((elementId: string) => {
    if (!checkCanEdit()) return;
    handlers.onElementDelete(elementId);
  }, [checkCanEdit, handlers]);

  // 포스트잇 추가 버튼 클릭 시 체크
  const handleAddModeChange = useCallback((mode: 'note' | 'image' | null) => {
    if (mode && !checkCanEdit()) {
      return;
    }
    setAddMode(mode);
  }, [checkCanEdit, setAddMode]);

  // 이미지 업로드 버튼 클릭 시 체크
  const handleImageButtonClickWrapper = useCallback(() => {
    if (!checkCanEdit()) {
      return;
    }
    handleImageButtonClick();
  }, [checkCanEdit, handleImageButtonClick]);

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* 툴바 */}
      <BoardToolbar
        boardName={board?.name || (isLoadingBoard ? '로딩 중...' : '보드를 찾을 수 없습니다')}
        boardDescription={board?.description}
        boardId={boardId}
        inviteCode={board?.inviteCode}
        isPublic={board?.isPublic ?? false}
        addMode={addMode}
        onAddModeChange={handleAddModeChange}
        onImageButtonClick={handleImageButtonClickWrapper}
        fileInputRef={fileInputRef}
        onFileSelect={handleFileSelect}
        onBoardUpdate={handleBoardUpdate}
        isOwner={isOwner}
      />

      {/* 보드 캔버스 */}
      <div className="flex-1 relative" data-board-canvas>
        {/* 협업 위젯 - 보드 위에 플로팅 */}
        <CollaborationWidget
          cursors={cursors}
          currentUserId={currentUser.userId}
          currentUserName={currentUser.userName}
        />

        <BoardCanvas
          boardId={boardId}
          elements={elements}
          cursors={cursors}
          onElementMove={handleElementMove}
          onElementResize={handleElementResize}
          onElementUpdate={handleElementUpdate}
          onElementColorChange={handleElementColorChange}
          onElementDelete={handleElementDelete}
          onAddNote={handleAddNote}
          onAddImage={handleAddImage}
          addMode={addMode}
          canEdit={!isAnonymous}
          onEditBlocked={() => setIsSignupModalOpen(true)}
          isOwner={isOwner}
          currentUserId={currentUser.userId}
        />
      </div>

      {/* 추가 모드 안내 */}
      {addMode && (
        <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-700">
          {addMode === 'note'
            ? '캔버스를 클릭하여 포스트잇을 추가하세요'
            : '이미지를 선택한 후 캔버스를 클릭하세요'}
        </div>
      )}

      {/* 회원가입 유도 모달 */}
      <SignupRequiredModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />

      {/* 비공개 보드 접근 차단 모달 */}
      <PrivateBoardModal
        isOpen={isPrivateBoardModalOpen}
        onClose={() => setIsPrivateBoardModalOpen(false)}
        boardName={board?.name}
        isAuthenticated={!isAnonymous && !!user}
      />

      {/* 토스트 알림 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};
