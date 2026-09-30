'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError } from '@/lib/api/client';
import { loginSchema, type LoginFormValues } from '@/lib/auth/login-schema';
import { useAuth } from './auth-provider';

export function LoginForm() {
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await login(values);
    } catch (error) {
      setFormError(loginErrorMessage(error));
    }
  });

  return (
    <form className="mt-8 space-y-5" noValidate onSubmit={onSubmit}>
      <div>
        <label
          className="block text-sm font-medium text-slate-800"
          htmlFor="username"
        >
          Usuário
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          aria-invalid={errors.username ? true : undefined}
          aria-describedby={errors.username ? 'username-error' : undefined}
          {...register('username')}
        />
        {errors.username ? (
          <p id="username-error" className="mt-2 text-sm text-red-700">
            {errors.username.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-800"
          htmlFor="password"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password ? (
          <p id="password-error" className="mt-2 text-sm text-red-700">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white outline-none hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'Usuário ou senha inválidos';
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Não foi possível entrar. Tente novamente.';
}
