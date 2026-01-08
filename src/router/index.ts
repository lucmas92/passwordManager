import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store.ts'
import { useVaultStore } from '@/stores/vault.store.ts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/vault',
      component: () => import('@/views/VaultView.vue'),
      meta: { requiresAuth: true, requiresVault: true },
    },
    {
      path: '/register',
      component: () => import('@/views/RegisterView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/vault' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const vault = useVaultStore()

  if (to.meta.requiresAuth && !auth.user) {
    return '/login'
  }

  if (to.meta.requiresVault && !vault.key) {
    return '/login'
  }
})

export default router
