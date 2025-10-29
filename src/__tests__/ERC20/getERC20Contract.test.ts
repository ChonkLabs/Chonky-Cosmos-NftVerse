import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getERC20Contract } from '../../ERC20/getERC20Contract';
import { getPublicClient } from '../../ERC20/rpcClients';

vi.mock('../../ERC20/rpcClients');
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    getContract: vi.fn((params) => ({
      address: params.address,
      abi: params.abi,
      client: params.client,
      mockContract: true,
    })),
  };
});

describe('getERC20Contract', () => {
  const mockContractAddress = '0x1234567890123456789012345678901234567890';
  const mockChainId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('contract initialization', () => {
    it('should create ERC20 contract with public client', () => {
      const mockPublicClient = { mock: 'publicClient' };
      vi.mocked(getPublicClient).mockReturnValue(mockPublicClient as any);

      const contract = getERC20Contract({
        contractAddress: mockContractAddress,
        chainId: mockChainId,
      });

      expect(getPublicClient).toHaveBeenCalledWith(mockChainId);
      expect(contract).toBeDefined();
      expect(contract.address).toBe(mockContractAddress);
    });

    it('should create contract with signer when provided', () => {
      const mockPublicClient = { mock: 'publicClient' };
      const mockSigner = { mock: 'signer' } as any;

      vi.mocked(getPublicClient).mockReturnValue(mockPublicClient as any);

      const contract = getERC20Contract({
        contractAddress: mockContractAddress,
        chainId: mockChainId,
        signer: mockSigner,
      });

      expect(contract).toBeDefined();
      expect(contract.client.wallet).toBe(mockSigner);
    });

    it('should handle different chain IDs', () => {
      const testChainIds = [1, 137, 42161, 10, 56];
      const mockPublicClient = { mock: 'publicClient' };

      vi.mocked(getPublicClient).mockReturnValue(mockPublicClient as any);

      testChainIds.forEach((chainId) => {
        getERC20Contract({
          contractAddress: mockContractAddress,
          chainId,
        });

        expect(getPublicClient).toHaveBeenCalledWith(chainId);
      });
    });
  });

  describe('address validation', () => {
    it('should accept valid ERC20 contract addresses', () => {
      const validAddresses = [
        '0x1234567890123456789012345678901234567890',
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      ];

      const mockPublicClient = { mock: 'publicClient' };
      vi.mocked(getPublicClient).mockReturnValue(mockPublicClient as any);

      validAddresses.forEach((address) => {
        const contract = getERC20Contract({
          contractAddress: address,
          chainId: mockChainId,
        });

        expect(contract).toBeDefined();
        expect(contract.address).toBe(address);
      });
    });

    it('should handle checksummed addresses', () => {
      const checksumAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const mockPublicClient = { mock: 'publicClient' };
      vi.mocked(getPublicClient).mockReturnValue(mockPublicClient as any);

      const contract = getERC20Contract({
        contractAddress: checksumAddress,
        chainId: mockChainId,
      });

      expect(contract.address).toBe(checksumAddress);
    });
  });

  describe('client configuration', () => {
    it('should configure public and wallet clients correctly', () => {
      const mockPublicClient = { mock: 'publicClient' };
      const mockSigner = { mock: 'walletClient' } as any;

      vi.mocked(getPublicClient).mockReturnValue(mockPublicClient as any);

      const contract = getERC20Contract({
        contractAddress: mockContractAddress,
        chainId: mockChainId,
        signer: mockSigner,
      });

      expect(contract.client.public).toBe(mockPublicClient);
      expect(contract.client.wallet).toBe(mockSigner);
    });

    it('should work with only public client', () => {
      const mockPublicClient = { mock: 'publicClient' };
      vi.mocked(getPublicClient).mockReturnValue(mockPublicClient as any);

      const contract = getERC20Contract({
        contractAddress: mockContractAddress,
        chainId: mockChainId,
      });

      expect(contract.client.public).toBe(mockPublicClient);
      expect(contract.client.wallet).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should propagate errors from getPublicClient', () => {
      vi.mocked(getPublicClient).mockImplementation(() => {
        throw new Error('Invalid chainId');
      });

      expect(() =>
        getERC20Contract({
          contractAddress: mockContractAddress,
          chainId: 999999,
        })
      ).toThrow('Invalid chainId');
    });
  });

  describe('multiple contract instances', () => {
    it('should create separate contracts for different addresses', () => {
      const mockPublicClient = { mock: 'publicClient' };
      vi.mocked(getPublicClient).mockReturnValue(mockPublicClient as any);

      const address1 = '0x1234567890123456789012345678901234567890';
      const address2 = '0x0987654321098765432109876543210987654321';

      const contract1 = getERC20Contract({
        contractAddress: address1,
        chainId: mockChainId,
      });

      const contract2 = getERC20Contract({
        contractAddress: address2,
        chainId: mockChainId,
      });

      expect(contract1.address).toBe(address1);
      expect(contract2.address).toBe(address2);
      expect(contract1.address).not.toBe(contract2.address);
    });

    it('should create separate contracts for different chains', () => {
      const mockPublicClient = { mock: 'publicClient' };
      vi.mocked(getPublicClient).mockReturnValue(mockPublicClient as any);

      getERC20Contract({
        contractAddress: mockContractAddress,
        chainId: 1,
      });

      getERC20Contract({
        contractAddress: mockContractAddress,
        chainId: 137,
      });

      expect(getPublicClient).toHaveBeenCalledWith(1);
      expect(getPublicClient).toHaveBeenCalledWith(137);
    });
  });
});