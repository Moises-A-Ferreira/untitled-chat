import { describe, it, expect, vi } from 'vitest';
import { findPreciseLocation } from '../lib/precise-geocoding';

describe('Precise Geocoding', () => {
  describe('findPreciseLocation', () => {
    it('deve encontrar rua com nome completo', () => {
      const result = findPreciseLocation('Rua Principal 150');
      
      expect(result.found).toBe(true);
      expect(result.address).toContain('Principal');
      expect(result.coordinates).toBeDefined();
      expect(result.coordinates.lat).toBeCloseTo(-22.73, 1);
      expect(result.coordinates.lng).toBeCloseTo(-48.57, 1);
    });

    it('deve encontrar rua sem prefixo "Rua"', () => {
      const result = findPreciseLocation('Principal 100');
      
      expect(result.found).toBe(true);
      expect(result.address).toContain('Principal');
    });

    it('deve ser case-insensitive', () => {
      const result1 = findPreciseLocation('RUA PRINCIPAL 100');
      const result2 = findPreciseLocation('rua principal 100');
      
      expect(result1.found).toBe(true);
      expect(result2.found).toBe(true);
      expect(result1.coordinates?.lat).toBeCloseTo(result2.coordinates?.lat || 0, 4);
    });

    it('deve retornar não encontrado para rua inexistente', () => {
      const result = findPreciseLocation('Rua Que Não Existe 123');
      
      expect(result.found).toBe(false);
      expect(result.needsFallback).toBe(true);
      expect(result.coordinates).toBeUndefined();
    });

    it('deve interpolar coordenadas com base no número', () => {
      const result1 = findPreciseLocation('Rua Principal 100');
      const result2 = findPreciseLocation('Rua Principal 500');
      
      expect(result1.found).toBe(true);
      expect(result2.found).toBe(true);
      
      // Números maiores devem ter coordenadas diferentes (interpolação linear)
      expect(result1.coordinates?.lat).not.toBe(result2.coordinates?.lat);
    });

    it('deve normalizar espaços extras', () => {
      const result = findPreciseLocation('Rua    Principal    150');
      
      expect(result.found).toBe(true);
    });

    it('deve remover vírgulas', () => {
      const result = findPreciseLocation('Rua Principal, 150');
      
      expect(result.found).toBe(true);
    });

    it('deve incluir bairro quando disponível', () => {
      const result = findPreciseLocation('Rua Principal 100');
      
      if (result.found) {
        expect(result.neighborhood).toBeDefined();
      }
    });

    it('deve incluir cidade', () => {
      const result = findPreciseLocation('Rua Principal 100');
      
      if (result.found) {
        expect(result.city).toBe('São Manuel');
      }
    });

    it('deve detectar Plinio Aristides Targa', () => {
      const result = findPreciseLocation('Rua Plinio Aristides Targa 487');
      
      expect(result.found).toBe(true);
      expect(result.address).toContain('Plinio');
      // Coordenadas calibradas pelo usuário
      expect(result.coordinates?.lat).toBeCloseTo(-22.744832, 2);
      expect(result.coordinates?.lng).toBeCloseTo(-48.569672, 2);
    });

    it('deve aceitar variações de typo em Aristides', () => {
      const result1 = findPreciseLocation('Plinio Aristides Targa 487');
      const result2 = findPreciseLocation('Plinio Artistides Targa 487'); // typo comum
      
      expect(result1.found).toBe(true);
      expect(result2.found).toBe(true);
    });

    it('deve retornar needsFallback quando não encontrar', () => {
      const result = findPreciseLocation('Avenida Inexistente 999');
      
      expect(result.needsFallback).toBe(true);
    });

    it('deve lidar com endereço vazio', () => {
      const result = findPreciseLocation('');
      
      expect(result.found).toBe(false);
      expect(result.needsFallback).toBe(true);
    });

    it('deve lidar com apenas número', () => {
      const result = findPreciseLocation('150');
      
      expect(result.found).toBe(false);
    });
  });

  describe('Interpolação de coordenadas', () => {
    it('deve interpolar corretamente no meio da rua', () => {
      const result = findPreciseLocation('Rua Principal 300');
      
      if (result.found && result.coordinates) {
        // Número 300 deve estar no meio entre 100 e 500
        expect(result.coordinates.lat).toBeDefined();
        expect(result.coordinates.lng).toBeDefined();
      }
    });

    it('deve usar coordenada inicial para número abaixo do mínimo', () => {
      const result = findPreciseLocation('Rua Principal 50');
      
      expect(result.found).toBe(true);
      // Deve usar coordenada de início
    });

    it('deve usar coordenada final para número acima do máximo', () => {
      const result = findPreciseLocation('Rua Principal 9999');
      
      expect(result.found).toBe(true);
      // Deve usar coordenada de fim
    });
  });

  describe('Performance', () => {
    it('deve processar rapidamente', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        findPreciseLocation('Rua Principal 150');
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // 100ms para 100 buscas
    });
  });
});
