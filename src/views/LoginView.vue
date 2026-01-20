<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useVaultStore } from '@/stores/vault.store'
import { supabase } from '@/services/supabase'
import { Eye, EyeOff, LockKeyholeOpen } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const authStore = useAuthStore()
const vaultStore = useVaultStore()

const email = ref('ilmassiluca@gmail.com')
const password = ref('supabase')
const masterPassword = ref('supabase8')

const showAccountPassword = ref(false)
const showMasterPassword = ref(false)

const { t } = useI18n()

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
    if (!vaultStore.locked) router.push('/vault')
  } catch (e: any) {
    if ('status' in e) error.value = t('auth.invalidCredentials')
    else error.value = e.message

    // sicurezza: cleanup completo
    vaultStore.lock()
    await authStore.logout()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] items-center justify-center">
    <Transition name="custom-gate" mode="out-in">
      <div v-if="vaultStore.isProcessing" class="flex flex-col justify-center items-center gap-3">
        <div class="animate-bounce">
          <LockKeyholeOpen :size="60" />
        </div>
        <p class="animate-pulse">{{ t('auth.derivingKey') }}</p>
      </div>
      <div v-else class="w-full bg-zinc-700 max-w-md rounded-2xl p-8 shadow-xl">
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
            <label class="block text-sm mb-1 text-zinc-400"> {{ $t('auth.email') }} </label>
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
            <label class="block text-sm mb-1 text-zinc-400">
              {{ $t('auth.passwordAccount') }}
            </label>
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
            <label class="block text-sm mb-1 text-zinc-400">
              {{ $t('auth.masterPassword') }}
            </label>
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
                <Eye v-if="!showMasterPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
            <p class="text-xs text-zinc-500 mt-1">{{ $t('auth.masterPasswordInfo') }}</p>
          </div>

          <!-- SUBMIT -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!loading">{{ $t('auth.unlock') }}</span>
            <span v-else>{{ $t('auth.derivingKey') }}</span>
          </button>
        </form>

        <!-- FOOTER -->
        <div class="mt-6 text-center text-sm text-zinc-400">
          {{ $t('auth.noAccount') }}
          <router-link to="/register" class="text-blue-400 hover:underline">
            {{ $t('auth.register') }}
          </router-link>
        </div>
      </div>
    </Transition>
  </div>
</template>
<style scoped>
/* --- ANIMAZIONE DI USCITA (Istantanea) --- */
.custom-gate-leave-active {
  transition: opacity 0s; /* Sparisce immediatamente */
}
.custom-gate-leave-to {
  opacity: 0;
}

/* --- ANIMAZIONE DI ENTRATA (2 Secondi) --- */
.custom-gate-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); /* Entrata fluida e lunga */
}

.custom-gate-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
  filter: blur(10px); /* Effetto scenografico opzionale */
}

.custom-gate-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
  filter: blur(0);
}

/* Stili di base per il layout */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #1a1a1a;
  color: white;
}
</style>
