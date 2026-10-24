module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }] },
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
};
