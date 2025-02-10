// 테스트 시 환경변수를 사용하려면 아래 주석을 해제하고 .env.test 임포트
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
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      moduleFileExtensions: ['js', 'json', 'ts'],
      moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
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
