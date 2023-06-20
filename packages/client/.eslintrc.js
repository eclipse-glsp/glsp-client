/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: '../../.eslintrc.js',
    rules: {
        'no-restricted-imports': [
            'warn',
            {
                name: 'sprotty',
                message: "Please use '~glsp-sprotty' instead"
            },
            {
                name: 'sprotty/*',
                message: "Please use '~glsp-sprotty' instead"
            },
            {
                name: 'sprotty-protocol',
                message: "Please use '~glsp-sprotty' instead"
            },
            {
                name: 'sprotty-protocol/*',
                message: "Please use '~glsp-sprotty' instead"
            },
            {
                name: '@eclipse-glsp/protocol',
                message: "Please use '~glsp-sprotty' instead"
            },
            {
                name: '@eclipse-glsp/protocol/*',
                message: "Please use '~glsp-sprotty' instead"
            }
        ],
        'import/no-unresolved': ['error', { ignore: ['~glsp-sprotty'] }]
    }
};
