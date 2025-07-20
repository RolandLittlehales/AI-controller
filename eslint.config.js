import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    // TypeScript recommended rules
    "@typescript-eslint/no-unused-vars": ["error", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
    }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-empty-function": "warn",
    "@typescript-eslint/ban-ts-comment": ["error", {
      "ts-expect-error": "allow-with-description",
      "ts-ignore": false,
      "ts-nocheck": false,
      "ts-check": false,
    }],

    // Vue 3 essential rules
    "vue/multi-word-component-names": "off",
    "vue/require-default-prop": "error",
    "vue/require-prop-types": "error",
    "vue/no-v-html": "warn",
    "vue/component-api-style": ["error", ["script-setup", "composition"]],
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/prop-name-casing": ["error", "camelCase"],
    "vue/require-explicit-emits": "error",

    // General JavaScript rules
    "no-console": "error",
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
    "comma-dangle": ["error", "always-multiline"],
    "no-trailing-spaces": "error",
    "no-unused-expressions": "error",
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": ["error", { functions: false }],

    // Array destructuring pattern enforcement
    "prefer-destructuring": ["warn", {
      array: false,
      object: true,
    }, {
      enforceForRenamedProperties: false,
    }],
    // Prettier will handle these, but we'll enforce them via ESLint too
    "quotes": ["error", "double", { avoidEscape: true }],
    "semi": ["error", "always"],
    "indent": ["error", 2, { SwitchCase: 1 }],
    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "never"],
    "comma-spacing": ["error", { before: false, after: true }],
    "key-spacing": ["error", { beforeColon: false, afterColon: true }],
    "arrow-spacing": ["error", { before: true, after: true }],
    "space-before-function-paren": ["error", {
      anonymous: "always",
      named: "never",
      asyncArrow: "always",
    }],
    "space-in-parens": ["error", "never"],
    "template-curly-spacing": ["error", "never"],
  },
});