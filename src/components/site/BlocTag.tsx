import { BLOC_COLOR, BLOC_LABEL, type Bloc } from "@/data/types";

export function BlocTag({ bloc, className = "" }: { bloc: Bloc; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-body-ink ${className}`}
      title={BLOC_LABEL[bloc]}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: BLOC_COLOR[bloc] }}
      />
      {BLOC_LABEL[bloc]}
    </span>
  );
}