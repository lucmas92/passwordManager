export interface Profile {
  id: string
  encryption_salt: string
}

export interface VaultItemPlain {
  title: string
  username: string
  password: string
  url?: string
}

export interface VaultItemEncrypted {
  id?: string
  user_id?: string
  encrypted_title: string
  encrypted_username: string
  encrypted_password: string
  encrypted_url?: string
}
