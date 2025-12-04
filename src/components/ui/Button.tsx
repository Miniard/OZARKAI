/**
 * Composant Button - Design moderne et accessible
 */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: `
        bg-primary-500 text-white
        hover:bg-primary-600 hover:shadow-primary-glow
        focus-visible:ring-primary-500
        active:scale-[0.98]
      `,
      secondary: `
        bg-slate-100 text-slate-700
        hover:bg-slate-200
        focus-visible:ring-slate-500
      `,
      outline: `
        bg-transparent border-2 border-slate-200 text-slate-700
        hover:bg-slate-50 hover:border-slate-300
        focus-visible:ring-slate-500
      `,
      ghost: `
        bg-transparent text-slate-600
        hover:bg-slate-100 hover:text-slate-900
        focus-visible:ring-slate-500
      `,
      danger: `
        bg-danger-500 text-white
        hover:bg-danger-600
        focus-visible:ring-danger-500
      `,
      success: `
        bg-success-500 text-white
        hover:bg-success-600
        focus-visible:ring-success-500
      `,
    };

    const sizes = {
      sm: 'text-sm px-3.5 py-2 rounded-lg gap-1.5',
      md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
      lg: 'text-base px-7 py-3.5 rounded-2xl gap-2.5',
      icon: 'p-2.5 rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'font-medium',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          // Variant styles
          variants[variant],
          // Size styles
          sizes[size],
          // Full width
          fullWidth && 'w-full',
          // Custom className
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Chargement...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
