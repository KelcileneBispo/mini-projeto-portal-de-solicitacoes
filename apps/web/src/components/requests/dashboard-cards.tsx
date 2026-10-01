import type { ComponentType } from 'react';
import {
  CheckCircleIcon,
  InboxIcon,
  LayersIcon,
  ProgressIcon,
} from '@/components/icons';
import type { DashboardResponse } from '@/types/api';

const CARDS: Array<{
  key: keyof DashboardResponse;
  label: string;
  icon: ComponentType;
  iconClassName: string;
}> = [
  {
    key: 'total',
    label: 'Total',
    icon: LayersIcon,
    iconClassName: 'bg-slate-100 text-slate-700',
  },
  {
    key: 'open',
    label: 'Abertas',
    icon: InboxIcon,
    iconClassName: 'bg-amber-100 text-amber-800',
  },
  {
    key: 'inProgress',
    label: 'Em atendimento',
    icon: ProgressIcon,
    iconClassName: 'bg-sky-100 text-sky-800',
  },
  {
    key: 'completed',
    label: 'Concluídas',
    icon: CheckCircleIcon,
    iconClassName: 'bg-emerald-100 text-emerald-800',
  },
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
      {CARDS.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.key}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-500">{card.label}</p>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconClassName}`}
              >
                <Icon />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              {summary[card.key]}
            </p>
          </article>
        );
      })}
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
