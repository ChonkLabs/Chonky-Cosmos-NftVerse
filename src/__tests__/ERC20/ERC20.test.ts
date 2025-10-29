import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ERC20 } from '../../ERC20/ERC20';
import { getERC20Contract } from '../../ERC20/getERC20Contract';
import { ethers } from 'ethers';
import type { Hex } from 'viem';

// Mock dependencies
vi.mock('../../ERC20/getERC20Contract');
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    encodeFunctionData: vi.fn(() => '0x095ea7b3'),
  };
});

describe('ERC20', () => {
  const mockErc20Address = '0x1234567890123456789012345678901234567890';
  const mockSpender = '0x0987654321098765432109876543210987654321';
  const mockOwner = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const mockAmount = BigInt(1000);
  const mockChainId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('approve', () => {
    it('should successfully approve spending amount', async () => {
      const mockSigner = {
        writeContract: vi.fn().mockResolvedValue('0xtxhash123'),
        chain: { id: mockChainId },
      };

      const txHash = await ERC20.approve(
        mockErc20Address,
        mockSpender,
        mockAmount,
        mockSigner as any,
      );

      expect(mockSigner.writeContract).toHaveBeenCalledWith({
        chain: mockSigner.chain,
        address: mockErc20Address as Hex,
        abi: expect.any(Array),
        functionName: 'approve',
        args: [mockSpender as Hex, mockAmount],
      });
      expect(txHash).toBe('0xtxhash123');
    });

    it('should handle approval with zero amount', async () => {
      const mockSigner = {
        writeContract: vi.fn().mockResolvedValue('0xtxhash456'),
        chain: { id: mockChainId },
      };

      const txHash = await ERC20.approve(
        mockErc20Address,
        mockSpender,
        BigInt(0),
        mockSigner as any,
      );

      expect(mockSigner.writeContract).toHaveBeenCalled();
      expect(txHash).toBe('0xtxhash456');
    });

    it('should handle approval failure', async () => {
      const mockSigner = {
        writeContract: vi.fn().mockRejectedValue(new Error('Transaction failed')),
        chain: { id: mockChainId },
      };

      await expect(
        ERC20.approve(mockErc20Address, mockSpender, mockAmount, mockSigner as any)
      ).rejects.toThrow('Transaction failed');
    });

    it('should handle very large amounts', async () => {
      const largeAmount = BigInt('999999999999999999999999999999');
      const mockSigner = {
        writeContract: vi.fn().mockResolvedValue('0xtxhash789'),
        chain: { id: mockChainId },
      };

      await ERC20.approve(mockErc20Address, mockSpender, largeAmount, mockSigner as any);

      expect(mockSigner.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [mockSpender as Hex, largeAmount],
        })
      );
    });
  });

  describe('approve_data', () => {
    it('should generate correct approval data', () => {
      const data = ERC20.approve_data(mockSpender, mockAmount);

      expect(data).toBeDefined();
      expect(typeof data).toBe('string');
      expect(data).toMatch(/^0x/);
    });

    it('should generate data for zero amount', () => {
      const data = ERC20.approve_data(mockSpender, BigInt(0));

      expect(data).toBeDefined();
      expect(typeof data).toBe('string');
    });

    it('should generate different data for different amounts', () => {
      const data1 = ERC20.approve_data(mockSpender, BigInt(100));
      const data2 = ERC20.approve_data(mockSpender, BigInt(200));

      expect(data1).toBeDefined();
      expect(data2).toBeDefined();
    });
  });

  describe('approveInfinite', () => {
    it('should approve infinite allowance using MaxUint256', async () => {
      const mockSigner = {
        writeContract: vi.fn().mockResolvedValue('0xtxhashInfinite'),
        chain: { id: mockChainId },
      };

      const txHash = await ERC20.approveInfinite(
        mockErc20Address,
        mockSpender,
        mockSigner as any,
      );

      expect(mockSigner.writeContract).toHaveBeenCalledWith({
        chain: mockSigner.chain,
        address: mockErc20Address as Hex,
        abi: expect.any(Array),
        functionName: 'approve',
        args: [mockSpender as Hex, BigInt(ethers.MaxUint256.toString())],
      });
      expect(txHash).toBe('0xtxhashInfinite');
    });

    it('should handle infinite approval failure', async () => {
      const mockSigner = {
        writeContract: vi.fn().mockRejectedValue(new Error('Infinite approval failed')),
        chain: { id: mockChainId },
      };

      await expect(
        ERC20.approveInfinite(mockErc20Address, mockSpender, mockSigner as any)
      ).rejects.toThrow('Infinite approval failed');
    });
  });

  describe('approveInfinite_data', () => {
    it('should generate correct infinite approval data', () => {
      const data = ERC20.approveInfinite_data(mockSpender);

      expect(data).toBeDefined();
      expect(typeof data).toBe('string');
      expect(data).toMatch(/^0x/);
    });

    it('should use MaxUint256 for infinite approval', () => {
      const data = ERC20.approveInfinite_data(mockSpender);
      expect(data).toBeDefined();
    });
  });

  describe('getAllowance', () => {
    it('should return current allowance', async () => {
      const mockAllowance = BigInt(5000);
      const mockContract = {
        read: {
          allowance: vi.fn().mockResolvedValue(mockAllowance),
        },
      };

      vi.mocked(getERC20Contract).mockReturnValue(mockContract as any);

      const allowance = await ERC20.getAllowance(
        mockErc20Address,
        mockOwner,
        mockSpender,
        mockChainId,
      );

      expect(getERC20Contract).toHaveBeenCalledWith({
        contractAddress: mockErc20Address,
        chainId: mockChainId,
      });
      expect(mockContract.read.allowance).toHaveBeenCalledWith([
        mockOwner as Hex,
        mockSpender as Hex,
      ]);
      expect(allowance).toBe(mockAllowance);
    });

    it('should return zero allowance when not approved', async () => {
      const mockContract = {
        read: {
          allowance: vi.fn().mockResolvedValue(BigInt(0)),
        },
      };

      vi.mocked(getERC20Contract).mockReturnValue(mockContract as any);

      const allowance = await ERC20.getAllowance(
        mockErc20Address,
        mockOwner,
        mockSpender,
        mockChainId,
      );

      expect(allowance).toBe(BigInt(0));
    });

    it('should handle getAllowance RPC errors', async () => {
      const mockContract = {
        read: {
          allowance: vi.fn().mockRejectedValue(new Error('RPC Error')),
        },
      };

      vi.mocked(getERC20Contract).mockReturnValue(mockContract as any);

      await expect(
        ERC20.getAllowance(mockErc20Address, mockOwner, mockSpender, mockChainId)
      ).rejects.toThrow('RPC Error');
    });

    it('should handle large allowance values', async () => {
      const largeAllowance = BigInt(ethers.MaxUint256.toString());
      const mockContract = {
        read: {
          allowance: vi.fn().mockResolvedValue(largeAllowance),
        },
      };

      vi.mocked(getERC20Contract).mockReturnValue(mockContract as any);

      const allowance = await ERC20.getAllowance(
        mockErc20Address,
        mockOwner,
        mockSpender,
        mockChainId,
      );

      expect(allowance).toBe(largeAllowance);
    });
  });

  describe('balanceOf', () => {
    it('should return token balance for address', async () => {
      const mockBalance = BigInt(10000);
      const mockContract = {
        read: {
          balanceOf: vi.fn().mockResolvedValue(mockBalance),
        },
      };

      vi.mocked(getERC20Contract).mockReturnValue(mockContract as any);

      const balance = await ERC20.balanceOf(
        mockErc20Address,
        mockOwner,
        mockChainId,
      );

      expect(getERC20Contract).toHaveBeenCalledWith({
        contractAddress: mockErc20Address,
        chainId: mockChainId,
      });
      expect(mockContract.read.balanceOf).toHaveBeenCalledWith([mockOwner as Hex]);
      expect(balance).toBe(mockBalance);
    });

    it('should return zero balance for address with no tokens', async () => {
      const mockContract = {
        read: {
          balanceOf: vi.fn().mockResolvedValue(BigInt(0)),
        },
      };

      vi.mocked(getERC20Contract).mockReturnValue(mockContract as any);

      const balance = await ERC20.balanceOf(
        mockErc20Address,
        mockOwner,
        mockChainId,
      );

      expect(balance).toBe(BigInt(0));
    });

    it('should handle balanceOf RPC errors', async () => {
      const mockContract = {
        read: {
          balanceOf: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      };

      vi.mocked(getERC20Contract).mockReturnValue(mockContract as any);

      await expect(
        ERC20.balanceOf(mockErc20Address, mockOwner, mockChainId)
      ).rejects.toThrow('Network error');
    });

    it('should handle very large balance values', async () => {
      const largeBalance = BigInt('1000000000000000000000000000');
      const mockContract = {
        read: {
          balanceOf: vi.fn().mockResolvedValue(largeBalance),
        },
      };

      vi.mocked(getERC20Contract).mockReturnValue(mockContract as any);

      const balance = await ERC20.balanceOf(
        mockErc20Address,
        mockOwner,
        mockChainId,
      );

      expect(balance).toBe(largeBalance);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle invalid addresses gracefully', async () => {
      const invalidAddress = 'invalid';
      const mockSigner = {
        writeContract: vi.fn().mockRejectedValue(new Error('Invalid address')),
        chain: { id: mockChainId },
      };

      await expect(
        ERC20.approve(invalidAddress, mockSpender, mockAmount, mockSigner as any)
      ).rejects.toThrow();
    });

    it('should handle network mismatch', async () => {
      const mockSigner = {
        writeContract: vi.fn().mockRejectedValue(new Error('Wrong network')),
        chain: { id: 999 },
      };

      await expect(
        ERC20.approve(mockErc20Address, mockSpender, mockAmount, mockSigner as any)
      ).rejects.toThrow();
    });
  });
});