/// <reference types="vitest/config" />
import { join, resolve } from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

const dirname = import.meta.dirname;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
    plugins: [react(), dts({ bundleTypes: true })],
    resolve: {
        alias: {
            "@": resolve(dirname, "src"),
        },
    },
    css: {},
    build: {
        lib: {
            entry: resolve(dirname, "src/index.ts"),
            formats: ["es"],
            fileName: "index",
            cssFileName: "style",
        },
        rolldownOptions: {
            external: ["react", "react-dom", "react/jsx-runtime"],
        },
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    include: ["src/**/*.test.{ts,tsx}"],
                },
            },
            {
                extends: true,
                plugins: [
                    // The plugin will run tests for the stories defined in your Storybook config
                    // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
                    storybookTest({
                        configDir: join(dirname, ".storybook"),
                    }),
                ],
                test: {
                    name: "storybook",
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright({}),
                        instances: [
                            {
                                browser: "chromium",
                            },
                        ],
                    },
                    setupFiles: [".storybook/vitest.setup.ts"],
                },
            },
        ],
    },
});
