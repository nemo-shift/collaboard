'use client';

import { useTheme } from '@shared/lib';

export const HowItWorksSection = () => {
  const { classes } = useTheme();

  return (
    <section className={`max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 sm:py-24 border-t ${classes.border} ${classes.bgSecondary}`}>
      <div className="max-w-6xl mx-auto">
        <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${classes.text} text-center mb-4 tracking-tight`}>
          3단계로 시작하기
        </h2>
        <p className={`text-lg sm:text-xl ${classes.textSecondary} text-center mb-16 max-w-2xl mx-auto`}>
          간단한 과정으로 아이디어를 공유하고 함께 작업하세요
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Step 1 */}
          <div className="relative">
            <div className="text-center">
              {/* Step Number */}
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${classes.bg} border-2 ${classes.text} flex items-center justify-center shadow-lg`}>
                <span className={`text-2xl font-bold ${classes.text}`}>1</span>
              </div>

              {/* Step Icon */}
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${classes.bg} ${classes.border} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
                <svg
                  className={`w-10 h-10 ${classes.text}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>

              <h3 className={`text-xl font-semibold ${classes.text} mb-3`}>
                로그인 또는 회원가입
              </h3>
              <p className={`${classes.textSecondary} leading-relaxed text-sm sm:text-base`}>
                Google 계정 또는 이메일로 간편하게 시작하세요
              </p>
            </div>

            {/* Connector Line */}
            <div className={`hidden md:block absolute top-8 left-full w-full h-0.5 ${classes.borderSecondary} -z-10`}>
              <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 ${classes.borderSecondary} rounded-full`} />
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="text-center">
              {/* Step Number */}
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${classes.bg} border-2 ${classes.text} flex items-center justify-center shadow-lg`}>
                <span className={`text-2xl font-bold ${classes.text}`}>2</span>
              </div>

              {/* Step Icon */}
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${classes.bg} ${classes.border} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
                <svg
                  className={`w-10 h-10 ${classes.text}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>

              <h3 className={`text-xl font-semibold ${classes.text} mb-3`}>
                보드 생성 또는 참여
              </h3>
              <p className={`${classes.textSecondary} leading-relaxed text-sm sm:text-base`}>
                새 보드를 만들거나 링크로 팀원의 보드에 참여하세요
              </p>
            </div>

            {/* Connector Line */}
            <div className={`hidden md:block absolute top-8 left-full w-full h-0.5 ${classes.borderSecondary} -z-10`}>
              <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 ${classes.borderSecondary} rounded-full`} />
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="text-center">
              {/* Step Number */}
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${classes.bg} border-2 ${classes.text} flex items-center justify-center shadow-lg`}>
                <span className={`text-2xl font-bold ${classes.text}`}>3</span>
              </div>

              {/* Step Icon */}
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${classes.bg} ${classes.border} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
                <svg
                  className={`w-10 h-10 ${classes.text}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>

              <h3 className={`text-xl font-semibold ${classes.text} mb-3`}>
                실시간으로 협업
              </h3>
              <p className={`${classes.textSecondary} leading-relaxed text-sm sm:text-base`}>
                포스트잇과 이미지를 추가하고 팀과 함께 아이디어를 발전시키세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

