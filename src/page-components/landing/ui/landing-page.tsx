'use client';

import { Footer } from '@shared/ui';
import { useAuth } from '@features/auth';
import { useTheme } from '@shared/lib';
import {
  HeroSection,
  InteractiveDemoSection,
  FeaturesSection,
  HowItWorksSection,
  CTASection,
} from '@widgets/landing';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-base-bg)' }}>
      <HeroSection isAuthenticated={isAuthenticated} />
      <InteractiveDemoSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
};
