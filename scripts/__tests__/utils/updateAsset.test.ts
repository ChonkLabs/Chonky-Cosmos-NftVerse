import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateAsset } from '../../utils/updateAsset';

// Mock global fetch
global.fetch = vi.fn();

describe('updateAsset', () => {
  const mockParams = {
    projectID: 12345,
    collectionID: 67890,
    assetID: 'image',
    tokenID: 1,
    url: 'https://example.com/updated-image.png',
    projectAccessKey: 'test-access-key',
    jwtAccessKey: 'test-jwt-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful updates', () => {
    it('should update asset successfully', async () => {
      const mockImageData = new ArrayBuffer(150);
      const mockResponse = { success: true, updated: true };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageData),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as any);

      const result = await updateAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      expect(result).toEqual(mockResponse);
    });

    it('should use correct endpoint URL', async () => {
      const mockImageData = new ArrayBuffer(100);

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageData),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as any);

      await updateAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      const updateCall = vi.mocked(global.fetch).mock.calls[1];
      const expectedUrl = `https://metadata.sequence.app/projects/${mockParams.projectID}/collections/${mockParams.collectionID}/tokens/${mockParams.tokenID}/upload/${mockParams.assetID}`;
      
      expect(updateCall[0]).toBe(expectedUrl);
    });

    it('should send correct authentication headers', async () => {
      const mockImageData = new ArrayBuffer(100);

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageData),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as any);

      await updateAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      const updateCall = vi.mocked(global.fetch).mock.calls[1];
      const headers = updateCall[1]?.headers as any;

      expect(headers['X-Access-Key']).toBe(mockParams.projectAccessKey);
      expect(headers['Authorization']).toBe(`Bearer ${mockParams.jwtAccessKey}`);
    });
  });

  describe('error handling', () => {
    it('should throw error when fetching new image fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Forbidden',
      } as any);

      await expect(
        updateAsset(
          mockParams.projectID,
          mockParams.collectionID,
          mockParams.assetID,
          mockParams.tokenID,
          mockParams.url,
          mockParams.projectAccessKey,
          mockParams.jwtAccessKey
        )
      ).rejects.toThrow();
    });

    it('should handle update API errors with console log', async () => {
      const mockImageData = new ArrayBuffer(100);

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageData),
        } as any)
        .mockRejectedValueOnce(new Error('Update failed'));

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await updateAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      expect(result).toBeUndefined();
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('comparison with uploadAsset', () => {
    it('should have same structure as uploadAsset', async () => {
      const mockImageData = new ArrayBuffer(100);

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageData),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as any);

      await updateAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      // Should use PUT method like uploadAsset
      const updateCall = vi.mocked(global.fetch).mock.calls[1];
      expect(updateCall[1]?.method).toBe('PUT');
    });

    it('should create FormData similarly to uploadAsset', async () => {
      const mockImageData = new ArrayBuffer(100);

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageData),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as any);

      await updateAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      const updateCall = vi.mocked(global.fetch).mock.calls[1];
      expect(updateCall[1]?.body).toBeInstanceOf(FormData);
    });
  });
});