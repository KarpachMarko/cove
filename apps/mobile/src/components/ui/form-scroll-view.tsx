import type { PropsWithChildren } from 'react';
import { cssInterop } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView as NativeKeyboardAwareScrollView } from 'react-native-keyboard-controller';

const KeyboardAwareScrollView = cssInterop(NativeKeyboardAwareScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

// One owner for keyboard insets and focused-field scrolling on both platforms.
export function FormScrollView({ children }: PropsWithChildren) {
  const { bottom } = useSafeAreaInsets();
  return (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerClassName="grow pb-10"
      bottomOffset={24}
      extraKeyboardSpace={bottom}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
