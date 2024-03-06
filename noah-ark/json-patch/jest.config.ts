/* eslint-disable */
export default {
    displayName: 'noah-ark-json-patch',

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
    coverageDirectory: '../../../coverage/libs/workspace/noah-ark/json-patch',
    preset: '../../../jest.preset.js',
};
