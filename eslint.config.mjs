import glspConfig from '@eclipse-glsp/eslint-config';

// Relative index and src imports restricted by the shared @eclipse-glsp/eslint-config.
// Must be included in every `no-restricted-imports` override since flat config replaces the entire rule value.
const restrictedBaseImports = ['..', '../index', '../..', '../../index', 'src'];

export default [
    ...glspConfig,
    // Ignore JS/MJS/CJS config/build files, scripts directory and local git worktrees
    { ignores: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/scripts/', '.worktrees/'] },
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
                },
                {
                    name: 'uuid',
                    message: "Use the 'generateUuid'/'isUuid' helpers (from '@eclipse-glsp/protocol') instead of importing 'uuid' directly."
                },
                {
                    name: 'uuid/*',
                    message: "Use the 'generateUuid'/'isUuid' helpers (from '@eclipse-glsp/protocol') instead of importing 'uuid' directly."
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
    // packages/protocol: restrict sprotty and uuid direct imports
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
                    name: 'uuid',
                    message:
                        "Use the 'generateUuid'/'isUuid' helpers (from this package's 'utils/uuid' module) instead of importing 'uuid' directly."
                },
                {
                    name: 'uuid/*',
                    message:
                        "Use the 'generateUuid'/'isUuid' helpers (from this package's 'utils/uuid' module) instead of importing 'uuid' directly."
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
                },
                {
                    name: 'uuid',
                    message: "Use the 'generateUuid'/'isUuid' helpers (from '@eclipse-glsp/protocol') instead of importing 'uuid' directly."
                },
                {
                    name: 'uuid/*',
                    message: "Use the 'generateUuid'/'isUuid' helpers (from '@eclipse-glsp/protocol') instead of importing 'uuid' directly."
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
                },
                {
                    name: 'uuid',
                    message: "Use the 'generateUuid'/'isUuid' helpers (from '@eclipse-glsp/sprotty') instead of importing 'uuid' directly."
                },
                {
                    name: 'uuid/*',
                    message: "Use the 'generateUuid'/'isUuid' helpers (from '@eclipse-glsp/sprotty') instead of importing 'uuid' directly."
                }
            ]
        }
    },
    // examples: only consume the public '@eclipse-glsp/client' API; the lower layers
    // (protocol, sprotty, raw sprotty/sprotty-protocol) are re-exported through it.
    {
        files: ['examples/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'warn',
                ...restrictedBaseImports,
                {
                    name: 'sprotty',
                    message: 'Please use @eclipse-glsp/client instead'
                },
                {
                    name: 'sprotty/*',
                    message: 'Please use @eclipse-glsp/client instead'
                },
                {
                    name: 'sprotty-protocol',
                    message: 'Please use @eclipse-glsp/client instead'
                },
                {
                    name: 'sprotty-protocol/*',
                    message: 'Please use @eclipse-glsp/client instead'
                },
                {
                    name: '@eclipse-glsp/protocol',
                    message: 'Please use @eclipse-glsp/client instead'
                },
                {
                    name: '@eclipse-glsp/protocol/*',
                    message: 'Please use @eclipse-glsp/client instead'
                },
                {
                    name: '@eclipse-glsp/sprotty',
                    message: 'Please use @eclipse-glsp/client instead'
                },
                {
                    name: '@eclipse-glsp/sprotty/*',
                    message: 'Please use @eclipse-glsp/client instead'
                },
                {
                    name: 'uuid',
                    message: "Use the 'generateUuid'/'isUuid' helpers (from '@eclipse-glsp/client') instead of importing 'uuid' directly."
                },
                {
                    name: 'uuid/*',
                    message: "Use the 'generateUuid'/'isUuid' helpers (from '@eclipse-glsp/client') instead of importing 'uuid' directly."
                }
            ]
        }
    }
];
