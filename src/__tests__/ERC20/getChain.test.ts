import { describe, it, expect } from 'vitest';
import { getChain } from '../../ERC20/getChain';

describe('getChain', () => {
  describe('finding chain by chainId', () => {
    it('should find polygon chain by chainId', () => {
      const chain = getChain(137);
      expect(chain).toBeDefined();
      expect(chain?.chainId).toBe(137);
      expect(chain?.name).toBe('polygon');
    });

    it('should find mainnet by chainId', () => {
      const chain = getChain(1);
      expect(chain).toBeDefined();
      expect(chain?.chainId).toBe(1);
      expect(chain?.name).toBe('mainnet');
    });

    it('should find arbitrum by chainId', () => {
      const chain = getChain(42161);
      expect(chain).toBeDefined();
      expect(chain?.chainId).toBe(42161);
      expect(chain?.name).toBe('arbitrum');
    });

    it('should find sepolia testnet by chainId', () => {
      const chain = getChain(11155111);
      expect(chain).toBeDefined();
      expect(chain?.chainId).toBe(11155111);
      expect(chain?.name).toBe('sepolia');
    });

    it('should return undefined for non-existent chainId', () => {
      const chain = getChain(999999);
      expect(chain).toBeUndefined();
    });

    it('should handle zero chainId', () => {
      const chain = getChain(0);
      expect(chain).toBeUndefined();
    });

    it('should handle negative chainId', () => {
      const chain = getChain(-1);
      expect(chain).toBeUndefined();
    });
  });

  describe('finding chain by name', () => {
    it('should find polygon chain by name', () => {
      const chain = getChain('polygon');
      expect(chain).toBeDefined();
      expect(chain?.name).toBe('polygon');
      expect(chain?.chainId).toBe(137);
    });

    it('should find mainnet by name', () => {
      const chain = getChain('mainnet');
      expect(chain).toBeDefined();
      expect(chain?.name).toBe('mainnet');
      expect(chain?.chainId).toBe(1);
    });

    it('should find chain name case-insensitively', () => {
      const chain1 = getChain('POLYGON');
      const chain2 = getChain('Polygon');
      const chain3 = getChain('polygon');

      expect(chain1?.name).toBe('polygon');
      expect(chain2?.name).toBe('polygon');
      expect(chain3?.name).toBe('polygon');
    });

    it('should return undefined for non-existent chain name', () => {
      const chain = getChain('nonexistent');
      expect(chain).toBeUndefined();
    });

    it('should handle empty string', () => {
      const chain = getChain('');
      expect(chain).toBeUndefined();
    });

    it('should find base chain', () => {
      const chain = getChain('base');
      expect(chain).toBeDefined();
      expect(chain?.name).toBe('base');
    });

    it('should find optimism chain', () => {
      const chain = getChain('optimism');
      expect(chain).toBeDefined();
      expect(chain?.name).toBe('optimism');
    });
  });

  describe('chain properties validation', () => {
    it('should return chains with all required properties', () => {
      const chain = getChain(137);
      expect(chain).toBeDefined();
      expect(chain).toHaveProperty('chainId');
      expect(chain).toHaveProperty('name');
      expect(chain).toHaveProperty('title');
      expect(chain).toHaveProperty('indexerUrl');
      expect(chain).toHaveProperty('metadataUrl');
      expect(chain).toHaveProperty('readOnlyNodeURL');
      expect(chain).toHaveProperty('explorerUrl');
      expect(chain).toHaveProperty('isTestnet');
    });

    it('should correctly identify testnet chains', () => {
      const mainnetChain = getChain('polygon');
      const testnetChain = getChain('sepolia');

      expect(mainnetChain?.isTestnet).toBe(false);
      expect(testnetChain?.isTestnet).toBe(true);
    });

    it('should return valid URLs for chain services', () => {
      const chain = getChain(137);
      expect(chain?.indexerUrl).toMatch(/^https?:\/\//);
      expect(chain?.metadataUrl).toMatch(/^https?:\/\//);
      expect(chain?.readOnlyNodeURL).toMatch(/^https?:\/\//);
    });
  });

  describe('multiple chain types', () => {
    const chainIds = [1, 137, 42161, 10, 56, 43114, 8453, 11155111];

    it('should handle all major chain IDs', () => {
      chainIds.forEach((chainId) => {
        const chain = getChain(chainId);
        expect(chain).toBeDefined();
        expect(chain?.chainId).toBe(chainId);
      });
    });

    it('should return unique chains', () => {
      const chains = chainIds.map((id) => getChain(id));
      const uniqueChainIds = new Set(chains.map((c) => c?.chainId));
      expect(uniqueChainIds.size).toBe(chains.length);
    });
  });
});