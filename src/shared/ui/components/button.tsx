'use client';

import Link from 'next/link';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'href'> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: ReactNode;
  href?: string;
  asLink?: boolean;
}

export const Button = ({
  variant = 'primary',
  className = '',
  children,
  href,
  asLink = false,
  ...props
}: ButtonProps) => {
  const baseStyles =
    'px-5 py-3 font-medium rounded-xl transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100';
  
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl disabled:hover:bg-gray-900',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:hover:bg-white disabled:hover:border-gray-300',
    outline: 'bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white disabled:hover:bg-white disabled:hover:text-gray-900',
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

  if (asLink && href) {
    // Link로 사용할 때는 button 관련 props 제거
    return (
      <Link
        href={href}
        className={combinedClassName}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  );
};

