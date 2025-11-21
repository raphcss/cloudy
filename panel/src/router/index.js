import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, requiresMaster: true },
  },
  {
    path: '/guild/:guildId',
    name: 'GuildPanel',
    component: () => import('../views/GuildPanel.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/guild/:guildId/setup',
    name: 'GuildSetup',
    component: () => import('../views/GuildSetup.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/error/:code?',
    name: 'Error',
    component: () => import('../views/NotFound.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Attendre que l'utilisateur soit chargé si un token existe
  if (authStore.token && !authStore.user && !authStore.isLoading) {
    await authStore.loadUser();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresMaster && !authStore.isMaster) {
    next('/dashboard');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
