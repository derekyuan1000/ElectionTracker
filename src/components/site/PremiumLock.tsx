import type { ReactNode } from "react";

export function PremiumLock({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="relative bg-white border border-hairline rounded-lg overflow-hidden">
      <div className="p-6 opacity-40 pointer-events-none select-none min-h-[200px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white/60 via-white/90 to-white">
        <div className="text-xs font-mono uppercase tracking-widest text-brand">Premium</div>
        <div className="font-display text-lg text-ink mt-1">{title}</div>
        <button className="mt-3 inline-flex items-center px-4 py-2 text-sm bg-ink text-white rounded-md cursor-not-allowed opacity-90">
          Unlock analysis
        </button>
        <div className="text-xs text-muted-ink mt-2">My Dashboard tier — demo</div>
      </div>
    </div>
  );
}