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
                name: 'sprotty-protocol',
                message: "Please use '@eclipse-glsp/protocol' instead"
            },
            {
                name: 'sprotty-protocol/*',
                message: "Please use '@eclipse-glsp/protocol' instead"
            }
        ]
    }
};
