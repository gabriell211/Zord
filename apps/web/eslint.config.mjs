import { defineConfig, globalIgnores } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

export default defineConfig([
    { ...eslint.configs.recommended, files: ["**/*.{js,mjs,cjs}"] },
    ...tseslint.configs.recommended,
    nextPlugin.configs["core-web-vitals"],
    {
        files: ["**/*.{ts,tsx,js,mjs}"],
        rules: {
            "no-warning-comments": [
                "error",
                { terms: ["FIXME", "TODO", "HACK"], location: "start" },
            ],
            "@typescript-eslint/no-explicit-any": "error",
        },
    },
    globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);
