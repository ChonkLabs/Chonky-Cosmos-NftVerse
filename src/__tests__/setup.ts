import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_PROJECT_ACCESS_KEY: 'test-access-key',
    VITE_PROJECT_ID: '12345',
  },
}));

// Add custom matchers
expect.extend({});