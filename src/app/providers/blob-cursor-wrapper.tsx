'use client';

import { usePathname } from 'next/navigation';
import { BlobCursor } from '@shared/ui';

/**
 * BlobCursor를 경로에 따라 조건부로 활성화하는 래퍼 컴포넌트
 * 랜딩 페이지(/)에서만 blob cursor 활성화
 */
export const BlobCursorWrapper = () => {
  const pathname = usePathname();
  
  // 랜딩 페이지에서만 blob cursor 활성화
  const isLandingPage = pathname === '/';
  
  return <BlobCursor enabled={isLandingPage} />;
};

