export type LeadCategoria = "empresario" | "designer" | "entusiasta" | "indefinido";

export const PERFIL_BADGES: Record<
  LeadCategoria,
  { emoji: string; label: string; color: string }
> = {
  empresario: { emoji: "🔥", label: "Empresário", color: "text-orange-400" },
  designer: { emoji: "🌶️", label: "Designer", color: "text-rose-400" },
  entusiasta: { emoji: "❄️", label: "Entusiasta", color: "text-sky-400" },
  indefinido: { emoji: "⚪", label: "—", color: "text-white/25" },
};

export function PerfilBadge({
  classificacao,
  score,
}: {
  classificacao: string | null;
  score: number;
}) {
  const key = (classificacao ?? "indefinido") as LeadCategoria;
  const b = PERFIL_BADGES[key] ?? PERFIL_BADGES.indefinido;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${b.color}`} title={b.label}>
      <span className="text-base leading-none">{b.emoji}</span>
      {key !== "indefinido" && <span className="font-light tabular-nums">{score}</span>}
    </span>
  );
}
