import glspConfig from '@eclipse-glsp/eslint-config';

// Relative index and src imports restricted by the shared @eclipse-glsp/eslint-config.
// Must be included in every `no-restricted-imports` override since flat config replaces the entire rule value.
const restrictedBaseImports = ['..', '../index', '../..', '../../index', 'src'];

export default [
    ...glspConfig,
    // Ignore JS/MJS/CJS config/build files and scripts directory
    { ignores: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/scripts/'] },
    // TypeScript parser options
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.eslint.json',
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    // Disable @typescript-eslint/no-unused-expressions (chai-friendly rule handles this)
    {
        files: ['**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off'
        }
    },
    // Disable import-x/namespace for test files (sinon namespace not resolved correctly)
    {
        files: ['**/*.spec.{ts,tsx}'],
        rules: {
            'import-x/namespace': 'off'
        }
    },
    // Default rules for all TS files
    {
        files: ['**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'warn',
                ...restrictedBaseImports,
                {
                    name: 'sprotty',
                    message: "The sprotty default exports are customized and reexported by GLSP. Please use '@eclipse-glsp/client' instead"
                },
                {
                    name: 'sprotty-protocol',
                    message:
                        "The sprotty-protocol default exports are customized and reexported by GLSP. Please use '@eclipse-glsp/client' instead"
                }
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'none',
                    caughtErrors: 'none',
                    varsIgnorePattern: 'svg|html'
                }
            ]
        }
    },
    // packages/protocol: restrict sprotty and circular @eclipse-glsp/client imports
    {
        files: ['packages/protocol/src/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'warn',
                ...restrictedBaseImports,
                {
                    name: 'sprotty',
                    message: "The protocol package should not have any direct 'sprotty' dependencies. Try to use 'sprotty-protocol' instead"
                },
                {
                    name: 'sprotty/*',
                    message: "The protocol package should not have any direct 'sprotty' dependencies. Try to use 'sprotty-protocol' instead"
                },
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
    },
    // packages/glsp-sprotty: restrict sprotty-protocol direct imports
    {
        files: ['packages/glsp-sprotty/src/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'warn',
                ...restrictedBaseImports,
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
    },
    // packages/client: restrict direct sprotty/sprotty-protocol/@eclipse-glsp/protocol imports
    {
        files: ['packages/client/src/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'warn',
                ...restrictedBaseImports,
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
    }
];
