'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@shared/ui';
import { usePasswordReset } from '@features/auth';

export const ResetRequestPage = () => {
  const {
    email,
    setEmail,
    handleRequestReset,
    isRequesting,
    requestError,
    requestSuccess,
  } = usePasswordReset();

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-lg mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            비밀번호 재설정
          </h1>
          <p className="text-base text-gray-600">
            등록된 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl p-8 sm:p-10">
          {requestSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  이메일을 확인해주세요
                </h2>
                <p className="text-sm text-gray-600">
                  비밀번호 재설정 링크를 이메일로 보내드렸습니다.
                  <br />
                  이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정하세요.
                </p>
              </div>
              <Link href="/auth">
                <Button className="w-full">로그인 페이지로 돌아가기</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-5">
              {requestError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{requestError}</p>
                </div>
              )}

              <Input
                id="email"
                name="email"
                type="email"
                label="이메일"
                placeholder="등록된 이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Button type="submit" className="w-full" disabled={isRequesting}>
                {isRequesting ? '전송 중...' : '재설정 링크 보내기'}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  로그인 페이지로 돌아가기
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

