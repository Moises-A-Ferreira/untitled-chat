/**
 * Tests for geocoding API (hybrid system: local database + Nominatim fallback)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { geocodeAddress } from '@/lib/geocoding-api';

// Mock axios
vi.mock('axios');

// Mock precise-geocoding module
vi.mock('@/lib/precise-geocoding', () => ({
  findPreciseLocation: vi.fn(),
}));

describe('geocoding-api.ts - geocodeAddress()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Local database geocoding (priority)', () => {
    it('should return local result when street is found in database', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: true,
        lat: -22.744832,
        lng: -48.569672,
        address: 'Rua Plinio Aristides Targa, 100',
        neighborhood: 'Centro',
        city: 'São Manuel',
        needsFallback: false,
      });

      const result = await geocodeAddress('Rua Plinio Aristides Targa, 100, São Manuel');

      expect(result.success).toBe(true);
      expect(result.data?.lat).toBe(-22.744832);
      expect(result.data?.lng).toBe(-48.569672);
      expect(result.data?.address.road).toBe('Rua Plinio Aristides Targa, 100');
      expect(result.data?.address.neighbourhood).toBe('Centro');
      expect(result.data?.address.city).toBe('São Manuel');
      expect(result.data?.address.state).toBe('São Paulo');
    });

    it('should format displayName correctly for local results', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: true,
        lat: -22.744832,
        lng: -48.569672,
        address: 'Rua Plinio Aristides Targa, 100',
        neighborhood: 'Centro',
        city: 'São Manuel',
        needsFallback: false,
      });

      const result = await geocodeAddress('Rua Plinio Aristides Targa, 100');

      expect(result.data?.displayName).toBe(
        'Rua Plinio Aristides Targa, 100, Centro, São Manuel - SP, Brasil'
      );
    });

    it('should include boundingbox in local results', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: true,
        lat: -22.744832,
        lng: -48.569672,
        address: 'Rua Plinio Aristides Targa, 100',
        neighborhood: 'Centro',
        city: 'São Manuel',
        needsFallback: false,
      });

      const result = await geocodeAddress('Rua Plinio Aristides Targa, 100');

      expect(result.data?.boundingbox).toEqual([
        String(-22.744832 - 0.001),
        String(-22.744832 + 0.001),
        String(-48.569672 - 0.001),
        String(-48.569672 + 0.001),
      ]);
    });

    it('should fallback to Nominatim when local result has needsFallback=true', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: false,
        lat: undefined,
        lng: undefined,
        address: '',
        neighborhood: '',
        city: '',
        needsFallback: true,
      });

      // Mock Nominatim response
      vi.mocked(axios.get).mockResolvedValue({
        data: [{
          lat: '-22.7311',
          lon: '-48.5706',
          display_name: 'Rua Desconhecida, São Manuel, SP, Brasil',
          address: {
            road: 'Rua Desconhecida',
            city: 'São Manuel',
            state: 'São Paulo',
          },
          boundingbox: ['-22.732', '-22.730', '-48.571', '-48.570'],
        }],
      });

      const result = await geocodeAddress('Rua Desconhecida, 100, São Manuel');

      expect(result.success).toBe(true);
      expect(axios.get).toHaveBeenCalled();
      expect(result.data?.lat).toBe(-22.7311);
      expect(result.data?.lng).toBe(-48.5706);
    });
  });

  describe('Nominatim API fallback', () => {
    beforeEach(() => {
      // Default: local database returns needsFallback
      import('@/lib/precise-geocoding').then(module => {
        vi.mocked(module.findPreciseLocation).mockReturnValue({
          success: false,
          lat: undefined,
          lng: undefined,
          address: '',
          neighborhood: '',
          city: '',
          needsFallback: true,
        });
      });
    });

    it('should call Nominatim API with correct parameters', async () => {
      const mockAxiosGet = vi.mocked(axios.get).mockResolvedValue({
        data: [{
          lat: '-22.7311',
          lon: '-48.5706',
          display_name: 'Test Street, São Manuel',
          address: {},
          boundingbox: ['-22.732', '-22.730', '-48.571', '-48.570'],
        }],
      });

      await geocodeAddress('Rua Teste, 100, São Manuel');

      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search',
        expect.objectContaining({
          params: expect.objectContaining({
            format: 'json',
            addressdetails: 1,
            countrycodes: 'BR',
            bounded: 1,
            'accept-language': 'pt-BR,pt',
          }),
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('SaoManuel-Ocorrencias-App'),
          }),
          timeout: 5000,
        })
      );
    });

    it('should try multiple search queries', async () => {
      const mockAxiosGet = vi.mocked(axios.get);
      
      // First 3 queries return empty, 4th returns result
      mockAxiosGet
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [{
            lat: '-22.7311',
            lon: '-48.5706',
            display_name: 'Rua Teste, São Manuel',
            address: { road: 'Rua Teste' },
            boundingbox: ['-22.732', '-22.730', '-48.571', '-48.570'],
          }],
        });

      const result = await geocodeAddress('Rua Teste, 100');

      expect(result.success).toBe(true);
      expect(mockAxiosGet).toHaveBeenCalledTimes(4);
    });

    it('should filter results to São Manuel area only', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: [
          {
            // Result far from São Manuel (should be filtered out)
            lat: '-23.5505', // São Paulo city
            lon: '-46.6333',
            display_name: 'Rua Teste, São Paulo',
            address: {},
            boundingbox: ['-23.551', '-23.550', '-46.634', '-46.633'],
          },
          {
            // Result in São Manuel (should be selected)
            lat: '-22.7311',
            lon: '-48.5706',
            display_name: 'Rua Teste, São Manuel',
            address: { road: 'Rua Teste' },
            boundingbox: ['-22.732', '-22.730', '-48.571', '-48.570'],
          },
        ],
      });

      const result = await geocodeAddress('Rua Teste');

      expect(result.success).toBe(true);
      expect(result.data?.lat).toBe(-22.7311);
      expect(result.data?.lng).toBe(-48.5706);
    });

    it('should return error when Nominatim returns empty results', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: [] });

      const result = await geocodeAddress('Endereço Inexistente 9999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('não foi possível geocodificar');
    });

    it('should handle Nominatim API errors gracefully', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

      const result = await geocodeAddress('Rua Teste, 100');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro ao buscar coordenadas');
    });

    it('should handle Nominatim timeout', async () => {
      vi.mocked(axios.get).mockRejectedValue({ code: 'ECONNABORTED' });

      const result = await geocodeAddress('Rua Teste, 100');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should include user agent in Nominatim requests', async () => {
      const mockAxiosGet = vi.mocked(axios.get).mockResolvedValue({
        data: [{
          lat: '-22.7311',
          lon: '-48.5706',
          display_name: 'Test',
          address: {},
          boundingbox: ['-22.732', '-22.730', '-48.571', '-48.570'],
        }],
      });

      await geocodeAddress('Rua Teste');

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'User-Agent': 'SaoManuel-Ocorrencias-App/1.0 (contato@saomanuel.sp.gov.br)',
          },
        })
      );
    });

    it('should set São Manuel viewbox for prioritized search', async () => {
      const mockAxiosGet = vi.mocked(axios.get).mockResolvedValue({
        data: [{
          lat: '-22.7311',
          lon: '-48.5706',
          display_name: 'Test',
          address: {},
          boundingbox: ['-22.732', '-22.730', '-48.571', '-48.570'],
        }],
      });

      await geocodeAddress('Rua Teste');

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            viewbox: '-48.6000,-22.7000,-48.5400,-22.7600',
            bounded: 1,
          }),
        })
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should prefer local database over Nominatim when both available', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      // Local database has result
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: true,
        lat: -22.744832,
        lng: -48.569672,
        address: 'Rua Plinio Aristides Targa, 100',
        neighborhood: 'Centro',
        city: 'São Manuel',
        needsFallback: false,
      });

      // Nominatim also would return result (but should not be called)
      vi.mocked(axios.get).mockResolvedValue({
        data: [{
          lat: '-22.7300',
          lon: '-48.5700',
          display_name: 'Different Result',
          address: {},
          boundingbox: ['-22.731', '-22.729', '-48.571', '-48.569'],
        }],
      });

      const result = await geocodeAddress('Rua Plinio Aristides Targa, 100');

      // Should use local result
      expect(result.data?.lat).toBe(-22.744832);
      expect(result.data?.lng).toBe(-48.569672);
      
      // Should not call Nominatim
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should handle empty address string', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: false,
        lat: undefined,
        lng: undefined,
        address: '',
        neighborhood: '',
        city: '',
        needsFallback: true,
      });

      vi.mocked(axios.get).mockResolvedValue({ data: [] });

      const result = await geocodeAddress('');

      expect(result.success).toBe(false);
    });

    it('should handle address with special characters', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: false,
        lat: undefined,
        lng: undefined,
        address: '',
        neighborhood: '',
        city: '',
        needsFallback: true,
      });

      vi.mocked(axios.get).mockResolvedValue({
        data: [{
          lat: '-22.7311',
          lon: '-48.5706',
          display_name: 'Rua José Ângelo, São Manuel',
          address: { road: 'Rua José Ângelo' },
          boundingbox: ['-22.732', '-22.730', '-48.571', '-48.570'],
        }],
      });

      const result = await geocodeAddress('Rua José Ângelo, 100, São Manuel');

      expect(result.success).toBe(true);
      expect(result.data?.address.road).toBe('Rua José Ângelo');
    });

    it('should maintain performance under 200ms for local database hits', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: true,
        lat: -22.744832,
        lng: -48.569672,
        address: 'Rua Plinio Aristides Targa, 100',
        neighborhood: 'Centro',
        city: 'São Manuel',
        needsFallback: false,
      });

      const startTime = performance.now();
      await geocodeAddress('Rua Plinio Aristides Targa, 100');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed Nominatim responses', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: false,
        lat: undefined,
        lng: undefined,
        address: '',
        neighborhood: '',
        city: '',
        needsFallback: true,
      });

      vi.mocked(axios.get).mockResolvedValue({
        data: [{
          // Missing lat/lon
          display_name: 'Test',
        }],
      });

      const result = await geocodeAddress('Rua Teste');

      expect(result.success).toBe(false);
    });

    it('should handle Nominatim rate limiting (429)', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: false,
        lat: undefined,
        lng: undefined,
        address: '',
        neighborhood: '',
        city: '',
        needsFallback: true,
      });

      vi.mocked(axios.get).mockRejectedValue({
        response: { status: 429 },
        message: 'Too Many Requests',
      });

      const result = await geocodeAddress('Rua Teste');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle coordinates outside expected ranges', async () => {
      const { findPreciseLocation } = await import('@/lib/precise-geocoding');
      
      vi.mocked(findPreciseLocation).mockReturnValue({
        success: false,
        lat: undefined,
        lng: undefined,
        address: '',
        neighborhood: '',
        city: '',
        needsFallback: true,
      });

      vi.mocked(axios.get).mockResolvedValue({
        data: [{
          lat: '999', // Invalid latitude
          lon: '999', // Invalid longitude
          display_name: 'Invalid Location',
          address: {},
          boundingbox: ['999', '999', '999', '999'],
        }],
      });

      const result = await geocodeAddress('Rua Teste');

      // Should filter out invalid coordinates (not within São Manuel area)
      expect(result.success).toBe(false);
    });
  });
});
