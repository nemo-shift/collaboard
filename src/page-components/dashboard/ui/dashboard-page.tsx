'use client';

import { useState } from 'react';
import {
  BoardCard,
  CreateBoardModal,
  useBoardStats,
  useBoardSort,
  useCreateBoard,
  useBoardList,
  type SortOption,
} from '@features/board';
import { BoardStats } from '@widgets/board-stats';
import { Button } from '@shared/ui';
import { useTheme } from '@shared/lib';

export const DashboardPage = () => {
  // 정렬 상태 관리
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 실제 API로 보드 목록 조회
  const { boards, isLoading: isLoadingBoards, error: boardsError, refresh } = useBoardList();

  // 보드 생성 훅
  const { createNewBoard, isLoading: isCreating } = useCreateBoard();

  // 고정된 보드와 일반 보드 분리
  const pinnedBoards = boards.filter((board) => board.isPinned);
  const unpinnedBoards = boards.filter((board) => !board.isPinned);

  // 즐겨찾기 필터링이면 즐겨찾기한 보드만, 아니면 일반 보드 사용
  const boardsToSort = sortBy === 'starred' 
    ? boards.filter((board) => board.isStarred && !board.isPinned) // 고정된 보드는 제외
    : unpinnedBoards;

  // 정렬된 보드 목록 (즐겨찾기는 이미 필터링되었으므로 'recent'로 정렬)
  const sortOptionForSort = sortBy === 'starred' ? 'recent' : sortBy;
  const sortedBoards = useBoardSort({ boards: boardsToSort, sortBy: sortOptionForSort });

  // 고정된 보드 정렬 (최신순)
  const sortedPinnedBoards = useBoardSort({ boards: pinnedBoards, sortBy: 'recent' });

  // 통계 계산 (features에서 가져오기) - 전체 보드 기준
  const stats = useBoardStats({ boards });

  const handleCreateBoard = async (data: { name: string; description?: string; isPublic: boolean }) => {
    try {
      await createNewBoard(data);
      setIsCreateModalOpen(false);
      // 보드 목록 새로고침 (리다이렉트되므로 필요 없을 수 있지만 안전을 위해)
      await refresh();
    } catch (error) {
      // 에러는 모달에서 처리됨
      throw error;
    }
  };

  const { classes } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--color-base-bg)]">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-strong)] mb-2 tracking-tight">
              내 보드
            </h1>
            <p className="text-base sm:text-lg text-[var(--color-text-body)] dark:text-[var(--color-text-secondary)]">
              보드를 생성하고 아이디어를 공유하세요
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            새 보드 만들기
          </Button>
        </div>

        {/* 통계 섹션 */}
        <BoardStats
          totalBoards={stats.totalBoards}
          totalElements={stats.totalElements}
          recentActivity={stats.recentActivity}
          todayBoards={stats.todayBoards}
        />

        {/* 정렬 옵션 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-body)] dark:text-[var(--color-text-secondary)]">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 text-sm border border-[var(--color-border-default)] rounded-lg bg-[var(--color-surface-default)] text-[var(--color-text-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] transition-all"
            >
              <option value="recent">최신순</option>
              <option value="starred">즐겨찾기</option>
              <option value="name">이름순</option>
              <option value="created">생성일순</option>
              <option value="updated">수정일순</option>
              <option value="activity">내 활동순</option>
            </select>
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">
            {sortBy === 'starred' 
              ? `즐겨찾기 ${sortedBoards.length}개`
              : `총 ${unpinnedBoards.length}개 보드${sortedPinnedBoards.length > 0 ? ` (고정 ${sortedPinnedBoards.length}개)` : ''}`}
          </div>
        </div>

        {/* 에러 표시 */}
        {boardsError && (
          <div className="mb-6 p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg">
            <p className="text-sm text-[var(--color-error)]">{boardsError}</p>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoadingBoards ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-main)] mb-4"></div>
            <p className="text-[var(--color-text-muted)]">보드를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 고정된 보드 섹션 */}
            {sortedPinnedBoards.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5 text-[var(--color-primary-main)] dark:text-[var(--color-accent-lime-main)]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12M8.8,14L10,12.8V4H14V12.8L15.2,14H8.8Z" />
                  </svg>
                  <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">고정된 보드</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 mb-8">
                  {sortedPinnedBoards.map((board) => (
                    <BoardCard key={board.id} board={board} onUpdate={refresh} />
                  ))}
                </div>
              </div>
            )}

            {/* 즐겨찾기 또는 일반 보드 섹션 */}
            {sortBy === 'starred' ? (
              sortedBoards.length > 0 && (
                <>
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">즐겨찾기</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                    {sortedBoards.map((board) => (
                      <BoardCard key={board.id} board={board} onUpdate={refresh} />
                    ))}
                  </div>
                </>
              )
            ) : (
              <>
                {sortedPinnedBoards.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text-strong)] mb-4">모든 보드</h2>
                  </div>
                )}
                {/* Boards Grid */}
                {sortedBoards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                    {sortedBoards.map((board) => (
                      <BoardCard key={board.id} board={board} onUpdate={refresh} />
                    ))}
                  </div>
                ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative mb-10">
              {/* Empty Post-it Notes - 코카콜라 컨셉 */}
              <div className="w-56 h-56 bg-[var(--color-primary-tint)] dark:bg-[var(--color-accent-lime-tint)] rounded-2xl shadow-xl transform rotate-[-4deg] flex items-center justify-center border-2 border-[var(--color-primary-main)] dark:border-[var(--color-accent-lime-main)]">
                <svg
                  className="w-20 h-20 text-[var(--color-primary-main)] dark:text-[var(--color-accent-lime-main)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="absolute top-6 right-6 w-44 h-44 bg-[var(--color-secondary-tint)] dark:bg-[var(--color-accent-blue-tint)] rounded-xl shadow-lg transform rotate-[3deg] opacity-60 border-2 border-[var(--color-secondary-main)] dark:border-[var(--color-accent-blue-main)]" />
              <div className="absolute bottom-6 left-6 w-40 h-40 bg-[var(--color-surface-subtle)] dark:bg-[var(--color-surface-elevated)] rounded-xl shadow-lg transform rotate-[-3deg] opacity-60 border border-[var(--color-border-default)]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-strong)] mb-3">
              아직 보드가 없습니다
            </h2>
            <p className="text-[var(--color-text-body)] dark:text-[var(--color-text-secondary)] mb-8 text-center max-w-md text-base">
              첫 번째 보드를 만들어서 아이디어를 정리하고 팀과 공유해보세요
            </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                새 보드 만들기
              </Button>
            </div>
                )}
              </>
            )}
          </>
        )}

        {/* 보드 생성 모달 */}
        <CreateBoardModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateBoard}
          isLoading={isCreating}
        />
      </main>
    </div>
  );
};


