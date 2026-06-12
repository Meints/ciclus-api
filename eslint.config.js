import eslintConfigPrettier from "eslint-config-prettier";

export default [
  eslintConfigPrettier,
  {
    ignores: ["generated/", "dist/", "node_modules/"],
  },
];
