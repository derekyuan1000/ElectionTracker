import { useEffect, useState } from "react";

const BARS = [
  "var(--bloc-left)",
  "var(--bloc-centerright)",
  "var(--bloc-farright)",
  "var(--bloc-liberal)",
  "var(--bloc-green)",
  "var(--bloc-regional)",
];

const MESSAGES = ["Fetching the latest polls…", "Weighting by recency…", "Projecting the Commons…"];

/**
 * Full-screen splash shown until live data settles. Stays mounted briefly
 * after `visible` flips to false so it can fade out.
 */
export function LoadingScreen({ visible }: { visible: boolean }) {
  const [mounted, setMounted] = useState(visible);
  const [msg, setMsg] = useState(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 500);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 1400);
    return () => clearInterval(t);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={visible}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-canvas transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center gap-8 animate-rise">
        <div className="font-display text-2xl tracking-tight text-ink">
          <span className="text-brand inline-block animate-pulse-dot">●</span> ElectionTracker
        </div>

        <div className="flex items-end gap-2 h-16" aria-hidden>
          {BARS.map((color, i) => (
            <span
              key={i}
              className="w-3 rounded-sm loader-bar"
              style={{ backgroundColor: color, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>

        <div className="h-5 overflow-hidden text-xs font-mono uppercase tracking-widest text-muted-ink">
          <span key={msg} className="block animate-rise">
            {MESSAGES[msg]}
          </span>
        </div>
      </div>
    </div>
  );
}
