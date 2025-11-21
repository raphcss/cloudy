<template>
  <Transition name="modal">
    <div v-if="confirmStore.isVisible" class="modal-overlay" @click.self="confirmStore.cancel()">
      <div class="modal-container" :class="`modal-${confirmStore.type}`">
        <div class="modal-header">
          <h3>{{ confirmStore.title }}</h3>
          <button class="close-btn" @click="confirmStore.cancel()">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="icon-container">
            <svg v-if="confirmStore.type === 'warning'" width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg v-else-if="confirmStore.type === 'danger'" width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 9V13M12 17H12.01M4.22 4.22L19.78 19.78M19.78 4.22L4.22 19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <svg v-else width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <p>{{ confirmStore.message }}</p>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-cancel" @click="confirmStore.cancel()">
            {{ confirmStore.cancelText }}
          </button>
          <button class="btn btn-confirm" :class="`btn-${confirmStore.type}`" @click="confirmStore.confirm()">
            {{ confirmStore.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useConfirmStore } from '@/stores/confirm';

const confirmStore = useConfirmStore();
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.icon-container {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.icon-container svg {
  color: var(--text-secondary);
}

.modal-warning .icon-container svg {
  color: #f59e0b;
}

.modal-danger .icon-container svg {
  color: #ef4444;
}

.modal-info .icon-container svg {
  color: #3b82f6;
}

.modal-body p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--border-color);
}

.btn-confirm {
  color: white;
}

.btn-warning {
  background: #f59e0b;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-info {
  background: #3b82f6;
}

.btn-info:hover {
  background: #2563eb;
}

/* Animation de la modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}
</style>
