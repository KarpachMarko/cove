import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavidromeClient, ZenSyncClient } from '@cove/core';
import type { Session } from '@cove/core';
import { credentials } from '../platform/credentials';
import { Loading, Notice, Screen } from '../components/ui/screen';

type SessionContextValue = {
  session: Session | null;
  connect: (session: Session) => Promise<void>;
  disconnect: () => Promise<void>;
};
const SessionContext = createContext<SessionContextValue | null>(null);
export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [sessionOverride, setSessionOverride] = useState<
    Session | null | undefined
  >();
  const restored = useQuery({
    queryKey: ['credentials'],
    queryFn: () => credentials.load(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
  const save = useMutation({
    mutationFn: async (value: Session) => {
      await credentials.save(value);
      setSessionOverride(value);
    },
  });
  const clear = useMutation({
    mutationFn: async () => {
      await credentials.clear();
      await queryClient.cancelQueries({
        predicate: (query) => query.queryKey[0] !== 'credentials',
      });
      queryClient.clear();
      setSessionOverride(null);
    },
  });
  if (restored.isPending && sessionOverride === undefined)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (restored.isError && sessionOverride === undefined)
    return (
      <Screen>
        <Notice
          title="Could not restore your connection"
          message={restored.error.message}
          retry={() => {
            void clear.mutateAsync();
          }}
        />
        {clear.error && (
          <Notice
            title="Could not reset storage"
            message={clear.error.message}
          />
        )}
      </Screen>
    );
  return (
    <SessionContext.Provider
      value={{
        session:
          sessionOverride === undefined
            ? (restored.data ?? null)
            : sessionOverride,
        connect: save.mutateAsync,
        disconnect: clear.mutateAsync,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('SessionProvider is missing.');
  return value;
}
export function useServices() {
  const { session } = useSession();
  return useMemo(() => {
    if (!session) throw new Error('A connected session is required.');
    return {
      providerKey:
        session.zensync?.id ?? session.zensync?.url ?? 'disconnected',
      library: new NavidromeClient(session.navidrome),
      providers: session.zensync ? new ZenSyncClient(session.zensync) : null,
    };
  }, [session]);
}
