import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GeocodingCache } from '@/lib/geocoding-cache';

describe('GeocodingCache', () => {
  let cache: GeocodingCache;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();

    Object.defineProperty(global, 'window', {
      value: {
        localStorage: localStorageMock,
      },
      writable: true,
    });

    cache = new GeocodingCache();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Operações Básicas', () => {
    it('deve armazenar e recuperar dados', () => {
      const testData = { success: true, data: { lat: -22.7311, lng: -48.5706 } };
      
      cache.set('Rua Principal 150', testData);
      const result = cache.get('Rua Principal 150');
      
      expect(result).toEqual(testData);
    });

    it('deve retornar null para chave inexistente', () => {
      const result = cache.get('Endereço Inexistente');
      expect(result).toBeNull();
    });

    it('deve normalizar chaves (case insensitive)', () => {
      const testData = { success: true };
      
      cache.set('Rua Principal 150', testData);
      
      expect(cache.get('RUA PRINCIPAL 150')).toEqual(testData);
      expect(cache.get('rua principal 150')).toEqual(testData);
      expect(cache.get('Rua   Principal   150')).toEqual(testData);
    });

    it('deve remover espaços extras da chave', () => {
      const testData = { success: true };
      
      cache.set('Rua    Principal    150', testData);
      
      expect(cache.get('Rua Principal 150')).toEqual(testData);
    });

    it('deve deletar entrada específica', () => {
      cache.set('Rua Principal 150', { success: true });
      expect(cache.has('Rua Principal 150')).toBe(true);
      
      cache.delete('Rua Principal 150');
      expect(cache.has('Rua Principal 150')).toBe(false);
    });

    it('deve limpar todo o cache', () => {
      cache.set('Endereço 1', { success: true });
      cache.set('Endereço 2', { success: true });
      cache.set('Endereço 3', { success: true });
      
      expect(cache.getStats().size).toBe(3);
      
      cache.clear();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('deve expirar entradas após TTL', () => {
      vi.useFakeTimers();
      
      const testData = { success: true };
      const ttl = 1000; // 1 segundo
      
      cache.set('Rua Principal 150', testData, ttl);
      
      // Antes de expirar
      expect(cache.get('Rua Principal 150')).toEqual(testData);
      
      // Avançar tempo além do TTL
      vi.advanceTimersByTime(1001);
      
      // Depois de expirar
      expect(cache.get('Rua Principal 150')).toBeNull();
      
      vi.useRealTimers();
    });

    it('deve usar TTL padrão se não especificado', () => {
      const testData = { success: true };
      cache.set('Rua Principal 150', testData);
      
      // Deve estar no cache (TTL padrão é 24h)
      expect(cache.get('Rua Principal 150')).toEqual(testData);
    });

    it('deve permitir TTLs diferentes para entradas diferentes', () => {
      vi.useFakeTimers();
      
      cache.set('Local', { type: 'local' }, 7 * 24 * 60 * 60 * 1000); // 7 dias
      cache.set('API', { type: 'api' }, 24 * 60 * 60 * 1000); // 24 horas
      cache.set('Error', { type: 'error' }, 5 * 60 * 1000); // 5 minutos
      
      // Após 6 minutos
      vi.advanceTimersByTime(6 * 60 * 1000);
      
      expect(cache.get('Local')).toBeTruthy(); // Ainda válido
      expect(cache.get('API')).toBeTruthy(); // Ainda válido
      expect(cache.get('Error')).toBeNull(); // Expirado
      
      vi.useRealTimers();
    });
  });

  describe('Estatísticas e Métricas', () => {
    it('deve contar hits corretamente', () => {
      cache.set('Rua Principal 150', { success: true });
      
      cache.get('Rua Principal 150'); // hit
      cache.get('Rua Principal 150'); // hit
      cache.get('Rua Principal 150'); // hit
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
    });

    it('deve contar misses corretamente', () => {
      cache.get('Inexistente 1'); // miss
      cache.get('Inexistente 2'); // miss
      cache.get('Inexistente 3'); // miss
      
      const stats = cache.getStats();
      expect(stats.misses).toBe(3);
    });

    it('deve calcular hit rate corretamente', () => {
      cache.set('Endereço 1', { success: true });
      cache.set('Endereço 2', { success: true });
      
      cache.get('Endereço 1'); // hit
      cache.get('Endereço 2'); // hit
      cache.get('Inexistente 1'); // miss
      cache.get('Inexistente 2'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(50); // 2/4 = 50%
    });

    it('deve rastrear tamanho do cache', () => {
      expect(cache.getStats().size).toBe(0);
      
      cache.set('Endereço 1', { success: true });
      expect(cache.getStats().size).toBe(1);
      
      cache.set('Endereço 2', { success: true });
      expect(cache.getStats().size).toBe(2);
      
      cache.delete('Endereço 1');
      expect(cache.getStats().size).toBe(1);
    });

    it('deve retornar hit rate 0 quando não há requisições', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('LRU (Least Recently Used)', () => {
    it('deve remover entrada mais antiga quando cache está cheio', () => {
      vi.useFakeTimers();
      const startTime = Date.now();
      
      // Criar cache com limite baixo para teste
      const smallCache = new GeocodingCache();
      
      // Adicionar entradas até o limite (assumindo maxCacheSize = 100)
      for (let i = 0; i < 100; i++) {
        vi.setSystemTime(startTime + i * 1000);
        smallCache.set(`Endereço ${i}`, { id: i });
      }
      
      expect(smallCache.getStats().size).toBe(100);
      
      // Adicionar mais uma - deve remover a mais antiga (Endereço 0)
      vi.setSystemTime(startTime + 101 * 1000);
      smallCache.set('Endereço Nova', { id: 101 });
      
      expect(smallCache.has('Endereço 0')).toBe(false); // Removida (mais antiga)
      expect(smallCache.has('Endereço Nova')).toBe(true); // Adicionada
      expect(smallCache.getStats().size).toBe(100); // Mantém limite
      
      vi.useRealTimers();
    });
  });

  describe('Persistência', () => {
    it('deve salvar no localStorage ao adicionar entrada', () => {
      cache.set('Rua Principal 150', { success: true });
      
      const stored = localStorage.getItem('geocoding-cache');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('deve carregar do localStorage na inicialização', () => {
      // Salvar dados
      cache.set('Rua Principal 150', { success: true, test: 'data' });
      
      // Criar novo cache (simula recarregar página)
      const newCache = new GeocodingCache();
      
      // Deve ter carregado os dados
      const result = newCache.get('Rua Principal 150');
      expect(result).toEqual({ success: true, test: 'data' });
    });

    it('deve limpar localStorage ao limpar cache', () => {
      cache.set('Rua Principal 150', { success: true });
      expect(localStorage.getItem('geocoding-cache')).toBeTruthy();
      
      cache.clear();
      expect(localStorage.getItem('geocoding-cache')).toBeNull();
    });

    it('deve calcular tamanho em KB', () => {
      cache.set('Endereço 1', { success: true, data: 'x'.repeat(1000) });
      
      const sizeKB = cache.getSizeInKB();
      expect(sizeKB).toBeGreaterThan(0);
    });
  });

  describe('Limpeza Automática', () => {
    it('deve remover entradas expiradas durante cleanup', () => {
      vi.useFakeTimers();
      
      // Adicionar entradas com TTLs curtos
      cache.set('Expira Rápido', { data: 1 }, 1000); // 1 segundo
      cache.set('Expira Lento', { data: 2 }, 10000); // 10 segundos
      
      expect(cache.getStats().size).toBe(2);
      
      // Avançar tempo para expirar apenas a primeira
      vi.advanceTimersByTime(1500);
      
      // Forçar limpeza (normalmente acontece a cada 1h)
      // @ts-ignore - acessar método privado para teste
      cache.cleanup();
      
      expect(cache.has('Expira Rápido')).toBe(false);
      expect(cache.has('Expira Lento')).toBe(true);
      expect(cache.getStats().size).toBe(1);
      
      vi.useRealTimers();
    });

    it('deve limpar entradas expiradas ao carregar do localStorage', () => {
      vi.useFakeTimers();
      const now = Date.now();
      
      // Criar entrada que já expirou
      cache.set('Expirado', { data: 'old' }, 1000);
      
      // Avançar tempo para expirar
      vi.advanceTimersByTime(2000);
      
      // Criar novo cache - deve limpar expirados ao carregar
      const newCache = new GeocodingCache();
      
      expect(newCache.has('Expirado')).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('Verificação de Existência', () => {
    it('deve verificar se entrada existe e está válida', () => {
      cache.set('Rua Principal 150', { success: true });
      
      expect(cache.has('Rua Principal 150')).toBe(true);
      expect(cache.has('Inexistente')).toBe(false);
    });

    it('deve retornar false para entradas expiradas', () => {
      vi.useFakeTimers();
      
      cache.set('Rua Principal 150', { success: true }, 1000);
      
      expect(cache.has('Rua Principal 150')).toBe(true);
      
      vi.advanceTimersByTime(1001);
      
      expect(cache.has('Rua Principal 150')).toBe(false);
      
      vi.useRealTimers();
    });
  });

  describe('Listagem de Chaves', () => {
    it('deve retornar array de chaves', () => {
      cache.set('Endereço 1', { data: 1 });
      cache.set('Endereço 2', { data: 2 });
      cache.set('Endereço 3', { data: 3 });
      
      const keys = cache.keys();
      
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBe(3);
    });

    it('deve retornar array vazio para cache vazio', () => {
      const keys = cache.keys();
      
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBe(0);
    });
  });

  describe('Casos Edge', () => {
    it('deve lidar com dados nulos', () => {
      cache.set('Null Data', null);
      
      const result = cache.get('Null Data');
      expect(result).toBeNull();
    });

    it('deve lidar com objetos complexos', () => {
      const complexData = {
        success: true,
        data: {
          coordinates: { lat: -22.7311, lng: -48.5706 },
          address: {
            street: 'Rua Principal',
            number: 150,
            metadata: {
              verified: true,
              timestamp: Date.now(),
            },
          },
        },
        suggestions: ['Sugestão 1', 'Sugestão 2'],
      };
      
      cache.set('Complexo', complexData);
      const result = cache.get('Complexo');
      
      expect(result).toEqual(complexData);
    });

    it('deve lidar com caracteres especiais nas chaves', () => {
      const testData = { success: true };
      
      cache.set('Rua São João, 123 - Centro', testData);
      const result = cache.get('Rua São João, 123 - Centro');
      
      expect(result).toEqual(testData);
    });

    it('deve lidar com localStorage cheio graciosamente', () => {
      // Mock localStorage.setItem para simular quota exceeded
      const originalSetItem = window.localStorage.setItem;
      window.localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });
      
      // Não deve lançar erro
      expect(() => {
        cache.set('Test', { data: 'test' });
      }).not.toThrow();
      
      // Restaurar
      window.localStorage.setItem = originalSetItem;
    });

    it('deve lidar com localStorage corrompido', () => {
      // Corromper localStorage
      window.localStorage.setItem('geocoding-cache', 'invalid json{[');
      
      // Criar novo cache - não deve lançar erro
      expect(() => {
        const newCache = new GeocodingCache();
      }).not.toThrow();
    });
  });
});
