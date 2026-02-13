import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  ariaLabel?: string;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  padding = 'md',
  onClick,
  ariaLabel,
}) => {
  const baseClasses = 'bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 transition-shadow';
  const hoverClass = onClick ? 'cursor-pointer hover:shadow-lg' : '';
  const paddingClass = paddingClasses[padding];

  return (
    <div
      className={`${baseClasses} ${hoverClass} ${paddingClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel || title}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {title && (
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};
