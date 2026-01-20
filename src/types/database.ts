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

export interface VaultItemData {
  id?: string
  title: string
  username?: string
  password?: string
  url?: string
  notes?: string
  fields?: Record<string, string> // campi personalizzati
  tags?: string[] // categorie / tag
  created_at?: string
  updated_at?: string
  attachments?: string[] // future: Base64 o riferimento a blob criptato
}

export interface VaultItemEncrypted {
  id: string
  user_id: string
  encrypted_data: string // AES-GCM Base64 blob contenente tutto VaultItemData
  created_at: string
  updated_at: string
}

export interface VaultHistoryEncrypted {
  id: string
  vault_item_id: string
  encrypted_data: string
  created_at: string
}

export interface VaultHistoryItem {
  id: string
  vault_item_id: string
  data: VaultItemData
  created_at: string
}
