/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: '@eclipse-glsp',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.json'
    },
    rules: {
        'no-restricted-imports': [
            'warn',
            {
                name: 'sprotty',
                message: "The protocol package should not have any direct 'sprotty' dependencies. Try to use 'sprotty-protocol' instead"
            },
            {
                name: 'sprotty/*',
                message: "The protocol package should not have any direct 'sprotty' dependencies. Try to use 'sprotty-protocol' instead"
            },
            'error',
            {
                name: '@eclipse-glsp/client',
                message:
                    "Circular dependency! This package is consumed by '@eclipse-glsp' client. Consider moving the conflicting file into this package."
            },
            {
                name: '@eclipse-glsp/client/*',
                message:
                    "Circular dependency! This package is consumed by '@eclipse-glsp' client. Consider moving the conflicting file into this package."
            }
        ]
    }
};
