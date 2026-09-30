import type { DashboardResponse } from '@/types/api';

const CARDS: Array<{ key: keyof DashboardResponse; label: string }> = [
  { key: 'total', label: 'Total' },
  { key: 'open', label: 'Abertas' },
  { key: 'inProgress', label: 'Em atendimento' },
  { key: 'completed', label: 'Concluídas' },
];

type DashboardCardsProps = {
  summary: DashboardResponse;
};

export function DashboardCards({ summary }: DashboardCardsProps) {
  return (
    <section
      aria-label="Resumo das solicitações"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {CARDS.map((card) => (
        <article
          key={card.key}
          className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
        >
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {summary[card.key]}
          </p>
        </article>
      ))}
    </section>
  );
}

export function DashboardCardsSkeleton() {
  return (
    <div
      aria-label="Carregando resumo"
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      role="status"
    >
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}
