module.exports = {
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'vue'],
    transform: {
        '^.+\\.vue$': 'vue-jest',
        '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
        '^.+\\.(j|t)sx?$': 'babel-jest',
    },
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    snapshotSerializers: ['jest-serializer-vue'],
    testMatch: [
        '**/tests/unit/**/*.spec.(js|jsx|ts|tsx)',
        '**/__tests__/*.(js|jsx|ts|tsx)',
    ],
    testURL: 'http://localhost/',
    watchPlugins: [
        'jest-watch-typeahead/filename',
        'jest-watch-typeahead/testname',
    ],
};
