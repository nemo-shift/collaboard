'use client';

import { useState, useEffect } from 'react';

export const InteractiveDemoSection = () => {
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 300, y: 200 });
  const [showNewNote, setShowNewNote] = useState(false);

  // 커서 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorPosition((prev) => ({
        x: prev.x + (Math.random() - 0.5) * 20,
        y: prev.y + (Math.random() - 0.5) * 20,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // 새 포스트잇 애니메이션
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNewNote(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-24 border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-4 tracking-tight">
          실제 화이트보드처럼
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
          드래그하고, 포스트잇을 추가하고, 이미지를 업로드하세요
        </p>
        
        {/* Whiteboard Demo */}
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, black 1px, transparent 1px),
                linear-gradient(to bottom, black 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          
          <div className="relative min-h-[500px] p-8 lg:p-12 bg-gray-50">
            {/* Multiple Post-it Notes */}
            <div
              className={`absolute top-12 left-12 w-40 h-40 bg-white rounded-xl border border-gray-200 shadow-xl transform rotate-[-4deg] p-4 transition-all duration-300 ${
                hoveredNote === 1
                  ? 'rotate-[-2deg] shadow-2xl scale-105'
                  : 'hover:rotate-[-2deg] hover:shadow-2xl'
              }`}
              onMouseEnter={() => setHoveredNote(1)}
              onMouseLeave={() => setHoveredNote(null)}
            >
              <div className="text-sm font-semibold text-gray-900 mb-2">
                💡 아이디어
              </div>
              <div className="text-xs text-gray-700 leading-relaxed">
                새로운 기능을
                <br />
                추가해보세요
              </div>
            </div>

            <div
              className={`absolute top-20 right-16 w-36 h-36 bg-gray-50 rounded-xl border border-gray-200 shadow-xl transform rotate-[3deg] p-4 transition-all duration-300 ${
                hoveredNote === 2
                  ? 'rotate-[1deg] shadow-2xl scale-105'
                  : 'hover:rotate-[1deg] hover:shadow-2xl'
              }`}
              onMouseEnter={() => setHoveredNote(2)}
              onMouseLeave={() => setHoveredNote(null)}
            >
              <div className="text-sm font-semibold text-gray-900 mb-2">
                📋 할 일
              </div>
              <div className="text-xs text-gray-700">
                • 작업 1
                <br />• 작업 2
                <br />• 작업 3
              </div>
            </div>

            <div
              className={`absolute bottom-24 left-20 w-44 h-40 bg-white rounded-xl border border-gray-200 shadow-xl transform rotate-[2deg] p-4 transition-all duration-300 ${
                hoveredNote === 3
                  ? 'rotate-[4deg] shadow-2xl scale-105'
                  : 'hover:rotate-[4deg] hover:shadow-2xl'
              }`}
              onMouseEnter={() => setHoveredNote(3)}
              onMouseLeave={() => setHoveredNote(null)}
            >
              <div className="text-sm font-semibold text-gray-900 mb-2">
                🎯 목표
              </div>
              <div className="text-xs text-gray-700 leading-relaxed">
                프로젝트의
                <br />
                최종 목표를
                <br />
                정리하세요
              </div>
            </div>

            {/* 새 포스트잇 애니메이션 */}
            {showNewNote && (
              <div
                className="absolute top-32 right-32 w-32 h-32 bg-white rounded-xl border border-gray-200 shadow-xl p-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{
                  transform: 'rotate(5deg)',
                }}
              >
                <div className="text-xs font-semibold text-gray-900 mb-1">
                  ✨ 새 아이디어
                </div>
                <div className="text-xs text-gray-700">
                  실시간으로 추가됨
                </div>
              </div>
            )}

            {/* Image Placeholder */}
            <div className="absolute bottom-16 right-20 w-48 h-36 bg-gray-100 rounded-xl border border-gray-200 shadow-xl flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-gray-500 font-medium">이미지 업로드</span>
              </div>
            </div>

            {/* Connection Lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 0 }}
            >
              <line
                x1="100"
                y1="120"
                x2="600"
                y2="180"
                stroke="gray"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                opacity="0.2"
              />
              <line
                x1="140"
                y1="400"
                x2="500"
                y2="320"
                stroke="gray"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                opacity="0.2"
              />
            </svg>

            {/* Cursor Indicators (showing collaboration) - 애니메이션 */}
            <div
              className="absolute top-32 left-1/3 transition-all duration-1000 ease-out"
              style={{
                transform: `translate(${cursorPosition.x - 300}px, ${cursorPosition.y - 200}px)`,
              }}
            >
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-gray-200">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-600 font-medium">팀원 1</span>
              </div>
            </div>
            <div className="absolute bottom-32 right-1/4">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-gray-200">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <span className="text-xs text-gray-600 font-medium">팀원 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

