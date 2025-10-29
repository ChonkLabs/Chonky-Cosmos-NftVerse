import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSaleConfiguration,
  formatPriceWithDecimals,
  getChainConfig,
} from '../../../utils/primarySales/helpers';

// Mock dependencies
vi.mock('@0xsequence/kit', () => ({
  getDefaultChains: vi.fn((chainIds: number[]) =>
    chainIds.map((id) => ({
      id,
      name: `chain-${id}`,
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    }))
  ),
}));

vi.mock('../../../salesConfigs', () => ({
  salesConfigs: [
    {
      nftTokenAddress: '0x1234567890123456789012345678901234567890',
      salesContractAddress: '0x0987654321098765432109876543210987654321',
      chainId: 80002,
    },
    {
      nftTokenAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      salesContractAddress: '0xfedcbafedcbafedcbafedcbafedcbafedcbafed',
      chainId: 137,
    },
  ],
  defaultChainId: 80002,
}));

describe('primarySales helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSaleConfiguration', () => {
    it('should return configuration for existing chainId', () => {
      const config = getSaleConfiguration(80002);

      expect(config).toBeDefined();
      expect(config.chainId).toBe(80002);
      expect(config.nftTokenAddress).toBe(
        '0x1234567890123456789012345678901234567890'
      );
      expect(config.salesContractAddress).toBe(
        '0x0987654321098765432109876543210987654321'
      );
      expect(config.networkName).toBe('chain-80002');
    });

    it('should return default configuration for undefined chainId', () => {
      const config = getSaleConfiguration(undefined);

      expect(config).toBeDefined();
      expect(config.chainId).toBe(80002);
    });

    it('should return default configuration for non-existent chainId', () => {
      const config = getSaleConfiguration(999999);

      expect(config).toBeDefined();
      expect(config.chainId).toBe(80002); // default
    });

    it('should return configuration for Polygon chainId', () => {
      const config = getSaleConfiguration(137);

      expect(config).toBeDefined();
      expect(config.chainId).toBe(137);
      expect(config.nftTokenAddress).toBe(
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      );
    });

    it('should include all required properties', () => {
      const config = getSaleConfiguration(80002);

      expect(config).toHaveProperty('networkName');
      expect(config).toHaveProperty('nftTokenAddress');
      expect(config).toHaveProperty('salesContractAddress');
      expect(config).toHaveProperty('chainId');
    });
  });

  describe('formatPriceWithDecimals', () => {
    it('should format whole numbers correctly', () => {
      const price = BigInt('1000000000000000000'); // 1 ETH in wei
      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('1');
    });

    it('should format decimal values correctly', () => {
      const price = BigInt('1500000000000000000'); // 1.5 ETH in wei
      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('1.5');
    });

    it('should handle zero value', () => {
      const price = BigInt(0);
      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('0');
    });

    it('should format small decimals correctly', () => {
      const price = BigInt('100000000000000'); // 0.0001 ETH
      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('0.0001');
    });

    it('should strip trailing zeros', () => {
      const price = BigInt('1000000000000000000'); // 1.0 ETH
      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('1');
      expect(formatted).not.toContain('.');
    });

    it('should handle USDC (6 decimals)', () => {
      const price = BigInt('1000000'); // 1 USDC
      const formatted = formatPriceWithDecimals(price, 6);

      expect(formatted).toBe('1');
    });

    it('should handle USDC decimal values', () => {
      const price = BigInt('1500000'); // 1.5 USDC
      const formatted = formatPriceWithDecimals(price, 6);

      expect(formatted).toBe('1.5');
    });

    it('should handle very large values', () => {
      const price = BigInt('1000000000000000000000000'); // 1M ETH
      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('1000000');
    });

    it('should handle values less than 1', () => {
      const price = BigInt('500000000000000000'); // 0.5 ETH
      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('0.5');
    });

    it('should pad decimals when needed', () => {
      const price = BigInt('1'); // 0.000000000000000001 ETH
      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('0.000000000000000001');
    });

    it('should handle different decimal places', () => {
      const testCases = [
        { price: BigInt('1000000'), decimals: 6, expected: '1' },
        { price: BigInt('1000000000'), decimals: 9, expected: '1' },
        { price: BigInt('100000000'), decimals: 8, expected: '1' },
      ];

      testCases.forEach(({ price, decimals, expected }) => {
        const formatted = formatPriceWithDecimals(price, decimals);
        expect(formatted).toBe(expected);
      });
    });

    it('should handle complex decimal values', () => {
      const price = BigInt('123456789012345678'); // 0.123456789012345678 ETH
      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('0.123456789012345678');
    });

    it('should correctly format when decimal part has trailing zeros', () => {
      const price = BigInt('1100000000000000000'); // 1.1 ETH
      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('1.1');
    });
  });

  describe('getChainConfig', () => {
    it('should return chain config for valid chainId', () => {
      const config = getChainConfig(80002);

      expect(config).toBeDefined();
      expect(config.id).toBe(80002);
      expect(config.name).toBe('chain-80002');
    });

    it('should return chain with native currency info', () => {
      const config = getChainConfig(137);

      expect(config).toHaveProperty('nativeCurrency');
      expect(config.nativeCurrency).toHaveProperty('name');
      expect(config.nativeCurrency).toHaveProperty('symbol');
      expect(config.nativeCurrency).toHaveProperty('decimals');
    });

    it('should handle multiple different chains', () => {
      const chainIds = [80002, 137];

      chainIds.forEach((chainId) => {
        const config = getChainConfig(chainId);
        expect(config.id).toBe(chainId);
      });
    });
  });

  describe('integration tests', () => {
    it('should format prices for sale configuration currency', () => {
      const config = getSaleConfiguration(80002);
      const price = BigInt('2500000000000000000'); // 2.5 ETH

      const formatted = formatPriceWithDecimals(price, 18);

      expect(formatted).toBe('2.5');
      expect(config.chainId).toBe(80002);
    });

    it('should work with all configured chains', () => {
      const chainIds = [80002, 137];

      chainIds.forEach((chainId) => {
        const saleConfig = getSaleConfiguration(chainId);
        const chainConfig = getChainConfig(chainId);

        expect(saleConfig.chainId).toBe(chainConfig.id);
      });
    });
  });
});