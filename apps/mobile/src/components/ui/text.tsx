import { Text as NativeText } from 'react-native';
import type { TextProps } from 'react-native';
const variants = {
  body: 'text-base text-foreground',
  title: 'text-4xl font-bold tracking-tight text-foreground',
  heading: 'text-xl font-semibold text-foreground',
  caption: 'text-sm text-muted',
  label: 'text-base font-semibold text-foreground',
} as const;
export function Text({
  variant = 'body',
  className = '',
  ...props
}: TextProps & { variant?: keyof typeof variants }) {
  return (
    <NativeText {...props} className={`${variants[variant]} ${className}`} />
  );
}
