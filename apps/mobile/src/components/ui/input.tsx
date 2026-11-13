import { TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Text } from './text';
import { colors } from '../../theme/tokens';
export type FieldProps = TextInputProps & { label: string; error?: string };
export function Field({ label, error, ...props }: FieldProps) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        className="min-h-12 rounded-xl border border-line bg-surface px-4 py-3 text-base text-foreground"
      />
      {error && (
        <Text accessibilityRole="alert" className="text-sm text-primary">
          {error}
        </Text>
      )}
    </View>
  );
}
export function fieldError(errors: readonly unknown[]): string | undefined {
  return (
    errors
      .map((error) =>
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : typeof error === 'string'
            ? error
            : '',
      )
      .filter(Boolean)
      .join('\n') || undefined
  );
}
