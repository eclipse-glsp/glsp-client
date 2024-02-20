/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: '../../.eslintrc.js',
    rules: {
        'no-restricted-imports': [
            'warn',
            {
                name: 'sprotty',
                message: 'Please use @eclipse-glsp/sprotty instead'
            },
            {
                name: 'sprotty/*',
                message: 'Please use @eclipse-glsp/sprotty instead'
            },
            {
                name: 'sprotty-protocol',
                message: 'Please use @eclipse-glsp/sprotty instead'
            },
            {
                name: 'sprotty-protocol/*',
                message: 'Please use @eclipse-glsp/sprotty instead'
            },
            {
                name: '@eclipse-glsp/protocol',
                message: 'Please use @eclipse-glsp/sprotty instead'
            },
            {
                name: '@eclipse-glsp/protocol/*',
                message: 'Please use @eclipse-glsp/sprotty instead'
            }
        ]
    }
};
