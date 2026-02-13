import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  required = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const widthClass = fullWidth ? 'w-full' : '';

  // ACCESIBILIDAD: Construir aria-describedby dinámicamente
  const describedByIds = [
    error ? errorId : null,
    helperText && !error ? helperId : null,
    ariaDescribedBy,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = `
    px-4 py-2 rounded-lg border min-h-[44px]
    ${error 
      ? 'border-red-500 focus:ring-red-500' 
      : 'border-slate-300 dark:border-slate-600 focus:ring-emerald-500'
    }
    bg-white dark:bg-slate-800
    text-slate-900 dark:text-white
    placeholder-slate-400 dark:placeholder-slate-500
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors
    ${widthClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={widthClass}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="obligatorio">*</span>}
        </label>
      )}
      <input 
        id={inputId} 
        className={inputClasses}
        aria-label={ariaLabel || label}
        aria-describedby={describedByIds || undefined}
        aria-invalid={error ? 'true' : 'false'}
        aria-required={required}
        required={required}
        {...props} 
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};
