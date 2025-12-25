'use client';

import { Footer } from '@shared/ui';
import { useAuth } from '@features/auth';
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
    <div className="min-h-screen bg-white">
      <HeroSection isAuthenticated={isAuthenticated} />
      <InteractiveDemoSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
};
