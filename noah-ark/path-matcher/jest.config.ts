/* eslint-disable */
export default {
    displayName: 'noah-ark-path-matcher',

    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.spec.json',
        },
    },
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]sx?$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    coverageDirectory: '../../../coverage/libs/workspace/noah-ark/path-matcher',
    preset: '../../../../jest.preset.js',
};
