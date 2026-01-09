// src/services/crypto.service.ts
export class CryptoService {
  private static encoder = new TextEncoder()
  private static decoder = new TextDecoder()

  /**
   * Deriva una chiave AES-GCM 256bit dalla Master Password + Salt
   * @param password string
   * @param salt string
   * @returns CryptoKey
   */
  static async deriveKey(password: string, salt: string): Promise<CryptoKey> {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey'],
    )

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.encoder.encode(salt),
        iterations: 100_000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )

    return key
  }

  /**
   * Cifra un testo o JSON lato client con AES-GCM
   * @param text string
   * @param key CryptoKey
   * @returns Base64 contenente IV + Ciphertext
   */
  static async encrypt(text: string, key: CryptoKey): Promise<string> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12)) // 12 byte per AES-GCM
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      this.encoder.encode(text),
    )

    // Concateno IV + ciphertext
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(cipherBuffer), iv.length)

    return btoa(String.fromCharCode(...combined))
  }

  /**
   * Decifra un Base64 contenente IV + Ciphertext
   * @param encryptedBase64 string
   * @param key CryptoKey
   * @returns testo in chiaro
   */
  static async decrypt(encryptedBase64: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    )

    return this.decoder.decode(decryptedBuffer)
  }
}

/**
 * Generatore di password sicuro
 * @param length numero di caratteri (default 16)
 * @param options opzionali: uppercase, numbers, symbols
 * @returns string password casuale sicura
 */
export function generatePassword(
  length = 16,
  options?: { uppercase?: boolean; numbers?: boolean; symbols?: boolean },
): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const nums = '0123456789'
  const syms = '!@#$%^&*()-_=+[]{};:,.<>?'

  let chars = lower
  if (options?.uppercase ?? true) chars += upper
  if (options?.numbers ?? true) chars += nums
  if (options?.symbols ?? true) chars += syms

  const array = new Uint32Array(length)
  window.crypto.getRandomValues(array)

  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars[array[i]! % chars.length]
  }
  return password
}
