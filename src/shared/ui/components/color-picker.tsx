'use client';

import { useState, useRef, useEffect } from 'react';
import { POSTIT_COLORS, DEFAULT_POSTIT_COLOR } from './constants';

interface ColorPickerProps {
  selectedColor?: string;
  onColorSelect: (color: string) => void;
}

export const ColorPicker = ({ selectedColor = DEFAULT_POSTIT_COLOR, onColorSelect }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={pickerRef} data-color-picker>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // blur 방지
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded-lg border-2 border-gray-400 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
        style={{ backgroundColor: selectedColor }}
        title="색상 선택"
      />

      {isOpen && (
        <div 
          className="absolute top-10 left-0 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-2 color-picker-popup"
          style={{ zIndex: 9999 }}
          onMouseDown={(e) => {
            e.preventDefault(); // blur 방지
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2">
            {POSTIT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // blur 방지
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onColorSelect(color.value);
                  setIsOpen(false);
                }}
                className={`w-8 h-8 rounded-md border-2 transition-all ${
                  selectedColor === color.value
                    ? 'border-gray-900 shadow-md scale-110 ring-2 ring-gray-400'
                    : 'border-gray-300 hover:border-gray-500 hover:shadow-sm'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

