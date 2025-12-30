'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TextStyle } from '@entities/element';
import { logger } from '@shared/lib';

// 헬퍼 함수: 첫 번째 텍스트 노드 찾기
const getFirstTextNode = (element: HTMLElement): Node | null => {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );
  return walker.nextNode();
};

// 헬퍼 함수: 마지막 텍스트 노드 찾기
const getLastTextNode = (element: HTMLElement): Node | null => {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );
  let lastNode: Node | null = null;
  while (walker.nextNode()) {
    lastNode = walker.currentNode;
  }
  return lastNode;
};

interface UseTextToolbarProps {
  contentEditableRef: React.RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  textStyle: TextStyle;
  onStyleChange: (style: TextStyle) => void;
}

interface ToolbarState {
  bold: boolean;
  italic: boolean;
}

/**
 * 텍스트 툴바 로직 훅
 * execCommand, getCurrentStyle, 상태 관리 등을 담당
 */
export const useTextToolbar = ({
  contentEditableRef,
  isEditing,
  textStyle,
  onStyleChange,
}: UseTextToolbarProps) => {
  const {
    fontSize,
    fontWeight,
    fontStyle,
    textDecoration = 'none',
  } = textStyle;

  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    bold: false,
    italic: false,
  });

  // 선택된 텍스트의 현재 스타일 확인 (간소화 버전)
  const getCurrentStyle = useCallback((): Partial<TextStyle> => {
    if (!contentEditableRef.current) return {};

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return {};

    const range = selection.getRangeAt(0);
    let element: HTMLElement | null = null;

    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      element = range.startContainer.parentElement;
    } else if (range.startContainer instanceof HTMLElement) {
      element = range.startContainer;
    }

    if (!element) return {};

    // contentEditable 범위 안쪽까지 위로 올라가면서 의미 있는 태그 찾기
    let styleElement: HTMLElement | null = element;
    while (styleElement && styleElement !== contentEditableRef.current) {
      const tag = styleElement.tagName.toLowerCase();
      if (
        [
          'b',
          'strong',
          'i',
          'em',
          'p',
          'span',
        ].includes(tag)
      ) {
        break;
      }
      styleElement = styleElement.parentElement;
    }

    if (!styleElement) return {};

    const style = window.getComputedStyle(styleElement);
    const tagName = styleElement.tagName.toLowerCase();

    return {
      fontWeight:
        style.fontWeight === '700' ||
        style.fontWeight === 'bold' ||
        tagName === 'b' ||
        tagName === 'strong'
          ? 'bold'
          : 'normal',
      fontStyle:
        style.fontStyle === 'italic' || tagName === 'i' || tagName === 'em'
          ? 'italic'
          : 'normal',
      fontSize: parseInt(style.fontSize) || fontSize,
    };
  }, [contentEditableRef, fontSize]);

  // 포맷팅 명령 실행 (간소화: selection 복원 / 플래그 제거)
  const execCommand = useCallback(
    (command: string, value?: string) => {
      if (!contentEditableRef.current) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const isCollapsed = selection.isCollapsed;

      // 브라우저에 포맷팅 위임
      document.execCommand(command, false, value);

      // 포커스 유지
      contentEditableRef.current.focus();

      // collapsed 상태일 때는 명령에 따라 toolbarState를 즉시 업데이트
      if (isCollapsed) {
        let newState: ToolbarState = { ...toolbarState };
        
        if (command === 'bold') {
          newState.bold = !toolbarState.bold;
        } else if (command === 'italic') {
          newState.italic = !toolbarState.italic;
        }

        setToolbarState(newState);
      } else {
        // selection이 있을 때는 현재 스타일을 읽어서 업데이트
        const style = getCurrentStyle();

        setToolbarState({
          bold: style.fontWeight === 'bold',
          italic: style.fontStyle === 'italic',
        });
      }
    },
    [contentEditableRef, getCurrentStyle, onStyleChange, textStyle, toolbarState],
  );

  // selection / input 변경 시 툴바 상태 업데이트
  useEffect(() => {
    if (!isEditing || !contentEditableRef.current) return;

    const updateToolbar = () => {
      const selection = window.getSelection();
      
      // selection이 없거나 contentEditable 밖이면 업데이트하지 않음
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      if (!contentEditableRef.current?.contains(range.commonAncestorContainer)) {
        return;
      }

      const style = getCurrentStyle();

      setToolbarState({
        bold: style.fontWeight === 'bold',
        italic: style.fontStyle === 'italic',
      });
    };

    const handleSelectionChange = () => {
      if (document.activeElement === contentEditableRef.current) {
        updateToolbar();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    contentEditableRef.current.addEventListener('input', updateToolbar);
    // keydown 이벤트도 추가하여 입력 중에도 스타일 업데이트
    contentEditableRef.current.addEventListener('keydown', updateToolbar);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      contentEditableRef.current?.removeEventListener('input', updateToolbar);
      contentEditableRef.current?.removeEventListener('keydown', updateToolbar);
    };
  }, [isEditing, contentEditableRef, getCurrentStyle, textStyle, onStyleChange]);

  // 헤딩 변경 (선택된 텍스트 또는 이후 입력되는 텍스트에 적용)
  const handleHeadingChange = useCallback(
    (newHeading: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p') => {
      if (!contentEditableRef.current) {
        return;
      }

      const contentEditable = contentEditableRef.current;
      const selection = window.getSelection();
      
      // 포커스가 contentEditable에 있는지 확인
      if (document.activeElement !== contentEditable) {
        contentEditable.focus();
      }

      if (!selection || selection.rangeCount === 0) {
        // selection이 없으면 formatBlock 사용
        document.execCommand('formatBlock', false, newHeading);
        contentEditable.focus();
        onStyleChange({
          ...textStyle,
          heading: newHeading,
        });
        return;
      }

      const range = selection.getRangeAt(0);
      
      // selection이 collapsed면 커서 위치에서 블록 분리 후 적용
      if (range.collapsed) {
        // 커서 위치의 블록 요소 찾기
        let container: Node = range.startContainer;
        let blockElement: HTMLElement | null = null;

        if (container.nodeType === Node.TEXT_NODE) {
          blockElement = container.parentElement;
        } else if (container instanceof HTMLElement) {
          blockElement = container;
        }

        // 블록 레벨 요소 찾기
        while (blockElement && blockElement !== contentEditable) {
          const tagName = blockElement.tagName.toLowerCase();
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div'].includes(tagName)) {
            break;
          }
          blockElement = blockElement.parentElement;
        }

        // 블록을 찾았고, 커서가 블록 중간에 있으면 분리
        if (blockElement && blockElement !== contentEditable) {
          // 커서가 블록의 시작이나 끝이 아닌 중간에 있는지 확인
          const blockRange = document.createRange();
          blockRange.selectNodeContents(blockElement);
          
          // 커서 위치 확인
          const cursorNode = range.startContainer;
          const cursorOffset = range.startOffset;
          
          // 블록의 첫 번째와 마지막 텍스트 노드 확인
          const firstTextNode = getFirstTextNode(blockElement);
          const lastTextNode = getLastTextNode(blockElement);
          
          const isAtStart = cursorNode === firstTextNode && cursorOffset === 0;
          const isAtEnd = cursorNode === lastTextNode && 
            cursorOffset === (lastTextNode.textContent?.length || 0);

          if (!isAtStart && !isAtEnd) {
            // 커서가 중간에 있으면 블록 분리 (Enter 키 시뮬레이션)
            // formatBlock 전에 블록을 분리하면 이후 입력이 새 블록에 적용됨
            document.execCommand('insertParagraph', false);
            // 이제 커서가 새 블록에 있으므로 formatBlock 적용
          }
        }

        // formatBlock 적용 (이후 입력되는 텍스트에 적용)
        document.execCommand('formatBlock', false, newHeading);
        contentEditable.focus();
        
        onStyleChange({
          ...textStyle,
          heading: newHeading,
        });
        return;
      }

      // selection이 있으면 선택된 영역에만 적용
      try {
        // 선택된 텍스트를 헤딩으로 감싸기
        const contents = range.extractContents();
        const newElement = document.createElement(newHeading);
        newElement.appendChild(contents);
        range.insertNode(newElement);
        
        // 선택 해제하고 커서를 새 헤딩 끝으로 이동
        const newRange = document.createRange();
        newRange.selectNodeContents(newElement);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        contentEditable.focus();
        
        onStyleChange({
          ...textStyle,
          heading: newHeading,
        });
      } catch (error) {
        logger.warn('헤딩 적용 실패:', error);
        // 폴백: formatBlock 사용
        document.execCommand('formatBlock', false, newHeading);
        contentEditable.focus();
        onStyleChange({
          ...textStyle,
          heading: newHeading,
        });
      }
    },
    [contentEditableRef, textStyle, onStyleChange],
  );

  return {
    toolbarState,
    execCommand,
    getCurrentStyle,
    handleHeadingChange,
  };
};
