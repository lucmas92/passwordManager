<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-9999 flex flex-col-reverse gap-2 w-80">
      <TransitionGroup name="list">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="p-4 rounded-lg shadow-lg border-l-4 flex gap-2 justify-between items-center text-white"
          :class="{
            'bg-green-600 border-green-800': toast.type === 'success',
            'bg-red-600 border-red-800': toast.type === 'error',
            'bg-blue-600 border-blue-800': toast.type === 'info',
          }"
        >
          <p class="text-sm font-medium">{{ toast.message }}</p>
          <button @click="toastStore.removeToast(toast.id)" class="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Animazioni di Vue */
.list-enter-active,
.list-leave-active {
  transition: all 0.6s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
