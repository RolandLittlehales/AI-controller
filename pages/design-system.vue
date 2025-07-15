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
          <h3>Button Styles</h3>
          <div class="buttons-container">
            <UButton 
              color="primary" 
              size="sm"
              data-testid="primary-button"
            >
              Primary Button
            </UButton>
            <UButton 
              color="gray" 
              size="sm"
              data-testid="secondary-button"
            >
              Secondary Button
            </UButton>
          </div>
        </section>
      </div>

      <section class="test-card colors-demo">
        <h3>Color Palette</h3>
        <div class="colors-grid">
          <div 
            v-for="shade in colorShades" 
            :key="shade"
            class="color-swatch"
            :class="`color-${shade}`"
            :data-testid="`color-swatch-${shade}`"
          >
            {{ shade }}
          </div>
        </div>
      </section>

      <section class="test-card terminal-demo">
        <h3>Terminal Component</h3>
        <div class="terminal-showcase">
          <Terminal :auto-connect="false" />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import Terminal from '~/components/Terminal.vue'

// Design system page for showcasing CSS variables and components

// Color shades for demo
const colorShades = ['50', '100', '200', '400', '600', '700', '800', '900']
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
.buttons-container {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
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

/* Terminal Demo */
.terminal-showcase {
  height: 400px;
}
</style>