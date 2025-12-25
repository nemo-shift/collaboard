'use client';

export const Footer = () => {
  return (
    <footer className="border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">© 2024 Vibe Board. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="#" className="hover:text-black transition-colors">
              이용약관
            </a>
            <a href="#" className="hover:text-black transition-colors">
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

