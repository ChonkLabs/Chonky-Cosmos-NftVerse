import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicClient } from '../../ERC20/rpcClients';
import { getChain } from '../../ERC20/getChain';

vi.mock('../../ERC20/getChain');
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    createPublicClient: vi.fn((config) => ({
      config,
      mockClient: true,
      chain: config.chain,
    })),
    http: vi.fn(() => 'mock-transport'),
  };
});

describe('getPublicClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful client creation', () => {
    it('should create public client for valid chainId', () => {
      const mockChainConfig = {
        chainId: 137,
        name: 'polygon',
        readOnlyNodeURL: 'https://polygon-rpc.com',
        viemChainConfig: {
          id: 137,
          name: 'Polygon',
        },
      };

      vi.mocked(getChain).mockReturnValue(mockChainConfig as any);

      const client = getPublicClient(137);

      expect(getChain).toHaveBeenCalledWith(137);
      expect(client).toBeDefined();
      expect(client.mockClient).toBe(true);
    });

    it('should configure client with correct RPC URLs', () => {
      const mockChainConfig = {
        chainId: 1,
        name: 'mainnet',
        readOnlyNodeURL: 'https://mainnet-rpc.com',
        viemChainConfig: {
          id: 1,
          name: 'Ethereum',
          rpcUrls: {
            default: { http: ['https://eth.public-rpc.com'] },
          },
        },
      };

      vi.mocked(getChain).mockReturnValue(mockChainConfig as any);

      const client = getPublicClient(1);

      expect(client.config.chain.rpcUrls.default.http).toEqual([
        'https://mainnet-rpc.com',
      ]);
    });

    it('should enable multicall batching', () => {
      const mockChainConfig = {
        chainId: 137,
        name: 'polygon',
        readOnlyNodeURL: 'https://polygon-rpc.com',
        viemChainConfig: { id: 137, name: 'Polygon' },
      };

      vi.mocked(getChain).mockReturnValue(mockChainConfig as any);

      const client = getPublicClient(137);

      expect(client.config.batch).toBeDefined();
      expect(client.config.batch.multicall).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid chainId', () => {
      vi.mocked(getChain).mockReturnValue(undefined);

      expect(() => getPublicClient(999999)).toThrow('Invalid chainId: 999999');
    });

    it('should throw error for null chainId network config', () => {
      vi.mocked(getChain).mockReturnValue(null as any);

      expect(() => getPublicClient(0)).toThrow('Invalid chainId: 0');
    });

    it('should handle negative chainIds', () => {
      vi.mocked(getChain).mockReturnValue(undefined);

      expect(() => getPublicClient(-1)).toThrow('Invalid chainId: -1');
    });
  });

  describe('multiple chain support', () => {
    it('should create clients for different chain IDs', () => {
      const chains = [
        {
          chainId: 1,
          name: 'mainnet',
          readOnlyNodeURL: 'https://mainnet-rpc.com',
          viemChainConfig: { id: 1, name: 'Ethereum' },
        },
        {
          chainId: 137,
          name: 'polygon',
          readOnlyNodeURL: 'https://polygon-rpc.com',
          viemChainConfig: { id: 137, name: 'Polygon' },
        },
        {
          chainId: 42161,
          name: 'arbitrum',
          readOnlyNodeURL: 'https://arbitrum-rpc.com',
          viemChainConfig: { id: 42161, name: 'Arbitrum' },
        },
      ];

      chains.forEach((chain) => {
        vi.mocked(getChain).mockReturnValue(chain as any);
        const client = getPublicClient(chain.chainId);
        expect(client).toBeDefined();
        expect(client.config.chain.rpcUrls.default.http[0]).toBe(
          chain.readOnlyNodeURL
        );
      });
    });

    it('should handle testnet chains', () => {
      const testnetConfig = {
        chainId: 11155111,
        name: 'sepolia',
        readOnlyNodeURL: 'https://sepolia-rpc.com',
        viemChainConfig: { id: 11155111, name: 'Sepolia' },
        isTestnet: true,
      };

      vi.mocked(getChain).mockReturnValue(testnetConfig as any);

      const client = getPublicClient(11155111);
      expect(client).toBeDefined();
    });
  });

  describe('RPC URL configuration', () => {
    it('should set both default and public RPC URLs', () => {
      const mockChainConfig = {
        chainId: 137,
        name: 'polygon',
        readOnlyNodeURL: 'https://custom-polygon-rpc.com',
        viemChainConfig: { id: 137, name: 'Polygon' },
      };

      vi.mocked(getChain).mockReturnValue(mockChainConfig as any);

      const client = getPublicClient(137);

      expect(client.config.chain.rpcUrls.default.http[0]).toBe(
        'https://custom-polygon-rpc.com'
      );
      expect(client.config.chain.rpcUrls.public.http[0]).toBe(
        'https://custom-polygon-rpc.com'
      );
    });

    it('should preserve viem chain config', () => {
      const viemConfig = {
        id: 137,
        name: 'Polygon Mainnet',
        network: 'matic',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
      };

      const mockChainConfig = {
        chainId: 137,
        name: 'polygon',
        readOnlyNodeURL: 'https://polygon-rpc.com',
        viemChainConfig: viemConfig,
      };

      vi.mocked(getChain).mockReturnValue(mockChainConfig as any);

      const client = getPublicClient(137);

      expect(client.config.chain.id).toBe(137);
      expect(client.config.chain.name).toBe('Polygon Mainnet');
    });
  });
});