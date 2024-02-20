/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: '../../.eslintrc.js',
    rules: {
        'no-restricted-imports': [
            'warn',
            {
                name: 'sprotty-protocol',
                message: 'Please use @eclipse-glsp/sprotty instead'
            },
            {
                name: 'sprotty-protocol/*',
                message: "Please use '@eclipse-glsp/protocol' instead"
            }
        ]
    }
};
