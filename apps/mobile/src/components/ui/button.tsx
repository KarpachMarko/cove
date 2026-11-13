import { ActivityIndicator, Pressable } from 'react-native';
import type { PressableProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from './text';
import { colors } from '../../theme/tokens';
export function Button({
  children,
  variant = 'primary',
  loading,
  className = '',
  disabled,
  accessibilityState,
  ...props
}: Omit<PressableProps, 'children'> & {
  children: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}) {
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        disabled: Boolean(disabled || loading),
        busy: loading,
      }}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3 ${variant === 'primary' ? 'bg-primary' : variant === 'secondary' ? 'bg-secondary' : ''} ${disabled || loading ? 'opacity-50' : 'active:opacity-70'} ${className}`}
    >
      {loading && (
        <ActivityIndicator
          color={variant === 'primary' ? '#fff' : colors.primary}
        />
      )}
      <Text
        className={`font-semibold ${variant === 'primary' ? 'text-white' : 'text-primary'}`}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  icon: Icon,
  label,
  disabled,
  accessibilityState,
  ...props
}: Omit<PressableProps, 'children'> & { icon: LucideIcon; label: string }) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        ...accessibilityState,
        disabled: Boolean(disabled),
      }}
      className={`min-h-12 min-w-12 items-center justify-center rounded-full active:bg-secondary ${disabled ? 'opacity-30' : ''}`}
    >
      <Icon size={24} color={colors.primary} />
    </Pressable>
  );
}
