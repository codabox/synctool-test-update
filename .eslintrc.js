module.exports = {
    env: {
        browser: true,
        node: true,
    },
    extends: [
        'standard',
        'plugin:vue/vue3-recommended',
    ],
    parserOptions: {
        parser: '@babel/eslint-parser',
        requireConfigFile: false,
        sourceType: 'module',
    },
    plugins: [
        'babel',
        'html',
        'import',
        'vue',
    ],
    root: true,
    // Add your custom rules here
    rules: {
        indent: ['error', 4],
        'max-len': ['error', 120],
        'comma-dangle': ['error', 'always-multiline'],
        'key-spacing': ['error', { mode: 'minimum' }],
        'vue/html-indent': ['error', 4],
        'vue/name-property-casing': ['error', 'kebab-case'],
        'vue/max-attributes-per-line': ['error', {
            multiline: 1,
            singleline: 4,
        }],
        'vue/html-self-closing': ['error', {
            html: {
                void: 'never',
                normal: 'never',
                component: 'always',
            },
        }],
        'vue/order-in-components': ['error', {
            order: [
                'el',
                'name',
                'parent',
                'extends',
                'mixins',
                'functional',
                ['props', 'propsData'],
                ['delimiters', 'comments'],
                ['components', 'directives', 'filters'],
                'inheritAttrs',
                'model',
                'data',
                'computed',
                'watch',
                'LIFECYCLE_HOOKS',
                'methods',
                ['template', 'render'],
                'renderError',
            ],
        }],
        'vue/component-definition-name-casing': 'off',
        'vue/no-mutating-props': 'off',
        'vue/no-multiple-template-root': 'off',
    },
}
