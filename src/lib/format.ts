export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtCountdown(iso: string): string {
  const target = new Date(iso).getTime();
  const now = new Date("2026-06-15").getTime();
  const days = Math.round((target - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days < 60) return `in ${days} days`;
  const months = Math.round(days / 30);
  if (months < 24) return `in ${months} months`;
  return `in ${(months / 12).toFixed(1)} years`;
}