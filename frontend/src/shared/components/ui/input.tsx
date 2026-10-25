import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';
export const Input = ({ className, ...props }: ComponentProps<'input'>) => (
  <input data-slot="input" className={cn('flex h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base text-foreground caret-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:border-destructive disabled:opacity-60', className)} {...props} />
);
