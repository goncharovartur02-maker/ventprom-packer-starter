module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'packages/**/*.ts',
    'apps/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  moduleNameMapping: {
    '^@core/(.*)$': '<rootDir>/packages/core/src/$1',
    '^@parsers/(.*)$': '<rootDir>/packages/parsers/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.js'],
};

