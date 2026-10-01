import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '@/lib/requests/labels';
import type { RequestFilters } from '@/types/api';

type RequestFiltersFormProps = {
  value: RequestFilters;
  onChange: (filters: RequestFilters) => void;
  onApply: () => void;
  onClear: () => void;
};

const fieldClassName =
  'mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

export function RequestFiltersForm({
  value,
  onChange,
  onApply,
  onClear,
}: RequestFiltersFormProps) {
  return (
    <form
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-1">
          <label
            className="block text-sm font-medium text-slate-800"
            htmlFor="filter-title"
          >
            Título
          </label>
          <input
            id="filter-title"
            type="search"
            value={value.title}
            className={fieldClassName}
            onChange={(event) =>
              onChange({ ...value, title: event.target.value })
            }
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium text-slate-800"
            htmlFor="filter-category"
          >
            Categoria
          </label>
          <select
            id="filter-category"
            value={value.category}
            className={fieldClassName}
            onChange={(event) =>
              onChange({
                ...value,
                category: event.target.value as RequestFilters['category'],
              })
            }
          >
            <option value="">Todas</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium text-slate-800"
            htmlFor="filter-status"
          >
            Status
          </label>
          <select
            id="filter-status"
            value={value.status}
            className={fieldClassName}
            onChange={(event) =>
              onChange({
                ...value,
                status: event.target.value as RequestFilters['status'],
              })
            }
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium text-slate-800"
            htmlFor="filter-from"
          >
            Data inicial
          </label>
          <input
            id="filter-from"
            type="date"
            value={value.from}
            className={fieldClassName}
            onChange={(event) =>
              onChange({ ...value, from: event.target.value })
            }
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium text-slate-800"
            htmlFor="filter-to"
          >
            Data final
          </label>
          <input
            id="filter-to"
            type="date"
            value={value.to}
            className={fieldClassName}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white outline-none hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Filtrar
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 outline-none hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          onClick={onClear}
        >
          Limpar filtros
        </button>
      </div>
    </form>
  );
}
