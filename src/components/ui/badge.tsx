import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'accent';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'border-transparent bg-zinc-100 text-zinc-900 shadow': variant === 'default',
          'border-zinc-800 bg-zinc-900 text-zinc-300': variant === 'secondary',
          'border-rose-900/60 bg-rose-950/40 text-rose-400': variant === 'destructive',
          'border-zinc-800 text-zinc-400': variant === 'outline',
          'border-emerald-900/60 bg-emerald-950/40 text-emerald-400': variant === 'success',
          'border-amber-900/60 bg-amber-950/40 text-amber-400': variant === 'warning',
          'border-blue-900/60 bg-blue-950/40 text-blue-400': variant === 'accent',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
