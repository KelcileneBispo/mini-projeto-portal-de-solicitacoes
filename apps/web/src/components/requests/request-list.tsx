import { formatOpenedAt } from '@/lib/requests/format-date';
import { categoryLabel } from '@/lib/requests/labels';
import type { RequestListItem } from '@/types/api';
import { StatusBadge } from './status-badge';

type RequestListProps = {
  items: RequestListItem[];
};

export function RequestList({ items }: RequestListProps) {
  return (
    <div>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium" scope="col">
                Código
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                Título
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                Categoria
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                Solicitante
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                Data de abertura
              </th>
              <th className="px-4 py-3 font-medium" scope="col">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {item.id}
                </td>
                <td className="px-4 py-3 text-slate-900">{item.title}</td>
                <td className="px-4 py-3 text-slate-700">
                  {categoryLabel(item.category)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {item.requester.name}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatOpenedAt(item.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-500">Código {item.id}</p>
              <StatusBadge status={item.status} />
            </div>
            <h2 className="mt-2 text-base font-semibold text-slate-900">
              {item.title}
            </h2>
            <dl className="mt-3 space-y-1 text-sm text-slate-700">
              <div className="flex justify-between gap-4">
                <dt>Categoria</dt>
                <dd>{categoryLabel(item.category)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Solicitante</dt>
                <dd className="text-right">{item.requester.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Data de abertura</dt>
                <dd>{formatOpenedAt(item.createdAt)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RequestListSkeleton() {
  return (
    <div
      aria-label="Carregando solicitações"
      className="space-y-3"
      role="status"
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}

type EmptyRequestsProps = {
  filtered: boolean;
};

export function EmptyRequests({ filtered }: EmptyRequestsProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center shadow-sm">
      <p className="text-sm text-slate-700">Nenhuma solicitação encontrada.</p>
      {filtered ? (
        <p className="mt-2 text-sm text-slate-500">
          Nenhum resultado corresponde aos filtros atuais.
        </p>
      ) : null}
    </div>
  );
}
