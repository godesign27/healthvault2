interface MiniStatProps { label: string; value: string; context: string }

export function MiniStat({ label, value, context }: MiniStatProps) {
  return <article className="mini-stat"><span>{label}</span><strong>{value}</strong><small>{context}</small></article>;
}
