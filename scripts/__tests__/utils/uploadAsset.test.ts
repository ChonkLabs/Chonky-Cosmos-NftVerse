import { describe, it, expect, beforeEach, vi } from 'vitest';
import { uploadAsset } from '../../utils/uploadAsset';

// Mock global fetch
global.fetch = vi.fn();

describe('uploadAsset', () => {
  const mockParams = {
    projectID: 12345,
    collectionID: 67890,
    assetID: 'image',
    tokenID: 1,
    url: 'https://example.com/image.png',
    projectAccessKey: 'test-access-key',
    jwtAccessKey: 'test-jwt-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful uploads', () => {
    it('should upload asset successfully', async () => {
      const mockImageData = new ArrayBuffer(100);
      const mockResponse = { success: true, assetUrl: 'https://uploaded.com/image.png' };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageData),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as any);

      const result = await uploadAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should construct correct metadata URL', async () => {
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

      await uploadAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      const uploadCall = vi.mocked(global.fetch).mock.calls[1];
      const expectedUrl = `https://metadata.sequence.app/projects/${mockParams.projectID}/collections/${mockParams.collectionID}/tokens/${mockParams.tokenID}/upload/${mockParams.assetID}`;
      
      expect(uploadCall[0]).toBe(expectedUrl);
    });

    it('should send correct headers', async () => {
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

      await uploadAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      const uploadCall = vi.mocked(global.fetch).mock.calls[1];
      const headers = uploadCall[1]?.headers as any;

      expect(headers['X-Access-Key']).toBe(mockParams.projectAccessKey);
      expect(headers['Authorization']).toBe(`Bearer ${mockParams.jwtAccessKey}`);
    });

    it('should use PUT method', async () => {
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

      await uploadAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      const uploadCall = vi.mocked(global.fetch).mock.calls[1];
      expect(uploadCall[1]?.method).toBe('PUT');
    });
  });

  describe('error handling', () => {
    it('should throw error when fetching image fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as any);

      await expect(
        uploadAsset(
          mockParams.projectID,
          mockParams.collectionID,
          mockParams.assetID,
          mockParams.tokenID,
          mockParams.url,
          mockParams.projectAccessKey,
          mockParams.jwtAccessKey
        )
      ).rejects.toThrow('Failed to fetch file from');
    });

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        uploadAsset(
          mockParams.projectID,
          mockParams.collectionID,
          mockParams.assetID,
          mockParams.tokenID,
          mockParams.url,
          mockParams.projectAccessKey,
          mockParams.jwtAccessKey
        )
      ).rejects.toThrow('Network error');
    });

    it('should handle upload API errors gracefully', async () => {
      const mockImageData = new ArrayBuffer(100);

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageData),
        } as any)
        .mockRejectedValueOnce(new Error('Upload failed'));

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await uploadAsset(
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

  describe('FormData handling', () => {
    it('should create FormData with correct file', async () => {
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

      await uploadAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      const uploadCall = vi.mocked(global.fetch).mock.calls[1];
      const body = uploadCall[1]?.body;

      expect(body).toBeInstanceOf(FormData);
    });
  });

  describe('edge cases', () => {
    it('should handle empty image data', async () => {
      const emptyData = new ArrayBuffer(0);

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(emptyData),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as any);

      const result = await uploadAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      expect(result).toBeDefined();
    });

    it('should handle large image files', async () => {
      const largeData = new ArrayBuffer(10 * 1024 * 1024); // 10MB

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(largeData),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as any);

      const result = await uploadAsset(
        mockParams.projectID,
        mockParams.collectionID,
        mockParams.assetID,
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      expect(result).toBeDefined();
    });

    it('should handle special characters in asset ID', async () => {
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

      await uploadAsset(
        mockParams.projectID,
        mockParams.collectionID,
        'image-special-123',
        mockParams.tokenID,
        mockParams.url,
        mockParams.projectAccessKey,
        mockParams.jwtAccessKey
      );

      const uploadCall = vi.mocked(global.fetch).mock.calls[1];
      expect(uploadCall[0]).toContain('image-special-123');
    });
  });
});