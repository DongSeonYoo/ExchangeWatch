require('dotenv').config({ path: '.env.test' });

module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '**/__test__/**/*.spec.ts',
        '!**/__test__/integration/**/*.spec.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/test/unit/setup.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      moduleFileExtensions: ['js', 'json', 'ts'],
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      globalSetup: '<rootDir>/test/integration/utils/global-setup.util.ts',
      globalTeardown:
        '<rootDir>/test/integration/utils/global-teardown.util.ts',
      displayName: 'integration',
      testMatch: ['**/__test__/integration/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/integration/setup.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      moduleFileExtensions: ['js', 'json', 'ts'],
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};
