import type { QueryClient } from '@tanstack/react-query';

export const dashboardQueryKey = ['dashboard'] as const;
export const requestsQueryKey = ['requests'] as const;

export function requestDetailQueryKey(id: number) {
  return ['request', id] as const;
}

export async function refreshRequestQueries(
  queryClient: QueryClient,
  id?: number,
): Promise<void> {
  const tasks = [
    queryClient.invalidateQueries({ queryKey: requestsQueryKey }),
    queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
  ];

  if (id !== undefined) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: requestDetailQueryKey(id) }),
    );
  }

  await Promise.all(tasks);
}

export async function refreshAfterDelete(
  queryClient: QueryClient,
  id: number,
): Promise<void> {
  queryClient.removeQueries({ queryKey: requestDetailQueryKey(id) });
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: requestsQueryKey }),
    queryClient.invalidateQueries({ queryKey: dashboardQueryKey }),
  ]);
}
