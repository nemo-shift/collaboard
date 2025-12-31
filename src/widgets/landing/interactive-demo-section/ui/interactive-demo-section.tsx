'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@shared/lib';
import { DemoPostit, CursorIndicator } from './components';

export const InteractiveDemoSection = () => {
  const { classes } = useTheme();
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 300, y: 200 });
  const [showNewNote, setShowNewNote] = useState(true); // 처음부터 보이도록 변경

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
    <section className={`max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-24 border-t ${classes.border} ${classes.bg}`}>
      <div className="max-w-6xl mx-auto">
        <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${classes.text} text-center mb-4 tracking-tight`}>
          실제 화이트보드처럼
        </h2>
        <p className={`text-lg sm:text-xl ${classes.textMuted} text-center mb-12 sm:mb-16 max-w-2xl mx-auto`}>
          드래그하고, 포스트잇을 추가하고, 이미지를 업로드하세요
        </p>
        
        {/* Whiteboard Demo */}
        <div className={`relative ${classes.bg} rounded-2xl ${classes.border} shadow-2xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden`}>
          <div className={`relative min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] p-4 sm:p-6 md:p-8 lg:p-12 ${classes.bgSurfaceSubtle}`}>
            {/* Grid Background - 라이트모드용 검은색 그리드 */}
          <div
              className="absolute inset-0 opacity-[0.06] dark:opacity-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, black 1px, transparent 1px),
                linear-gradient(to bottom, black 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
                zIndex: 0,
            }}
          />
            {/* 다크모드용 밝은 그리드 */}
            <div
              className="absolute inset-0 opacity-0 dark:opacity-[0.15]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, white 1px, transparent 1px),
                  linear-gradient(to bottom, white 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                zIndex: 0,
              }}
            />
            {/* Multiple Post-it Notes */}
            <DemoPostit
              id={1}
              title="💡 아이디어"
              content={
                <>
                  새로운 기능을
                  <br />
                  추가해보세요
                </>
              }
              position={{ top: '1rem', left: '1rem' }}
              size={{ width: '8rem', height: '8rem' }}
              rotation={-4}
              hoveredNote={hoveredNote}
              onMouseEnter={() => setHoveredNote(1)}
              onMouseLeave={() => setHoveredNote(null)}
              leadingRelaxed
              className="sm:!top-16 sm:!left-16 sm:!w-40 sm:!h-40"
            />

            <DemoPostit
              id={2}
              title="📋 할 일"
              content={
                <>
                  • 작업 1
                  <br />• 작업 2
                  <br />• 작업 3
                </>
              }
              position={{ top: '1rem', right: '1rem' }}
              size={{ width: '7rem', height: '7rem' }}
              rotation={3}
              hoveredNote={hoveredNote}
              onMouseEnter={() => setHoveredNote(2)}
              onMouseLeave={() => setHoveredNote(null)}
              className="sm:!top-16 sm:!right-24 sm:!w-36 sm:!h-36"
            />

            <DemoPostit
              id={3}
              title="🎯 목표"
              content={
                <>
                프로젝트의
                <br />
                최종 목표를
                <br />
                정리하세요
                </>
              }
              position={{ bottom: '3rem', left: '1rem' }}
              size={{ width: '9rem', height: '8rem' }}
              rotation={2}
              hoveredNote={hoveredNote}
              onMouseEnter={() => setHoveredNote(3)}
              onMouseLeave={() => setHoveredNote(null)}
              leadingRelaxed
              className="sm:!bottom-28 sm:!left-24 sm:!w-44 sm:!h-40"
            />

            {/* 가운데 포스트잇 추가 */}
            <DemoPostit
              id={4}
              title="📝 메모"
              content={
                <>
                  중요한 내용을
                  <br />
                  기록하세요
                </>
              }
              position={{ top: '50%', left: '50%' }}
              size={{ width: '7rem', height: '7rem' }}
              rotation={-2}
              hoveredNote={hoveredNote}
              onMouseEnter={() => setHoveredNote(4)}
              onMouseLeave={() => setHoveredNote(null)}
              transform="translate(-50%, -50%) rotate(-2deg)"
              className="sm:!w-36 sm:!h-36"
            />

            {/* 새 포스트잇 애니메이션 */}
            {showNewNote && (
              <DemoPostit
                id={5}
                title="✨ 새 아이디어"
                content="실시간으로 추가됨"
                position={{ top: '8rem', right: '1rem' }}
                size={{ width: '6rem', height: '6rem' }}
                rotation={5}
                hoveredNote={null}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 sm:!top-44 sm:!right-28 sm:!w-32 sm:!h-32"
              />
            )}

            {/* Image Placeholder */}
            <div className="absolute bottom-4 right-4 sm:bottom-20 sm:right-24 w-32 h-24 sm:w-48 sm:h-36 bg-[#F5F5F0] dark:bg-[#2A2A2A] rounded-sm border border-[#E0E0E0] dark:border-[#404040] shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-center" style={{ zIndex: 10 }}>
              <div className="text-center">
                <svg
                  className={`w-8 h-8 sm:w-12 sm:h-12 mx-auto ${classes.textMuted} mb-2`}
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
                <span className={`text-xs sm:text-sm ${classes.textMuted} font-medium`}>이미지 업로드</span>
              </div>
            </div>

            {/* Connection Lines - 모바일에서 숨김 */}
            <svg
              className="absolute inset-0 pointer-events-none hidden sm:block"
              style={{ zIndex: 1 }}
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

            {/* Cursor Indicators (showing collaboration) */}
            <CursorIndicator
              name="팀원 1"
              color="#3b82f6"
              position={{ top: '80px', left: '120px' }}
              transform="translate(-6px, -6px)"
              className="sm:!top-[135px] sm:!left-[300px]"
            />
            <CursorIndicator
              name="팀원 2"
              color="#10b981"
              position={{ bottom: '4rem', right: '15%' }}
              animationDelay="0.5s"
              className="sm:!bottom-8 sm:!right-[25%]"
            />
            <CursorIndicator
              name="팀원 3"
              color="#a855f7"
              position={{ top: '50%', left: '50%' }}
              transform="translate(-50%, calc(-50% - 80px))"
              animationDelay="1s"
              className="sm:!transform-[translate(-50%,calc(-50%-120px))]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

