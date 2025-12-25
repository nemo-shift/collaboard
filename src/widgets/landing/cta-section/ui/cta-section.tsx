'use client';

import { Button } from '@shared/ui';

interface CTASectionProps {
  isAuthenticated?: boolean;
}

export const CTASection = ({ isAuthenticated = false }: CTASectionProps) => {
  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-24 border-t border-gray-200 bg-gray-50">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          {isAuthenticated ? '새 보드를 만들어보세요' : '지금 시작하세요'}
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-xl mx-auto">
          {isAuthenticated
            ? '대시보드에서 새 보드를 만들고 팀과 함께 작업을 시작하세요'
            : '지금 바로 시작하여 아이디어를 공유하고 함께 작업해보세요'}
        </p>
        <Button
          href={isAuthenticated ? '/dashboard' : '/auth'}
          asLink
          className="min-w-[240px] text-base sm:text-lg px-8 py-4"
        >
          {isAuthenticated ? '대시보드로 가기' : '시작하기'}
        </Button>
      </div>
    </section>
  );
};

