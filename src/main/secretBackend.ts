export type StorageBackend = 'basic_text' | 'gnome_libsecret' | 'kwallet' | 'kwallet5' | 'kwallet6' | 'unknown'

export interface SecretStatus {
  protected: boolean
  description: string
}

// On Linux, Electron reports encryption as available even with no keyring,
// but then uses a hardcoded key (basic_text), which only obfuscates. Only
// Keychain (macOS), DPAPI (Windows), libsecret and KWallet count as protection.
export function secretStatus(platform: string, available: boolean, backend: StorageBackend | null): SecretStatus {
  if (!available) {
    return { protected: false, description: 'OS encryption unavailable; secrets are stored as plain text (file mode 0600)' }
  }
  if (platform === 'darwin') return { protected: true, description: 'macOS Keychain' }
  if (platform === 'win32') return { protected: true, description: 'Windows DPAPI' }
  if (backend === 'gnome_libsecret') return { protected: true, description: 'Linux libsecret (GNOME Keyring or compatible)' }
  if (backend === 'kwallet' || backend === 'kwallet5' || backend === 'kwallet6') {
    return { protected: true, description: `Linux ${backend}` }
  }
  return {
    protected: false,
    description: 'no Linux keyring found; secrets are stored as plain text (file mode 0600)',
  }
}
