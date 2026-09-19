import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'white';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          {
            'bg-zinc-100 text-zinc-900 shadow hover:bg-zinc-200': variant === 'default',
            'bg-rose-600 text-white shadow-sm hover:bg-rose-500': variant === 'destructive',
            'border border-zinc-800 bg-transparent shadow-sm hover:bg-zinc-800 text-zinc-200':
              variant === 'outline',
            'bg-zinc-800 text-zinc-100 shadow-sm hover:bg-zinc-700': variant === 'secondary',
            'hover:bg-zinc-800/60 hover:text-zinc-100 text-zinc-400': variant === 'ghost',
            'text-zinc-100 underline-offset-4 hover:underline': variant === 'link',
            'bg-[#fefce8] text-zinc-950 font-semibold shadow hover:bg-white': variant === 'white',
          },
          {
            'h-9 px-4 py-2': size === 'default',
            'h-8 rounded-lg px-3 text-xs': size === 'sm',
            'h-10 rounded-xl px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
