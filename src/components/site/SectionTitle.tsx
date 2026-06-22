import type { ReactNode } from "react";

export function SectionTitle({ eyebrow, title, lead }: { eyebrow?: string; title: ReactNode; lead?: ReactNode }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && (
        <div className="text-xs font-mono uppercase tracking-widest text-brand">{eyebrow}</div>
      )}
      <h2 className="text-3xl md:text-4xl mt-3">{title}</h2>
      {lead && <p className="mt-3 text-body-ink leading-relaxed">{lead}</p>}
    </div>
  );
}