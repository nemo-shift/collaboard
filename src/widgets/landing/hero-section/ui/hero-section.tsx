'use client';

import { Button } from '@shared/ui';

interface HeroSectionProps {
  isAuthenticated?: boolean;
}

export const HeroSection = ({ isAuthenticated = false }: HeroSectionProps) => {
  return (
    <section className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12 sm:pt-16 pb-20 sm:pb-24 overflow-hidden">
      {/* 웨이브 밴드 배경 이미지 - 포스트잇 뒤에 배치 (CSS Mask 사용) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* 라이트모드용 - 빨간색 */}
        <div 
          className="absolute right-0 w-3/4 hidden lg:block dark:hidden"
          style={{ 
            top: '520px', // 할일 포스트잇 중간 높이에서 반 정도 내림
            height: '400px',
            maxHeight: '400px',
            WebkitMaskImage: 'url(/images/collawave.png)',
            WebkitMaskSize: '80%',
            WebkitMaskPosition: 'top right',
            WebkitMaskRepeat: 'no-repeat',
            maskImage: 'url(/images/collawave.png)',
            maskSize: '80%',
            maskPosition: 'top right',
            maskRepeat: 'no-repeat',
            backgroundColor: 'var(--color-primary-main)',
            opacity: 0.8
          }}
        />
        {/* 다크모드용 - 라임색 */}
        <div 
          className="absolute right-0 w-3/4 hidden lg:hidden dark:lg:block"
          style={{ 
            top: '520px', // 할일 포스트잇 중간 높이에서 반 정도 내림
            height: '400px',
            maxHeight: '400px',
            WebkitMaskImage: 'url(/images/collawave.png)',
            WebkitMaskSize: '80%',
            WebkitMaskPosition: 'top right',
            WebkitMaskRepeat: 'no-repeat',
            maskImage: 'url(/images/collawave.png)',
            maskSize: '80%',
            maskPosition: 'top right',
            maskRepeat: 'no-repeat',
            backgroundColor: 'var(--color-accent-lime-main)',
            opacity: 0.8
          }}
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: Text Content */}
        <div className="text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-[var(--color-text-strong)] mb-6 leading-tight tracking-tight">
            <span className="whitespace-nowrap">
              <span className="sm:hidden">톡 쏘는<br />실시간 협업 보드</span>
              <span className="hidden sm:inline">톡 쏘는 실시간 협업 보드</span>
            </span>
            <br />
            <span className="text-[var(--color-primary-main)] dark:text-[var(--color-accent-lime-main)] whitespace-nowrap">
              Together, ideas fizz.
            </span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-[var(--color-text-body)] dark:text-[var(--color-text-secondary)] mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
            {isAuthenticated
              ? '팀이 함께 모이면, 아이디어는 자연스럽게 살아납니다.'
              : 'Collaboard는 실시간으로 반응하고 함께 만들기 위해 태어난 협업 보드입니다. 함께 시작해요.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button
              href={isAuthenticated ? '/dashboard' : '/auth'}
              asLink
              className="min-w-[220px]"
            >
              {isAuthenticated ? '대시보드로 가기' : '시작하기'}
            </Button>
          </div>
        </div>

        {/* Right: Post-it Notes Design */}
        <div className="relative flex items-center justify-center min-h-[400px] lg:min-h-[600px] lg:ml-8">
          {/* Post-it Notes Stack */}
          <div className="relative w-full max-w-md h-full">
            {/* Large Post-it 1 - 노란색 포스트잇 (아이디어) - 중앙 하단 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-48 bg-[#FFFC9B] dark:bg-[#FFF9C4] rounded-sm shadow-lg transform rotate-[-3deg] p-5 hover:rotate-[1deg] hover:shadow-xl transition-all duration-300 z-30 border border-[#F5F5DC] dark:border-[#E8E8D3]">
              <div className="text-base font-bold text-[#333] dark:text-[#1a1a1a] mb-3">
                💡 아이디어
              </div>
              <div className="text-sm text-[#333] dark:text-[#1a1a1a] leading-relaxed">
                새로운 기능을
                <br />
                추가해보세요
              </div>
            </div>

            {/* Large Post-it 2 - 분홍색 포스트잇 (할 일) - 왼쪽 중앙 */}
            <div className="absolute top-36 left-4 w-44 h-44 bg-[#FFB3BA] dark:bg-[#FFCCCB] rounded-sm shadow-lg transform rotate-[-8deg] p-5 hover:rotate-[-13deg] hover:shadow-xl transition-all duration-300 z-20 border border-[#FFA0A8] dark:border-[#FFB6C1]">
              <div className="text-base font-bold text-[#333] dark:text-[#1a1a1a] mb-3">
                📋 할 일
              </div>
              <div className="text-sm text-[#333] dark:text-[#1a1a1a]">
                • 작업 1
                <br />• 작업 2
                <br />• 작업 3
              </div>
            </div>

            {/* Large Post-it 3 - 파란색 포스트잇 (목표) - 오른쪽 중앙, 아이디어 아래 */}
            <div className="absolute top-35 right-5 w-52 h-48 bg-[#B3D9FF] dark:bg-[#ADD8E6] rounded-sm shadow-lg transform rotate-[5deg] p-5 hover:rotate-[9deg] hover:shadow-xl transition-all duration-300 z-40 border border-[#99CCFF] dark:border-[#87CEEB]">
              <div className="text-base font-bold text-[#333] dark:text-[#1a1a1a] mb-3">
                🎯 목표
              </div>
              <div className="text-sm text-[#333] dark:text-[#1a1a1a] leading-relaxed">
                프로젝트의
                <br />
                최종 목표를
                <br />
                정리하세요
              </div>
            </div>

            {/* Medium Post-it 4 - 초록색 포스트잇 (메모) - 왼쪽 상단 */}
            <div className="absolute top-0 left-8 w-36 h-36 bg-[#B3FFB3] dark:bg-[#C8E6C9] rounded-sm shadow-lg transform rotate-[5deg] p-4 hover:rotate-[-1deg] hover:shadow-xl transition-all duration-300 z-10 border border-[#99FF99] dark:border-[#A5D6A7]">
              <div className="text-sm font-bold text-[#333] dark:text-[#1a1a1a] mb-2">
                ✨ 메모
              </div>
              <div className="text-xs text-[#333] dark:text-[#1a1a1a]">
                중요한 내용을
                <br />
                기록하세요
              </div>
            </div>

            {/* Small Post-it 5 - 보라색 포스트잇 (참고) - 오른쪽 상단 */}
            <div className="absolute top-1 right-10 w-32 h-32 bg-[#E1BEE7] dark:bg-[#D1C4E9] rounded-sm shadow-md transform rotate-[-6deg] p-3 hover:rotate-[4deg] hover:shadow-lg transition-all duration-300 z-50 border border-[#CE93D8] dark:border-[#B39DDB]">
              <div className="text-xs font-bold text-[#333] dark:text-[#1a1a1a] mb-1">
                📌 참고
              </div>
              <div className="text-xs text-[#333] dark:text-[#1a1a1a]">
                유용한 정보
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

