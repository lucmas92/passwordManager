import { CryptoService } from './crypto.service'
import type { VaultItemPlain, VaultItemEncrypted } from '@/types/database'

export async function encryptItem(
  item: VaultItemPlain,
  key: CryptoKey,
): Promise<VaultItemEncrypted> {
  return {
    encrypted_title: await CryptoService.encrypt(item.title, key),
    encrypted_username: await CryptoService.encrypt(item.username, key),
    encrypted_password: await CryptoService.encrypt(item.password, key),
    encrypted_url: item.url ? await CryptoService.encrypt(item.url, key) : undefined,
  }
}
