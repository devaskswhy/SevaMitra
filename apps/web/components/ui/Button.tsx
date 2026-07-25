'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Defaults to 'primary'. */
  variant?: ButtonVariant;
  /** Padding/font-size step from the type & spacing scale. Defaults to 'md'.
   *  Every size keeps a >=48px tap target (--tap-target) regardless of the
   *  visual density, per the app's older-age-friendly accessibility goal. */
  size?: ButtonSize;
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-xs)' },
  md: { padding: 'var(--space-3) var(--space-7)', fontSize: 'var(--text-sm)' },
  lg: { padding: 'var(--space-4) var(--space-9)', fontSize: 'var(--text-md)' },
};

/**
 * Shared button primitive. Composes the existing `.btn-sacred` /
 * `.btn-sacred-{variant}` CSS (globals.css) — which already defines the
 * gradient fills, borders, and :hover lift/glow per variant — so this
 * component only needs to parametrize size and pass through standard
 * button props, instead of every page re-implementing its own button
 * look via inline styles.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', style, disabled, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`btn-sacred btn-sacred-${variant} ${className}`.trim()}
      disabled={disabled}
      style={{
        ...sizeStyles[size],
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
