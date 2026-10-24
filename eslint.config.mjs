import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const eslintConfig = [
  { ignores: [".next/**", "coverage/**", "graphify-out/**", "artifacts/**", "next-env.d.ts", "mobile/android-poc/android/**/build/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
