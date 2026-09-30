import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Informe o usuário.')
    .min(3, 'O usuário deve ter entre 3 e 50 caracteres.')
    .max(50, 'O usuário deve ter entre 3 e 50 caracteres.'),
  password: z
    .string()
    .min(1, 'Informe a senha.')
    .min(8, 'A senha deve ter entre 8 e 72 caracteres.')
    .max(72, 'A senha deve ter entre 8 e 72 caracteres.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
