<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Create New Terminal</h3>
        <AppButton
          icon="i-heroicons-x-mark"
          variant="secondary"
          size="sm"
          @click="closeModal"
        />
      </div>

      <div class="modal-body">
        <!-- Terminal Name -->
        <div class="form-group">
          <label for="terminal-name" class="form-label">Terminal Name *</label>
          <input
            id="terminal-name"
            v-model="form.name"
            type="text"
            class="form-input"
            :class="{ 'form-input--error': nameError }"
            placeholder="e.g., Feature Development"
            :disabled="isCreating"
          >
          <div v-if="nameError" class="form-error">
            {{ nameError }}
          </div>
        </div>

        <!-- Simple creation for Phase 2A - Git integration will be added in Phase 2B -->
        <div class="form-group">
          <p class="form-help-text">
            Phase 2A: Simple terminal creation. Git integration will be added in Phase 2B.
          </p>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div class="modal-footer">
        <AppButton
          variant="secondary"
          :disabled="isCreating"
          @click="closeModal"
        >
          Cancel
        </AppButton>
        <AppButton
          variant="primary"
          :loading="isCreating"
          :disabled="!canCreate"
          @click="createTerminal"
        >
          Create Terminal
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useTerminalManagerStore } from "~/stores/terminalManager";
import { logger } from "~/utils/logger";
import AppButton from "~/components/ui/AppButton.vue";

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "terminalCreated", terminalId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const terminalStore = useTerminalManagerStore();

// Modal state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Form state - simplified for Phase 2A
const form = ref({
  name: "",
});

const isCreating = ref(false);
const error = ref("");

// Computed properties - simplified for Phase 2A
const isNameTaken = computed(() => {
  if (!form.value.name.trim()) return false;
  return terminalStore.isTerminalNameTaken(form.value.name);
});

const nameError = computed(() => {
  if (!form.value.name.trim()) return "";
  if (isNameTaken.value) return `Terminal name "${form.value.name}" is already in use`;
  return "";
});

const canCreate = computed(() => {
  const hasName = form.value.name.trim() !== "";
  const nameIsValid = hasName && !isNameTaken.value;
  return nameIsValid && !isCreating.value && terminalStore.canCreateTerminal;
});

// Methods - simplified for Phase 2A
const resetForm = () => {
  form.value = {
    name: "",
  };
  error.value = "";
};

const closeModal = () => {
  isOpen.value = false;
  resetForm();
};

// Phase 2B: WebSocket-enabled terminal creation with real connections

const createTerminal = async () => {
  if (!canCreate.value) return;

  isCreating.value = true;
  error.value = "";

  try {
    // Phase 2B: Create terminal with WebSocket connection
    const terminalId = await terminalStore.createTerminalWithWebSocket({
      name: form.value.name.trim()
    });

    // Set the new terminal as active
    terminalStore.setActiveTerminal(terminalId);

    emit("terminalCreated", terminalId);
    closeModal();

    logger.info("Terminal with WebSocket created successfully", { terminalId, name: form.value.name });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to create terminal";
    logger.error("Failed to create terminal", { error: err });
  } finally {
    isCreating.value = false;
  }
};

// Phase 2A: Simplified lifecycle - no complex watchers needed
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.modal-body {
  padding: var(--spacing-lg);
  max-height: 60vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-input:disabled {
  background-color: var(--color-muted);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.form-input--error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px var(--color-danger-light);
}

.form-error {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  margin-top: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.form-help-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  padding: var(--spacing-sm);
  background-color: var(--color-surface-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.error-message {
  background-color: var(--color-danger-light);
  color: var(--color-danger-dark);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
  border: 1px solid var(--color-danger);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: var(--spacing-sm);
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: var(--spacing-md);
  }
}
</style>