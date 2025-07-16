<template>
  <section class="demo-section terminal-section">
    <h2>Terminal Component</h2>
    <p class="terminal-note">
      The terminal maintains its dark appearance for optimal readability in both themes.
    </p>
    <div class="terminal-wrapper">
      <Terminal :auto-connect="false" />
    </div>
  </section>
</template>

<script setup lang="ts">
import Terminal from "~/components/Terminal.vue";
</script>
