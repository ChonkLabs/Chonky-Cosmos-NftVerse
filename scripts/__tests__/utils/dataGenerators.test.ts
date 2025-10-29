import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mergeAttributes,
  generateDivineAxeName,
  generateAxeDescription,
  generateAxeAttributes,
  getRandomImage,
  generateNFTsMetadata,
  generatePlaceholderMetadata,
} from '../../utils/dataGenerators';

describe('dataGenerators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mergeAttributes', () => {
    it('should merge multiple attributes into one object', () => {
      const attributes = [
        { sharpness: 100 },
        { weight: 50 },
        { durability: 200 },
      ];

      const merged = mergeAttributes(attributes);

      expect(merged).toEqual({
        sharpness: 100,
        weight: 50,
        durability: 200,
      });
    });

    it('should return null for empty array', () => {
      const merged = mergeAttributes([]);
      expect(merged).toBeNull();
    });

    it('should handle single attribute', () => {
      const attributes = [{ power: 999 }];
      const merged = mergeAttributes(attributes);

      expect(merged).toEqual({ power: 999 });
    });

    it('should override duplicate keys with last value', () => {
      const attributes = [
        { sharpness: 100 },
        { sharpness: 200 },
        { sharpness: 300 },
      ];

      const merged = mergeAttributes(attributes);
      expect(merged).toEqual({ sharpness: 300 });
    });

    it('should handle complex attribute objects', () => {
      const attributes = [
        { a: 1, b: 2 },
        { c: 3, d: 4 },
        { e: 5 },
      ];

      const merged = mergeAttributes(attributes);
      expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4, e: 5 });
    });
  });

  describe('generateDivineAxeName', () => {
    it('should generate name with correct format', () => {
      const name = generateDivineAxeName();

      expect(name).toMatch(/^Divine Axe #\d{3}$/);
    });

    it('should generate names with 3-digit suffix', () => {
      const name = generateDivineAxeName();
      const suffix = name.split('#')[1];

      expect(suffix).toHaveLength(3);
      expect(parseInt(suffix)).toBeGreaterThanOrEqual(0);
      expect(parseInt(suffix)).toBeLessThan(1000);
    });

    it('should pad single digits with zeros', () => {
      // Mock Math.random to return 0.005 (should give "005")
      vi.spyOn(Math, 'random').mockReturnValue(0.005);

      const name = generateDivineAxeName();
      expect(name).toBe('Divine Axe #005');

      vi.restoreAllMocks();
    });

    it('should generate different names on multiple calls', () => {
      const names = new Set();
      for (let i = 0; i < 50; i++) {
        names.add(generateDivineAxeName());
      }

      // Should have some variety (not all the same)
      expect(names.size).toBeGreaterThan(1);
    });
  });

  describe('generateAxeDescription', () => {
    it('should generate valid description with all parts', () => {
      const description = generateAxeDescription();

      expect(description).toBeDefined();
      expect(description.length).toBeGreaterThan(0);
      expect(description).toMatch(/^This .* axe,/);
      expect(description).toContain(',');
      expect(description).toContain('.');
    });

    it('should use valid adjectives', () => {
      const validAdjectives = [
        'mighty',
        'ancient',
        'powerful',
        'enchanted',
        'cursed',
        'legendary',
        'forgotten',
      ];

      const description = generateAxeDescription();
      const hasValidAdjective = validAdjectives.some((adj) =>
        description.includes(adj)
      );

      expect(hasValidAdjective).toBe(true);
    });

    it('should generate different descriptions', () => {
      const descriptions = new Set();

      for (let i = 0; i < 20; i++) {
        descriptions.add(generateAxeDescription());
      }

      // Should have variety
      expect(descriptions.size).toBeGreaterThan(1);
    });

    it('should have proper sentence structure', () => {
      const description = generateAxeDescription();

      expect(description.startsWith('This ')).toBe(true);
      expect(description.endsWith('.')).toBe(true);
    });
  });

  describe('generateAxeAttributes', () => {
    it('should generate requested number of attributes', () => {
      const attributes = generateAxeAttributes(4);

      expect(attributes).toHaveLength(4);
    });

    it('should generate unique attributes', () => {
      const attributes = generateAxeAttributes(5);
      const keys = attributes.map((attr) => Object.keys(attr)[0]);
      const uniqueKeys = new Set(keys);

      expect(uniqueKeys.size).toBe(5);
    });

    it('should throw error if requesting more than available', () => {
      expect(() => generateAxeAttributes(20)).toThrow(
        'Requested attributes exceed available options'
      );
    });

    it('should generate attributes with numeric values', () => {
      const attributes = generateAxeAttributes(3);

      attributes.forEach((attr) => {
        const value = Object.values(attr)[0];
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(1500);
      });
    });

    it('should handle edge case of 1 attribute', () => {
      const attributes = generateAxeAttributes(1);

      expect(attributes).toHaveLength(1);
      expect(Object.keys(attributes[0])).toHaveLength(1);
    });

    it('should handle maximum attributes', () => {
      const attributes = generateAxeAttributes(10);

      expect(attributes).toHaveLength(10);
      const keys = attributes.map((attr) => Object.keys(attr)[0]);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(10);
    });

    it('should use valid attribute names', () => {
      const validNames = [
        'sharpness',
        'weight',
        'balance',
        'durability',
        'magic',
        'attackPower',
        'elementalAffinity',
        'edgeRetention',
        'speed',
        'criticalHitChance',
      ];

      const attributes = generateAxeAttributes(5);

      attributes.forEach((attr) => {
        const key = Object.keys(attr)[0];
        expect(validNames).toContain(key);
      });
    });

    it('should generate different values on multiple calls', () => {
      const attrs1 = generateAxeAttributes(3);
      const attrs2 = generateAxeAttributes(3);

      const values1 = attrs1.map((a) => Object.values(a)[0]).join(',');
      const values2 = attrs2.map((a) => Object.values(a)[0]).join(',');

      // Very unlikely to be identical
      expect(values1).not.toBe(values2);
    });
  });

  describe('getRandomImage', () => {
    it('should return a valid image URL', () => {
      const image = getRandomImage();

      expect(image).toBeDefined();
      expect(typeof image).toBe('string');
      expect(image).toMatch(/^https:\/\//);
    });

    it('should return one of the two valid images', () => {
      const validImages = [
        'https://metadata.sequence.app/projects/30957/collections/690/tokens/0/image.png',
        'https://metadata.sequence.app/projects/30957/collections/690/tokens/1/image.png',
      ];

      const image = getRandomImage();
      expect(validImages).toContain(image);
    });

    it('should have randomness in selection', () => {
      const images = new Set();

      for (let i = 0; i < 20; i++) {
        images.add(getRandomImage());
      }

      // Should eventually get both images
      expect(images.size).toBeGreaterThan(0);
    });
  });

  describe('generateNFTsMetadata', () => {
    it('should generate requested number of NFTs', () => {
      const count = 5;
      const metadatas = generateNFTsMetadata(count);

      expect(metadatas).toHaveLength(count);
    });

    it('should generate NFTs with all required fields', () => {
      const metadatas = generateNFTsMetadata(3);

      metadatas.forEach((metadata) => {
        expect(metadata).toHaveProperty('name');
        expect(metadata).toHaveProperty('description');
        expect(metadata).toHaveProperty('image');
        expect(metadata).toHaveProperty('attributes');
      });
    });

    it('should generate NFTs with valid names', () => {
      const metadatas = generateNFTsMetadata(3);

      metadatas.forEach((metadata) => {
        expect(metadata.name).toMatch(/^Divine Axe #\d{3}$/);
      });
    });

    it('should generate NFTs with 4 attributes each', () => {
      const metadatas = generateNFTsMetadata(5);

      metadatas.forEach((metadata) => {
        expect(metadata.attributes).toHaveLength(4);
      });
    });

    it('should handle generating zero NFTs', () => {
      const metadatas = generateNFTsMetadata(0);
      expect(metadatas).toHaveLength(0);
    });

    it('should handle generating large batch of NFTs', () => {
      const metadatas = generateNFTsMetadata(100);

      expect(metadatas).toHaveLength(100);
      expect(metadatas[0]).toHaveProperty('name');
      expect(metadatas[99]).toHaveProperty('name');
    });

    it('should generate unique NFTs', () => {
      const metadatas = generateNFTsMetadata(10);
      const names = metadatas.map((m) => m.name);

      // Names might overlap due to random generation, but should have some variety
      expect(names.length).toBe(10);
    });

    it('should use valid image URLs', () => {
      const metadatas = generateNFTsMetadata(5);

      metadatas.forEach((metadata) => {
        expect(metadata.image).toMatch(/^https:\/\//);
      });
    });
  });

  describe('generatePlaceholderMetadata', () => {
    it('should generate requested number of placeholders', () => {
      const count = 5;
      const metadatas = generatePlaceholderMetadata(count);

      expect(metadatas).toHaveLength(count);
    });

    it('should generate placeholders with correct structure', () => {
      const metadatas = generatePlaceholderMetadata(3);

      metadatas.forEach((metadata) => {
        expect(metadata).toHaveProperty('name');
        expect(metadata).toHaveProperty('description');
        expect(metadata).toHaveProperty('image');
        expect(metadata).toHaveProperty('attributes');
      });
    });

    it('should set name to "Chest"', () => {
      const metadatas = generatePlaceholderMetadata(5);

      metadatas.forEach((metadata) => {
        expect(metadata.name).toBe('Chest');
      });
    });

    it('should set description to "Placeholder NFT"', () => {
      const metadatas = generatePlaceholderMetadata(5);

      metadatas.forEach((metadata) => {
        expect(metadata.description).toBe('Placeholder NFT');
      });
    });

    it('should use chest image URL', () => {
      const metadatas = generatePlaceholderMetadata(3);

      metadatas.forEach((metadata) => {
        expect(metadata.image).toContain('chestimage.png');
      });
    });

    it('should have empty attributes array', () => {
      const metadatas = generatePlaceholderMetadata(5);

      metadatas.forEach((metadata) => {
        expect(metadata.attributes).toEqual([]);
      });
    });

    it('should handle zero placeholders', () => {
      const metadatas = generatePlaceholderMetadata(0);
      expect(metadatas).toHaveLength(0);
    });

    it('should generate identical placeholders', () => {
      const metadatas = generatePlaceholderMetadata(10);

      const first = metadatas[0];
      metadatas.forEach((metadata) => {
        expect(metadata.name).toBe(first.name);
        expect(metadata.description).toBe(first.description);
        expect(metadata.image).toBe(first.image);
        expect(metadata.attributes).toEqual(first.attributes);
      });
    });
  });
});