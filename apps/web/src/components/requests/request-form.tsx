'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CATEGORY_OPTIONS } from '@/lib/requests/labels';
import {
  requestFormSchema,
  type RequestFormInput,
  type RequestFormValues,
} from '@/lib/requests/form-schema';

type RequestFormProps = {
  mode: 'create' | 'edit';
  initialValues: RequestFormInput;
  onSubmit: (values: RequestFormValues) => Promise<void>;
  onCancel: () => void;
};

const fieldClassName =
  'mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

export function submitButtonLabel(
  mode: 'create' | 'edit',
  pending: boolean,
): string {
  if (mode === 'create') {
    return pending ? 'Criando...' : 'Criar solicitação';
  }

  return pending ? 'Salvando...' : 'Salvar alterações';
}

export function RequestForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: RequestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormInput, unknown, RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: initialValues,
  });

  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <p className="text-sm text-slate-600">Campos com * são obrigatórios.</p>

      <div>
        <label
          className="block text-sm font-medium text-slate-800"
          htmlFor="request-title"
        >
          Título <span className="text-red-700">*</span>
        </label>
        <input
          id="request-title"
          type="text"
          className={fieldClassName}
          required
          aria-required="true"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'request-title-error' : undefined}
          {...register('title')}
        />
        {errors.title ? (
          <p id="request-title-error" className="mt-2 text-sm text-red-700">
            {errors.title.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-800"
          htmlFor="request-description"
        >
          Descrição <span className="text-red-700">*</span>
        </label>
        <textarea
          id="request-description"
          rows={6}
          className={fieldClassName}
          required
          aria-required="true"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={
            errors.description ? 'request-description-error' : undefined
          }
          {...register('description')}
        />
        {errors.description ? (
          <p
            id="request-description-error"
            className="mt-2 text-sm text-red-700"
          >
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-800"
          htmlFor="request-category"
        >
          Categoria <span className="text-red-700">*</span>
        </label>
        <select
          id="request-category"
          className={fieldClassName}
          required
          aria-required="true"
          aria-invalid={errors.category ? true : undefined}
          aria-describedby={
            errors.category ? 'request-category-error' : undefined
          }
          {...register('category')}
        >
          <option value="">Selecione</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.category ? (
          <p id="request-category-error" className="mt-2 text-sm text-red-700">
            {errors.category.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 outline-none hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white outline-none hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {submitButtonLabel(mode, isSubmitting)}
        </button>
      </div>
    </form>
  );
}
