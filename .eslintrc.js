module.exports = {
    extends: "standard",
    rules: {
        semi: ["error", "always"],
        indent: "off",
        quotes: "off",
        "space-before-function-paren": ["error", {
            anonymous: "always",
            named: "never",
            asyncArrow: "always"
        }],
        // Weird errors saying bootstrap is undefined, when it is not...
        "no-undef": "off",
        "no-new": "off"
    }
};
