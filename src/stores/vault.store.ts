import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from './auth.store'
import { CryptoService } from '@/services/crypto.service.ts'
import router from '@/router'
import type { VaultItemData, VaultItemEncrypted } from '@/types/database.ts'
import { useI18n } from 'vue-i18n'

export const useVaultStore = defineStore('vault', () => {
  const authStore = useAuthStore()
  const { t } = useI18n()

  const items = ref<VaultItemData[]>([])
  const key = ref<CryptoKey | null>(null)
  const locked = ref(true)
  const isProcessing = ref(false)
  const error = ref<string>('')

  // Auto-lock
  const autoLockTimeout = ref(300) // default 5 min
  const lockOnVisibilityChange = ref(true)

  let autoLockTimer: number | undefined

  // Inizializza vault (dopo login)
  async function unlock(masterPassword: string, salt: string) {
    isProcessing.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      key.value = await CryptoService.deriveKey(masterPassword, salt)
      await fetchItems()
      startAutoLock()
      registerActivityListeners()
      locked.value = false
    } catch (err: any) {
      console.error(err)
      throw new Error(t('vault.unlockError'))
    } finally {
      isProcessing.value = false
    }
  }

  // Lock vault (rimuove CryptoKey)
  function lock() {
    key.value = null
    locked.value = true
    stopAutoLock()
    removeActivityListeners()
    items.value = []
    router.push('/login')
  }

  // Fetch items da Supabase
  async function fetchItems() {
    if (!authStore.user) return
    const { data, error } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const decrypted = []

    for (const item of data as VaultItemEncrypted[]) {
      const decryptedData = await CryptoService.decrypt(item.encrypted_data, key.value!)
      decrypted.push({
        id: item.id!,
        created_at: item.created_at,
        updated_at: item.updated_at,
        ...JSON.parse(decryptedData),
      })
    }

    items.value = decrypted as VaultItemData[]
  }

  // Aggiungi nuovo item
  async function addItem(encryptedData: string) {
    if (!authStore.user) return
    const { data, error } = await supabase
      .from('vault_items')
      .insert([{ user_id: authStore.user.id, encrypted_data: encryptedData }])
      .select()
      .single()

    if (error) throw error
    items.value.push(data as VaultItemData)
  }

  // Aggiorna item esistente
  async function updateItem(id: string, encryptedData: string) {
    const { data, error } = await supabase
      .from('vault_items')
      .update({ encrypted_data: encryptedData })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const index = items.value.findIndex((i) => i.id === id)
    if (index !== -1) items.value[index] = data as VaultItemData
  }

  // Elimina item
  async function deleteItem(id: string) {
    const { error } = await supabase.from('vault_items').delete().eq('id', id)
    if (error) throw error
    items.value = items.value.filter((i) => i.id !== id)
  }

  // Auto-lock countdown
  function startAutoLock() {
    stopAutoLock()
    autoLockTimer = window.setTimeout(() => {
      lock()
      authStore.logout()
    }, autoLockTimeout.value * 1000)
  }

  function resetAutoLock() {
    if (autoLockTimer) clearTimeout(autoLockTimer)
    startAutoLock()
  }

  function stopAutoLock() {
    if (autoLockTimer) clearTimeout(autoLockTimer)
  }

  // Event listeners per reset timeout
  const activityEvents = ['keydown', 'touchstart', 'touchmove']
  function registerActivityListeners() {
    activityEvents.forEach((e) => window.addEventListener(e, resetAutoLock))
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  function removeActivityListeners() {
    activityEvents.forEach((e) => window.removeEventListener(e, resetAutoLock))
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  function handleVisibilityChange() {
    if (document.hidden && lockOnVisibilityChange.value) {
      lock()
      authStore.logout()
      alert('Vault bloccato perché la finestra non è attiva')
    }
  }

  return {
    items,
    key,
    locked,
    autoLockTimeout,
    lockOnVisibilityChange,
    isProcessing,
    error,
    fetchItems,
    unlock, // ✅ ripristinata
    lock, // ✅ confermata
    addItem,
    updateItem,
    deleteItem,
    resetAutoLock,
  }
})
