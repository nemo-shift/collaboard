'use client';

import { Button } from '@shared/ui';

interface HeroSectionProps {
  isAuthenticated?: boolean;
}

export const HeroSection = ({ isAuthenticated = false }: HeroSectionProps) => {
  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-12 sm:pt-16 pb-20 sm:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: Text Content */}
        <div className="text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            {isAuthenticated ? (
              <>
                환영합니다!
                <br />
                <span className="text-gray-900">
                  보드를 만들어 시작하세요
                </span>
              </>
            ) : (
              <>
                아이디어를
                <br />
                <span className="text-gray-900">
                  함께 만들어가세요
                </span>
              </>
            )}
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
            {isAuthenticated
              ? '대시보드에서 새 보드를 만들고 팀과 함께 작업을 시작하세요'
              : '실시간으로 공유하고 함께 발전시키는 미니멀리스트 온라인 화이트보드'}
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
        <div className="relative flex items-center justify-center min-h-[400px] lg:min-h-[500px]">
          {/* Post-it Notes Stack */}
          <div className="relative w-full max-w-md">
            {/* Large Post-it 1 - 노란색 (전형적인 포스트잇) */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-yellow-50 rounded-xl border border-yellow-200 shadow-xl transform rotate-[-5deg] p-5 hover:rotate-[-3deg] hover:shadow-2xl transition-all duration-300 z-10">
              <div className="text-base font-bold text-gray-900 mb-3">
                💡 아이디어
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                새로운 기능을
                <br />
                추가해보세요
              </div>
            </div>

            {/* Large Post-it 2 - 분홍색 */}
            <div className="absolute top-16 right-0 w-44 h-44 bg-pink-50 rounded-xl border border-pink-200 shadow-xl transform rotate-[4deg] p-5 hover:rotate-[2deg] hover:shadow-2xl transition-all duration-300 z-20">
              <div className="text-base font-bold text-gray-900 mb-3">
                📋 할 일
              </div>
              <div className="text-sm text-gray-700">
                • 작업 1
                <br />• 작업 2
                <br />• 작업 3
              </div>
            </div>

            {/* Large Post-it 3 - 연한 파란색 */}
            <div className="absolute bottom-8 left-8 w-52 h-48 bg-blue-50 rounded-xl border border-blue-200 shadow-xl transform rotate-[2deg] p-5 hover:rotate-[4deg] hover:shadow-2xl transition-all duration-300 z-30">
              <div className="text-base font-bold text-gray-900 mb-3">
                🎯 목표
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                프로젝트의
                <br />
                최종 목표를
                <br />
                정리하세요
              </div>
            </div>

            {/* Medium Post-it 4 - 연한 초록색 */}
            <div className="absolute bottom-0 right-12 w-36 h-36 bg-green-50 rounded-xl border border-green-200 shadow-xl transform rotate-[-3deg] p-4 hover:rotate-[-1deg] hover:shadow-2xl transition-all duration-300 z-40">
              <div className="text-sm font-bold text-gray-900 mb-2">
                ✨ 메모
              </div>
              <div className="text-xs text-gray-700">
                중요한 내용을
                <br />
                기록하세요
              </div>
            </div>

            {/* Small Post-it 5 - 연한 보라색 */}
            <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-purple-50 rounded-xl border border-purple-200 shadow-lg transform rotate-[6deg] p-3 hover:rotate-[4deg] hover:shadow-xl transition-all duration-300 z-50">
              <div className="text-xs font-bold text-gray-900 mb-1">
                📌 참고
              </div>
              <div className="text-xs text-gray-700">
                유용한 정보
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

