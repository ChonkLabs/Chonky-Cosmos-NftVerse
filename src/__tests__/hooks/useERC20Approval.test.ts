import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useERC20Approval, BigIntReplacer, BigIntReviver } from '../../hooks/transactions/useERC20Approval';
import { ERC20 } from '../../ERC20/ERC20';
import React from 'react';

// Mock ERC20 module
vi.mock('../../ERC20/ERC20');

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useERC20Approval', () => {
  const mockProps = {
    spenderAddress: '0x1234567890123456789012345678901234567890',
    erc20Address: '0x0987654321098765432109876543210987654321',
    userAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    targetAmount: BigInt(1000),
    chainId: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful approval checks', () => {
    it('should check ERC20 allowance and balance', async () => {
      const mockAllowance = BigInt(500);
      const mockBalance = BigInt(2000);

      vi.mocked(ERC20.getAllowance).mockResolvedValue(mockAllowance);
      vi.mocked(ERC20.balanceOf).mockResolvedValue(mockBalance);

      const { result } = renderHook(() => useERC20Approval(mockProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.erc20CurrencyAllowance).toBe(mockAllowance);
      expect(result.current.data?.erc20CurrencyUserBalance).toBe(mockBalance);
      expect(result.current.data?.isRequiresAllowanceApproval).toBe(true);
      expect(result.current.data?.isUserInsufficientBalance).toBe(false);
    });

    it('should detect when approval is not required', async () => {
      const mockAllowance = BigInt(2000);
      const mockBalance = BigInt(2000);

      vi.mocked(ERC20.getAllowance).mockResolvedValue(mockAllowance);
      vi.mocked(ERC20.balanceOf).mockResolvedValue(mockBalance);

      const { result } = renderHook(() => useERC20Approval(mockProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isRequiresAllowanceApproval).toBe(false);
    });

    it('should detect insufficient balance', async () => {
      const mockAllowance = BigInt(2000);
      const mockBalance = BigInt(500);

      vi.mocked(ERC20.getAllowance).mockResolvedValue(mockAllowance);
      vi.mocked(ERC20.balanceOf).mockResolvedValue(mockBalance);

      const { result } = renderHook(() => useERC20Approval(mockProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isUserInsufficientBalance).toBe(true);
    });

    it('should work with zero allowance', async () => {
      vi.mocked(ERC20.getAllowance).mockResolvedValue(BigInt(0));
      vi.mocked(ERC20.balanceOf).mockResolvedValue(BigInt(1000));

      const { result } = renderHook(() => useERC20Approval(mockProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.erc20CurrencyAllowance).toBe(BigInt(0));
      expect(result.current.data?.isRequiresAllowanceApproval).toBe(true);
    });
  });

  describe('disabled state', () => {
    it('should not execute when disabled', async () => {
      const { result } = renderHook(
        () => useERC20Approval({ ...mockProps, disabled: true }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isFetching).toBe(false), { timeout: 100 });

      expect(ERC20.getAllowance).not.toHaveBeenCalled();
      expect(ERC20.balanceOf).not.toHaveBeenCalled();
    });

    it('should not execute when required params are missing', async () => {
      const { result } = renderHook(
        () => useERC20Approval({ spenderAddress: undefined } as any),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isFetching).toBe(false), { timeout: 100 });

      expect(ERC20.getAllowance).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle ERC20 getAllowance errors', async () => {
      vi.mocked(ERC20.getAllowance).mockRejectedValue(new Error('Network error'));
      vi.mocked(ERC20.balanceOf).mockResolvedValue(BigInt(1000));

      const { result } = renderHook(() => useERC20Approval(mockProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });

    it('should handle ERC20 balanceOf errors', async () => {
      vi.mocked(ERC20.getAllowance).mockResolvedValue(BigInt(1000));
      vi.mocked(ERC20.balanceOf).mockRejectedValue(new Error('Balance check failed'));

      const { result } = renderHook(() => useERC20Approval(mockProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle very large amounts', async () => {
      const largeAmount = BigInt('999999999999999999999999999999');

      vi.mocked(ERC20.getAllowance).mockResolvedValue(largeAmount);
      vi.mocked(ERC20.balanceOf).mockResolvedValue(largeAmount);

      const { result } = renderHook(
        () => useERC20Approval({ ...mockProps, targetAmount: largeAmount }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.erc20CurrencyAllowance).toBe(largeAmount);
    });

    it('should handle exact match of allowance and target', async () => {
      const exactAmount = BigInt(1000);

      vi.mocked(ERC20.getAllowance).mockResolvedValue(exactAmount);
      vi.mocked(ERC20.balanceOf).mockResolvedValue(exactAmount);

      const { result } = renderHook(() => useERC20Approval(mockProps), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.isRequiresAllowanceApproval).toBe(false);
      expect(result.current.data?.isUserInsufficientBalance).toBe(false);
    });
  });
});

describe('BigInt utilities', () => {
  describe('BigIntReplacer', () => {
    it('should convert BigInt to serializable object', () => {
      const value = BigInt(12345);
      const replaced = BigIntReplacer('key', value);

      expect(replaced).toEqual({ type: 'bigint', v: '12345' });
    });

    it('should pass through non-BigInt values', () => {
      const value = 'string';
      const replaced = BigIntReplacer('key', value);

      expect(replaced).toBe('string');
    });

    it('should handle objects with BigInt values in JSON.stringify', () => {
      const obj = {
        amount: BigInt(1000),
        name: 'test',
        count: 42,
      };

      const serialized = JSON.stringify(obj, BigIntReplacer);
      expect(serialized).toContain('"type":"bigint"');
      expect(serialized).toContain('"v":"1000"');
    });

    it('should handle zero BigInt', () => {
      const value = BigInt(0);
      const replaced = BigIntReplacer('key', value);

      expect(replaced).toEqual({ type: 'bigint', v: '0' });
    });

    it('should handle very large BigInt values', () => {
      const value = BigInt('999999999999999999999999');
      const replaced = BigIntReplacer('key', value);

      expect(replaced).toEqual({ type: 'bigint', v: '999999999999999999999999' });
    });
  });

  describe('BigIntReviver', () => {
    it('should convert serialized BigInt back to BigInt', () => {
      const serialized = { type: 'bigint', v: '12345' };
      const revived = BigIntReviver('key', serialized);

      expect(revived).toBe(BigInt(12345));
    });

    it('should pass through non-BigInt serialized values', () => {
      const value = 'string';
      const revived = BigIntReviver('key', value);

      expect(revived).toBe('string');
    });

    it('should handle objects with BigInt values in JSON.parse', () => {
      const obj = {
        amount: BigInt(1000),
        name: 'test',
      };

      const serialized = JSON.stringify(obj, BigIntReplacer);
      const parsed = JSON.parse(serialized, BigIntReviver);

      expect(parsed.amount).toBe(BigInt(1000));
      expect(parsed.name).toBe('test');
    });

    it('should handle zero BigInt', () => {
      const serialized = { type: 'bigint', v: '0' };
      const revived = BigIntReviver('key', serialized);

      expect(revived).toBe(BigInt(0));
    });
  });

  describe('round-trip serialization', () => {
    it('should correctly serialize and deserialize BigInt', () => {
      const original = BigInt(999999);
      const serialized = JSON.stringify(original, BigIntReplacer);
      const deserialized = JSON.parse(serialized, BigIntReviver);

      expect(deserialized).toBe(original);
    });

    it('should handle complex objects with multiple BigInts', () => {
      const original = {
        balance: BigInt(1000),
        allowance: BigInt(2000),
        target: BigInt(1500),
        name: 'Token',
        enabled: true,
      };

      const serialized = JSON.stringify(original, BigIntReplacer);
      const deserialized = JSON.parse(serialized, BigIntReviver);

      expect(deserialized.balance).toBe(original.balance);
      expect(deserialized.allowance).toBe(original.allowance);
      expect(deserialized.target).toBe(original.target);
      expect(deserialized.name).toBe(original.name);
      expect(deserialized.enabled).toBe(original.enabled);
    });

    it('should handle nested objects with BigInts', () => {
      const original = {
        user: {
          balance: BigInt(1000),
          address: '0x123',
        },
        contract: {
          allowance: BigInt(2000),
        },
      };

      const serialized = JSON.stringify(original, BigIntReplacer);
      const deserialized = JSON.parse(serialized, BigIntReviver);

      expect(deserialized.user.balance).toBe(original.user.balance);
      expect(deserialized.contract.allowance).toBe(original.contract.allowance);
    });
  });
});