import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dotenv
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

describe('getBodyAndKeys', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('successful configuration', () => {
    it('should return valid keys and body with all env vars set', async () => {
      process.env.VITE_PROJECT_ID = '12345';
      process.env.JWT_ACCESS_KEY = 'test-jwt-key';
      process.env.VITE_PROJECT_ACCESS_KEY = 'test-access-key';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;
      const result = getBodyAndKeys();

      expect(result).toHaveProperty('keys');
      expect(result).toHaveProperty('body');
      expect(result.keys.projectId).toBe(12345);
      expect(result.keys.jwtAccessKey).toBe('test-jwt-key');
      expect(result.keys.projectAccessKey).toBe('test-access-key');
      expect(result.body.quantity).toBe(10);
      expect(result.body.collectionId).toBe(892189);
    });

    it('should parse projectId as number', async () => {
      process.env.VITE_PROJECT_ID = '99999';
      process.env.JWT_ACCESS_KEY = 'jwt';
      process.env.VITE_PROJECT_ACCESS_KEY = 'access';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;
      const result = getBodyAndKeys();

      expect(typeof result.keys.projectId).toBe('number');
      expect(result.keys.projectId).toBe(99999);
    });

    it('should have default body values', async () => {
      process.env.VITE_PROJECT_ID = '12345';
      process.env.JWT_ACCESS_KEY = 'jwt';
      process.env.VITE_PROJECT_ACCESS_KEY = 'access';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;
      const result = getBodyAndKeys();

      expect(result.body.quantity).toBe(10);
      expect(result.body.collectionId).toBe(892189);
    });
  });

  describe('error handling', () => {
    it('should throw error when VITE_PROJECT_ID is missing', async () => {
      delete process.env.VITE_PROJECT_ID;
      process.env.JWT_ACCESS_KEY = 'jwt';
      process.env.VITE_PROJECT_ACCESS_KEY = 'access';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;

      expect(() => getBodyAndKeys()).toThrow('Missing project id');
    });

    it('should throw error when JWT_ACCESS_KEY is missing', async () => {
      process.env.VITE_PROJECT_ID = '12345';
      delete process.env.JWT_ACCESS_KEY;
      process.env.VITE_PROJECT_ACCESS_KEY = 'access';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;

      expect(() => getBodyAndKeys()).toThrow('Missing jwt access key');
    });

    it('should throw error when VITE_PROJECT_ACCESS_KEY is missing', async () => {
      process.env.VITE_PROJECT_ID = '12345';
      process.env.JWT_ACCESS_KEY = 'jwt';
      delete process.env.VITE_PROJECT_ACCESS_KEY;

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;

      expect(() => getBodyAndKeys()).toThrow('Missing project access key');
    });

    it('should handle invalid project ID format', async () => {
      process.env.VITE_PROJECT_ID = 'invalid';
      process.env.JWT_ACCESS_KEY = 'jwt';
      process.env.VITE_PROJECT_ACCESS_KEY = 'access';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;
      const result = getBodyAndKeys();

      expect(isNaN(result.keys.projectId as any)).toBe(true);
    });
  });

  describe('keys structure', () => {
    it('should return keys with correct structure', async () => {
      process.env.VITE_PROJECT_ID = '12345';
      process.env.JWT_ACCESS_KEY = 'jwt';
      process.env.VITE_PROJECT_ACCESS_KEY = 'access';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;
      const result = getBodyAndKeys();

      expect(result.keys).toHaveProperty('projectId');
      expect(result.keys).toHaveProperty('jwtAccessKey');
      expect(result.keys).toHaveProperty('projectAccessKey');
    });

    it('should return body with correct structure', async () => {
      process.env.VITE_PROJECT_ID = '12345';
      process.env.JWT_ACCESS_KEY = 'jwt';
      process.env.VITE_PROJECT_ACCESS_KEY = 'access';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;
      const result = getBodyAndKeys();

      expect(result.body).toHaveProperty('quantity');
      expect(result.body).toHaveProperty('collectionId');
      expect(typeof result.body.quantity).toBe('number');
      expect(typeof result.body.collectionId).toBe('number');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string project ID', async () => {
      process.env.VITE_PROJECT_ID = '';
      process.env.JWT_ACCESS_KEY = 'jwt';
      process.env.VITE_PROJECT_ACCESS_KEY = 'access';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;

      expect(() => getBodyAndKeys()).toThrow('Missing project id');
    });

    it('should handle whitespace in env vars', async () => {
      process.env.VITE_PROJECT_ID = '  12345  ';
      process.env.JWT_ACCESS_KEY = '  jwt  ';
      process.env.VITE_PROJECT_ACCESS_KEY = '  access  ';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;
      const result = getBodyAndKeys();

      // Note: Number() trims whitespace, but strings don't
      expect(result.keys.projectId).toBe(12345);
      expect(result.keys.jwtAccessKey).toBe('  jwt  ');
    });

    it('should handle very large project IDs', async () => {
      process.env.VITE_PROJECT_ID = '999999999999';
      process.env.JWT_ACCESS_KEY = 'jwt';
      process.env.VITE_PROJECT_ACCESS_KEY = 'access';

      const getBodyAndKeys = (await import('../../utils/getBodyAndKeys')).default;
      const result = getBodyAndKeys();

      expect(result.keys.projectId).toBe(999999999999);
    });
  });
});