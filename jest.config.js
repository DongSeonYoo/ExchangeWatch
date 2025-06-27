require('dotenv').config({ path: '.env.test' });

module.exports = {
  roots: ['<rootDir>'],
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '**/__test__/**/*.spec.ts',
        '!**/__test__/integration/**/*.spec.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/test/unit/setup.ts'],
      testEnvironment: 'node',
      transform: { '^.+\\.(t|j)s$': 'ts-jest' },
      moduleFileExtensions: ['js', 'json', 'ts'],
      moduleNameMapper: { '^src/(.*)$': '<rootDir>/src/$1' },
    },
    {
      displayName: 'integration',
      testMatch: ['**/__test__/integration/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/integration/setup.ts'],
      testEnvironment: 'node',
      globalSetup: '<rootDir>/test/integration/global-setup.ts',
      globalTeardown: '<rootDir>/test/integration/global-teardown.ts',
      transform: { '^.+\\.(t|j)s$': 'ts-jest' },
      moduleFileExtensions: ['js', 'json', 'ts'],
      moduleNameMapper: { '^src/(.*)$': '<rootDir>/src/$1' },
    },
  ],
};
