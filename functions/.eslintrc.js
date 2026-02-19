module.exports = {
  root: true,
  env: {
    node: true,   // 👈 this is the important part
    es2021: true,
  },
  extends: ["eslint:recommended", "google"],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "script",
  },
  rules: {
    "require-jsdoc": "off",
    "no-new-wrappers": "off",
    quotes: ["error", "double", { allowTemplateLiterals: true }],
  },
};
