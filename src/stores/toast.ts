import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function addToast(message: string, type: ToastType = 'info') {
    const id = Date.now()
    toasts.value.push({ id, message, type })

    // se ci sono più di 5 toast, rimuovi il più vecchio
    if (toasts.value.length > 5) {
      toasts.value.shift()
    }

    // Rimuovi automaticamente dopo 3 secondi
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, addToast, removeToast }
})
