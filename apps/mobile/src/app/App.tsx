import '../../global.css';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import NetInfo from '@react-native-community/netinfo';
import {
  focusManager,
  onlineManager,
  QueryClientProvider,
} from '@tanstack/react-query';
import { createQueryClient } from './query-client';
import { ErrorBoundary } from './error-boundary';
import { SessionProvider, useSession } from './session';
import { Navigation } from './navigation';
import { ConnectionScreen } from '../features/connection/connection-screen';
import { PlaybackProvider } from '../features/playback/playback-provider';
function AuthenticatedApp() {
  // A new account gets a new cache. Late responses from a disconnected account
  // can only reach its discarded QueryClient, never a later session.
  const [queryClient] = useState(createQueryClient);
  useEffect(
    () => () => {
      void queryClient.cancelQueries();
      queryClient.clear();
    },
    [queryClient],
  );
  return (
    <QueryClientProvider client={queryClient}>
      <PlaybackProvider>
        <Navigation />
      </PlaybackProvider>
    </QueryClientProvider>
  );
}
function ConnectedApp() {
  const { session } = useSession();
  return session ? <AuthenticatedApp /> : <ConnectionScreen />;
}
export default function App() {
  const [queryClient] = useState(createQueryClient);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) =>
      focusManager.setFocused(state === 'active'),
    );
    const unsubscribe = NetInfo.addEventListener((state) =>
      onlineManager.setOnline(
        state.isConnected !== false && state.isInternetReachable !== false,
      ),
    );
    return () => {
      subscription.remove();
      unsubscribe();
    };
  }, []);
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <SafeAreaView
          edges={['top', 'left', 'right']}
          className="flex-1 bg-background"
        >
          <StatusBar style="dark" />
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <SessionProvider>
                <ConnectedApp />
              </SessionProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaView>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
