<template>
  <div class="page-wrapper">
    <div class="error-page">
      <div class="error-content">
        <div class="error-icon">🔍</div>
        <h1 class="error-code">{{ errorCode }}</h1>
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="error-actions">
          <button @click="goBack" class="btn btn-secondary">
            ← Retour
          </button>
          <router-link to="/dashboard" class="btn btn-primary">
            🏠 Dashboard
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';

export default {
  name: 'NotFound',
  setup() {
    const router = useRouter();
    const route = useRoute();

    const errorCode = computed(() => route.params.code || '404');
    
    const errorTitle = computed(() => {
      const titles = {
        '404': 'Page non trouvée',
        '403': 'Accès refusé',
        '500': 'Erreur serveur',
      };
      return titles[errorCode.value] || 'Erreur';
    });

    const errorMessage = computed(() => {
      const messages = {
        '404': 'La page que vous recherchez n\'existe pas ou a été déplacée.',
        '403': 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.',
        '500': 'Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.',
      };
      return messages[errorCode.value] || 'Une erreur inattendue s\'est produite.';
    });

    const goBack = () => {
      router.back();
    };

    return {
      errorCode,
      errorTitle,
      errorMessage,
      goBack,
    };
  },
};
</script>

<style scoped lang="scss">
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.error-content {
  text-align: center;
  max-width: 600px;

  .error-icon {
    font-size: 6rem;
    margin-bottom: 1rem;
    opacity: 0.5;
    animation: float 3s ease-in-out infinite;
  }

  .error-code {
    font-size: 8rem;
    font-weight: 900;
    background: linear-gradient(135deg, var(--accent) 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    line-height: 1;
  }

  .error-title {
    color: var(--text-primary);
    font-size: 2rem;
    margin: 1rem 0 0.5rem 0;
    font-weight: 700;
  }

  .error-message {
    color: var(--text-secondary);
    font-size: 1.1rem;
    margin-bottom: 2rem;
    line-height: 1.6;
  }

  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>
