<template>
  <section class="demo-section terminal-section">
    <h2>Terminal Component</h2>
    <p class="terminal-note">
      The terminal maintains its dark appearance for optimal readability in both themes.
    </p>
    <div class="terminal-wrapper">
      <TerminalDisplay />
    </div>
  </section>
</template>

<script setup lang="ts">
import TerminalDisplay from "~/components/terminal/TerminalDisplay.vue";
</script>
