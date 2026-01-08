<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import zxcvbn from 'zxcvbn'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('') // Supabase account password
const masterPassword = ref('') // Zero-Knowledge
const confirmMaster = ref('')

const passwordStrengthScore = ref(0)
const passwordStrengthText = ref('')

watch(masterPassword, (val: string) => {
  if (val) {
    const result = zxcvbn(val)
    passwordStrengthScore.value = result.score // 0-4
    passwordStrengthText.value = result.feedback.warning || result.feedback.suggestions[0] || ''
  } else {
    passwordStrengthScore.value = 0
    passwordStrengthText.value = ''
  }
})

const strengthColor = computed(() => {
  switch (passwordStrengthScore.value) {
    case 0:
    case 1:
      return 'bg-red-500'
    case 2:
      return 'bg-yellow-500'
    case 3:
      return 'bg-emerald-400'
    case 4:
      return 'bg-green-500'
    default:
      return 'bg-zinc-600'
  }
})

const loading = ref(false)
const error = ref<string | null>(null)

async function register() {
  error.value = null

  if (masterPassword.value !== confirmMaster.value) {
    error.value = 'Le Master Password non coincidono'
    return
  }

  loading.value = true

  try {
    // 1️⃣ Registrazione Supabase (account password)
    await authStore.register(email.value, password.value)

    // 2️⃣ IMPORTANTISSIMO:
    // NON deriviamo la chiave qui.
    // L'utente deve fare login esplicito per sbloccare il vault.

    router.push('/login')
  } catch (e: any) {
    console.error(e)
    error.value = e?.message || 'Errore durante la registrazione'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-900 text-zinc-100">
    <div class="w-full max-w-md bg-zinc-800 rounded-2xl p-8 shadow-xl">
      <!-- HEADER -->
      <h1 class="text-2xl font-semibold text-center mb-6">🆕 Create Vault</h1>

      <!-- ERROR -->
      <div v-if="error" class="mb-4 text-sm text-red-400 bg-red-950/40 p-3 rounded">
        {{ error }}
      </div>

      <!-- FORM -->
      <form @submit.prevent="register" class="space-y-4">
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
          <input
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
            class="w-full px-4 py-2 rounded bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <!-- MASTER PASSWORD -->
        <div>
          <label class="block text-sm mb-1 text-zinc-400"> Master Password </label>
          <input
            v-model="masterPassword"
            type="password"
            required
            autocomplete="off"
            class="w-full px-4 py-2 rounded bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <p class="text-xs text-zinc-500 mt-1">Usata per cifrare il vault. Non recuperabile.</p>
        </div>
        <div class="mt-2">
          <div class="w-full bg-zinc-700 h-2 rounded">
            <div
              class="h-2 rounded transition-all duration-300"
              :class="strengthColor"
              :style="{ width: passwordStrengthScore * 25 + '%' }"
            ></div>
          </div>
          <p class="text-xs text-zinc-400 mt-1">{{ passwordStrengthText }}</p>
        </div>

        <!-- CONFIRM MASTER -->
        <div>
          <label class="block text-sm mb-1 text-zinc-400"> Conferma Master Password </label>
          <input
            v-model="confirmMaster"
            type="password"
            required
            autocomplete="off"
            class="w-full px-4 py-2 rounded bg-zinc-900 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <!-- SUBMIT -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!loading">Create Vault</span>
          <span v-else>Generating vault…</span>
        </button>
      </form>

      <!-- FOOTER -->
      <div class="mt-6 text-center text-sm text-zinc-400">
        Hai già un account?
        <router-link to="/login" class="text-blue-400 hover:underline"> Login </router-link>
      </div>
    </div>
  </div>
</template>
