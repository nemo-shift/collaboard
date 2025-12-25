'use client';

import { useEffect, useRef, useMemo } from 'react';
import { supabase } from '@shared/api';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscriptionConfig {
  channelName: string;
  table: string;
  schema?: string;
  filter?: string;
  events?: RealtimeEvent[];
  enabled?: boolean;
}

export interface RealtimeSubscriptionCallbacks<T = any> {
  onInsert?: (payload: { new: any; old: any }) => Promise<T> | T | void;
  onUpdate?: (payload: { new: any; old: any }) => Promise<T> | T | void;
  onDelete?: (payload: { new: any; old: any }) => Promise<T> | T | void;
  shouldIgnore?: (payload: { new: any; old: any }, event: RealtimeEvent) => boolean;
}

/**
 * Supabase Realtime 구독을 위한 재사용 가능한 훅
 * 
 * @purpose
 * Supabase Realtime의 postgres_changes 이벤트를 구독하는 공통 로직을 제공합니다.
 * 여러 테이블(board_elements, boards, user_board_preferences 등)의 변경사항을
 * 실시간으로 감지하고 처리할 수 있습니다.
 * 
 * @features
 * - INSERT, UPDATE, DELETE 이벤트 구독
 * - 필터링 지원 (특정 board_id, user_id 등)
 * - 자신의 변경사항 무시 옵션
 * - 자동 cleanup (언마운트 시)
 * 
 * @param {RealtimeSubscriptionConfig} config - 구독 설정
 * @param {string} config.channelName - 채널 이름 (고유해야 함)
 * @param {string} config.table - 테이블 이름
 * @param {string} [config.schema='public'] - 스키마 이름
 * @param {string} [config.filter] - 필터 조건 (예: 'board_id=eq.xxx')
 * @param {RealtimeEvent[]} [config.events=['INSERT', 'UPDATE', 'DELETE']] - 구독할 이벤트
 * @param {boolean} [config.enabled=true] - 구독 활성화 여부
 * 
 * @param {RealtimeSubscriptionCallbacks} callbacks - 이벤트 핸들러
 * @param {Function} [callbacks.onInsert] - INSERT 이벤트 핸들러
 * @param {Function} [callbacks.onUpdate] - UPDATE 이벤트 핸들러
 * @param {Function} [callbacks.onDelete] - DELETE 이벤트 핸들러
 * @param {Function} [callbacks.shouldIgnore] - 이벤트 무시 여부 판단 함수
 * 
 * @example
 * ```tsx
 * useRealtimeSubscription({
 *   channelName: `board:${boardId}:elements`,
 *   table: 'board_elements',
 *   filter: `board_id=eq.${boardId}`,
 *   events: ['INSERT', 'UPDATE', 'DELETE'],
 *   onInsert: async (payload) => {
 *     // 새 요소 추가 처리
 *   },
 *   onUpdate: async (payload) => {
 *     // 요소 업데이트 처리
 *   },
 *   shouldIgnore: (payload) => {
 *     // 자신의 변경사항 무시
 *     return payload.new.user_id === currentUserId;
 *   },
 * });
 * ```
 */
export function useRealtimeSubscription<T = any>(
  config: RealtimeSubscriptionConfig,
  callbacks: RealtimeSubscriptionCallbacks<T>
): void {
  console.log('[RealtimeSubscription] 훅 호출:', {
    channelName: config.channelName,
    table: config.table,
    enabled: config.enabled,
  });

  const {
    channelName,
    table,
    schema = 'public',
    filter,
    events: eventsProp = ['INSERT', 'UPDATE', 'DELETE'],
    enabled = true,
  } = config;

  // events 배열을 메모이제이션하여 의존성 배열 안정화
  const eventsString = useMemo(() => eventsProp.join(','), [eventsProp.join(',')]);
  const events = useMemo(() => eventsProp, [eventsString]);

  const {
    onInsert,
    onUpdate,
    onDelete,
    shouldIgnore,
  } = callbacks;

  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // 함수 참조를 ref로 저장하여 안정성 확보
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  const shouldIgnoreRef = useRef(shouldIgnore);

  // 함수 참조 업데이트
  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
    shouldIgnoreRef.current = shouldIgnore;
  }, [onInsert, onUpdate, onDelete, shouldIgnore]);

  useEffect(() => {
    // 즉시 로그 출력 (가장 먼저)
    console.log('[RealtimeSubscription] ⚡⚡⚡ useEffect 실행 시작:', {
      channelName,
      table,
      enabled,
      events: events.join(','),
      timestamp: Date.now(),
    });
    
    console.log('[RealtimeSubscription] ⚡ useEffect 실행 상세:', {
      channelName,
      table,
      enabled,
      events: events.join(','),
      hasOnInsert: !!onInsert,
      hasOnUpdate: !!onUpdate,
      hasOnDelete: !!onDelete,
      hasShouldIgnore: !!shouldIgnore,
      includesDELETE: events.includes('DELETE'),
      includesUPDATE: events.includes('UPDATE'),
      includesINSERT: events.includes('INSERT'),
    });

    if (!enabled) {
      console.log('[RealtimeSubscription] 구독 비활성화:', { channelName, table });
      return;
    }

    console.log('[RealtimeSubscription] 구독 시작:', {
      channelName,
      table,
      schema,
      filter,
      events: events.join(','),
      hasOnInsert: !!onInsert,
      hasOnUpdate: !!onUpdate,
      hasOnDelete: !!onDelete,
      hasShouldIgnore: !!shouldIgnore,
    });

    const channel = supabase.channel(channelName);

    // INSERT 이벤트
    if (events.includes('INSERT') || events.includes('*')) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema,
          table,
          filter,
        },
        async (payload) => {
          if (shouldIgnoreRef.current?.(payload, 'INSERT')) {
            return;
          }
          if (onInsertRef.current) {
            await onInsertRef.current(payload);
          }
        }
      );
    }

    // UPDATE 이벤트
    if (events.includes('UPDATE') || events.includes('*')) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema,
          table,
          filter,
        },
        async (payload) => {
          if (shouldIgnoreRef.current?.(payload, 'UPDATE')) {
            return;
          }
          if (onUpdateRef.current) {
            await onUpdateRef.current(payload);
          }
        }
      );
    }

    // DELETE 이벤트
    console.log('[RealtimeSubscription] 🔍 DELETE 이벤트 체크:', {
      channelName,
      table,
      events: events.join(','),
      includesDELETE: events.includes('DELETE'),
      includesStar: events.includes('*'),
      willRegister: events.includes('DELETE') || events.includes('*'),
      hasOnDelete: !!onDeleteRef.current,
    });
    
    if (events.includes('DELETE') || events.includes('*')) {
      console.log('[RealtimeSubscription] ✅ DELETE 이벤트 리스너 등록:', {
        channelName,
        table,
        filter,
        hasShouldIgnore: !!shouldIgnoreRef.current,
        hasOnDelete: !!onDeleteRef.current,
      });
      
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema,
          table,
          filter,
        },
        async (payload) => {
          console.log('[RealtimeSubscription] DELETE 이벤트 수신:', {
            channelName,
            table,
            filter,
            payload,
            oldId: payload.old?.id,
            newId: payload.new?.id,
          });
          
          if (shouldIgnoreRef.current?.(payload, 'DELETE')) {
            console.log('[RealtimeSubscription] DELETE 이벤트 shouldIgnore=true, 무시됨');
            return;
          }
          
          console.log('[RealtimeSubscription] DELETE 이벤트 처리 진행');
          
          if (onDeleteRef.current) {
            console.log('[RealtimeSubscription] DELETE 핸들러 호출 시작');
            try {
              await onDeleteRef.current(payload);
              console.log('[RealtimeSubscription] DELETE 핸들러 호출 완료');
            } catch (error) {
              console.error('[RealtimeSubscription] DELETE 핸들러 에러:', error);
            }
          } else {
            console.warn('[RealtimeSubscription] DELETE 핸들러가 없습니다');
          }
        }
      );
    }

    channel.subscribe((status) => {
      console.log('[RealtimeSubscription] 구독 상태:', {
        channelName,
        table,
        status,
      });
    });
    channelRef.current = channel;

    return () => {
      console.log('[RealtimeSubscription] 🗑️ cleanup 실행:', { 
        channelName, 
        table,
        timestamp: Date.now(),
      });
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    enabled,
    channelName,
    schema,
    table,
    filter,
    eventsString, // 메모이제이션된 문자열 사용
    // 함수들은 ref로 관리하므로 의존성 배열에서 제거
  ]);
}

