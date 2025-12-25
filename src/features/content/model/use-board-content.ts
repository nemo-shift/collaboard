'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { BoardElement } from '@entities/element';
// import { mockElements } from './mock-elements'; // 더미 데이터 주석 처리
import { calculateImageSize } from '../lib/calculate-image-size';
import { DEFAULT_NOTE_COLOR, DEFAULT_NOTE_SIZE } from '../lib/constants';
import {
  getBoardElements,
  createBoardElement,
  updateBoardElement,
  deleteBoardElement,
} from '@features/content/api';
import { uploadImage, deleteImage } from '@features/content/api/supabase/storage';
import { useRealtimeSubscription, fetchUserName } from '@shared/lib';
import {
  mapElementRowToElement,
  type BoardElementRowWithJoins,
} from '@entities/element/lib/element-mapper';

interface UseBoardContentProps {
  boardId: string;
  currentUserId: string;
  currentUserName?: string | null;
  initialElements?: BoardElement[]; // 초기 요소 데이터 (옵션)
  boardOwnerId?: string; // 보드 소유자 ID
  isOwner?: boolean; // 현재 사용자가 보드 소유자인지 여부
  onPermissionDenied?: (message: string) => void; // 권한 없을 때 콜백
}

interface UseBoardContentReturn {
  elements: BoardElement[];
  handlers: {
    onElementMove: (elementId: string, position: { x: number; y: number }, isDragging?: boolean) => void;
    onElementResize: (elementId: string, size: { width: number; height: number }) => void;
    onElementUpdate: (elementId: string, content: string) => void;
    onElementColorChange: (elementId: string, color: string) => void;
    onElementDelete: (elementId: string) => void;
    onAddNote: (position: { x: number; y: number }) => void;
    onAddImage: (position: { x: number; y: number }, file: File) => void;
  };
}

export const useBoardContent = ({
  boardId,
  currentUserId,
  currentUserName,
  initialElements,
  boardOwnerId,
  isOwner = false,
  onPermissionDenied,
}: UseBoardContentProps): UseBoardContentReturn => {
  // 초기 데이터: props로 받은 데이터가 있으면 사용, 없으면 API에서 가져오기
  const [elements, setElements] = useState<BoardElement[]>(initialElements || []);
  const [isLoading, setIsLoading] = useState(!initialElements);
  
  // 자신이 최근에 업데이트한 요소 추적 (Realtime 이벤트 무시용)
  // Map<elementId, timestamp>
  const recentlyUpdatedRef = useRef<Map<string, number>>(new Map());
  
  // 드래그 중인 요소 추적 (드래그 중에는 Realtime 이벤트를 더 오래 무시)
  // Map<elementId, dragStartTimestamp>
  const draggingElementsRef = useRef<Map<string, number>>(new Map());

  // 보드 요소 로드
  useEffect(() => {
    if (initialElements) {
      // 초기 데이터가 제공되면 사용
      return;
    }

    if (!boardId) {
      return;
    }

    const loadElements = async () => {
      try {
        setIsLoading(true);
        const fetchedElements = await getBoardElements(boardId);
        setElements(fetchedElements);
      } catch (error) {
        console.error('Failed to load board elements:', error);
        // 에러 발생 시 빈 배열 유지
      } finally {
        setIsLoading(false);
      }
    };

    loadElements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]); // initialElements는 dependency에서 제거 (참조 변경 방지)

  // Realtime 구독: board_elements 테이블 변경 감지
  const shouldIgnoreRealtimeEvent = useCallback(
    (payload: { new: any; old: any }, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`[Realtime ${event}] shouldIgnore 호출:`, {
        event,
        payload,
        currentUserId,
        hasOld: !!payload.old,
        hasNew: !!payload.new,
        oldId: payload.old?.id,
        newId: payload.new?.id,
      });

      // DELETE 이벤트는 payload.old에 삭제된 행 데이터가 있음
      if (event === 'DELETE') {
        const deletedRow = payload.old;
        console.log('[Realtime DELETE] shouldIgnore - 삭제된 행:', deletedRow);
        
        if (!deletedRow || !deletedRow.id) {
          console.log('[Realtime DELETE] shouldIgnore - id가 없음, 무시하지 않음');
          // id가 없으면 무시하지 않음 (다른 사용자의 삭제일 수 있음)
          return false;
        }
        
        const deletedId = deletedRow.id;
        const recentlyUpdated = recentlyUpdatedRef.current.get(deletedId);
        const timeSinceUpdate = recentlyUpdated ? Date.now() - recentlyUpdated : null;
        
        console.log('[Realtime DELETE] shouldIgnore - 삭제 추적 정보:', {
          deletedId,
          recentlyUpdated,
          timeSinceUpdate,
          willIgnore: recentlyUpdated && timeSinceUpdate && timeSinceUpdate < 1000,
        });
        
        if (recentlyUpdated && timeSinceUpdate && timeSinceUpdate < 1000) {
          // 자신이 최근에 삭제한 요소는 무시 (optimistic update와 중복 방지)
          console.log('[Realtime DELETE] shouldIgnore - 자신이 최근에 삭제한 요소 무시');
          return true;
        }
        
        // 다른 사용자가 삭제한 경우는 무시하지 않음 (실시간 반영)
        console.log('[Realtime DELETE] shouldIgnore - 다른 사용자의 삭제, 무시하지 않음');
        return false;
      }
      
      // INSERT, UPDATE는 payload.new 사용
      const row = payload.new;
      if (!row) {
        console.log(`[Realtime ${event}] shouldIgnore - payload.new가 없음`);
        return false;
      }
      
      // INSERT: 자신이 생성한 요소는 무시
      if (event === 'INSERT' && row.user_id === currentUserId) {
        console.log('[Realtime INSERT] shouldIgnore - 자신이 생성한 요소 무시');
        return true;
      }
      
      // UPDATE: 드래그 중이거나 최근 업데이트한 요소는 무시
      if (event === 'UPDATE') {
        const elementId = row.id;
        
        // 드래그 중인 요소 확인
        const dragStartTime = draggingElementsRef.current.get(elementId);
        if (dragStartTime && Date.now() - dragStartTime < 3000) {
          console.log('[Realtime UPDATE] shouldIgnore - 드래그 중인 요소 무시');
          return true;
        }
        if (dragStartTime) {
          draggingElementsRef.current.delete(elementId);
        }
        
        // 최근 업데이트한 요소 확인
        const recentlyUpdated = recentlyUpdatedRef.current.get(elementId);
        if (recentlyUpdated && Date.now() - recentlyUpdated < 1000) {
          console.log('[Realtime UPDATE] shouldIgnore - 최근 업데이트한 요소 무시');
          return true;
        }
      }
      
      console.log(`[Realtime ${event}] shouldIgnore - 무시하지 않음`);
      return false;
    },
    [currentUserId]
  );

  const handleRealtimeInsert = useCallback(async (payload: { new: any; old: any }) => {
    const newRow = payload.new as any;
    
    // 사용자 정보 조회
    const userName = await fetchUserName(newRow.user_id);

    const elementRow: BoardElementRowWithJoins = {
      ...newRow,
      user_name: userName,
    };

    const newElement = mapElementRowToElement(elementRow);

    // 중복 체크 후 추가
    setElements((prev) => {
      const exists = prev.find((el) => el.id === newElement.id);
      if (exists) return prev;
      return [...prev, newElement];
    });
  }, []);

  const handleRealtimeUpdate = useCallback(async (payload: { new: any; old: any }) => {
    const updatedRow = payload.new as any;
    
    // 사용자 정보 조회
    const userName = await fetchUserName(updatedRow.user_id);

    const elementRow: BoardElementRowWithJoins = {
      ...updatedRow,
      user_name: userName,
    };

    const updatedElement = mapElementRowToElement(elementRow);

    setElements((prev) =>
      prev.map((el) => (el.id === updatedElement.id ? updatedElement : el))
    );
  }, []);

  const handleRealtimeDelete = useCallback((payload: { new: any; old: any }) => {
    console.log('[Realtime DELETE] handleRealtimeDelete 호출:', {
      payload,
      oldId: payload.old?.id,
      newId: payload.new?.id,
      oldData: payload.old,
      newData: payload.new,
    });
    
    const deletedId = payload.old?.id;
    if (!deletedId) {
      console.error('[Realtime DELETE] id를 찾을 수 없습니다:', payload);
      return;
    }
    
    console.log('[Realtime DELETE] 삭제할 요소 ID:', deletedId);
    
    setElements((prev) => {
      const beforeCount = prev.length;
      const filtered = prev.filter((el) => {
        const shouldKeep = el.id !== deletedId;
        if (!shouldKeep) {
          console.log('[Realtime DELETE] 요소 제거:', el.id, el);
        }
        return shouldKeep;
      });
      const afterCount = filtered.length;
      
      console.log('[Realtime DELETE] 요소 삭제 결과:', {
        beforeCount,
        afterCount,
        deletedId,
        removed: beforeCount - afterCount,
        currentElements: filtered.map(el => ({ id: el.id, type: el.type })),
      });
      
      return filtered;
    });
  }, []);

  // board_elements 테이블 Realtime 구독
  console.log('[useBoardContent] Realtime 구독 설정:', {
    boardId,
    channelName: `board:${boardId}:elements`,
    enabled: !!boardId,
    hasShouldIgnore: !!shouldIgnoreRealtimeEvent,
    hasOnInsert: !!handleRealtimeInsert,
    hasOnUpdate: !!handleRealtimeUpdate,
    hasOnDelete: !!handleRealtimeDelete,
  });

  useRealtimeSubscription(
    {
      channelName: `board:${boardId}:elements`,
      table: 'board_elements',
      filter: `board_id=eq.${boardId}`,
      events: ['INSERT', 'UPDATE', 'DELETE'],
      enabled: !!boardId,
    },
    {
      shouldIgnore: shouldIgnoreRealtimeEvent,
      onInsert: handleRealtimeInsert,
      onUpdate: handleRealtimeUpdate,
      onDelete: handleRealtimeDelete,
    }
  );

  const handleElementMove = useCallback(
    async (elementId: string, position: { x: number; y: number }, isDragging: boolean = false) => {
      // 드래그 시작 시 추적
      if (isDragging && !draggingElementsRef.current.has(elementId)) {
        draggingElementsRef.current.set(elementId, Date.now());
      }
      
      // 최근 업데이트 추적 (Realtime 이벤트 무시용)
      recentlyUpdatedRef.current.set(elementId, Date.now());
      
      // Optimistic update
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, position } : el))
      );

      // 드래그 중이 아닐 때만 Supabase로 업데이트 (드래그 종료 시에만 저장)
      if (!isDragging) {
        // 드래그 종료 시 추적 정보 제거
        draggingElementsRef.current.delete(elementId);
        
        // Supabase로 업데이트
        try {
          await updateBoardElement(elementId, { position });
        } catch (error) {
          console.error('Failed to update element position:', error);
          // 에러 발생 시 추적 정보 제거
          recentlyUpdatedRef.current.delete(elementId);
          draggingElementsRef.current.delete(elementId);
          // 에러 발생 시 이전 상태로 복구
          const loadElements = async () => {
            try {
              const fetchedElements = await getBoardElements(boardId);
              setElements(fetchedElements);
            } catch (err) {
              console.error('Failed to reload elements:', err);
            }
          };
          loadElements();
        }
      }
    },
    [boardId]
  );

  const handleElementResize = useCallback(
    async (elementId: string, size: { width: number; height: number }) => {
      // 최근 업데이트 추적 (Realtime 이벤트 무시용)
      recentlyUpdatedRef.current.set(elementId, Date.now());
      
      // Optimistic update
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, size } : el))
      );

      // Supabase로 업데이트
      try {
        await updateBoardElement(elementId, { size });
      } catch (error) {
        console.error('Failed to update element size:', error);
        // 에러 발생 시 추적 정보 제거
        recentlyUpdatedRef.current.delete(elementId);
        // 에러 발생 시 이전 상태로 복구
        const loadElements = async () => {
          try {
            const fetchedElements = await getBoardElements(boardId);
            setElements(fetchedElements);
          } catch (err) {
            console.error('Failed to reload elements:', err);
          }
        };
        loadElements();
      }
    },
    [boardId]
  );

  const handleElementUpdate = useCallback(
    async (elementId: string, content: string) => {
      // 최근 업데이트 추적 (Realtime 이벤트 무시용)
      recentlyUpdatedRef.current.set(elementId, Date.now());
      
      // Optimistic update
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, content } : el))
      );

      // Supabase로 업데이트
      try {
        await updateBoardElement(elementId, { content });
      } catch (error) {
        console.error('Failed to update element content:', error);
        // 에러 발생 시 추적 정보 제거
        recentlyUpdatedRef.current.delete(elementId);
        // 에러 발생 시 이전 상태로 복구
        const loadElements = async () => {
          try {
            const fetchedElements = await getBoardElements(boardId);
            setElements(fetchedElements);
          } catch (err) {
            console.error('Failed to reload elements:', err);
          }
        };
        loadElements();
      }
    },
    [boardId]
  );

  const handleElementColorChange = useCallback(
    async (elementId: string, color: string) => {
      // 최근 업데이트 추적 (Realtime 이벤트 무시용)
      recentlyUpdatedRef.current.set(elementId, Date.now());
      
      // Optimistic update
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, color } : el))
      );

      // Supabase로 업데이트
      try {
        await updateBoardElement(elementId, { color });
      } catch (error) {
        console.error('Failed to update element color:', error);
        // 에러 발생 시 추적 정보 제거
        recentlyUpdatedRef.current.delete(elementId);
        // 에러 발생 시 이전 상태로 복구
        const loadElements = async () => {
          try {
            const fetchedElements = await getBoardElements(boardId);
            setElements(fetchedElements);
          } catch (err) {
            console.error('Failed to reload elements:', err);
          }
        };
        loadElements();
      }
    },
    [boardId]
  );

  const handleElementDelete = useCallback(
    async (elementId: string) => {
      // 권한 체크: 소유자가 아니면 자신의 요소만 삭제 가능
      const element = elements.find((el) => el.id === elementId);
      if (!element) return;

      const isElementOwner = element.userId === currentUserId;
      if (!isOwner && !isElementOwner) {
        // 보드 소유자가 아니고, 요소 소유자도 아닌 경우 삭제 불가
        console.warn('Cannot delete element: permission denied');
        onPermissionDenied?.('다른 사용자의 요소를 삭제할 권한이 없습니다.');
        return;
      }

      // 최근 삭제 추적 (Realtime 이벤트 무시용)
      const deleteTimestamp = Date.now();
      recentlyUpdatedRef.current.set(elementId, deleteTimestamp);
      console.log('[handleElementDelete] 삭제 추적 정보 저장:', {
        elementId,
        timestamp: deleteTimestamp,
        recentlyUpdatedMap: Array.from(recentlyUpdatedRef.current.entries()),
      });

      // Optimistic update
      console.log('[handleElementDelete] Optimistic update 시작');
      setElements((prev) => {
        const beforeCount = prev.length;
        const filtered = prev.filter((el) => el.id !== elementId);
        const afterCount = filtered.length;
        console.log('[handleElementDelete] Optimistic update 결과:', {
          beforeCount,
          afterCount,
          elementId,
          removed: beforeCount - afterCount,
        });
        return filtered;
      });

      // Supabase로 삭제
      console.log('[handleElementDelete] Supabase 삭제 시작:', elementId);
      try {
        await deleteBoardElement(elementId);
        console.log('[handleElementDelete] Supabase 삭제 완료:', elementId);
        
        // 이미지인 경우 Storage에서도 삭제
        if (element.type === 'image' && element.content) {
          // blob URL이 아닌 경우에만 Storage에서 삭제
          if (!element.content.startsWith('blob:')) {
            try {
              console.log('[handleElementDelete] Storage 이미지 삭제 시작:', element.content);
              await deleteImage(element.content);
              console.log('[handleElementDelete] Storage 이미지 삭제 완료');
            } catch (storageError) {
              console.warn('Failed to delete image from storage:', storageError);
              // Storage 삭제 실패해도 계속 진행
            }
          }
        }
      } catch (error) {
        console.error('[handleElementDelete] Supabase 삭제 실패:', error);
        // 에러 발생 시 추적 정보 제거
        recentlyUpdatedRef.current.delete(elementId);
        console.log('[handleElementDelete] 에러로 인한 추적 정보 제거:', elementId);
        // 에러 발생 시 이전 상태로 복구
        const loadElements = async () => {
          try {
            const fetchedElements = await getBoardElements(boardId);
            setElements(fetchedElements);
            console.log('[handleElementDelete] 요소 목록 복구 완료');
          } catch (err) {
            console.error('Failed to reload elements:', err);
          }
        };
        loadElements();
      }
    },
    [boardId, elements, currentUserId, isOwner, onPermissionDenied]
  );

  const handleAddNote = useCallback(
    async (position: { x: number; y: number }) => {
      try {
        const newElement = await createBoardElement({
          boardId,
          userId: currentUserId,
          type: 'note',
          content: '',
          position,
          size: DEFAULT_NOTE_SIZE,
          color: DEFAULT_NOTE_COLOR,
        });
        setElements((prev) => [...prev, newElement]);
      } catch (error) {
        console.error('Failed to create note:', error);
      }
    },
    [boardId, currentUserId]
  );

  const handleAddImage = useCallback(
    async (position: { x: number; y: number }, file: File) => {
      // 이미지 크기 계산
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = async () => {
        try {
          const { width, height } = calculateImageSize(img.width, img.height);

          // 임시 요소 ID 생성 (업로드 전에 미리 생성)
          const tempElementId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Supabase Storage에 업로드
          let imageUrl: string;
          try {
            imageUrl = await uploadImage(file, boardId, tempElementId);
          } catch (uploadError) {
            console.error('Failed to upload image:', uploadError);
            // 업로드 실패 시 임시 blob URL 사용 (기존 동작 유지)
            imageUrl = objectUrl;
          }

          // 요소 생성
          const newElement = await createBoardElement({
            boardId,
            userId: currentUserId,
            type: 'image',
            content: imageUrl,
            position,
            size: { width, height },
          });
          
          // 실제 elementId로 이미지 파일명 변경 (선택사항)
          // 현재는 tempElementId로 업로드했으므로 그대로 사용
          
          setElements((prev) => [...prev, newElement]);
          
          // blob URL 정리
          URL.revokeObjectURL(objectUrl);
        } catch (error) {
          console.error('Failed to create image element:', error);
          URL.revokeObjectURL(objectUrl);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image');
        URL.revokeObjectURL(objectUrl);
      };
      
      img.src = objectUrl;
    },
    [boardId, currentUserId]
  );

  return {
    elements,
    handlers: {
      onElementMove: handleElementMove,
      onElementResize: handleElementResize,
      onElementUpdate: handleElementUpdate,
      onElementColorChange: handleElementColorChange,
      onElementDelete: handleElementDelete,
      onAddNote: handleAddNote,
      onAddImage: handleAddImage,
    },
  };
};

