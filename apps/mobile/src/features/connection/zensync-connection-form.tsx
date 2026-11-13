import { Keyboard, View } from 'react-native';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { z } from 'zod';
import { serverUrlSchema } from '@cove/core';
import { useSession } from '../../app/session';
import { Button } from '../../components/ui/button';
import { Field, fieldError } from '../../components/ui/input';
import { Text } from '../../components/ui/text';

export function ZenSyncConnectionForm() {
  const { session, connect } = useSession();
  const current = session?.zensync;
  const save = useMutation({
    mutationFn: async (values: { url: string; apiKey: string }) => {
      if (!session) throw new Error('Connect your library first.');
      await connect({
        ...session,
        zensync: {
          url: serverUrlSchema.parse(values.url),
          apiKey: values.apiKey.trim() || current?.apiKey || '',
          id: Crypto.randomUUID(),
        },
      });
    },
  });
  const form = useForm({
    defaultValues: { url: current?.url ?? '', apiKey: '' },
    validators: {
      onSubmit: z
        .object({
          url: serverUrlSchema,
          apiKey: z
            .string()
            .trim()
            .max(500)
            .refine(
              (value) => !/[\r\n]/.test(value),
              'Enter the API key on a single line.',
            ),
        })
        .refine((value) => Boolean(value.apiKey || current?.apiKey), {
          path: ['apiKey'],
          message: 'Enter your ZenSync API key.',
        }),
    },
    onSubmit: async ({ value }) => {
      Keyboard.dismiss();
      try {
        await save.mutateAsync(value);
        form.reset({ url: serverUrlSchema.parse(value.url), apiKey: '' });
      } catch {
        /* Keep the editable draft and show the save error. */
      }
    },
  });
  return (
    <View className="gap-5">
      <Text variant="heading">ZenSync</Text>
      <Text variant="caption">
        Update discovery without disconnecting your music library.
      </Text>
      <form.Field name="url">
        {(field) => (
          <Field
            label="ZenSync server"
            placeholder="https://zensync.example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={field.state.value}
            onChangeText={field.handleChange}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>
      <form.Field name="apiKey">
        {(field) => (
          <Field
            label={current ? 'Replace API key (optional)' : 'ZenSync API key'}
            placeholder={
              current ? 'Leave empty to keep your saved key' : undefined
            }
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={field.state.value}
            onChangeText={field.handleChange}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta.errors)}
          />
        )}
      </form.Field>
      <form.Subscribe
        selector={(state) => ({
          dirty: state.isDirty,
          submitting: state.isSubmitting,
        })}
      >
        {(state) => (
          <Button
            disabled={!state.dirty}
            loading={state.submitting}
            onPress={() => {
              void form.handleSubmit();
            }}
          >
            Save ZenSync connection
          </Button>
        )}
      </form.Subscribe>
      {save.isSuccess && (
        <Text variant="caption" accessibilityLiveRegion="polite">
          ZenSync connection saved.
        </Text>
      )}
      {save.error && (
        <Text accessibilityRole="alert" className="text-primary">
          {save.error.message}
        </Text>
      )}
    </View>
  );
}
