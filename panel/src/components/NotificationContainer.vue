<template>
  <div class="notification-container">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`]"
        @click="removeNotification(notification.id)"
      >
        <div class="notification-icon">
          <span v-if="notification.type === 'success'">✓</span>
          <span v-else-if="notification.type === 'error'">✕</span>
          <span v-else-if="notification.type === 'warning'">⚠</span>
          <span v-else>ℹ</span>
        </div>
        <div class="notification-message">{{ notification.message }}</div>
        <button class="notification-close" @click.stop="removeNotification(notification.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useNotificationStore } from '../stores/notification';

export default {
  name: 'NotificationContainer',
  setup() {
    const notificationStore = useNotificationStore();
    
    const notifications = computed(() => notificationStore.notifications);
    
    const removeNotification = (id) => {
      notificationStore.remove(id);
    };
    
    return {
      notifications,
      removeNotification,
    };
  },
};
</script>

<style scoped lang="scss">
.notification-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  cursor: pointer;
  pointer-events: all;
  min-width: 300px;
  transition: all 0.3s;

  &:hover {
    transform: translateX(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  .notification-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .notification-message {
    flex: 1;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .notification-close {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.1);
    color: inherit;
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
    line-height: 1;

    &:hover {
      background: rgba(0, 0, 0, 0.2);
      transform: scale(1.1);
    }
  }

  &-success {
    background: rgba(72, 187, 120, 0.95);
    color: white;
    border-left: 4px solid #2f855a;

    .notification-icon {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &-error {
    background: rgba(245, 101, 101, 0.95);
    color: white;
    border-left: 4px solid #c53030;

    .notification-icon {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &-warning {
    background: rgba(237, 137, 54, 0.95);
    color: white;
    border-left: 4px solid #c05621;

    .notification-icon {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &-info {
    background: rgba(66, 153, 225, 0.95);
    color: white;
    border-left: 4px solid #2c5282;

    .notification-icon {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}
</style>
