'use client';

import { useTheme } from '@shared/lib';

export const FeaturesSection = () => {
  const { classes } = useTheme();

  return (
    <section className={`max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-24 border-t ${classes.border} ${classes.bg}`}>
      <div className="max-w-6xl mx-auto">
        <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${classes.text} text-center mb-12 sm:mb-16 tracking-tight`}>
          함께 작업하는 새로운 방식
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Feature 1 */}
          <div className="text-center group">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${classes.bg} ${classes.border} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
              <svg
                className={`w-8 h-8 ${classes.text}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold ${classes.text} mb-3`}>
              실시간 협업
            </h3>
            <p className={`${classes.textSecondary} leading-relaxed text-sm sm:text-base`}>
              여러 사람이 동시에 작업하고 변경사항이 즉시 반영됩니다
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center group">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${classes.bgSecondary} ${classes.border} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
              <svg
                className={`w-8 h-8 ${classes.text}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold ${classes.text} mb-3`}>
              자유로운 아이디어 표현
            </h3>
            <p className={`${classes.textSecondary} leading-relaxed text-sm sm:text-base`}>
              포스트잇과 이미지로 아이디어를 자유롭게 표현하고 정리하세요
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center group">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${classes.bg} ${classes.border} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
              <svg
                className={`w-8 h-8 ${classes.text}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold ${classes.text} mb-3`}>
              미니멀한 디자인
            </h3>
            <p className={`${classes.textSecondary} leading-relaxed text-sm sm:text-base`}>
              깔끔하고 직관적인 인터페이스로 집중해서 작업하세요
            </p>
          </div>

          {/* Feature 4 - 보드 공유 */}
          <div className="text-center group">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${classes.bgSecondary} ${classes.border} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
              <svg
                className={`w-8 h-8 ${classes.text}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold ${classes.text} mb-3`}>
              간편한 보드 공유
            </h3>
            <p className={`${classes.textSecondary} leading-relaxed text-sm sm:text-base`}>
              링크 하나로 팀원을 초대하고 함께 작업하세요
            </p>
          </div>

          {/* Feature 5 - 대시보드 관리 */}
          <div className="text-center group">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${classes.bg} ${classes.border} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
              <svg
                className={`w-8 h-8 ${classes.text}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className={`text-xl font-semibold ${classes.text} mb-3`}>
              대시보드로 관리
            </h3>
            <p className={`${classes.textSecondary} leading-relaxed text-sm sm:text-base`}>
              모든 보드를 한 곳에서 관리하고 통계를 확인하세요
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

