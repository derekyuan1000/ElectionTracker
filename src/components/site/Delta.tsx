export function Delta({ value }: { value: number }) {
  const up = value > 0;
  const zero = value === 0;
  return (
    <span
      className={`font-mono text-sm ${zero ? "text-muted-ink" : up ? "text-up" : "text-down"}`}
    >
      {value > 0 ? "+" : ""}{value.toFixed(1)}
    </span>
  );
}