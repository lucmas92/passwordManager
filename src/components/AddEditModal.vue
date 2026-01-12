<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
    <div class="bg-zinc-600 rounded-lg p-6 w-full max-w-lg relative">
      <h2 class="text-xl font-bold text-zinc-100 mb-4">
        {{ editData ? t('item.editEntry') : t('item.addEntry') }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-3 text-sm">
        <!-- Title -->
        <div class="flex justify-between gap-3">
          <div class="w-full">
            <label class="block text-xs text-zinc-200 mb-1">{{ t('item.title') }}</label>
            <input
              v-model="form.title"
              type="text"
              class="w-full px-3 py-1 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-0"
              required
            />
          </div>

          <!-- Username -->
          <div class="w-full">
            <label class="block text-xs text-zinc-200 mb-1">{{ t('item.username') }}</label>
            <input
              v-model="form.username"
              type="text"
              class="w-full px-3 py-1 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-0"
            />
          </div>
        </div>
        <div>
          <label class="block text-zinc-200 mb-1">{{ t('item.password') }}</label>
          <div class="flex items-center gap-2">
            <div class="relative flex-1">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                autocomplete="off"
                class="w-full px-3 py-1 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400"
                @click="showPassword = !showPassword"
              >
                <Eye :size="25" v-if="!showPassword" />
                <EyeOff :size="25" v-else />
              </button>
            </div>
            <button type="button" @click="generateRandomPassword">
              {{ t('item.fillRandomPassword') }}
            </button>
          </div>
        </div>

        <div class="mt-2" v-if="form.password.trim().length > 0">
          <PasswordStrength :password="form.password" />
        </div>

        <!-- URL -->
        <div>
          <label class="block text-zinc-200 mb-1">{{ t('item.url') }}</label>
          <input
            v-model="form.url"
            type="url"
            class="w-full px-3 py-1 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-0"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-zinc-200 mb-1">{{ t('item.notes') }}</label>
          <textarea
            v-model="form.notes"
            rows="2"
            class="w-full px-3 py-1 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-0 resize-none"
          ></textarea>
        </div>

        <section class="border-t border-b border-zinc-700 py-1 space-y-2">
          <span class="text-xs text-zinc-400">{{ t('item.customFields') }}</span>
          <!-- Campi personalizzati -->
          <div v-for="(val, key) in form.fields" :key="key" class="flex gap-2 items-end">
            <div class="flex-1">
              <label class="block text-zinc-200 mb-1">{{ key }}</label>
              <input
                v-model="form.fields[key]"
                type="text"
                class="w-full px-3 py-1 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-0"
              />
            </div>
            <button
              type="button"
              class="h-6 w-6 bg-red-600 rounded-full hover:bg-red-500 text-white flex items-center justify-center mb-1"
              @click="removeField(key)"
            >
              <CircleX />
            </button>
          </div>
          <div class="relative px-4 flex flex-col items-center group">
            <button
              type="button"
              @click="addField"
              class="px-2 py-1 rounded text-emerald-500 hover:bg-emerald-500 hover:text-white"
            >
              <Plus />
            </button>

            <div
              class="absolute z-99 bottom-full mb-2 hidden group-hover:flex flex-col items-center"
            >
              <span
                class="relative z-99 p-2 text-xs leading-none text-white whitespace-no-wrap bg-gray-800 shadow-lg rounded-md"
              >
                {{ t('item.addField') }}
              </span>
              <div class="w-3 h-3 -mt-2 rotate-45 bg-gray-800"></div>
            </div>
          </div>
        </section>

        <!-- Tags -->
        <div>
          <label class="block text-zinc-200 mb-1">{{ t('item.tags') }}</label>
          <input
            v-model="tagsInput"
            @keydown.enter.prevent="addTag"
            type="text"
            :placeholder="t('item.tags.placeholder')"
            class="w-full px-3 py-1 bg-zinc-800 text-zinc-100 focus:outline-none focus:ring-0"
          />
          <div class="flex gap-2 flex-wrap mt-1">
            <span
              v-for="tag in form.tags"
              :key="tag"
              class="bg-blue-600 text-xs px-2 py-1 rounded flex items-center gap-1"
            >
              {{ tag }}
              <button type="button" @click="removeTag(tag)" class="text-white text-xs">×</button>
            </span>
          </div>
        </div>

        <!-- Bottoni -->
        <div class="flex justify-end gap-2 mt-4">
          <button
            type="button"
            class="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600 text-zinc-100"
            @click="$emit('close')"
          >
            {{ t('form.cancel') }}
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-700 text-white"
          >
            {{ t('form.save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, onMounted } from 'vue'
import { useVaultStore } from '@/stores/vault.store'
import { CryptoService, generatePassword } from '@/services/crypto.service'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff, CircleX, Plus } from 'lucide-vue-next'
import PasswordStrength from '@/components/PasswordStrength.vue'

interface VaultForm {
  title: string
  username: string
  password: string
  url: string
  notes: string
  fields: Record<string, string>
  tags: string[]
}

const { t } = useI18n()
const vaultStore = useVaultStore()

const props = defineProps<{ editData: any }>()
const emit = defineEmits(['close', 'saved'])

const showPassword = ref(true)
const tagsInput = ref('')

const form = reactive<VaultForm>({
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  fields: {},
  tags: [],
})

// Popola il form se è in edit mode
watch(
  () => props.editData,
  (val) => {
    if (val) {
      form.title = val.title || ''
      form.username = val.username || ''
      form.password = val.password || ''
      form.url = val.url || ''
      form.notes = val.notes || ''
      form.fields = { ...(val.fields || {}) }
      form.tags = [...(val.tags || [])]
    } else {
      form.title = ''
      form.username = ''
      form.password = ''
      form.url = ''
      form.notes = ''
      form.fields = {}
      form.tags = []
    }
  },
  { immediate: true },
)

// Gestione campi personalizzati
function addField() {
  const key = prompt(t('item.fieldName'))
  if (key) form.fields[key] = ''
}
function removeField(key: string) {
  delete form.fields[key]
}

// Gestione tag
function addTag() {
  if (tagsInput.value.trim() && !form.tags.includes(tagsInput.value.trim())) {
    form.tags.push(tagsInput.value.trim())
    tagsInput.value = ''
  }
}
function removeTag(tag: string) {
  form.tags = form.tags.filter((t) => t !== tag)
}

function generateRandomPassword() {
  showPassword.value = true
  form.password = generatePassword(16, {
    uppercase: true,
    numbers: true,
    symbols: true,
  })
}

// Submit form
async function handleSubmit() {
  if (!vaultStore.key) {
    alert(t('noCryptoKey'))
    return
  }
  const payload = JSON.stringify({ ...form })
  const encryptedData = await CryptoService.encrypt(payload, vaultStore.key)
  try {
    if (props.editData?.id) {
      await vaultStore.updateItem(props.editData.id, encryptedData)
    } else {
      await vaultStore.addItem(encryptedData)
    }
    emit('saved', { ...form })
  } catch (err) {
    console.error(err)
    alert(t('form.errorSaving'))
  }
}

onMounted(() => {
  setTimeout(() => {
    showPassword.value = false
  }, 100)
})
</script>
