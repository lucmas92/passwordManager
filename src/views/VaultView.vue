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

      <div class="relative flex flex-col items-center group">
        <button
          @click="openAddModal"
          class="px-2 py-1 rounded text-emerald-500 hover:bg-emerald-500 hover:text-white"
        >
          <Plus />
        </button>

        <div class="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center">
          <span
            class="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-gray-800 shadow-lg rounded-md"
          >
            {{ t('vault.addEntry') }}
          </span>
          <div class="w-3 h-3 -mt-2 rotate-45 bg-gray-800"></div>
        </div>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden w-full">
      <aside
        class="w-full md:w-1/3 border-r flex-col flex"
        :class="{ 'hidden md:flex': selectedVault, flex: !selectedVault }"
      >
        <div class="p-4 border-b font-bold text-xl bg-zinc-800">{{ t('vault.title') }}</div>
        <ul class="overflow-y-auto flex-1">
          <li
            v-for="item in filteredItems"
            :key="item.id"
            class="p-4 border-b hover:bg-blue-50 cursor-pointer"
          >
            <div class="flex-1" @click="selectedVault = item">
              <h2 class="font-semibold text-lg text-zinc-100">{{ item.title }}</h2>
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
          :class="[selectedVault ? 'bg-gray-600 ' : 'flex bg-gray-400 ']"
        >
          <VaultDetail v-if="selectedVault" :vault="selectedVault"></VaultDetail>
          <p v-else>{{ t('vault.noSelectedItem') }}</p>
        </div>
      </main>
    </div>

    <!-- Lista Entry -->
    <div v-if="false" class="space-y-3">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="p-4 bg-zinc-800 rounded flex flex-col md:flex-row md:justify-between gap-2"
      >
        <div class="flex-1" @click="selectedVault = item">
          <h2 class="font-semibold text-lg text-zinc-100">{{ item.title }}</h2>
          <p class="text-sm text-zinc-400">{{ item.username }}</p>
          <p class="text-sm text-zinc-400">{{ item.url }}</p>
          <p class="text-sm text-zinc-400" v-if="item.notes">
            {{ item.notes }}
          </p>

          <!-- Campi personalizzati -->
          <div v-for="(val, key) in item.fields" :key="key" class="text-sm text-zinc-400">
            {{ key }}: {{ val }}
          </div>

          <!-- Tags -->
          <div class="flex gap-2 mt-1 flex-wrap">
            <span v-for="tag in item.tags" :key="tag" class="bg-blue-600 text-xs px-2 py-1 rounded">
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Azioni -->
        <div class="flex gap-2 mt-2 md:mt-0 items-center">
          <div class="relative flex flex-col items-center group">
            <button
              @click="copyPassword(item)"
              class="px-2 py-1 rounded hover:bg-zinc-600 text-zinc-100"
            >
              <Copy />
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

          <div class="relative flex flex-col items-center group">
            <button
              @click="openEdit(item)"
              class="px-2 py-1 rounded hover:bg-zinc-600 text-zinc-100"
            >
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
              @click="deleteItem(item.id!)"
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
import { Copy, Pencil, Trash, ChevronLeft, Plus } from 'lucide-vue-next'
import VaultDetail from '@/views/VaultDetail.vue'

const { t } = useI18n()
const vaultStore = useVaultStore()
const authStore = useAuthStore()

const searchQuery = ref('')

// Modal state
const showModal = ref(false)
const modalData = ref<any>(null)

// Auto-lock countdown
const countdown = ref(vaultStore.autoLockTimeout)
let countdownInterval: number | undefined

function startCountdown() {
  stopCountdown()
  countdown.value = vaultStore.autoLockTimeout
  countdownInterval = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      lockVault()
    }
  }, 1000)
}

function stopCountdown() {
  if (countdownInterval) clearInterval(countdownInterval)
}

// Lock vault
function lockVault() {
  vaultStore.lock()
  authStore.logout()
  stopCountdown()
  alert(t('vault.locked'))
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

function openEdit(item: any) {
  modalData.value = { ...item, id: item.id }
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

// Actions
function copyPassword(item: VaultItemData) {
  const data = item
  if (data.password) navigator.clipboard.writeText(data.password)
}

function deleteItem(id: string) {
  if (confirm(t('vault.confirmDelete'))) {
    vaultStore.deleteItem(id)
  }
}
</script>
