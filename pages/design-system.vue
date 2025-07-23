<template>
  <div class="design-system">
    <header class="design-header">
      <h1 class="design-title">Design System</h1>
      <p class="design-subtitle">CSS Variables & Component Library</p>
    </header>

    <main class="design-main">
      <div class="test-grid">
        <section class="test-card typography-demo">
          <h3>Typography Scale</h3>
          <h1 class="demo-h1">Heading 1 (4xl)</h1>
          <h2 class="demo-h2">Heading 2 (2xl)</h2>
          <h3 class="demo-h3">Heading 3 (xl)</h3>
          <p class="demo-body">Body text (base size)</p>
          <p class="demo-small">Small text (sm)</p>
          <p class="demo-tiny">Tiny text (xs)</p>
        </section>

        <section class="test-card spacing-demo">
          <h3>Spacing Scale</h3>
          <div class="spacing-xs">XS spacing (4px)</div>
          <div class="spacing-sm">SM spacing (8px)</div>
          <div class="spacing-md">MD spacing (12px)</div>
          <div class="spacing-lg">LG spacing (16px)</div>
          <div class="spacing-xl">XL spacing (24px)</div>
        </section>

        <section class="test-card radius-demo">
          <h3>Border Radius</h3>
          <div class="radius-sm">Small radius (4px)</div>
          <div class="radius-md">Medium radius (6px)</div>
          <div class="radius-lg">Large radius (8px)</div>
          <div class="radius-xl">XL radius (12px)</div>
          <div class="radius-2xl">2XL radius (16px)</div>
        </section>

        <section class="test-card buttons-demo">
          <h3>Button Components</h3>

          <!-- Size Variants -->
          <div class="buttons-container">
            <h4>Sizes</h4>
            <AppButton
              v-for="button in BUTTON_SIZES"
              :key="button.size"
              :size="button.size"
              variant="primary"
            >
              {{ button.label }}
            </AppButton>
          </div>

          <!-- Variant Types -->
          <div class="buttons-container">
            <h4>Variants</h4>
            <AppButton
              v-for="button in BUTTON_VARIANTS"
              :key="button.variant"
              :variant="button.variant"
            >
              {{ button.label }}
            </AppButton>
          </div>

          <!-- With Icons -->
          <div class="buttons-container">
            <h4>With Icons</h4>
            <AppButton
              v-for="button in ICON_BUTTONS"
              :key="button.icon"
              :icon="button.icon"
              :variant="button.variant"
              size="sm"
            >
              {{ button.label }}
            </AppButton>
            <AppButton
              variant="primary"
              trailing-icon="i-heroicons-arrow-right"
              size="sm"
            >
              Next
            </AppButton>
          </div>

          <!-- Icon Only -->
          <div class="buttons-container">
            <h4>Icon Only</h4>
            <AppButton
              v-for="(button, index) in ICON_ONLY_BUTTONS"
              :key="`icon-only-${index}`"
              :icon="button.icon"
              :variant="button.variant"
              :size="button.size"
            />
          </div>

          <!-- States -->
          <div class="buttons-container">
            <h4>States</h4>
            <AppButton variant="primary" size="sm" loading>Loading</AppButton>
            <AppButton variant="secondary" size="sm" disabled>Disabled</AppButton>
            <AppButton variant="primary" size="sm" block>Block Button</AppButton>
          </div>
        </section>

        <!-- Modal Component Demo -->
        <section class="test-card modals-demo">
          <h3>Modal Components</h3>

          <!-- Modal Sizes -->
          <div class="buttons-container">
            <h4>Modal Sizes</h4>
            <AppButton
              v-for="size in MODAL_SIZES"
              :key="`modal-${size.value}`"
              variant="secondary"
              size="sm"
              @click="showModal(size.value)"
            >
              {{ size.label }}
            </AppButton>
          </div>

          <!-- Confirm Dialog -->
          <div class="buttons-container">
            <h4>Confirm Dialog</h4>
            <AppButton
              variant="danger"
              size="sm"
              @click="showConfirmDialog = true"
            >
              Show Confirm Dialog
            </AppButton>
          </div>

          <!-- Modal with Icons -->
          <div class="buttons-container">
            <h4>Modal with Icon</h4>
            <AppButton
              variant="primary"
              size="sm"
              @click="showIconModal = true"
            >
              Show Icon Modal
            </AppButton>
          </div>
        </section>
      </div>

      <section class="test-card colors-demo">
        <h3>Color Palette</h3>
        <div class="colors-grid">
          <div
            v-for="shade in COLOR_SHADES"
            :key="shade"
            class="color-swatch"
            :class="`color-${shade}`"
            :data-testid="`color-swatch-${shade}`"
          >
            {{ shade }}
          </div>
        </div>
      </section>

      <section class="test-card terminal-sidebar-demo">
        <h3>Terminal Sidebar Component</h3>
        <div class="terminal-sidebar-showcase">
          <TerminalSidebar />
        </div>
      </section>

      <section class="test-card terminal-display-demo">
        <h3>Terminal Display Component</h3>
        <div class="terminal-display-showcase">
          <TerminalDisplay />
        </div>
      </section>
    </main>

    <!-- Modal Demos -->
    <AppModal
      v-for="size in MODAL_SIZES"
      :key="`modal-instance-${size.value}`"
      v-model="modalStates[size.value]"
      :title="`${size.label} Modal`"
      :size="size.value"
    >
      <p>This is a {{ size.label.toLowerCase() }} modal. It demonstrates the {{ size.value }} size variant.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>

      <template #footer>
        <AppButton variant="secondary" @click="modalStates[size.value] = false">
          Cancel
        </AppButton>
        <AppButton variant="primary" @click="modalStates[size.value] = false">
          Save Changes
        </AppButton>
      </template>
    </AppModal>

    <!-- Icon Modal -->
    <AppModal
      v-model="showIconModal"
      title="Success!"
      icon="✅"
      size="sm"
    >
      <p>Your changes have been saved successfully.</p>

      <template #footer>
        <AppButton variant="primary" @click="showIconModal = false">
          Got it
        </AppButton>
      </template>
    </AppModal>

    <!-- Confirm Dialog -->
    <AppConfirmDialog
      v-model="showConfirmDialog"
      title="Delete Item"
      message="Are you sure you want to delete this item? This action cannot be undone."
      confirm-text="Delete"
      confirm-variant="danger"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import TerminalSidebar from "~/components/terminal/TerminalSidebar.vue";
import TerminalDisplay from "~/components/terminal/TerminalDisplay.vue";
import AppButton from "~/components/ui/AppButton.vue";
import AppModal from "~/components/ui/AppModal.vue";
import AppConfirmDialog from "~/components/ui/AppConfirmDialog.vue";

// Constants
const COLOR_SHADES = ["50", "100", "200", "400", "600", "700", "800", "900"] as const;

const BUTTON_SIZES = [
  { size: "xs", label: "Extra Small" },
  { size: "sm", label: "Small" },
  { size: "md", label: "Medium" },
  { size: "lg", label: "Large" },
] as const;

const BUTTON_VARIANTS = [
  { variant: "primary", label: "Primary" },
  { variant: "secondary", label: "Secondary" },
  { variant: "danger", label: "Danger" },
] as const;

const ICON_BUTTONS = [
  { icon: "i-heroicons-plus", variant: "primary", label: "Add Item" },
  { icon: "i-heroicons-x-mark", variant: "secondary", label: "Cancel" },
  { icon: "i-heroicons-trash", variant: "danger", label: "Delete" },
] as const;

const ICON_ONLY_BUTTONS = [
  { icon: "i-heroicons-plus", variant: "primary", size: "xs" },
  { icon: "i-heroicons-x-mark", variant: "secondary", size: "sm" },
  { icon: "i-heroicons-cog-6-tooth", variant: "primary", size: "md" },
  { icon: "i-heroicons-trash", variant: "danger", size: "lg" },
] as const;

const MODAL_SIZES = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
  { value: "fullscreen", label: "Fullscreen" },
] as const;

// Modal states
const modalStates = reactive({
  sm: false,
  md: false,
  lg: false,
  xl: false,
  fullscreen: false,
});

const showIconModal = ref(false);
const showConfirmDialog = ref(false);

// Methods
const showModal = (size: string): void => {
  modalStates[size as keyof typeof modalStates] = true;
};

const handleConfirmDelete = (): void => {
  // Handle delete action
};
</script>

<style scoped>
.design-system {
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.design-header {
  padding: var(--spacing-3xl) var(--spacing-xl);
  text-align: center;
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-secondary) 100%);
  border-bottom: 1px solid var(--color-border);
}

.design-title {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-primary);
}

.design-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
}

.design-main {
  padding: var(--spacing-2xl);
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-2xl);
  margin-bottom: var(--spacing-3xl);
}

.test-card {
  background: var(--color-surface);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-light);
}

.test-card h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--color-primary);
}

/* Typography Demo */
.typography-demo .demo-h1,
.typography-demo .demo-h2,
.typography-demo .demo-h3 {
  color: var(--color-text-primary);
}

.demo-h1 {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin: var(--spacing-sm) 0;
}

.demo-h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin: var(--spacing-sm) 0;
}

.demo-h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  margin: var(--spacing-sm) 0;
}

.demo-body {
  margin: var(--spacing-sm) 0;
}

.demo-small {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: var(--spacing-sm) 0;
}

.demo-tiny {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: var(--spacing-sm) 0;
}

/* Spacing Demo */
.spacing-demo > div {
  background: var(--color-primary-light);
  margin-bottom: var(--spacing-sm);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.spacing-xs { padding: var(--spacing-xs); }
.spacing-sm { padding: var(--spacing-sm); }
.spacing-md { padding: var(--spacing-md); }
.spacing-lg { padding: var(--spacing-lg); }
.spacing-xl { padding: var(--spacing-xl); }

/* Radius Demo */
.radius-demo > div {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.radius-sm { border-radius: var(--radius-sm); }
.radius-md { border-radius: var(--radius-md); }
.radius-lg { border-radius: var(--radius-lg); }
.radius-xl { border-radius: var(--radius-xl); }
.radius-2xl { border-radius: var(--radius-2xl); }

/* Buttons Demo */
.buttons-demo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.buttons-container {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  align-items: center;
}

.buttons-container h4 {
  width: 100%;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

/* Colors Demo */
.colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--spacing-sm);
}

.color-swatch {
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}

.color-50 { background: var(--color-lavender-50); color: var(--color-text-primary); }
.color-100 { background: var(--color-lavender-100); color: var(--color-text-primary); }
.color-200 { background: var(--color-lavender-200); color: var(--color-text-primary); }
.color-400 { background: var(--color-lavender-400); color: var(--color-text-on-primary); }
.color-600 { background: var(--color-lavender-600); color: var(--color-text-on-primary); }
.color-700 { background: var(--color-lavender-700); color: var(--color-text-on-primary); }
.color-800 { background: var(--color-lavender-800); color: var(--color-text-on-primary); }
.color-900 { background: var(--color-lavender-900); color: var(--color-text-on-primary); }

/* Terminal Sidebar Demo */
.terminal-sidebar-showcase {
  height: 400px;
  display: flex;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* Terminal Display Demo */
.terminal-display-showcase {
  height: 400px;
  display: flex;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
</style>