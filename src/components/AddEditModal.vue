<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { encryptItem } from '@/services/vault.service'
import { useVaultStore } from '@/stores/vault.store'
import type { VaultItemPlain } from '@/types/database'
import { useAuthStore } from '@/stores/auth.store.ts'
import zxcvbn from 'zxcvbn'

const props = defineProps<{
  modelValue: boolean
  item?: VaultItemPlain & { id?: string }
}>()

const emit = defineEmits(['update:modelValue', 'saved'])

const vaultStore = useVaultStore()

const passwordStrengthScore = ref(0)
const passwordStrengthText = ref('')

const form = ref<VaultItemPlain>({
  title: '',
  username: '',
  password: '',
  url: '',
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

watch(
  () => form.value.password,
  (val) => {
    if (val) {
      const result = zxcvbn(val)
      passwordStrengthScore.value = result.score
      passwordStrengthText.value = result.feedback.warning || result.feedback.suggestions[0] || ''
    } else {
      passwordStrengthScore.value = 0
      passwordStrengthText.value = ''
    }
  },
)

watch(
  () => props.item,
  (val) => {
    if (val) form.value = { ...val }
  },
  { immediate: true },
)

async function save() {
  const encrypted = await encryptItem(form.value, vaultStore.key!)

  if (props.item?.id) {
    await supabase.from('vault_items').update(encrypted).eq('id', props.item.id)
  } else {
    const authStore = useAuthStore()

    await supabase.from('vault_items').insert({
      ...encrypted,
      user_id: authStore.user!.id,
    })
  }

  emit('saved')
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/60 flex items-center justify-center">
    <div class="bg-zinc-800 p-6 rounded-xl w-full max-w-md space-y-4">
      <h2 class="text-lg font-semibold">{{ item ? 'Modifica' : 'Nuova' }} Credenziale</h2>

      <input v-model="form.title" placeholder="Titolo" class="input" />
      <input v-model="form.username" placeholder="Username" class="input" />
      <input v-model="form.password" placeholder="Password" class="input" />

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
      <input v-model="form.url" placeholder="URL" class="input" />

      <div class="flex justify-end gap-2">
        <button @click="$emit('update:modelValue', false)" class="btn">Annulla</button>
        <button @click="save" class="btn-primary">Salva</button>
      </div>
    </div>
  </div>
</template>
