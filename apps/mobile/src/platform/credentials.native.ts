import * as SecureStore from 'expo-secure-store';
import { sessionSchema } from '@cove/core';
import type { CredentialStorage } from '@cove/core';
const key = 'cove.session.v1';
export const credentials: CredentialStorage = {
  async load() {
    const value = await SecureStore.getItemAsync(key);
    if (!value) return null;
    const parsed = sessionSchema.safeParse(JSON.parse(value) as unknown);
    if (!parsed.success)
      throw new Error(
        'Stored connection data is incompatible. Reset the connection to sign in again.',
      );
    return parsed.data;
  },
  save(session) {
    return SecureStore.setItemAsync(key, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  clear() {
    return SecureStore.deleteItemAsync(key);
  },
};
