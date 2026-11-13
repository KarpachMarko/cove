import { QueryClient } from '@tanstack/react-query';
import { ServiceError } from '@cove/core';
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (count, error) =>
          !(
            error instanceof ServiceError &&
            (error.status === 401 || error.status === 403)
          ) && count < 2,
      },
      mutations: { retry: false },
    },
  });
}
