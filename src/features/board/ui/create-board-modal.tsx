'use client';

import { useState } from 'react';
import { Button, Input } from '@shared/ui';
import { useTheme } from '@shared/lib';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; isPublic: boolean }) => Promise<void>;
  isLoading?: boolean;
}

export const CreateBoardModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateBoardModalProps) => {
  const { classes } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true); // 기본값: 공개
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('보드 이름을 입력해주세요.');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      // 성공 시 폼 초기화
      setName('');
      setDescription('');
      setIsPublic(true); // 기본값: 공개
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '보드 생성에 실패했습니다.');
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPublic(true); // 기본값: 공개
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`${classes.bgSurface} rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 ${classes.border}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${classes.text}`}>새 보드 만들기</h2>
          <button
            type="button"
            onClick={handleClose}
            className={`${classes.textMuted} hover:${classes.text} transition-colors`}
            disabled={isLoading}
            aria-label="모달 닫기"
          >
            <svg
              className="w-6 h-6"
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

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Input
              id="board-name"
              name="name"
              type="text"
              label="보드 이름"
              placeholder="보드 이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="board-description" className={`block text-sm font-medium mb-2 ${classes.textBody}`}>
              보드 설명 (선택)
            </label>
            <textarea
              id="board-description"
              name="description"
              placeholder="보드에 대한 설명을 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isLoading}
              className={`w-full px-4 py-2.5 ${classes.border} rounded-lg ${classes.bgSurfaceSubtle} ${classes.textBody} focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] transition-all disabled:cursor-not-allowed resize-none`}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="board-private"
              name="isPrivate"
              checked={!isPublic}
              onChange={(e) => setIsPublic(!e.target.checked)}
              disabled={isLoading}
              className={`w-4 h-4 ${classes.text} ${classes.border} rounded focus:ring-[var(--color-primary-main)] focus:ring-2`}
            />
            <label htmlFor="board-private" className={`text-sm cursor-pointer ${classes.textBody}`}>
              비공개 보드로 만들기
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2.5"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-6 py-2.5"
            >
              {isLoading ? '생성 중...' : '보드 만들기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

