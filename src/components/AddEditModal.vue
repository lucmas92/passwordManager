<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/services/supabase'
import { encryptItem } from '@/services/vault.service'
import { useVaultStore } from '@/stores/vault.store'
import type { VaultItemPlain } from '@/types/database'
import { useAuthStore } from '@/stores/auth.store.ts'

const props = defineProps<{
  modelValue: boolean
  item?: VaultItemPlain & { id?: string }
}>()

const emit = defineEmits(['update:modelValue', 'saved'])

const vaultStore = useVaultStore()

const form = ref<VaultItemPlain>({
  title: '',
  username: '',
  password: '',
  url: '',
})

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
      <input v-model="form.url" placeholder="URL" class="input" />

      <div class="flex justify-end gap-2">
        <button @click="$emit('update:modelValue', false)" class="btn">Annulla</button>
        <button @click="save" class="btn-primary">Salva</button>
      </div>
    </div>
  </div>
</template>
