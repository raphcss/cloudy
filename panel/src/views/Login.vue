<template>
  <div class="login-page">
    <div class="login-card">
      <h2>🛡️ Connexion</h2>
      <p class="subtitle">Claude</p>

      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Connexion en cours...</p>
      </div>

      <div v-else class="discord-login">
        <button @click="loginWithDiscord" class="btn-discord" :disabled="loading">
          <svg width="24" height="24" viewBox="0 0 71 55" fill="none">
            <g clip-path="url(#clip0)">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="white"/>
            </g>
          </svg>
          Se connecter avec Discord
        </button>

        <p class="info-text">
          Cliquez pour vous connecter avec votre compte Discord.
          Vos informations seront utilisées uniquement pour l'authentification.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import api from '../services/api';

export default {
  name: 'Login',
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const route = useRoute();

    const loading = ref(false);
    const error = ref('');

    // Vérifier si on revient du callback Discord
    onMounted(async () => {
      const code = route.query.code;
      
      if (code) {
        console.log('[Discord OAuth] Code reçu depuis Discord:', code.substring(0, 10) + '...');
        
        // Nettoyer l'URL immédiatement pour éviter de réutiliser le code
        router.replace({ query: {} });
        
        loading.value = true;
        error.value = '';

        console.log('[Discord OAuth] Envoi du code à l\'API...');
        const result = await authStore.loginWithDiscord(code);

        loading.value = false;

        if (result.success) {
          console.log('[Discord OAuth] Connexion réussie, redirection vers dashboard');
          router.push('/dashboard');
        } else {
          console.error('[Discord OAuth] Erreur:', result.message);
          error.value = result.message || 'Erreur lors de la connexion avec Discord';
        }
      }
    });

    const loginWithDiscord = async () => {
      try {
        loading.value = true;
        error.value = '';

        console.log('[Discord OAuth] Demande de l\'URL d\'authentification...');
        const response = await api.getDiscordAuthUrl();
        
        if (response.data.success) {
          console.log('[Discord OAuth] Redirection vers Discord:', response.data.url);
          // Rediriger vers Discord
          window.location.href = response.data.url;
        } else {
          throw new Error('Impossible d\'obtenir l\'URL Discord');
        }
      } catch (err) {
        console.error('[Discord OAuth] Erreur lors de la redirection:', err);
        loading.value = false;
        error.value = err.response?.data?.message || 'Erreur lors de la redirection vers Discord';
      }
    };

    return {
      loading,
      error,
      loginWithDiscord,
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
  max-width: 450px;
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
}

.discord-login {
  text-align: center;

  .btn-discord {
    width: 100%;
    padding: 1rem 2rem;
    background: #5865F2;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);

    &:hover:not(:disabled) {
      background: #4752c4;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(88, 101, 242, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    svg {
      width: 24px;
      height: 24px;
    }
  }

  .info-text {
    margin-top: 1.5rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
}

.loading-state {
  text-align: center;
  padding: 2rem;

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border-color);
    border-top: 4px solid var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  p {
    color: var(--text-secondary);
    font-weight: 500;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
