'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@shared/api';
import type { CursorPosition } from '@entities/element';
import { generateUserColor } from '@shared/lib';

interface UseCollaborationProps {
  boardId: string;
  currentUserId: string; // 로그인한 경우 userId, 어나니머스는 랜덤 UUID
  currentUserName: string | null; // 로그인한 경우 이름, 어나니머스는 null
  currentUserColor?: string; // 사용자 색상
}

interface UseCollaborationReturn {
  cursors: CursorPosition[];
}

export const useCollaboration = ({
  boardId,
  currentUserId,
  currentUserName,
  currentUserColor,
}: UseCollaborationProps): UseCollaborationReturn => {
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const channelRef = useRef<any>(null);
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scaleRef = useRef<number>(1);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 현재 사용자 색상
  const userColor = currentUserColor || generateUserColor(currentUserId);

  // 마우스 위치 브로드캐스트 (throttle 적용)
  const broadcastCursor = useCallback((x: number, y: number) => {
    if (!channelRef.current) return;

    mousePositionRef.current = { x, y };

    // throttle: 100ms마다 한 번만 전송
    if (throttleTimerRef.current) return;

    throttleTimerRef.current = setTimeout(() => {
      channelRef.current?.track({
        userId: currentUserId,
        userName: currentUserName,
        x,
        y,
        color: userColor,
        updatedAt: new Date().toISOString(),
      });
      throttleTimerRef.current = null;
    }, 100);
  }, [currentUserId, currentUserName, userColor]);

  useEffect(() => {
    if (!boardId) return;

    // Realtime 채널 구독
    const channel = supabase
      .channel(`board:${boardId}:cursors`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const cursorList: CursorPosition[] = [];

        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: any) => {
            // 자신의 커서는 제외
            if (presence.userId !== currentUserId) {
              cursorList.push({
                userId: presence.userId,
                userName: presence.userName || 'Anonymous',
                x: presence.x || 0,
                y: presence.y || 0,
                color: presence.color || generateUserColor(presence.userId),
              });
            }
          });
        });

        setCursors(cursorList);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // 새 사용자 참여
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // 사용자 떠남
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // 초기 presence 전송
          await channel.track({
            userId: currentUserId,
            userName: currentUserName,
            x: 0,
            y: 0,
            color: userColor,
            updatedAt: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    // 마우스 이동 이벤트 리스너
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('[data-collaboration-widget]')) {
        return;
      }

      // 캔버스 내부 마우스 위치 계산
      const canvas = document.querySelector('[data-board-canvas]') as HTMLElement;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        // 실제 보드 좌표로 변환 (scale, offset 고려)
        const scale = scaleRef.current;
        const offset = offsetRef.current;
        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;
        broadcastCursor(x, y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [boardId, currentUserId, currentUserName, userColor, broadcastCursor]);

  // scale과 offset을 외부에서 업데이트할 수 있도록 ref 노출
  // (BoardCanvas에서 사용)
  useEffect(() => {
    // BoardCanvas의 scale과 offset을 감지하기 위한 커스텀 이벤트 리스너
    const handleScaleOffsetUpdate = (e: CustomEvent<{ scale: number; offset: { x: number; y: number } }>) => {
      scaleRef.current = e.detail.scale;
      offsetRef.current = e.detail.offset;
    };

    window.addEventListener('board-canvas-update' as any, handleScaleOffsetUpdate as EventListener);

    return () => {
      window.removeEventListener('board-canvas-update' as any, handleScaleOffsetUpdate as EventListener);
    };
  }, []);

  return {
    cursors,
  };
};

