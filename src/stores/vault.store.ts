import { defineStore } from 'pinia'
import { CryptoService } from '@/services/crypto.service'
import { useAuthStore } from './auth.store'

let inactivityTimer: ReturnType<typeof setTimeout> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null

export const useVaultStore = defineStore('vault', {
  state: () => ({
    key: null as CryptoKey | null,
    timeoutMinutes: 5, // default, modificabile lato utente
    remainingSeconds: 0, // countdown visivo
  }),

  actions: {
    async unlock(masterPassword: string, salt: string) {
      this.key = await CryptoService.deriveKey(masterPassword, salt)
      this.startInactivityTimer()
      this.registerActivityListeners()
    },

    lock() {
      this.key = null
      this.clearInactivityTimer()
      this.removeActivityListeners()
      this.remainingSeconds = 0
    },

    startInactivityTimer() {
      this.clearInactivityTimer()
      this.remainingSeconds = this.timeoutMinutes * 60

      // Countdown visivo
      countdownInterval = setInterval(() => {
        if (this.remainingSeconds > 0) {
          this.remainingSeconds--
        } else {
          clearInterval(countdownInterval!)
        }
      }, 1000)

      // Timer auto-lock
      inactivityTimer = setTimeout(
        () => {
          console.log('Auto-lock: timeout inattività')
          this.lock()
          useAuthStore().logout()
          alert('Vault bloccato per inattività!')
        },
        this.timeoutMinutes * 60 * 1000,
      )
    },

    clearInactivityTimer() {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (countdownInterval) clearInterval(countdownInterval)
      inactivityTimer = null
      countdownInterval = null
    },

    resetTimer() {
      if (this.key) this.startInactivityTimer()
    },

    registerActivityListeners() {
      const events = ['keydown', 'touchstart', 'touchmove']
      events.forEach((e) => window.addEventListener(e, this.resetTimer))
    },

    removeActivityListeners() {
      const events = ['keydown', 'touchstart', 'touchmove']
      events.forEach((e) => window.removeEventListener(e, this.resetTimer))
    },

    setTimeoutMinutes(minutes: number) {
      this.timeoutMinutes = minutes
      if (this.key) this.startInactivityTimer() // resetta il timer
    },
  },
})
