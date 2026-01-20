'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-gold-500 text-espresso-900 hover:bg-gold-600 hover:shadow-glow active:scale-[0.98]',
      secondary:
        'bg-espresso-800 text-champagne-100 hover:bg-espresso-700 hover:shadow-soft-lg active:scale-[0.98]',
      outline:
        'border-2 border-espresso-300 text-espresso-800 bg-transparent hover:border-gold-500 hover:text-gold-700 active:scale-[0.98]',
      ghost:
        'text-espresso-700 bg-transparent hover:bg-nude-200 hover:text-espresso-900 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center',
          'font-sans font-medium tracking-wide',
          'rounded-2xl transition-all duration-300 ease-luxury',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
