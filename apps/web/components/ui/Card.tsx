import { HTMLAttributes, forwardRef } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Inner padding from the spacing scale. Defaults to 'md' (24px). */
  padding?: CardPadding;
}

const paddingMap: Record<CardPadding, string> = {
  none: '0',
  sm: 'var(--space-4)',
  md: 'var(--space-6)',
  lg: 'var(--space-8)',
};

/**
 * Shared card primitive wrapping the existing `.card` / `.glass-card`
 * glassmorphism treatment (globals.css) — background blur, border, and
 * :hover lift are inherited from that class. Only padding is
 * parametrized, since that's what varied ad-hoc (p-4/p-6/p-8/24px/28px…)
 * across pages that were each hand-rolling their own card look.
 */
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'md', className = '', style, children, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={`card ${className}`.trim()}
      style={{ padding: paddingMap[padding], ...style }}
      {...rest}
    >
      {children}
    </div>
  );
});

export default Card;
