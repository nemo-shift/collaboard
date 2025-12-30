'use client';

import Link from 'next/link';
import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'href'> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: ReactNode;
  href?: string;
  asLink?: boolean;
}

const baseStyles =
  'px-5 py-3 font-medium rounded-xl transition-all duration-300 ease-in-out inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100 outline-none focus:outline-none';

const BUTTON_VARIANTS = {
  primary: 'bg-[var(--color-primary-main)] dark:bg-[var(--color-accent-lime-main)] text-white dark:text-[#1a1a1a] hover:bg-[var(--color-primary-hover)] dark:hover:bg-[var(--color-accent-lime-main)] dark:hover:brightness-110 active:bg-[var(--color-primary-active)] dark:active:bg-[var(--color-accent-lime-main)] dark:active:brightness-95 shadow-lg hover:shadow-xl hover:shadow-[var(--color-primary-main)]/30 dark:hover:shadow-[0_0_20px_rgba(196,255,0,0.6)] dark:hover:ring-2 dark:hover:ring-[var(--color-accent-lime-main)] dark:hover:ring-opacity-50 transition-all duration-300 disabled:hover:bg-[var(--color-primary-main)] dark:disabled:hover:bg-[var(--color-accent-lime-main)] disabled:hover:shadow-lg',
  secondary: 'bg-[var(--color-surface-default)] dark:bg-[var(--color-surface-default)] border border-[var(--color-border-default)] text-[var(--color-text-body)] dark:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-secondary-main)] dark:hover:border-[var(--color-accent-blue-main)] hover:text-[var(--color-secondary-main)] dark:hover:text-[var(--color-accent-blue-main)] transition-all duration-300 disabled:hover:bg-[var(--color-surface-default)] disabled:hover:border-[var(--color-border-default)] disabled:hover:text-[var(--color-text-body)]',
  outline: 'bg-transparent border-2 border-[var(--color-primary-action)] dark:border-[var(--color-primary-action)] text-[var(--color-primary-action)] hover:bg-[var(--color-primary-action)] hover:text-white dark:hover:text-[#1a1a1a] transition-all duration-300 disabled:hover:bg-transparent disabled:hover:text-[var(--color-primary-action)]',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  className = '',
  children,
  href,
  asLink = false,
  ...props
}, ref) => {

  const combinedClassName = `${baseStyles} ${BUTTON_VARIANTS[variant]} ${className}`;

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
      ref={ref}
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

