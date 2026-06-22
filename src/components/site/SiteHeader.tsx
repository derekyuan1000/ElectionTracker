import { Link } from "@tanstack/react-router";

const NAV = [
  { to: "/", label: "Main", exact: true },
  { to: "/polls", label: "Polls" },
  { to: "/political-parties", label: "Parties" },
  { to: "/elections", label: "Elections" },
  { to: "/projection", label: "Projection" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-hairline bg-canvas/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl tracking-tight text-ink">
            <span className="text-brand">●</span> ElectionTracker
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              activeOptions={{ exact: "exact" in item ? item.exact : false }}
              activeProps={{ className: "text-ink bg-canvas-soft rounded-md" }}
              className="px-3 py-1.5 text-body-ink hover:text-ink transition-colors rounded-md"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
