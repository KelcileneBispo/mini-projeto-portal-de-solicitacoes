import { z } from 'zod';
import type {
  CreateRequestPayload,
  RequestCategory,
  UpdateRequestPayload,
} from '../../types/api';

const CATEGORY_VALUES = [
  'TI',
  'RH',
  'COMPRAS',
  'FINANCEIRO',
  'INFRAESTRUTURA',
] as const satisfies readonly RequestCategory[];

function isRequestCategory(value: string): value is RequestCategory {
  return (CATEGORY_VALUES as readonly string[]).includes(value);
}

function requiredText(
  emptyMessage: string,
  limitMessage: string,
  min: number,
  max: number,
) {
  return z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (!value) {
        context.addIssue({ code: 'custom', message: emptyMessage });
        return;
      }

      if (value.length < min || value.length > max) {
        context.addIssue({ code: 'custom', message: limitMessage });
      }
    });
}

export const requestFormSchema = z.object({
  title: requiredText(
    'Informe o título.',
    'Título deve ter entre 3 e 120 caracteres',
    3,
    120,
  ),
  description: requiredText(
    'Informe a descrição.',
    'Descrição deve ter entre 10 e 2000 caracteres',
    10,
    2000,
  ),
  category: z.string().refine(isRequestCategory, 'Selecione a categoria.'),
});

export type RequestFormInput = z.input<typeof requestFormSchema>;
export type RequestFormValues = z.output<typeof requestFormSchema>;

export const emptyRequestForm: RequestFormInput = {
  title: '',
  description: '',
  category: '',
};

export function toRequestPayload(
  values: RequestFormValues,
): CreateRequestPayload {
  return {
    title: values.title,
    description: values.description,
    category: values.category,
  };
}

export function toUpdateRequestPayload(
  values: RequestFormValues,
): UpdateRequestPayload {
  return toRequestPayload(values);
}
