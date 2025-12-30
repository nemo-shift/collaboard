'use client';

import { useEffect, useRef, useMemo } from 'react';
import { supabase } from '@shared/api';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from './logger';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscriptionConfig {
  channelName: string;
  table: string;
  schema?: string;
  filter?: string;
  events?: RealtimeEvent[];
  enabled?: boolean;
}

export interface RealtimeSubscriptionCallbacks<T = unknown> {
  onInsert?: (payload: { new: unknown; old: unknown }) => Promise<T> | T | void;
  onUpdate?: (payload: { new: unknown; old: unknown }) => Promise<T> | T | void;
  onDelete?: (payload: { new: unknown; old: unknown }) => Promise<T> | T | void;
  shouldIgnore?: (payload: { new: unknown; old: unknown }, event: RealtimeEvent) => boolean;
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
export function useRealtimeSubscription<T = unknown>(
  config: RealtimeSubscriptionConfig,
  callbacks: RealtimeSubscriptionCallbacks<T>
): void {

  const {
    channelName: channelNameProp,
    table,
    schema = 'public',
    filter: filterProp,
    events: eventsProp = ['INSERT', 'UPDATE', 'DELETE'],
    enabled = true,
  } = config;

  // channelName과 filter를 메모이제이션하여 안정적인 의존성 보장
  const channelName = useMemo(() => channelNameProp, [channelNameProp]);
  const filter = useMemo(() => filterProp, [filterProp]);

  // events 배열을 직접 사용
  const events = eventsProp;
  
  // events 배열을 문자열로 변환하여 안정적인 의존성 생성
  const eventsKey = useMemo(() => {
    // 배열을 정렬하여 안정적인 키 생성
    const sorted = [...eventsProp].sort();
    return sorted.join(',');
  }, [eventsProp.length]); // 길이만 의존성으로 사용 (내용은 고정되어 있으므로)

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

  // 이전 값들을 저장하여 실제 변경 여부 확인
  const prevValuesRef = useRef({
    enabled,
    channelName,
    schema,
    table,
    filter,
    eventsKey,
  });

  // 함수 참조 업데이트
  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
    shouldIgnoreRef.current = shouldIgnore;
  }, [onInsert, onUpdate, onDelete, shouldIgnore]);

  // 메인 구독 useEffect
  // 이전 값과 비교하여 실제 변경이 있을 때만 실행
  useEffect(() => {
    const prev = prevValuesRef.current;
    const hasChanged = 
      prev.enabled !== enabled ||
      prev.channelName !== channelName ||
      prev.schema !== schema ||
      prev.table !== table ||
      prev.filter !== filter ||
      prev.eventsKey !== eventsKey;

    if (!hasChanged && channelRef.current) {
      // 값이 변경되지 않았고 이미 구독이 설정되어 있으면 실행하지 않음
      return;
    }

    // 이전 값 업데이트
    prevValuesRef.current = {
      enabled,
      channelName,
      schema,
      table,
      filter,
      eventsKey,
    };

    if (!enabled) {
      return;
    }

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
    if (events.includes('DELETE') || events.includes('*')) {
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema,
          table,
          filter,
        },
        async (payload) => {
          // payload.old가 없거나 유효하지 않은 경우 에러 로그만 출력
          if (!payload.old) {
            logger.error('[RealtimeSubscription] DELETE 이벤트: payload.old가 없습니다', payload);
            return;
          }
          
          if (!payload.old.id) {
            logger.error('[RealtimeSubscription] DELETE 이벤트: payload.old.id가 없습니다', payload);
            return;
          }
          
          if (shouldIgnoreRef.current?.(payload, 'DELETE')) {
            return;
          }
          
          if (onDeleteRef.current) {
            try {
              await onDeleteRef.current(payload);
            } catch (error) {
              logger.error('[RealtimeSubscription] DELETE 핸들러 에러:', error);
            }
          }
        }
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // 구독 성공 시에만 로그 출력 (선택적)
      }
    });
    channelRef.current = channel;

    return () => {
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
    // events 배열을 안정적으로 처리
    // eventsProp는 보통 상수 배열이므로 직접 사용
    // 하지만 의존성 배열에서 배열을 직접 사용하면 참조가 변경될 수 있으므로
    // eventsKey를 사용하되, eventsProp.length만 의존성으로 사용
    eventsKey,
    // 함수들은 ref로 관리하므로 의존성 배열에서 제거
  ]);
}

