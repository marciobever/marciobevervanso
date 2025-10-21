// components/ui/GlassCard.tsx
import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement>;

export default function GlassCard({ className = '', children, ...rest }: Props) {
  return (
    <div
      className={[
        // vidro leve + borda + sombra suave
        'relative overflow-hidden rounded-2xl border bg-white/90 backdrop-blur-sm',
        'shadow-sm hover:shadow-md transition',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
