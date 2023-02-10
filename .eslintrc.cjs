module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: 'standard',
    overrides: [
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        indent: ['error', 4],
        'comma-dangle': ['error',
            {
                objects: 'always',
                arrays: 'never',
                imports: 'never',
                exports: 'never',
                functions: 'never',
            }
        ],
    },
}
