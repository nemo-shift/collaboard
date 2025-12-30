'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { RefObject } from 'react';
import type { BoardElement, CursorPosition, TextStyle } from '@entities/element';
import { ConfirmDialog } from '@shared/ui';
import { formatUserName, useTheme } from '@shared/lib';
import { NoteElement, ImageElement, TextElement, ZoomControls, Minimap, GridBackground } from './components';
import { CANVAS_CONSTANTS } from './lib/constants';
import { useCanvasPanning, useElementInteraction, useElementEditing } from '../model';

interface BoardCanvasProps {
  boardId: string;
  elements: BoardElement[];
  cursors: CursorPosition[];
  onElementMove: (elementId: string, position: { x: number; y: number }, isDragging?: boolean) => void;
  onElementResize: (elementId: string, size: { width: number; height: number }) => void;
  onElementUpdate: (elementId: string, content: string) => void;
  onElementColorChange: (elementId: string, color: string) => void;
  onElementStyleChange?: (elementId: string, style: TextStyle) => void;
  onElementZIndexChange?: (elementId: string, zIndex: number) => void;
  onElementDelete: (elementId: string) => void;
  onAddNote: (position: { x: number; y: number }) => void;
  onAddImage: (position: { x: number; y: number }) => void;
  onAddText?: (position: { x: number; y: number }) => void;
  addMode?: 'note' | 'image' | 'text' | null;
  canEdit?: boolean;
  onEditBlocked?: () => void;
  isOwner?: boolean;
  currentUserId?: string;
  isModalOpen?: boolean;
}

export const BoardCanvas = ({
  boardId,
  elements,
  cursors,
  onElementMove,
  onElementResize,
  onElementUpdate,
  onElementColorChange,
  onElementStyleChange,
  onElementZIndexChange,
  onElementDelete,
  onAddNote,
  onAddImage,
  onAddText,
  addMode = null,
  canEdit = true,
  onEditBlocked,
  isOwner = false,
  currentUserId,
  isModalOpen = false,
}: BoardCanvasProps) => {
  const [scale, setScale] = useState<number>(CANVAS_CONSTANTS.DEFAULT_SCALE);
  const { classes } = useTheme();
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // interaction 훅 먼저 실행하여 selectedElement를 가져옴
  // (editing 훅에서 selectedElement가 필요하므로)
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // editing 훅 실행
  const editing = useElementEditing({
    elements,
    canEdit,
    onEditBlocked,
    onElementUpdate,
    selectedElement,
    setSelectedElement,
  });

  // panning 훅 실행 (offsetRef 생성)
  // interaction의 ref는 getter 함수로 전달하여 동적으로 가져옴
  // useRef를 사용하여 interaction의 ref를 저장할 공간을 미리 생성
  const interactionRefsRef = useRef<{
    draggedElementRef?: RefObject<string | null>;
    resizingElementRef?: RefObject<string | null>;
  }>({});

  const panning = useCanvasPanning({
    canvasRef,
    canvasContainerRef,
    scale,
    boardId,
    getDraggedElementRef: () => interactionRefsRef.current.draggedElementRef,
    getResizingElementRef: () => interactionRefsRef.current.resizingElementRef,
  });

  // interaction 훅 실행 (panning의 offsetRef와 editing의 상태 사용)
  const interaction = useElementInteraction({
    canvasRef,
    scale,
    offsetRef: panning.offsetRef,
    elements,
    onElementMove,
    onElementResize,
    onElementZIndexChange,
    onElementDelete,
    editingElement: editing.editingElement,
    setEditingElement: editing.setEditingElement,
    setEditContent: editing.setEditContent,
    selectedElement,
    setSelectedElement,
  });

  // interaction의 ref를 interactionRefsRef에 저장하여 panning 훅이 접근할 수 있도록 함
  useEffect(() => {
    interactionRefsRef.current = {
      draggedElementRef: interaction.draggedElementRef,
      resizingElementRef: interaction.resizingElementRef,
    };
  }, [interaction.draggedElementRef, interaction.resizingElementRef]);

  // zIndex로 정렬된 요소들
  const sortedElements = useMemo(() => {
    return [...elements].sort((a, b) => {
      const aZIndex = a.zIndex ?? 0;
      const bZIndex = b.zIndex ?? 0;
      return aZIndex - bZIndex;
    });
  }, [elements]);

  // 뷰포트 크기 추적
  useEffect(() => {
    const updateViewportSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  // boardId가 변경될 때 scale 초기화
  useEffect(() => {
    setScale(CANVAS_CONSTANTS.DEFAULT_SCALE);
  }, [boardId]);

  // 마우스 이동 추적 (커서 표시용)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('[data-collaboration-widget]')) {
        return;
      }
      
      if (canvasRef.current && panning.offsetRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        // 마우스 위치는 커서 표시용이므로 여기서는 상태 업데이트만 (실제 사용은 다른 곳에서)
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => canvas.removeEventListener('mousemove', handleMouseMove);
    }
  }, [panning.offsetRef, scale]);

  // 클릭으로 포스트잇/이미지 추가 (addMode에 따라)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (addMode && !interaction.draggedElement && !interaction.resizingElement) {
      const containerRect = canvasContainerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const x = (e.clientX - containerRect.left) / scale;
        const y = (e.clientY - containerRect.top) / scale;
        
        if (addMode === 'note') {
          onAddNote({ x, y });
        } else if (addMode === 'image') {
          onAddImage({ x, y });
        } else if (addMode === 'text' && onAddText) {
          onAddText({ x, y });
        }
      }
    }
  }, [addMode, scale, onAddNote, onAddImage, onAddText, interaction.draggedElement, interaction.resizingElement]);

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full ${classes.bg} overflow-hidden cursor-grab active:cursor-grabbing`}
      onMouseDown={panning.handleMouseDown}
      onMouseMove={(e) => {
        // 패닝 중이 아닐 때만 요소 드래그/리사이즈 처리
        // panning.isDragging은 비동기 상태이므로 ref를 사용하는 것이 더 안전하지만,
        // 여기서는 간단하게 상태를 확인 (패닝이 시작되면 window 이벤트로 처리되므로 충돌 없음)
        if (!panning.isDragging) {
          interaction.handleMouseMove(e);
        }
      }}
      onMouseUp={(e) => {
        // 패닝 중일 때는 이벤트를 무시하고 window 레벨 이벤트가 처리하도록 함
        // stopPropagation을 호출하지 않아서 window 레벨 mouseup이 발생하도록 함
        if (panning.isDragging) {
          return;
        }
        // 패닝 중이 아닐 때만 요소 드래그/리사이즈 종료 처리
        interaction.handleMouseUp();
      }}
      onMouseLeave={(e) => {
        // 패닝 중일 때는 이벤트를 무시하고 window 레벨 이벤트가 처리하도록 함
        if (panning.isDragging) {
          return;
        }
        // 패닝 중이 아닐 때만 요소 드래그/리사이즈 종료 처리
        interaction.handleMouseUp();
      }}
      onClick={(e) => {
        // 패닝이 실제로 발생했을 때만 클릭 이벤트 무시
        // handleMouseDown에서 stopPropagation을 호출하지 않으므로,
        // 클릭만 하고 드래그하지 않은 경우 onClick이 발생함
        // isDragging이 false이고 hasPanned도 false인 경우에만 클릭 허용
        // (isDragging이 true면 아직 패닝 중, hasPanned가 true면 방금 패닝했음)
        if (panning.isDragging) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        // hasPanned가 true면 방금 패닝이 발생했으므로 클릭 무시
        if (panning.hasPanned) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        const target = e.target as HTMLElement;
        if (target.closest('[data-collaboration-widget]')) {
          return;
        }
        
        // 빈 공간 클릭 시 선택 해제 및 편집 모드 종료
        const isBlankSpace = (
          target === canvasRef.current ||
          target.closest('.grid-background') ||
          (!target.closest('[data-element-id]') && !target.closest('button') && !target.closest('[data-color-picker]') && !target.closest('.color-picker-popup') && !target.closest('[data-text-toolbar]'))
        );
        
        if (isBlankSpace) {
          interaction.setSelectedElement(null);
          // 편집 모드 종료 - 내용 저장 후 종료
          if (editing.editingElement) {
            const element = elements.find((el) => el.id === editing.editingElement);
            if (element) {
              let currentContent = editing.editContent;
              
              // 현재 편집 중인 내용을 DOM에서 직접 읽기
              if (element.type === 'text' && editing.contentEditableRef.current) {
                currentContent = editing.contentEditableRef.current.innerHTML || '';
              } else if (element.type === 'note' && editing.textareaRef.current) {
                currentContent = editing.textareaRef.current.value || '';
              }
              
              // 내용 저장
              onElementUpdate(editing.editingElement, currentContent);
              editing.setEditingElement(null);
              editing.setEditContent('');
            }
          }
        }
        
        handleClick(e);
      }}
      onDoubleClick={editing.handleDoubleClick}
      style={{ cursor: addMode === 'note' || addMode === 'image' || addMode === 'text' ? 'crosshair' : 'grab' }}
    >
      {/* 그리드 배경 */}
      <GridBackground offset={panning.offset} scale={scale} />

      {/* 요소들 */}
      <div
        ref={canvasContainerRef}
        className="absolute left-0 right-0 bottom-0"
        style={{
          top: 'calc(64px + var(--board-toolbar-height, 57px))',
          transform: `translate(${panning.offset.x}px, ${panning.offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          willChange: panning.isDragging ? 'transform' : 'auto',
        }}
      >
        {sortedElements.map((element) => {
          const isEditing = editing.editingElement === element.id;
          const isSelected = interaction.selectedElement === element.id;

          return (
            <div
              key={element.id}
              data-element-id={element.id}
              className="absolute cursor-move select-none group"
              style={{
                left: `${element.position.x}px`,
                top: `${element.position.y}px`,
                width: element.type === 'text' ? 'auto' : `${element.size.width}px`,
                height: `${element.size.height}px`,
                ...(element.type === 'text' && { maxWidth: '800px' }),
              }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                const isContentEditable = target.closest('[contenteditable="true"]');
                
                if (element.type === 'text' && !isEditing) {
                  const textElementDisplay = target.closest('[data-text-element-display]');
                  if (textElementDisplay) {
                    return;
                  }
                  
                  const elementWrapper = e.currentTarget as HTMLElement;
                  const displayDiv = elementWrapper.querySelector('[data-text-element-display]');
                  if (displayDiv && displayDiv.contains(target)) {
                    return;
                  }
                }
                
                if (
                  target.closest('button[title="삭제 (Delete 키)"]') || 
                  target.closest('button[title="앞으로 가져오기 (Ctrl+])"]') ||
                  target.closest('button[title="뒤로 보내기 (Ctrl+[)"]') ||
                  target.closest('[data-color-picker]') ||
                  target.closest('.color-picker-popup') ||
                  target.closest('[data-text-toolbar]') ||
                  (isEditing && isContentEditable)
                ) {
                  return;
                }
                
                if (!isEditing && !interaction.resizingElement) {
                  e.stopPropagation();
                  interaction.handleElementSelect(element.id);
                }
              }}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('resize-handle')) {
                  interaction.handleResizeStart(e, element.id, element.size);
                  return;
                }
                
                if (isEditing) {
                  e.stopPropagation();
                  return;
                }
                
                if (element.type === 'text') {
                  return;
                }
                
                interaction.handleElementDragStart(e, element.id, element.position);
              }}
            >
              {element.type === 'note' ? (
                <NoteElement
                  element={element}
                  isEditing={isEditing}
                  editContent={editing.editContent}
                  isSelected={isSelected}
                  isOwner={isOwner}
                  currentUserId={currentUserId}
                  scale={scale}
                  onEditContentChange={editing.setEditContent}
                  onEditComplete={editing.handleEditComplete}
                  onColorChange={(color) => onElementColorChange(element.id, color)}
                  onDelete={() => {
                    interaction.openDeleteConfirm(element.id, 'note');
                  }}
                  onResizeStart={(e) => interaction.handleResizeStart(e, element.id, element.size)}
                  onBringForward={onElementZIndexChange && canEdit ? () => interaction.handleBringForward(element.id) : undefined}
                  onSendBackward={onElementZIndexChange && canEdit ? () => interaction.handleSendBackward(element.id) : undefined}
                  textareaRef={editing.textareaRef}
                />
              ) : element.type === 'text' ? (
                <TextElement
                  element={element}
                  isEditing={isEditing}
                  editContent={editing.editContent}
                  isSelected={isSelected}
                  isOwner={isOwner}
                  currentUserId={currentUserId}
                  scale={scale}
                  onEditContentChange={editing.setEditContent}
                  onEditComplete={editing.handleEditComplete}
                  onStyleChange={(style) => {
                    if (onElementStyleChange) {
                      onElementStyleChange(element.id, style);
                    }
                  }}
                  onDelete={() => {
                    interaction.openDeleteConfirm(element.id, 'text');
                  }}
                  onDragStart={(e) => interaction.handleElementDragStart(e, element.id, element.position)}
                  contentEditableRef={editing.contentEditableRef}
                  onDoubleClick={editing.handleDoubleClick}
                  onSelect={interaction.handleElementSelect}
                  onBringForward={onElementZIndexChange && canEdit ? () => interaction.handleBringForward(element.id) : undefined}
                  onSendBackward={onElementZIndexChange && canEdit ? () => interaction.handleSendBackward(element.id) : undefined}
                />
              ) : (
                <ImageElement
                  element={element}
                  isSelected={isSelected}
                  isOwner={isOwner}
                  currentUserId={currentUserId}
                  onDelete={() => {
                    interaction.openDeleteConfirm(element.id, 'image');
                  }}
                  onResizeStart={(e) => interaction.handleResizeStart(e, element.id, element.size)}
                  onBringForward={onElementZIndexChange && canEdit ? () => interaction.handleBringForward(element.id) : undefined}
                  onSendBackward={onElementZIndexChange && canEdit ? () => interaction.handleSendBackward(element.id) : undefined}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 다른 사용자 커서들 */}
      {Array.from(
        new Map(cursors.map((cursor) => [cursor.userId, cursor])).values()
      ).map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${cursor.x * scale + panning.offset.x}px`,
            top: `${cursor.y * scale + panning.offset.y}px`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: cursor.color }}
          />
          <div
            className={`absolute top-4 left-0 px-2 py-1 ${classes.bg} rounded shadow-sm text-xs font-medium whitespace-nowrap`}
            style={{ color: cursor.color }}
          >
            {formatUserName(cursor.userName)}
          </div>
        </div>
      ))}

      {/* 줌 컨트롤 */}
      <ZoomControls scale={scale} onScaleChange={(newScale) => setScale(newScale)} />

      {/* 미니맵 */}
      {!isModalOpen && viewportSize.width > 0 && viewportSize.height > 0 && (
        <Minimap
          elements={elements}
          offset={panning.offset}
          scale={scale}
          viewportSize={viewportSize}
          onOffsetChange={(newOffset) => {
            panning.setOffset(newOffset);
            panning.offsetRef.current = newOffset;
            if (canvasContainerRef.current) {
              canvasContainerRef.current.style.transform = 
                `translate(${newOffset.x}px, ${newOffset.y}px) scale(${scale})`;
            }
            const gridBackgrounds = document.querySelectorAll('.grid-background');
            gridBackgrounds.forEach((grid) => {
              (grid as HTMLElement).style.transform = `translate(${newOffset.x}px, ${newOffset.y}px)`;
            });
          }}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={interaction.deleteConfirm.isOpen}
        title="삭제 확인"
        message={interaction.getDeleteMessage()}
        confirmText="삭제"
        cancelText="취소"
        onConfirm={interaction.handleDeleteConfirm}
        onCancel={interaction.handleDeleteCancel}
      />
    </div>
  );
};
