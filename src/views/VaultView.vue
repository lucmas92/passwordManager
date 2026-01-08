<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { CryptoService } from '@/services/crypto.service'
import { useVaultStore } from '@/stores/vault.store'
import { useAuthStore } from '@/stores/auth.store'
import type { VaultItemEncrypted } from '@/types/database'
import AddEditModal from '@/components/AddEditModal.vue'

interface VaultItemDecrypted {
  id: string
  title: string
  username: string
  password: string
  url?: string
}

const vaultStore = useVaultStore()
const authStore = useAuthStore()

const timeoutOptions = [1, 3, 5, 10] // minuti configurabili

const loading = ref(true)
const error = ref<string | null>(null)
const items = ref<VaultItemDecrypted[]>([])

async function loadVault() {
  try {
    loading.value = true

    const { data, error: fetchError } = await supabase
      .from('vault_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError

    const decrypted: VaultItemDecrypted[] = []

    for (const item of data as VaultItemEncrypted[]) {
      decrypted.push({
        id: item.id!,
        title: await CryptoService.decrypt(item.encrypted_title, vaultStore.key!),
        username: await CryptoService.decrypt(item.encrypted_username, vaultStore.key!),
        password: await CryptoService.decrypt(item.encrypted_password, vaultStore.key!),
        url: item.encrypted_url
          ? await CryptoService.decrypt(item.encrypted_url, vaultStore.key!)
          : undefined,
      })
    }

    items.value = decrypted
  } catch (e) {
    console.error(e)
    error.value = 'Errore di decifratura. Master Password errata.'
    vaultStore.lock()
    await authStore.logout()
  } finally {
    loading.value = false
  }
}

async function copyPassword(password: string) {
  await navigator.clipboard.writeText(password)
}

async function lockVault() {
  vaultStore.lock()
  await authStore.logout()
}

const showModal = ref(false)
const editingItem = ref<any | null>(null)

function openNew() {
  editingItem.value = null
  showModal.value = true
}

function openEdit(item: VaultItemDecrypted) {
  editingItem.value = item
  showModal.value = true
}

async function deleteItem(id: string) {
  if (!confirm('Eliminare questa credenziale?')) return
  await supabase.from('vault_items').delete().eq('id', id)
  await loadVault()
}

onMounted(loadVault)
</script>

<template>
  <div class="min-h-screen bg-zinc-900 text-zinc-100 p-6">
    <!-- HEADER -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold">🔐 Vault</h1>

      <button @click="openNew" class="btn-primary">+ Nuova</button>

      <div class="flex items-center gap-4">
        <!-- Countdown -->
        <div v-if="vaultStore.remainingSeconds > 0" class="text-sm text-zinc-400">
          Auto-lock in {{ Math.floor(vaultStore.remainingSeconds / 60) }}m
          {{ vaultStore.remainingSeconds % 60 }}s
        </div>

        <!-- Config timeout -->
        <select
          v-model.number="vaultStore.timeoutMinutes"
          @change="vaultStore.setTimeoutMinutes(vaultStore.timeoutMinutes)"
          class="bg-zinc-900 border border-zinc-700 text-sm px-2 py-1 rounded text-zinc-100"
        >
          <option v-for="opt in timeoutOptions" :key="opt" :value="opt">{{ opt }} min</option>
        </select>

        <button @click="lockVault" class="text-sm px-3 py-2 rounded bg-red-600 hover:bg-red-700">
          Lock Vault
        </button>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="text-zinc-400">Decifratura in corso...</div>

    <!-- ERROR -->
    <div v-if="error" class="text-red-400">
      {{ error }}
    </div>

    <!-- EMPTY -->
    <div v-if="!loading && items.length === 0" class="text-zinc-400">
      Nessuna credenziale salvata.
    </div>

    <!-- VAULT LIST -->
    <div class="grid gap-4">
      <div v-for="item in items" :key="item.id" class="bg-zinc-800 rounded-xl p-4 shadow">
        <div class="flex justify-between items-start">
          <div>
            <h2 class="font-semibold text-lg">{{ item.title }}</h2>
            <p class="text-sm text-zinc-400">{{ item.username }}</p>
            <a
              v-if="item.url"
              :href="item.url"
              target="_blank"
              class="text-sm text-blue-400 hover:underline"
            >
              {{ item.url }}
            </a>
          </div>
          <div class="flex gap-2">
            <button @click="copyPassword(item.password)" class="btn-sm">Copia</button>
            <button @click="openEdit(item)" class="btn-sm">Modifica</button>
            <button @click="deleteItem(item.id)" class="btn-sm text-red-400">Elimina</button>
          </div>
        </div>
      </div>
    </div>

    <AddEditModal v-model="showModal" :item="editingItem" @saved="loadVault" />
  </div>
</template>
