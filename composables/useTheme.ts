import { computed, watch, onMounted } from "vue";
import { useCookie, useState } from "nuxt/app";

export function useTheme() {
  const isDarkMode = useState<boolean>("isDarkMode", () => false);
  const themeCookie = useCookie<boolean>("theme-preference");

  const systemPreference = computed(() => {
    if (typeof window === "undefined") return "Unknown";
    if (!window.matchMedia) return "Unknown";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "Dark" : "Light";
  });

  function toggleTheme() {

    isDarkMode.value = !isDarkMode.value;
  }

  watch(isDarkMode, (val) => {
    themeCookie.value = val;
  });

  onMounted(() => {
    if (themeCookie.value !== undefined) {
      isDarkMode.value = themeCookie.value;
    } else {
      isDarkMode.value = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      themeCookie.value = isDarkMode.value;
    }
  });

  return { isDarkMode, toggleTheme, systemPreference };
}
