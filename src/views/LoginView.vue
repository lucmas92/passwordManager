<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useVaultStore } from '@/stores/vault.store'
import { supabase } from '@/services/supabase'
import { Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const vaultStore = useVaultStore()

const email = ref('ilmassiluca@gmail.com')
const password = ref('supabase')
const masterPassword = ref('supabase8')

const showAccountPassword = ref(false)
const showMasterPassword = ref(false)

const loading = ref(false)
const error = ref<string | null>(null)

async function login() {
  error.value = null
  loading.value = true

  try {
    // 1️⃣ Login Supabase (account password)
    await authStore.login(email.value, password.value)

    const { data: profile } = await supabase.from('profiles').select('encryption_salt').single()

    if (!profile) {
      // primo login → crea profilo
      const salt = crypto.randomUUID()

      await supabase.from('profiles').insert({
        id: authStore.user.id,
        encryption_salt: salt,
      })

      await vaultStore.unlock(masterPassword.value, salt)
    } else {
      await vaultStore.unlock(masterPassword.value, profile.encryption_salt)
    }

    // 4️⃣ Redirect al vault
    router.push('/vault')
  } catch (e: any) {
    console.error(e)

    error.value = e?.message || 'Credenziali non valide o Master Password errata'

    // sicurezza: cleanup completo
    vaultStore.lock()
    await authStore.logout()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-900 text-zinc-100">
    <div class="w-full max-w-md bg-zinc-800 rounded-2xl p-8 shadow-xl">
      <!-- HEADER -->
      <h1 class="text-2xl font-semibold text-center mb-6">🔐 Unlock Vault</h1>

      <!-- ERROR -->
      <div v-if="error" class="mb-4 text-sm text-red-400 bg-red-950/40 p-3 rounded">
        {{ error }}
      </div>

      <!-- FORM -->
      <form @submit.prevent="login" class="space-y-4">
        <!-- EMAIL -->
        <div>
          <label class="block text-sm mb-1 text-zinc-400"> Email </label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-4 py-2 rounded bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <!-- ACCOUNT PASSWORD -->
        <div>
          <label class="block text-sm mb-1 text-zinc-400"> Password Account </label>
          <div class="relative">
            <input
              v-model="password"
              :type="showAccountPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              class="w-full px-4 py-2 pr-10 rounded bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <button
              type="button"
              @click="showAccountPassword = !showAccountPassword"
              class="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-200"
              aria-label="Mostra/Nascondi password account"
            >
              <Eye v-if="!showAccountPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- MASTER PASSWORD -->
        <div>
          <label class="block text-sm mb-1 text-zinc-400"> Master Password </label>
          <div class="relative">
            <input
              v-model="masterPassword"
              :type="showMasterPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              class="w-full px-4 py-2 pr-10 rounded bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <button
              type="button"
              @click="showMasterPassword = !showMasterPassword"
              class="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-200"
              aria-label="Mostra/Nascondi password account"
            >
              <Eye v-if="!showAccountPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
          <p class="text-xs text-zinc-500 mt-1">Non viene mai inviata al server</p>
        </div>

        <!-- SUBMIT -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!loading">Unlock</span>
          <span v-else>Deriving key…</span>
        </button>
      </form>

      <!-- FOOTER -->
      <div class="mt-6 text-center text-sm text-zinc-400">
        Non hai un account?
        <router-link to="/register" class="text-blue-400 hover:underline"> Registrati </router-link>
      </div>
    </div>
  </div>
</template>
