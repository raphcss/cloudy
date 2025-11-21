<template>
  <div class="login-page">
    <div class="login-card">
      <h2>📝 Inscription</h2>
      <p class="subtitle">Créer un compte</p>

      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            placeholder="Votre nom"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="votre@email.com"
          />
        </div>

        <div class="form-group">
          <label for="discordId">Discord ID (optionnel)</label>
          <input
            id="discordId"
            v-model="discordId"
            type="text"
            placeholder="123456789012345678"
          />
          <small class="text-muted">Si vous avez déjà été ajouté comme modérateur, entrez votre Discord ID pour récupérer vos permissions</small>
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Inscription...' : 'S\'inscrire' }}
        </button>
      </form>

      <div class="footer-links">
        <router-link to="/login">Déjà un compte ? Se connecter</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

export default {
  name: 'Register',
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    const username = ref('');
    const email = ref('');
    const discordId = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');

    const handleRegister = async () => {
      loading.value = true;
      error.value = '';

      const result = await authStore.register({
        username: username.value,
        email: email.value,
        discordId: discordId.value || undefined,
        password: password.value,
      });

      loading.value = false;

      if (result.success) {
        router.push('/dashboard');
      } else {
        error.value = result.message;
      }
    };

    return {
      username,
      email,
      discordId,
      password,
      loading,
      error,
      handleRegister,
    };
  },
};
</script>

<style scoped lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.login-card {
  background: var(--bg-secondary);
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--border-color);

  h2 {
    text-align: center;
    color: var(--accent);
    margin-bottom: 0.5rem;
  }

  .subtitle {
    text-align: center;
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  .btn-block {
    width: 100%;
    margin-top: 1rem;
  }

  .footer-links {
    text-align: center;
    margin-top: 1.5rem;

    a {
      color: var(--accent);
      text-decoration: none;
      transition: color 0.3s;

      &:hover {
        text-decoration: underline;
        color: var(--accent-hover);
      }
    }
  }
}
</style>
