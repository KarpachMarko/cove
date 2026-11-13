import { View } from 'react-native';
import { FormScrollView } from '../../components/ui/form-scroll-view';
import { ZenSyncConnectionForm } from './zensync-connection-form';
import { useMutation } from '@tanstack/react-query';
import { useSession } from '../../app/session';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { PageHeading, Screen } from '../../components/ui/screen';
export function SettingsScreen() {
  const { session, disconnect } = useSession();
  const reset = useMutation({ mutationFn: disconnect });
  return (
    <Screen>
      <FormScrollView>
        <PageHeading title="Connections" />
        <View className="gap-5 px-5 pb-8">
          <Text variant="heading">Navidrome</Text>
          <Text>{session?.navidrome.url}</Text>
          <Text variant="caption">
            Connected as {session?.navidrome.username}
          </Text>
          <ZenSyncConnectionForm />
          <Text variant="caption">
            To change your Navidrome server or account, disconnect and
            reconnect. Disconnecting stops playback and clears cached library
            data and credentials on this device.
          </Text>
          <Button
            variant="secondary"
            loading={reset.isPending}
            onPress={() => reset.mutate()}
          >
            Disconnect and change connections
          </Button>
          {reset.error && (
            <Text accessibilityRole="alert" className="text-primary">
              {reset.error.message}
            </Text>
          )}
        </View>
      </FormScrollView>
    </Screen>
  );
}
