import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-hairline rounded-lg ${className}`}>{children}</div>
  );
}

export function CardHeader({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between px-6 py-4 border-b border-hairline-soft">
      <div>
        <div className="text-ink font-display text-lg">{title}</div>
        {subtitle && <div className="text-sm text-muted-ink mt-0.5">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}