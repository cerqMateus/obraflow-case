import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

const buttonVariants = cva('inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60', {
  variants: { variant: {
    default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
    outline: 'border border-border bg-background text-foreground hover:bg-muted',
    ghost: 'text-foreground hover:bg-muted',
  } }, defaultVariants: { variant: 'default' },
});
export const Button = ({ className, variant, asChild = false, ...props }:
  ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) => {
  const Component = asChild ? Slot : 'button';
  return <Component data-slot="button" className={cn(buttonVariants({ variant }), className)} {...props} />;
};
