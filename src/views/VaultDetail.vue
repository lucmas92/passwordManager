<template>
  <div class="p-4 lg:p-8" v-if="vault">
    <!-- Visualizzazione dettagli -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold">{{ localVault.title ?? 'Voce senza titolo' }}</h2>
        <div class="flex gap-2">
          <div class="relative flex flex-col items-center group">
            <button @click="toggleEdit" class="px-2 py-1 rounded hover:bg-zinc-600 text-zinc-100">
              <Pencil />
            </button>

            <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center">
              <span
                class="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-gray-800 shadow-lg rounded-md"
              >
                {{ t('vault.edit') }}
              </span>
              <div class="w-3 h-3 -mt-2 rotate-45 bg-gray-800"></div>
            </div>
          </div>
          <div class="relative flex flex-col items-center group">
            <button
              @click="confirmDelete"
              class="px-2 py-1 rounded text-red-500 hover:bg-red-500 hover:text-white"
            >
              <Trash />
            </button>

            <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center">
              <span
                class="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-gray-800 shadow-lg rounded-md"
              >
                {{ t('vault.delete') }}
              </span>
              <div class="w-3 h-3 -mt-2 rotate-45 bg-gray-800"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="font-medium text-sm text-gray-600">Username</label>
          <div class="mt-1 text-lg">{{ localVault.username ?? '-' }}</div>
        </div>

        <div>
          <div class="flex items-center">
            <label class="font-medium text-sm text-gray-600">Password</label>
            <div class="relative flex flex-col items-center group">
              <button
                @click="copyPassword"
                class="px-2 py-1 rounded hover:bg-zinc-600 text-zinc-100"
              >
                <Copy :size="16" />
              </button>

              <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center">
                <span
                  class="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-gray-800 shadow-lg rounded-md"
                >
                  {{ t('vault.copy') }}
                </span>
                <div class="w-3 h-3 -mt-2 rotate-45 bg-gray-800"></div>
              </div>
            </div>
          </div>
          <div class="mt-1 flex items-center gap-3">
            <div class="text-lg font-mono w-full overflow-hidden whitespace-nowrap">
              <span v-if="showPassword">{{ localVault.password }}</span>
              <span v-else>••••••••</span>
            </div>
            <button @click="showPassword = !showPassword" class="text-sm px-2 py-1">
              <Eye v-if="!showPassword" />
              <EyeOff v-else />
            </button>
          </div>

          <PasswordStrength v-if="localVault.password" :password="localVault.password" />
        </div>

        <div v-if="localVault.url">
          <div class="flex items-center">
            <label class="font-medium text-sm text-gray-600">URL</label>
            <div class="relative flex flex-col items-center group">
              <button @click="copyUrl" class="px-2 py-1 rounded hover:bg-zinc-600 text-zinc-100">
                <Copy :size="16" />
              </button>

              <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center">
                <span
                  class="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-gray-800 shadow-lg rounded-md"
                >
                  {{ t('vault.copy') }}
                </span>
                <div class="w-3 h-3 -mt-2 rotate-45 bg-gray-800"></div>
              </div>
            </div>
          </div>
          <div class="mt-1">
            <a :href="localVault.url" target="_blank" class="text-blue-600 underline">{{
              localVault.url
            }}</a>
          </div>
        </div>

        <div v-if="localVault.tags && localVault.tags.length">
          <label class="font-medium text-sm text-gray-600">Tags</label>
          <div class="mt-1 flex flex-wrap gap-2">
            <span
              v-for="(t, i) in localVault.tags"
              :key="i"
              class="text-xs px-2 py-1 bg-gray-400 rounded"
              >{{ t }}</span
            >
          </div>
        </div>

        <div v-if="localVault.notes" class="md:col-span-2">
          <label class="font-medium text-sm text-gray-600">Note</label>
          <div class="mt-1 whitespace-pre-line">{{ localVault.notes }}</div>
        </div>

        <div>
          <label class="font-medium text-sm text-gray-600">Creato</label>
          <div class="mt-1 text-sm text-gray-500">{{ formattedCreatedAt }}</div>
        </div>

        <div>
          <label class="font-medium text-sm text-gray-600">Aggiornato</label>
          <div class="mt-1 text-sm text-gray-500">{{ formattedUpdatedAt }}</div>
        </div>
      </div>
    </div>

    <AddEditModal v-if="editMode" :edit-data="editItem" @saved="saveEdit" @close="cancelEdit" />
  </div>
</template>

<script setup lang="ts">
import type { VaultItemData } from '@/types/database.ts'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import AddEditModal from '@/components/AddEditModal.vue'
import { Copy, Eye, EyeOff, Pencil, Trash } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import PasswordStrength from '@/components/PasswordStrength.vue'
import { useToastStore } from '@/stores/toast.ts'

const props = defineProps<{
  vault: VaultItemData
}>()

const localVault = ref<VaultItemData>({} as VaultItemData)

onMounted(() => {
  localVault.value = { ...props.vault }
})

const emit = defineEmits<{
  (e: 'update', payload: VaultItemData): void
  (e: 'delete', payload: string | number | VaultItemData): void
}>()

const { t } = useI18n()

const editMode = ref(false)
const showPassword = ref(false)
const toast = useToastStore()

const editItem = reactive<VaultItemData>({ ...props.vault } as VaultItemData)
const tagsInput = ref((props.vault.tags && props.vault.tags.join(', ')) || '')

// Keep reactive copy in sync if prop changes externally
watch(
  () => props.vault,
  (newV) => {
    localVault.value = { ...props.vault }
    Object.assign(editItem, newV || {})
    tagsInput.value = (newV?.tags && newV.tags.join(', ')) || ''
  },
)

const formattedCreatedAt = computed(() => {
  if (!props.vault?.created_at) return '-'
  return new Date(props.vault.created_at).toLocaleString()
})

const formattedUpdatedAt = computed(() => {
  if (!props.vault?.updated_at) return '-'
  return new Date(props.vault.updated_at).toLocaleString()
})

function toggleEdit() {
  editMode.value = true
}

function cancelEdit() {
  // restore from prop
  Object.assign(editItem, props.vault)
  tagsInput.value = (props.vault.tags && props.vault.tags.join(', ')) || ''
  editMode.value = false
}

function saveEdit(updatedItem: VaultItemData) {
  localVault.value = updatedItem
  emit('update', updatedItem)
  editMode.value = false
}

function confirmDelete() {
  if (confirm('Sei sicuro di voler eliminare questa voce?')) {
    emit('delete', props.vault.id ?? props.vault)
  }
}

async function copyPassword() {
  const pwd = props.vault?.password ?? ''
  if (!pwd) {
    toast.addToast('Password vuota', 'info')
    return
  }
  try {
    await navigator.clipboard.writeText(pwd)
    // messaggio minimo
    toast.addToast('Password copiata negli appunti.', 'info')
  } catch (e: any) {
    console.error(e)
    // fallback
    const textarea = document.createElement('textarea')
    textarea.value = pwd
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      toast.addToast('Password copiata negli appunti.', 'info')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

async function copyUrl() {
  const url = props.vault?.url ?? ''
  if (!url) {
    toast.addToast('Url vuota.', 'info')
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    // messaggio minimo
    toast.addToast('Url copiata negli appunti.', 'info')
  } catch (e: any) {
    console.error(e)
    // fallback
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      toast.addToast('Url copiata negli appunti.', 'info')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}
</script>

<style scoped>
/* ...existing styles... */
</style>
