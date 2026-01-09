<template>
  <div class="bg-zinc-900 text-zinc-100 max-h-screen flex flex-col">
    <header class="flex-none">
      <nav class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold">Password Vault</h1>
        <div>
          <button
            class="flex justify-center items-center gap-2 px-3 py-2 rounded bg-yellow-600 hover:bg-yellow-700 text-white"
            v-if="!vaultStore.locked"
            @click="lock"
          >
            <LockKeyhole /> Lock Vault
          </button>
        </div>
      </nav>
    </header>
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useVaultStore } from '@/stores/vault.store'
import { LockKeyhole } from 'lucide-vue-next'

const vaultStore = useVaultStore()
function lock() {
  vaultStore.lock()
}
</script>
