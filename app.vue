<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
// Global styles imported via nuxt.config.ts

// Basic head setup
useHead({
  title: 'AI Agent Manager',
  meta: [
    { name: 'description', content: 'A powerful web application for managing multiple terminal-based AI instances' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ]
})
</script>