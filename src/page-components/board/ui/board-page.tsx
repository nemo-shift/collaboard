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
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileBannerVisible, setIsMobileBannerVisible] = useState(false);

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

  // 모바일 감지 및 배너 표시 여부 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      
      // 모바일이고, "다시 보지 않기"를 선택하지 않았으면 배너 표시
      if (mobile) {
        const dismissed = localStorage.getItem('mobile-banner-dismissed') === 'true';
        setIsMobileBannerVisible(!dismissed);
      } else {
        setIsMobileBannerVisible(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 배너 닫기 (일시)
  const handleBannerClose = useCallback(() => {
    setIsMobileBannerVisible(false);
    // 배너가 닫히면 CSS 변수 제거
    document.documentElement.style.setProperty('--mobile-banner-height', '0px');
  }, []);

  // 배너 영구 닫기
  const handleBannerDismiss = useCallback(() => {
    setIsMobileBannerVisible(false);
    localStorage.setItem('mobile-banner-dismissed', 'true');
    // 배너가 닫히면 CSS 변수 제거
    document.documentElement.style.setProperty('--mobile-banner-height', '0px');
  }, []);

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

  // 포스트잇/이미지/텍스트 추가 모드 변경 (권한 체크 포함)
  const handleAddModeChange = useCallback((mode: 'note' | 'image' | 'text' | null) => {
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

      {/* 모바일 안내 배너 */}
      {isMobile && isMobileBannerVisible && (
        <div 
          className={`fixed left-0 right-0 z-30 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2.5 flex items-center gap-2 animate-slide-down shadow-sm`}
          style={{ 
            top: `calc(64px + var(--board-toolbar-height, 57px))`,
          }}
          ref={(el) => {
            // 배너 높이를 CSS 변수로 설정
            if (el) {
              const height = el.offsetHeight;
              document.documentElement.style.setProperty('--mobile-banner-height', `${height}px`);
            }
          }}
        >
          {/* 스마트폰 아이콘 */}
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          
          {/* 안내 문구 */}
          <p className="text-xs text-yellow-800 dark:text-yellow-200 flex-1">
            모바일 환경에서는 일부 기능이 제한될 수 있습니다. 원활한 이용을 위해 PC 사용을 권장드립니다.
          </p>
          
          {/* 버튼 그룹 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleBannerDismiss}
              className="text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 underline transition-colors px-2 py-1"
              aria-label="다시 보지 않기"
            >
              다시 보지 않기
            </button>
            <button
              onClick={handleBannerClose}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors p-1"
              aria-label="닫기"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 보드 캔버스 - fixed 툴바 아래에 위치하도록 여백 추가 (헤더 64px + 보드 툴바 높이) */}
      <div 
        className="flex-1 relative transition-all duration-300 ease-out" 
        data-board-canvas
        style={{
          marginTop: isMobile && isMobileBannerVisible ? '40px' : '0',
        }}
      >
        {/* 협업 위젯 - 보드 위에 플로팅 */}
        {!isModalOpen && (
        <CollaborationWidget
          cursors={cursors}
          currentUserId={currentUser.userId}
          currentUserName={currentUser.userName ?? undefined}
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
        <div className={`absolute bottom-4 left-4 right-4 sm:right-auto ${classes.bg} ${classes.border} rounded-lg shadow-lg px-3 sm:px-4 py-2 text-xs sm:text-sm ${classes.textMuted}`}>
          {addMode === 'note'
            ? '캔버스를 클릭하여 포스트잇을 추가하세요'
            : addMode === 'image'
            ? '이미지를 선택한 후 캔버스를 클릭하세요'
            : '캔버스를 클릭하여 텍스트를 추가하세요'}
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
