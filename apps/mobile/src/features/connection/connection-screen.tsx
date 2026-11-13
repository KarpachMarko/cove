import { Keyboard, View } from 'react-native';
import { FormScrollView } from '../../components/ui/form-scroll-view';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import * as Crypto from 'expo-crypto';
import {
  createNavidromeAuth,
  NavidromeClient,
  serverUrlSchema,
} from '@cove/core';
import { useSession } from '../../app/session';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { Field, fieldError } from '../../components/ui/input';
import { PageHeading, Screen } from '../../components/ui/screen';
const connectionSchema = z
  .object({
    url: serverUrlSchema,
    username: z.string().trim().min(1, 'Enter your username.').max(200),
    password: z.string().min(1, 'Enter your password.').max(500),
    zenUrl: z.union([z.literal(''), serverUrlSchema]),
    apiKey: z.string().max(500),
  })
  .refine((value) => Boolean(value.zenUrl) === Boolean(value.apiKey.trim()), {
    message: 'Enter both the ZenSync address and API key, or leave both empty.',
    path: ['apiKey'],
  });
export function ConnectionScreen() {
  const { connect } = useSession();
  const mutation = useMutation({
    mutationFn: async (values: z.input<typeof connectionSchema>) => {
      const parsed = connectionSchema.parse(values);
      const salt = Array.from(Crypto.getRandomBytes(16), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('');
      const navidrome = createNavidromeAuth(
        parsed.url,
        parsed.username,
        parsed.password,
        salt,
      );
      await new NavidromeClient(navidrome).ping();
      await connect({
        navidrome,
        ...(parsed.zenUrl
          ? {
              zensync: {
                url: parsed.zenUrl,
                apiKey: parsed.apiKey.trim(),
                id: Crypto.randomUUID(),
              },
            }
          : {}),
      });
    },
  });
  const form = useForm({
    defaultValues: {
      url: '',
      username: '',
      password: '',
      zenUrl: '',
      apiKey: '',
    },
    validators: { onSubmit: connectionSchema },
    onSubmit: async ({ value }) => {
      Keyboard.dismiss();
      await mutation.mutateAsync(value).catch(() => undefined);
    },
  });
  return (
    <Screen>
      <FormScrollView>
        <PageHeading
          title="Welcome to Cove"
          subtitle="Your music. A place of its own."
        />
        <View className="gap-5 px-5">
          <Text>Connect your Navidrome library to start listening.</Text>
          <form.Field name="url">
            {(field) => (
              <Field
                label="Navidrome server"
                placeholder="https://music.example.com"
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
          <form.Field name="username">
            {(field) => (
              <Field
                label="Username"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => (
              <Field
                label="Password"
                secureTextEntry
                autoComplete="current-password"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>
          <Text variant="heading" className="mt-4">
            Discovery, optionally
          </Text>
          <Text variant="caption">
            Connect ZenSync to search Deezer and lossless.am. Create a key in
            ZenSync with search:read and requests:create permissions.
          </Text>
          <form.Field name="zenUrl">
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
                label="ZenSync API key"
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
          {mutation.error && (
            <Text accessibilityRole="alert" className="text-primary">
              {mutation.error.message}
            </Text>
          )}
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(busy) => (
              <Button
                loading={busy}
                onPress={() => {
                  void form.handleSubmit();
                }}
              >
                Connect to your library
              </Button>
            )}
          </form.Subscribe>
          <Text variant="caption">
            Connections stay in your device’s secure storage. Your Navidrome
            password is used to sign in and is never saved.
          </Text>
        </View>
      </FormScrollView>
    </Screen>
  );
}
