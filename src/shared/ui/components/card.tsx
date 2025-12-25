import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'postit';
}

export const Card = ({
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) => {
  const baseStyles = 'bg-white border rounded-lg shadow-sm p-6';
  
  const variants = {
    default: 'border-gray-200',
    postit: 'border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

