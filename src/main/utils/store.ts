import {safeStorage} from 'electron';
import settings from 'electron-settings';

// Check if encryption is available on this system
const isEncryptionAvailable = safeStorage.isEncryptionAvailable();

if (!isEncryptionAvailable) {
  console.warn(
      'Encryption is not available on this system. API keys will be stored unencrypted. ' +
      'On Linux, install libsecret for encrypted storage: sudo apt-get install libsecret-1-dev');
}

export async function getKey(): Promise<string|null> {
  try {
    const storedKey = await settings.get('aiKey');
    if (!storedKey || typeof storedKey !== 'string')
      return null;

    // If encryption is available, decrypt the key
    if (isEncryptionAvailable) {
      return safeStorage.decryptString(Buffer.from(storedKey, 'base64'));
    }

    // Otherwise, return the key as-is (unencrypted fallback)
    return storedKey;
  } catch (error) {
    console.error('Error retrieving AI key:', error);
    return null;
  }
}

export async function setKey(secretKey: string): Promise<boolean> {
  try {
    // If encryption is available, encrypt the key
    if (isEncryptionAvailable) {
      const encryptedKey = safeStorage.encryptString(secretKey);
      await settings.set('aiKey', encryptedKey.toString('base64'));
    } else {
      // Otherwise, store the key unencrypted (with warning already shown)
      await settings.set('aiKey', secretKey);
    }
    return true;
  } catch (error) {
    console.error('Error setting AI key:', error);
    return false;
  }
}

export async function deleteKey(): Promise<boolean> {
  try {
    await settings.unset('aiKey');
    return true;
  } catch (error) {
    console.error('Error deleting AI key:', error);
    return false;
  }
}
