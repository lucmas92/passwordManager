export class CryptoService {
  static async deriveKey(password: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey'],
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100_000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    )
  }

  static async encrypt(plainText: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(plainText)

    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)

    const combined = new Uint8Array(iv.length + cipher.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(cipher), iv.length)

    return btoa(String.fromCharCode(...combined))
  }

  static async decrypt(payload: string, key: CryptoKey): Promise<string> {
    const data = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
    const iv = data.slice(0, 12)
    const cipher = data.slice(12)

    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)

    return new TextDecoder().decode(plain)
  }

  static async generatePassword(
    length = 16,
    options?: {
      uppercase?: boolean
      numbers?: boolean
      symbols?: boolean
    },
  ): Promise<string> {
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nums = '0123456789'
    const syms = '!@#$%^&*()-_=+[]{};:,.<>?'

    let chars = lower
    if (options?.uppercase ?? true) chars += upper
    if (options?.numbers ?? true) chars += nums
    if (options?.symbols ?? true) chars += syms

    let password = ''
    const array = new Uint32Array(length)
    window.crypto.getRandomValues(array) // crypto-safe random
    for (let i = 0; i < length; i++) {
      password += chars[array[i]! % chars.length]
    }
    return password
  }
}
