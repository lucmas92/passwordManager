import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    loading: false,
  }),

  actions: {
    async register(email: string, password: string) {
      this.loading = true

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      this.user = data.user
      this.loading = false
    },

    async login(email: string, password: string) {
      this.loading = true
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      this.user = data.user
      this.loading = false
    },

    async logout() {
      await supabase.auth.signOut()
      this.user = null
    },
  },
})
