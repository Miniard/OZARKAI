/**
 * Composant Card - Design épuré et moderne
 */

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ===========================================
   CARD CONTAINER
   =========================================== */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-slate-200/80 shadow-card',
      bordered: 'bg-white border-2 border-slate-200',
      elevated: 'bg-white shadow-soft-lg border border-slate-100',
      interactive: 'bg-white border border-slate-200/80 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

/* ===========================================
   CARD HEADER
   =========================================== */

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  action?: ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between gap-4 pb-4',
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

/* ===========================================
   CARD TITLE
   =========================================== */

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  description?: string;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', description, children, ...props }, ref) => (
    <div>
      <Component
        ref={ref}
        className={cn(
          'text-lg font-semibold text-slate-900 tracking-tight',
          className
        )}
        {...props}
      >
        {children}
      </Component>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  )
);

CardTitle.displayName = 'CardTitle';

/* ===========================================
   CARD CONTENT
   =========================================== */

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('', className)}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

/* ===========================================
   CARD FOOTER
   =========================================== */

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-3 pt-4',
        bordered && 'border-t border-slate-100 mt-4',
        className
      )}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

/* ===========================================
   STAT CARD
   =========================================== */

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: ReactNode;
  iconColor?: string;
  className?: string;
}

function StatCard({ title, value, change, icon, iconColor = 'text-primary-500', className }: StatCardProps) {
  const changeColors = {
    increase: 'text-success-600 bg-success-50',
    decrease: 'text-danger-600 bg-danger-50',
    neutral: 'text-slate-600 bg-slate-100',
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
          {change && (
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              changeColors[change.type]
            )}>
              {change.type === 'increase' && '↑'}
              {change.type === 'decrease' && '↓'}
              {Math.abs(change.value)}%
            </span>
          )}
        </div>
        {icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            iconColor
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter, StatCard };
