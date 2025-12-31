'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BlobCursor } from '@shared/ui';

/**
 * BlobCursor를 경로에 따라 조건부로 활성화하는 래퍼 컴포넌트
 * 랜딩 페이지(/)에서만 blob cursor 활성화
 * 모바일에서는 비활성화
 */
export const BlobCursorWrapper = () => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  
  // 랜딩 페이지에서만 blob cursor 활성화
  const isLandingPage = pathname === '/';
  
  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // Tailwind sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 모바일이거나 랜딩 페이지가 아니면 비활성화
  return <BlobCursor enabled={isLandingPage && !isMobile} />;
};

