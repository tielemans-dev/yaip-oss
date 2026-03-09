import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    watch: false,
    globals: false,
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
})
