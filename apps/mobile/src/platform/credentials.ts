// Fail closed on an unimplemented platform. Future desktop shells provide their own OS keychain adapter.
import type { CredentialStorage } from '@cove/core';
const unsupported = async (): Promise<never> => {
  throw new Error(
    'Secure credential storage is only configured for iOS and Android.',
  );
};
export const credentials: CredentialStorage = {
  load: unsupported,
  save: unsupported,
  clear: unsupported,
};
