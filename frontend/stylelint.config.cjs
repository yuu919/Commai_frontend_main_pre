/**
 * Stylelint configuration for UI policy enforcement
 */
module.exports = {
  extends: [
    "stylelint-config-recommended",
    "stylelint-config-standard",
    "stylelint-config-tailwindcss",
  ],
  rules: {
    "color-no-hex": true,
    // Ban color-mix outside tokens.css to force tokens indirection
    "function-disallowed-list": [
      ["color-mix"],
      {
        "exceptFunctions": [],
        "message": "Use tokens instead of color-mix outside tokens.css",
      },
    ],
    "declaration-no-important": true,
    "selector-max-compound-selectors": 2,
  },
  ignoreFiles: [
    "src/styles/tokens.css", // tokens 定義は除外
  ],
};


