<template>
  <div class="px-4 py-2 lg:px-12 lg:py-4 flex flex-col h-[calc(100vh-4.5rem)]">
    <!-- Header -->
    <div class="flex flex-col-reverse md:flex-row gap-2 flex-none py-4">
      <!-- Search -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cerca..."
        class="flex-1 px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />

      <div class="flex flex-col justify-center items-center">
        <!-- Toggle blocco su visibilità -->
        <div class="flex items-center gap-2 px-3 rounded">
          <input
            type="checkbox"
            v-model="vaultStore.lockOnVisibilityChange"
            id="lockToggle"
            class="accent-emerald-500"
          />
          <label for="lockToggle" class="text-zinc-200 text-sm">{{
            t('vault.lockOnVisibilityChange')
          }}</label>
        </div>

        <!-- Countdown Auto-Lock -->
        <div class="mb-4 text-sm text-zinc-400">{{ t('vault.autoLockIn') }}: {{ countdown }}s</div>
      </div>

      <!-- Export Button -->
      <div class="flex items-center relative group">
        <button
          class="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-100 flex items-center gap-2"
        >
          <Download :size="18" />
          Export
        </button>
        <!-- Dropdown menu -->
        <div
          class="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col bg-zinc-800 border border-zinc-700 rounded shadow-lg z-50 min-w-[120px]"
        >
          <button
            @click="exportData('json')"
            class="px-4 py-2 text-left hover:bg-zinc-700 text-zinc-200 text-sm"
          >
            JSON
          </button>
          <button
            @click="exportData('csv')"
            class="px-4 py-2 text-left hover:bg-zinc-700 text-zinc-200 text-sm"
          >
            CSV
          </button>
        </div>
      </div>
    </div>
    <div class="flex flex-1 overflow-hidden w-full">
      <aside
        class="w-full md:w-1/3 md:border-r flex-col flex"
        :class="{ 'hidden md:flex': selectedVault, flex: !selectedVault }"
      >
        <div class="flex justify-between items-center bg-zinc-800 border-b">
          <div class="p-4 font-bold text-xl">{{ t('vault.title') }}</div>

          <div class="relative px-4 flex flex-col items-center group">
            <button
              @click="openAddModal"
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
                {{ t('vault.addEntry') }}
              </span>
              <div class="w-3 h-3 -mt-2 rotate-45 bg-gray-800"></div>
            </div>
          </div>
        </div>

        <ul class="overflow-y-auto flex-1">
          <li
            v-for="item in filteredItems"
            :key="item.id"
            class="p-4 border-b border-zinc-700 hover:bg-zinc-800 cursor-pointer"
          >
            <div class="flex-1" @click="selectedVault = item">
              <h2 class="text-lg text-zinc-100">{{ item.title }}</h2>
              <p class="text-sm text-zinc-400">{{ item.username }}</p>

              <div class="flex gap-2 mt-1 flex-wrap">
                <span
                  v-for="tag in item.tags"
                  :key="tag"
                  class="bg-blue-600 text-xs px-2 py-1 rounded"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </li>
        </ul>
      </aside>

      <main
        class="w-full md:w-2/3 flex-col flex"
        :class="{ flex: selectedVault, 'hidden md:flex': !selectedVault }"
      >
        <div class="p-4 border-b flex items-center md:hidden">
          <button class="text-blue-600 font-semibold flex" @click="selectedVault = null">
            <ChevronLeft /> {{ t('vault.back') }}
          </button>
        </div>

        <div
          class="flex-1 overflow-y-auto p-4 justify-center items-center"
          :class="[selectedVault ? 'bg-zinc-800 ' : 'flex bg-trasparent ']"
        >
          <VaultDetail
            v-if="selectedVault"
            :vault="selectedVault"
            @update="onUpdated"
          ></VaultDetail>
          <p v-else>{{ t('vault.noSelectedItem') }}</p>
        </div>
      </main>
    </div>

    <!-- Add/Edit Modal -->
    <AddEditModal
      v-if="showModal"
      :editData="modalData"
      @close="handleModalClose"
      @saved="handleModalSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useVaultStore } from '@/stores/vault.store'
import { useAuthStore } from '@/stores/auth.store'
import { useI18n } from 'vue-i18n'
import AddEditModal from '@/components/AddEditModal.vue'
import type { VaultItemData } from '@/types/database.ts'
import { ChevronLeft, Plus, Download } from 'lucide-vue-next'
import VaultDetail from '@/views/VaultDetail.vue'
import { useToastStore } from '@/stores/toast.ts'

const { t } = useI18n()
const vaultStore = useVaultStore()
const authStore = useAuthStore()

const searchQuery = ref('')

// Modal state
const showModal = ref(false)
const modalData = ref<any>(null)
const toast = useToastStore()

// Auto-lock countdown
const countdown = ref(vaultStore.autoLockTimeout)
let countdownInterval: number | undefined

function startCountdown() {
  stopCountdown()
  countdown.value = vaultStore.autoLockTimeout
  countdownInterval = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      lockVault(true)
    }
  }, 1000)
}

function stopCountdown() {
  if (countdownInterval) clearInterval(countdownInterval)
}

// Lock vault
function lockVault(timeExpired = false) {
  vaultStore.lock()
  authStore.logout()
  stopCountdown()
  if (timeExpired) {
    toast.addToast(t('vault.autoLocked'), 'info')
  } else {
    toast.addToast(t('vault.lostVisibilityLocked'), 'info')
  }
}

// Reset countdown on activity
function resetCountdown() {
  countdown.value = vaultStore.autoLockTimeout
}

// Event listeners for auto-lock
const activityEvents = ['keydown', 'touchstart', 'touchmove']
function registerActivityListeners() {
  activityEvents.forEach((e) => window.addEventListener(e, resetCountdown))
  document.addEventListener('visibilitychange', handleVisibilityChange)
}
function removeActivityListeners() {
  activityEvents.forEach((e) => window.removeEventListener(e, resetCountdown))
  document.removeEventListener('visibilitychange', handleVisibilityChange)
}

// Lock on tab hidden if toggle attivo
function handleVisibilityChange() {
  if (document.hidden && vaultStore.lockOnVisibilityChange) {
    lockVault()
  }
}

onMounted(() => {
  startCountdown()
  registerActivityListeners()
})

onBeforeUnmount(() => {
  stopCountdown()
  removeActivityListeners()
})
const selectedVault = ref<VaultItemData | null>(null)

const onUpdated = () => {
  vaultStore.fetchItems()
}

// Filtered items (search locale)
const filteredItems = computed(() => {
  if (!vaultStore.items || !vaultStore.key) return []

  const query = searchQuery.value.toLowerCase()
  return vaultStore.items.filter((item: any) => {
    const searchFields = [
      item.title,
      item.username,
      item.url,
      item.notes,
      ...Object.values(item.fields || {}), // campi personalizzati
      ...(item.tags || []), // <-- qui includiamo i tags
    ]

    // Confronto case-insensitive
    return searchFields.some((field) => field && field.toString().toLowerCase().includes(query))
  })
})

// Modal handlers
function openAddModal() {
  modalData.value = null
  showModal.value = true
}

function handleModalClose() {
  showModal.value = false
  modalData.value = null
}

async function handleModalSaved() {
  // ricarica la lista dopo save
  await vaultStore.fetchItems()
  showModal.value = false
  modalData.value = null
}

function exportData(format: 'json' | 'csv') {
  if (
    !confirm(
      'ATTENZIONE: Il file esportato NON sarà cifrato! Chiunque potrà leggere le tue password. Vuoi procedere?',
    )
  ) {
    return
  }

  let dataStr = ''
  let mimeType = ''
  let extension = ''

  if (format === 'json') {
    dataStr = JSON.stringify(vaultStore.items, null, 2)
    mimeType = 'application/json'
    extension = 'json'
  } else if (format === 'csv') {
    // CSV Header
    const headers = ['Title', 'Username', 'Password', 'URL', 'Notes', 'Tags']
    const rows = vaultStore.items.map((item) => {
      const tags = item.tags ? item.tags.join(';') : ''
      // Escape CSV fields
      const escape = (text: string | undefined) => {
        if (!text) return ''
        return `"${text.replace(/"/g, '""')}"`
      }
      return [
        escape(item.title),
        escape(item.username),
        escape(item.password),
        escape(item.url),
        escape(item.notes),
        escape(tags),
      ].join(',')
    })
    dataStr = [headers.join(','), ...rows].join('\n')
    mimeType = 'text/csv'
    extension = 'csv'
  }

  const blob = new Blob([dataStr], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `password-manager-export-${new Date().toISOString().slice(0, 10)}.${extension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.addToast('Esportazione completata. Proteggi il file scaricato!', 'info')
}
</script>
