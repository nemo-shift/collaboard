'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBoardByInviteCode, joinBoard } from '@features/board/api';
import { useAuth } from '@features/auth';

export default function InviteBoardPage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params?.inviteCode as string;
  const { user } = useAuth();

  useEffect(() => {
    if (!inviteCode) return;

    const loadBoardAndJoin = async () => {
      try {
        const board = await getBoardByInviteCode(inviteCode);
        if (board) {
          // 로그인한 사용자이고, 소유자가 아닌 경우 자동 참여
          if (user?.id && board.ownerId !== user.id) {
            try {
              await joinBoard(board.id, user.id);
            } catch (error) {
              console.error('Failed to join board:', error);
              // 참여 실패해도 보드는 볼 수 있음
            }
          }
          // 보드 페이지로 이동 (비공개 보드인 경우 board-page에서 모달 처리)
          router.replace(`/board/${board.id}`);
        } else {
          // 보드를 찾을 수 없거나 접근 불가 (초대코드가 유효하지 않거나 삭제됨)
          router.replace('/');
        }
      } catch (error) {
        console.error('Failed to load board by invite code:', error);
        // 에러 발생 시 홈으로 이동
        router.replace('/');
      }
    };

    loadBoardAndJoin();
  }, [inviteCode, router, user?.id]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-gray-600">보드를 불러오는 중...</p>
      </div>
    </div>
  );
}

