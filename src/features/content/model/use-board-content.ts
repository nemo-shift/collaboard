'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { BoardElement } from '@entities/element';
// import { mockElements } from './mock-elements'; // 더미 데이터 주석 처리
import { calculateImageSize } from '../lib/calculate-image-size';
import { DEFAULT_NOTE_COLOR, DEFAULT_NOTE_SIZE, DEFAULT_TEXT_SIZE, REALTIME_IGNORE_TIMEOUT, REALTIME_DRAG_IGNORE_TIMEOUT } from '../lib/constants';
import {
  getBoardElements,
  createBoardElement,
  updateBoardElement,
  deleteBoardElement,
} from '@features/content/api';
import { uploadImage, deleteImage } from '@features/content/api/supabase/storage';
import { useRealtimeSubscription, fetchUserName, type RealtimeEvent, logger } from '@shared/lib';
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
    onElementStyleChange: (elementId: string, style: TextStyle) => void;
    onElementZIndexChange: (elementId: string, zIndex: number) => void;
    onElementDelete: (elementId: string) => void;
    onAddNote: (position: { x: number; y: number }) => void;
    onAddImage: (position: { x: number; y: number }, file: File) => void;
    onAddText: (position: { x: number; y: number }) => void;
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
        logger.error('Failed to load board elements:', error);
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
    (payload: { new: unknown; old: unknown }, event: RealtimeEvent) => {
      // DELETE 이벤트는 payload.old에 삭제된 행 데이터가 있음
      if (event === 'DELETE') {
        const deletedRow = payload.old;
        
        if (!deletedRow || !deletedRow.id) {
          // id가 없으면 처리 (다른 사용자의 삭제일 수 있음)
          return false;
        }
        
        const deletedId = deletedRow.id;
        const deletedUserId = deletedRow.user_id;
        
        // user_id가 없는 경우도 처리
        if (!deletedUserId) {
          return false;
        }
        
        // 다른 사용자가 삭제한 경우는 항상 처리 (실시간 반영)
        if (deletedUserId !== currentUserId) {
          return false; // false = 무시하지 않음 = 처리함
        }
        
        // 자신이 삭제한 경우에만 recentlyUpdatedRef 확인
        const recentlyUpdated = recentlyUpdatedRef.current.get(deletedId);
        if (recentlyUpdated && Date.now() - recentlyUpdated < REALTIME_IGNORE_TIMEOUT) {
          // 자신이 최근에 삭제한 요소는 무시 (optimistic update와 중복 방지)
          return true;
        }
        
        // 자신이 삭제했지만 recentlyUpdatedRef에 없거나 시간이 지난 경우는 처리
        return false;
      }
      
      // INSERT, UPDATE는 payload.new 사용
      const row = payload.new as { id?: string; user_id?: string };
      if (!row) {
        return false;
      }
      
      // INSERT: 자신이 생성한 요소는 무시
      if (event === 'INSERT' && row.user_id === currentUserId) {
        return true;
      }
      
      // UPDATE: 드래그 중이거나 최근 업데이트한 요소는 무시
      if (event === 'UPDATE') {
        const elementId = row.id;
        
        // 드래그 중인 요소 확인
        const dragStartTime = draggingElementsRef.current.get(elementId);
        if (dragStartTime && Date.now() - dragStartTime < REALTIME_DRAG_IGNORE_TIMEOUT) {
          return true;
        }
        if (dragStartTime) {
          draggingElementsRef.current.delete(elementId);
        }
        
        // 최근 업데이트한 요소 확인
        const recentlyUpdated = recentlyUpdatedRef.current.get(elementId);
        if (recentlyUpdated && Date.now() - recentlyUpdated < REALTIME_IGNORE_TIMEOUT) {
          return true;
        }
      }
      
      return false;
    },
    [currentUserId]
  );

  const handleRealtimeInsert = useCallback(async (payload: { new: unknown; old: unknown }) => {
    const newRow = payload.new as BoardElementRowWithJoins;
    
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

  const handleRealtimeUpdate = useCallback(async (payload: { new: unknown; old: unknown }) => {
    const updatedRow = payload.new as BoardElementRowWithJoins;
    
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

  const handleRealtimeDelete = useCallback((payload: { new: unknown; old: unknown }) => {
    const deletedRow = payload.old as { id?: string };
    const deletedId = deletedRow?.id;
    
    if (!deletedId) {
      logger.error('[Realtime DELETE] id를 찾을 수 없습니다:', payload);
      return;
    }
    
    // 추적 정보도 제거
    recentlyUpdatedRef.current.delete(deletedId);
    draggingElementsRef.current.delete(deletedId);
    
    setElements((prev) => {
      const elementToDelete = prev.find((el) => el.id === deletedId);
      
      if (!elementToDelete) {
        // 이미 UI에 없으면 그대로 반환
        return prev;
      }
      
      // 요소 제거
      return prev.filter((el) => el.id !== deletedId);
    });
  }, [currentUserId]);

  // events 배열을 메모이제이션하여 안정적인 의존성 보장
  const realtimeEvents = useMemo(() => ['INSERT', 'UPDATE', 'DELETE'] as RealtimeEvent[], []);

  // board_elements 테이블 Realtime 구독
  useRealtimeSubscription(
    {
      channelName: `board:${boardId}:elements`,
      table: 'board_elements',
      filter: `board_id=eq.${boardId}`,
      events: realtimeEvents,
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
      // 요소가 존재하는지 확인
      const elementExists = elements.some((el) => el.id === elementId);
      if (!elementExists) {
        logger.warn('[handleElementMove] 요소가 존재하지 않습니다:', elementId);
        return;
      }
      
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
        } catch (error: unknown) {
          logger.error('Failed to update element position:', error);
          // 에러 발생 시 추적 정보 제거
          recentlyUpdatedRef.current.delete(elementId);
          draggingElementsRef.current.delete(elementId);
          
          // 요소가 존재하지 않거나 권한이 없는 경우 UI에서 제거
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('존재하지 않습니다') || errorMessage.includes('권한이 없습니다')) {
            setElements((prev) => prev.filter((el) => el.id !== elementId));
            return;
          }
          
          // 에러 발생 시 이전 상태로 복구
          const loadElements = async () => {
            try {
              const fetchedElements = await getBoardElements(boardId);
              setElements(fetchedElements);
            } catch (err) {
              logger.error('Failed to reload elements:', err);
            }
          };
          loadElements();
        }
      }
    },
    [boardId, elements]
  );

  const handleElementResize = useCallback(
    async (elementId: string, size: { width: number; height: number }) => {
      // 요소가 존재하는지 확인
      const elementExists = elements.some((el) => el.id === elementId);
      if (!elementExists) {
        logger.warn('[handleElementResize] 요소가 존재하지 않습니다:', elementId);
        return;
      }
      
      // 최근 업데이트 추적 (Realtime 이벤트 무시용)
      recentlyUpdatedRef.current.set(elementId, Date.now());
      
      // Optimistic update
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, size } : el))
      );

      // Supabase로 업데이트
      try {
        await updateBoardElement(elementId, { size });
      } catch (error: unknown) {
        logger.error('Failed to update element size:', error);
        // 에러 발생 시 추적 정보 제거
        recentlyUpdatedRef.current.delete(elementId);
        
        // 요소가 존재하지 않거나 권한이 없는 경우 UI에서 제거
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('존재하지 않습니다') || errorMessage.includes('권한이 없습니다')) {
          setElements((prev) => prev.filter((el) => el.id !== elementId));
          return;
        }
        
        // 에러 발생 시 이전 상태로 복구
        const loadElements = async () => {
          try {
            const fetchedElements = await getBoardElements(boardId);
            setElements(fetchedElements);
          } catch (err) {
            logger.error('Failed to reload elements:', err);
          }
        };
        loadElements();
      }
    },
    [boardId, elements]
  );

  const handleElementUpdate = useCallback(
    async (elementId: string, content: string) => {
      // 요소가 존재하는지 확인
      const elementExists = elements.some((el) => el.id === elementId);
      if (!elementExists) {
        logger.warn('[handleElementUpdate] 요소가 존재하지 않습니다:', elementId);
        return;
      }
      
      // 최근 업데이트 추적 (Realtime 이벤트 무시용)
      recentlyUpdatedRef.current.set(elementId, Date.now());
      
      // Optimistic update
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, content } : el))
      );

      // Supabase로 업데이트
      try {
        await updateBoardElement(elementId, { content });
      } catch (error: unknown) {
        logger.error('Failed to update element content:', error);
        // 에러 발생 시 추적 정보 제거
        recentlyUpdatedRef.current.delete(elementId);
        
        // 요소가 존재하지 않거나 권한이 없는 경우 UI에서 제거
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('존재하지 않습니다') || errorMessage.includes('권한이 없습니다')) {
          setElements((prev) => prev.filter((el) => el.id !== elementId));
          return;
        }
        
        // 에러 발생 시 이전 상태로 복구
        const loadElements = async () => {
          try {
            const fetchedElements = await getBoardElements(boardId);
            setElements(fetchedElements);
          } catch (err) {
            logger.error('Failed to reload elements:', err);
          }
        };
        loadElements();
      }
    },
    [boardId, elements]
  );

  const handleElementColorChange = useCallback(
    async (elementId: string, color: string) => {
      // 요소가 존재하는지 확인
      const elementExists = elements.some((el) => el.id === elementId);
      if (!elementExists) {
        logger.warn('[handleElementColorChange] 요소가 존재하지 않습니다:', elementId);
        return;
      }
      
      // 최근 업데이트 추적 (Realtime 이벤트 무시용)
      recentlyUpdatedRef.current.set(elementId, Date.now());
      
      // Optimistic update
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, color } : el))
      );

      // Supabase로 업데이트
      try {
        await updateBoardElement(elementId, { color });
      } catch (error: unknown) {
        logger.error('Failed to update element color:', error);
        // 에러 발생 시 추적 정보 제거
        recentlyUpdatedRef.current.delete(elementId);
        
        // 요소가 존재하지 않거나 권한이 없는 경우 UI에서 제거
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('존재하지 않습니다') || errorMessage.includes('권한이 없습니다')) {
          setElements((prev) => prev.filter((el) => el.id !== elementId));
          return;
        }
        
        // 에러 발생 시 이전 상태로 복구
        const loadElements = async () => {
          try {
            const fetchedElements = await getBoardElements(boardId);
            setElements(fetchedElements);
          } catch (err) {
            logger.error('Failed to reload elements:', err);
          }
        };
        loadElements();
      }
    },
    [boardId, elements]
  );

  const handleElementDelete = useCallback(
    async (elementId: string) => {
      // 권한 체크: 소유자가 아니면 자신의 요소만 삭제 가능
      const element = elements.find((el) => el.id === elementId);
      if (!element) return;

      const isElementOwner = element.userId === currentUserId;
      if (!isOwner && !isElementOwner) {
        // 보드 소유자가 아니고, 요소 소유자도 아닌 경우 삭제 불가
        logger.warn('Cannot delete element: permission denied');
        onPermissionDenied?.('다른 사용자의 요소를 삭제할 권한이 없습니다.');
        return;
      }

      // 최근 삭제 추적 (Realtime 이벤트 무시용)
      const deleteTimestamp = Date.now();
      recentlyUpdatedRef.current.set(elementId, deleteTimestamp);

      // Optimistic update
      setElements((prev) => prev.filter((el) => el.id !== elementId));

      // Supabase로 삭제
      try {
        await deleteBoardElement(elementId);
        
        // 이미지인 경우 Storage에서도 삭제
        if (element.type === 'image' && element.content) {
          // blob URL이 아닌 경우에만 Storage에서 삭제
          if (!element.content.startsWith('blob:')) {
            try {
              await deleteImage(element.content);
            } catch (storageError) {
              logger.warn('Failed to delete image from storage:', storageError);
              // Storage 삭제 실패해도 계속 진행
            }
          }
        }
      } catch (error) {
        logger.error('[handleElementDelete] Supabase 삭제 실패:', error);
        // 에러 발생 시 추적 정보 제거
        recentlyUpdatedRef.current.delete(elementId);
        // 에러 발생 시 이전 상태로 복구
        const loadElements = async () => {
          try {
            const fetchedElements = await getBoardElements(boardId);
            setElements(fetchedElements);
          } catch (err) {
            logger.error('Failed to reload elements:', err);
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
        logger.error('Failed to create note:', error);
      }
    },
    [boardId, currentUserId]
  );

  const handleAddText = useCallback(
    async (position: { x: number; y: number }) => {
      try {
        const newElement = await createBoardElement({
          boardId,
          userId: currentUserId,
          type: 'text',
          content: '',
          position,
          size: DEFAULT_TEXT_SIZE,
          textStyle: {
            fontSize: 24,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            heading: 'p',
          },
        });
        setElements((prev) => [...prev, newElement]);
      } catch (error) {
        logger.error('Failed to create text:', error);
      }
    },
    [boardId, currentUserId]
  );

  const handleElementStyleChange = useCallback(
    async (elementId: string, style: TextStyle) => {
      const element = elements.find((el) => el.id === elementId);
      if (!element) return;

      // 권한 체크
      const canEdit = isOwner || element.userId === currentUserId;
      if (!canEdit) {
        if (onPermissionDenied) {
          onPermissionDenied();
        }
        return;
      }

      try {
        await updateBoardElement(elementId, { textStyle: style });
        setElements((prev) =>
          prev.map((el) =>
            el.id === elementId ? { ...el, textStyle: style } : el
          )
        );
      } catch (error) {
        logger.error('Failed to update text style:', error);
      }
    },
    [elements, currentUserId, isOwner, onPermissionDenied]
  );

  const handleElementZIndexChange = useCallback(
    async (elementId: string, zIndex: number) => {
      // 요소가 존재하는지 확인
      const elementExists = elements.some((el) => el.id === elementId);
      if (!elementExists) {
        logger.warn('[handleElementZIndexChange] 요소가 존재하지 않습니다:', elementId);
        return;
      }

      // 권한 체크
      const element = elements.find((el) => el.id === elementId);
      if (!element) return;
      const canEdit = isOwner || element.userId === currentUserId;
      if (!canEdit) {
        onPermissionDenied?.('다른 사용자의 요소를 수정할 권한이 없습니다.');
        return;
      }

      // 최근 업데이트 추적 (Realtime 이벤트 무시용)
      recentlyUpdatedRef.current.set(elementId, Date.now());

      // Optimistic update
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? { ...el, zIndex } : el))
      );

      // Supabase로 업데이트
      try {
        await updateBoardElement(elementId, { zIndex });
      } catch (error: unknown) {
        logger.error('Failed to update element zIndex:', error);
        // 에러 발생 시 추적 정보 제거
        recentlyUpdatedRef.current.delete(elementId);

        // 요소가 존재하지 않거나 권한이 없는 경우 UI에서 제거
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('존재하지 않습니다') || errorMessage.includes('권한이 없습니다')) {
          setElements((prev) => prev.filter((el) => el.id !== elementId));
          return;
        }

        // 에러 발생 시 이전 상태로 복구
        const loadElements = async () => {
          try {
            const fetchedElements = await getBoardElements(boardId);
            setElements(fetchedElements);
          } catch (err) {
            logger.error('Failed to reload elements:', err);
          }
        };
        loadElements();
      }
    },
    [boardId, elements, currentUserId, isOwner, onPermissionDenied]
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
            logger.error('Failed to upload image:', uploadError);
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
          logger.error('Failed to create image element:', error);
          URL.revokeObjectURL(objectUrl);
        }
      };
      
      img.onerror = () => {
        logger.error('Failed to load image');
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
      onElementStyleChange: handleElementStyleChange,
      onElementZIndexChange: handleElementZIndexChange,
      onElementDelete: handleElementDelete,
      onAddNote: handleAddNote,
      onAddImage: handleAddImage,
      onAddText: handleAddText,
    },
  };
};

