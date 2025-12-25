'use client';

import Link from 'next/link';
import { useAuth } from '@features/auth';

interface HeaderProps {
  showLogin?: boolean;
  showLogout?: boolean;
  onLogout?: () => void;
}

export const Header = ({
  showLogin = true,
  showLogout = true,
  onLogout,
}: HeaderProps) => {
  const { userProfile, isAuthenticated, signOut } = useAuth();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await signOut();
    }
  };

  return (
    <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Vibe Board</h1>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {userProfile && (
                  <span className="text-sm text-gray-600">
                    {userProfile.displayName || userProfile.email}
                  </span>
                )}
                {showLogout && (
                  <button
                    onClick={handleLogout}
                    className="text-xs text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium"
                  >
                    로그아웃
                  </button>
                )}
              </>
            ) : (
              showLogin && (
                <Link
                  href="/auth"
                  className="text-xs text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium"
                >
                  로그인
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

