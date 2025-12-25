'use client';

import { useState, useRef } from 'react';

interface UseBoardActionsReturn {
  addMode: 'note' | 'image' | null;
  setAddMode: (mode: 'note' | 'image' | null) => void;
  pendingImageFile: File | null;
  setPendingImageFile: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageButtonClick: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddImageWithFile: (
    position: { x: number; y: number },
    onAddImage: (position: { x: number; y: number }, file: File) => void
  ) => void;
}

export const useBoardActions = (): UseBoardActionsReturn => {
  const [addMode, setAddMode] = useState<'note' | 'image' | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageButtonClick = () => {
    setAddMode('image');
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPendingImageFile(file);
      // 파일 선택 후 캔버스 클릭 대기 (addMode는 이미 'image'로 설정됨)
    }
    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddImageWithFile = (
    position: { x: number; y: number },
    onAddImage: (position: { x: number; y: number }, file: File) => void
  ) => {
    if (pendingImageFile) {
      onAddImage(position, pendingImageFile);
      setPendingImageFile(null);
      setAddMode(null);
    }
  };

  return {
    addMode,
    setAddMode,
    pendingImageFile,
    setPendingImageFile,
    fileInputRef,
    handleImageButtonClick,
    handleFileSelect,
    handleAddImageWithFile,
  };
};

