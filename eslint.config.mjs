import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "infra/**/*.js",
      "infra/**/*.d.ts",
      "infra/cdk.out/**",
      "next-env.d.ts",
      "public/sw.js",
    ],
  },
];

export default eslintConfig;
