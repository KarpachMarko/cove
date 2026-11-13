import { ActivityIndicator, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { Text } from './text';
import { Button } from './button';
import { colors } from '../../theme/tokens';
export function Screen({ children }: PropsWithChildren) {
  return <View className="flex-1 bg-background">{children}</View>;
}
export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="gap-2 px-5 pb-5 pt-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text accessibilityRole="header" variant="title" className="flex-1">
          {title}
        </Text>
        {action}
      </View>
      {subtitle && <Text variant="caption">{subtitle}</Text>}
    </View>
  );
}
export function Notice({
  title,
  message,
  retry,
}: {
  title: string;
  message?: string;
  retry?: () => void;
}) {
  return (
    <View className="gap-3 px-5 py-8">
      <Text accessibilityRole={retry ? 'alert' : 'header'} variant="heading">
        {title}
      </Text>
      {message && <Text variant="caption">{message}</Text>}
      {retry && (
        <Button variant="secondary" onPress={retry}>
          Try again
        </Button>
      )}
    </View>
  );
}
export function Loading() {
  return (
    <View
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      className="items-center p-8"
    >
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
