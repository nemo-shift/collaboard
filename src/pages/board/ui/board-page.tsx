'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { BoardCanvas } from '@widgets/board-canvas';
import { BoardToolbar } from '@widgets/board-toolbar';
import { CollaborationWidget } from '@widgets/collaboration-widget';
import { SignupRequiredModal, PrivateBoardModal, ToastContainer, type ToastType } from '@shared/ui';
import { useBoardContent, useEditGuardedHandlers } from '@features/content';
import { useCollaboration } from '@features/collaboration';
import { useBoardActions, useBoardRealtimeUpdates } from '@features/board';
import { useAuth } from '@features/auth';
import { getBoard, updateBoard } from '@features/board/api';
import { generateAnonymousUserId, useTheme, logger } from '@shared/lib';
import type { Board } from '@entities/board';

export const BoardPage = () => {
  const params = useParams();
  const boardId = (params?.boardId as string) || '';
  const { user, userProfile, isAnonymous } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isPrivateBoardModalOpen, setIsPrivateBoardModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: ToastType; duration?: number }>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 어나니머스 사용자 ID (localStorage에 저장하여 일관성 유지)
  const anonymousUserId = useMemo(() => generateAnonymousUserId(), []);

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
          
          // 소유자가 아닌 경우 모달 표시 (비로그인 유저 포함)
          if (!isOwnerCheck) {
            setIsPrivateBoardModalOpen(true);
          }
        }
      } catch (error) {
        logger.error('Failed to load board:', error);
      } finally {
        setIsLoadingBoard(false);
      }
    };

    loadBoard();
  }, [boardId, currentUser.userId, user]);

  // 보드 정보 Realtime 구독 (이름, 설명, 공개/비공개 변경 감지)
  useBoardRealtimeUpdates({
    boardId,
    board,
    setBoard,
  });

  // 현재 사용자가 보드 소유자인지 확인 (메모이제이션)
  const isOwner = useMemo(() => {
    return board?.ownerId === currentUser.userId;
  }, [board?.ownerId, currentUser.userId]);

  // boardOwnerId를 안정화 (메모이제이션)
  const boardOwnerId = useMemo(() => {
    return board?.ownerId || '';
  }, [board?.ownerId]);

  // 협업 로직 (커서)
  const { cursors } = useCollaboration({
    boardId,
    currentUserId: currentUser.userId,
    currentUserName: currentUser.userName,
  });

  // 토스트 표시 함수
  const showToast = useCallback((message: string, type: ToastType = 'warning', duration = 3000) => {
    // 권한 관련 메시지는 error 타입으로
    const isPermissionError = message.includes('권한이 없습니다');
    const finalType = isPermissionError ? 'error' : type;
    
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type: finalType, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // 콘텐츠 관리 로직 (포스트잇, 이미지)
  const { elements, handlers } = useBoardContent({
    boardId,
    currentUserId: currentUser.userId,
    currentUserName: currentUser.userName,
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
      logger.error('Failed to update board:', error);
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

  // 편집 권한이 보호된 핸들러들
  const guardedHandlers = useEditGuardedHandlers({
    handlers: {
      ...handlers,
      // onAddNote는 addMode를 null로 설정하는 추가 로직이 필요
      onAddNote: (position: { x: number; y: number }) => {
        handlers.onAddNote(position);
        setAddMode(null);
      },
      // onAddImage는 handleAddImageWithFile를 직접 호출
      onAddImage: (position: { x: number; y: number }) => {
        handleAddImageWithFile(position, handlers.onAddImage);
      },
      // onAddText는 addMode를 null로 설정하는 추가 로직이 필요
      onAddText: (position: { x: number; y: number }) => {
        handlers.onAddText?.(position);
        setAddMode(null);
      },
    },
    checkCanEdit,
    onPermissionDenied: () => setIsSignupModalOpen(true),
  });

  // 포스트잇/이미지 추가 모드 변경 (권한 체크 포함)
  const handleAddModeChange = useCallback((mode: 'note' | 'image' | null) => {
    if (mode && !checkCanEdit()) {
      return;
    }
    setAddMode(mode);
  }, [checkCanEdit, setAddMode]);

  // 이미지 업로드 버튼 클릭 핸들러 (권한 체크 후 파일 선택 다이얼로그 열기)
  const handleImageButtonClickWithCheck = useCallback(() => {
    if (!checkCanEdit()) {
      return;
    }
    handleImageButtonClick();
  }, [checkCanEdit, handleImageButtonClick]);

  const { classes } = useTheme();

  return (
    <div className={`flex flex-col h-screen ${classes.bg}`}>

      {/* 툴바 */}
      <BoardToolbar
        boardName={board?.name || (isLoadingBoard ? '로딩 중...' : '보드를 찾을 수 없습니다')}
        boardDescription={board?.description}
        boardId={boardId}
        inviteCode={board?.inviteCode}
        isPublic={board?.isPublic ?? false}
        addMode={addMode}
        onAddModeChange={handleAddModeChange}
        onImageButtonClick={handleImageButtonClickWithCheck}
        fileInputRef={fileInputRef}
        onFileSelect={handleFileSelect}
        onBoardUpdate={handleBoardUpdate}
        isOwner={isOwner}
        onModalStateChange={setIsModalOpen}
        isAnonymous={isAnonymous}
        onEditBlocked={() => setIsSignupModalOpen(true)}
      />

      {/* 보드 캔버스 - fixed 툴바 아래에 위치하도록 여백 추가 (헤더 64px + 보드 툴바 높이) */}
      <div 
        className="flex-1 relative" 
        data-board-canvas
      >
        {/* 협업 위젯 - 보드 위에 플로팅 */}
        {!isModalOpen && (
        <CollaborationWidget
          cursors={cursors}
          currentUserId={currentUser.userId}
          currentUserName={currentUser.userName}
        />
        )}

        <BoardCanvas
          boardId={boardId}
          elements={elements}
          cursors={cursors}
          onElementMove={guardedHandlers.onElementMove}
          onElementResize={guardedHandlers.onElementResize}
          onElementUpdate={guardedHandlers.onElementUpdate}
          onElementColorChange={guardedHandlers.onElementColorChange}
          onElementStyleChange={guardedHandlers.onElementStyleChange}
          onElementZIndexChange={guardedHandlers.onElementZIndexChange}
          onElementDelete={guardedHandlers.onElementDelete}
          onAddNote={guardedHandlers.onAddNote}
          onAddImage={guardedHandlers.onAddImage}
          onAddText={guardedHandlers.onAddText}
          addMode={addMode}
          canEdit={!isAnonymous}
          onEditBlocked={() => setIsSignupModalOpen(true)}
          isOwner={isOwner}
          currentUserId={currentUser.userId}
          isModalOpen={isModalOpen}
        />
      </div>

      {/* 추가 모드 안내 */}
      {addMode && (
        <div className={`absolute bottom-4 left-4 ${classes.bg} ${classes.border} rounded-lg shadow-lg px-4 py-2 text-sm ${classes.textSecondary}`}>
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
