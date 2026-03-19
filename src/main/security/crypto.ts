import { safeStorage } from 'electron'

export function encryptString(plainText: string): Buffer {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system')
  }
  return safeStorage.encryptString(plainText)
}

export function decryptString(encrypted: Buffer): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system')
  }
  return safeStorage.decryptString(encrypted)
}

export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}
