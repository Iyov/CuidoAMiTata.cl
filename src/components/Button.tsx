import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
export type ButtonSize = 'small' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  secondary: 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  small: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  children,
  ...props
}, ref) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

  return (
    <button ref={ref} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';
