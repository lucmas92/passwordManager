<template>
  <div class="bg-zinc-900 text-zinc-100 max-h-screen flex flex-col">
    <header class="flex-none">
      <nav class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold">Password Vault</h1>
        <div>
          <button
            class="flex justify-center items-center gap-2 px-3 py-2 rounded bg-yellow-600 hover:bg-yellow-700 text-white"
            v-if="!vaultStore.locked"
            :disabled="vaultStore.locking"
            @click="lock"
          >
            <LockKeyhole /> Lock Vault
          </button>
        </div>
      </nav>
    </header>
    <div
      aria-hidden="true"
      class="iris-overlay"
      :class="!vaultStore.locking ? 'iris-overlay--close' : 'iris-overlay--open'"
    />
    <main class="flex-1 overflow-auto">
      <router-view />

      <ToastContainer />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useVaultStore } from '@/stores/vault.store'
import { LockKeyhole } from 'lucide-vue-next'
import ToastContainer from '@/ui/ToastContainer.vue'
import { useToastStore } from '@/stores/toast.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const toast = useToastStore()
const vaultStore = useVaultStore()
async function lock() {
  await vaultStore.lock()
  toast.addToast(t('vault.locked'), 'info')
}
</script>
<style scoped>
/* Overlay base */
.iris-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgb(0 0 0 / 0.95);
  pointer-events: none;

  transition: clip-path 500ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: clip-path;
}

/* Aperto */
.iris-overlay--open {
  clip-path: circle(150% at 50% 50%);
}

/* Chiuso */
.iris-overlay--close {
  clip-path: circle(0% at 50% 50%);
}
</style>
