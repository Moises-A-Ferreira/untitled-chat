import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { limiter, RATE_LIMITS, createRateLimitKey, checkRateLimit, getClientIp } from '../lib/rate-limit';

describe('Rate Limiting System', () => {
  beforeEach(() => {
    // Limpar todos os rate limits antes de cada teste
    limiter['store'].clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createRateLimitKey', () => {
    it('deve criar chave com tipo e identificador', () => {
      const key = createRateLimitKey('login', '192.168.1.1');
      expect(key).toBe('login:192.168.1.1');
    });

    it('deve aceitar números como identificador', () => {
      const key = createRateLimitKey('ocorrencia', 123);
      expect(key).toBe('ocorrencia:123');
    });
  });

  describe('getClientIp', () => {
    it('deve extrair IP do header x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' },
      });
      expect(getClientIp(request)).toBe('203.0.113.1');
    });

    it('deve retornar "unknown" quando não há header', () => {
      const request = new Request('http://localhost');
      expect(getClientIp(request)).toBe('unknown');
    });

    it('deve fazer trim do IP', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '  192.168.1.1  ' },
      });
      expect(getClientIp(request)).toBe('192.168.1.1');
    });
  });

  describe('RateLimiter.check', () => {
    it('deve permitir primeira requisição', () => {
      const result = limiter.check('test:user1', 5, 60000);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('deve decrementar remaining a cada requisição', () => {
      limiter.check('test:user2', 3, 60000);
      limiter.check('test:user2', 3, 60000);
      const result = limiter.check('test:user2', 3, 60000);
      
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('deve bloquear após exceder limite', () => {
      const key = 'test:user3';
      const limit = 2;

      limiter.check(key, limit, 60000);
      limiter.check(key, limit, 60000);
      const result = limiter.check(key, limit, 60000);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('deve incluir resetIn em segundos', () => {
      const key = 'test:user4';
      limiter.check(key, 1, 60000);
      const result = limiter.check(key, 1, 60000);

      expect(result.success).toBe(false);
      expect(result.resetIn).toBeGreaterThan(0);
      expect(result.resetIn).toBeLessThanOrEqual(60000);
    });

    it('deve resetar após janela expirar', () => {
      const key = 'test:user5';
      const windowMs = 100; // 100ms para teste rápido

      limiter.check(key, 1, windowMs);
      limiter.check(key, 1, windowMs); // Bloqueia

      // Aguardar janela expirar
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = limiter.check(key, 1, windowMs);
          expect(result.success).toBe(true);
          resolve();
        }, 150);
      });
    });
  });

  describe('checkRateLimit helper', () => {
    it('deve permitir requisições dentro do limite', () => {
      expect(() => {
        checkRateLimit('test:user6', 5, 60000);
      }).not.toThrow();
    });

    it('deve lançar erro ao exceder limite', () => {
      const key = 'test:user7';
      checkRateLimit(key, 1, 60000);

      expect(() => {
        checkRateLimit(key, 1, 60000);
      }).toThrow('Too Many Requests');
    });

    it('erro deve conter status 429', () => {
      const key = 'test:user8';
      checkRateLimit(key, 1, 60000);

      try {
        checkRateLimit(key, 1, 60000);
        expect.fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.status).toBe(429);
        expect(error.retryAfter).toBeGreaterThan(0);
      }
    });
  });

  describe('RATE_LIMITS políticas', () => {
    it('LOGIN: 5 tentativas por 15 minutos', () => {
      expect(RATE_LIMITS.LOGIN.limit).toBe(5);
      expect(RATE_LIMITS.LOGIN.window).toBe(15 * 60 * 1000);
      expect(RATE_LIMITS.LOGIN.key).toBe('login');
    });

    it('REGISTER: 3 contas por hora', () => {
      expect(RATE_LIMITS.REGISTER.limit).toBe(3);
      expect(RATE_LIMITS.REGISTER.window).toBe(60 * 60 * 1000);
      expect(RATE_LIMITS.REGISTER.key).toBe('register');
    });

    it('CREATE_OCORRENCIA: 10 por hora', () => {
      expect(RATE_LIMITS.CREATE_OCORRENCIA.limit).toBe(10);
      expect(RATE_LIMITS.CREATE_OCORRENCIA.window).toBe(60 * 60 * 1000);
      expect(RATE_LIMITS.CREATE_OCORRENCIA.key).toBe('ocorrencia');
    });

    it('GEOCODE: 20 por minuto', () => {
      expect(RATE_LIMITS.GEOCODE.limit).toBe(20);
      expect(RATE_LIMITS.GEOCODE.window).toBe(60 * 1000);
      expect(RATE_LIMITS.GEOCODE.key).toBe('geocode');
    });
  });

  describe('RateLimiter.reset', () => {
    it('deve resetar contador específico', () => {
      const key = 'test:user9';
      checkRateLimit(key, 1, 60000);

      limiter.reset(key);

      expect(() => {
        checkRateLimit(key, 1, 60000);
      }).not.toThrow();
    });

    it('deve preservar outros contadores', () => {
      const key1 = 'test:user10';
      const key2 = 'test:user11';

      checkRateLimit(key1, 1, 60000);
      checkRateLimit(key2, 1, 60000);

      limiter.reset(key1);

      expect(() => checkRateLimit(key1, 1, 60000)).not.toThrow();
      expect(() => checkRateLimit(key2, 1, 60000)).toThrow();
    });
  });

  describe('Limpeza automática', () => {
    it('deve remover entradas expiradas', () => {
      const key = 'test:cleanup';
      limiter.check(key, 1, 50); // Janela muito curta

      expect(limiter.getStatus(key)).not.toBeNull();

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          limiter['cleanup']();
          expect(limiter.getStatus(key)).toBeNull();
          resolve();
        }, 100);
      });
    });
  });

  describe('Cenários de uso real', () => {
    it('cenário: brute force de login', () => {
      const ip = '192.168.1.100';
      const key = createRateLimitKey('login', ip);

      // 5 tentativas permitidas
      for (let i = 0; i < 5; i++) {
        expect(() => checkRateLimit(key, 5, 15 * 60 * 1000)).not.toThrow();
      }

      // 6ª tentativa bloqueada
      expect(() => checkRateLimit(key, 5, 15 * 60 * 1000)).toThrow('Too Many Requests');
    });

    it('cenário: spam de registros', () => {
      const ip = '203.0.113.50';
      const key = createRateLimitKey('register', ip);

      // 3 registros permitidos
      for (let i = 0; i < 3; i++) {
        expect(() => checkRateLimit(key, 3, 60 * 60 * 1000)).not.toThrow();
      }

      // 4º registro bloqueado
      expect(() => checkRateLimit(key, 3, 60 * 60 * 1000)).toThrow();
    });

    it('cenário: múltiplos usuários independentes', () => {
      const user1 = 'test:user_a';
      const user2 = 'test:user_b';

      checkRateLimit(user1, 1, 60000);
      
      // user1 bloqueado, mas user2 não
      expect(() => checkRateLimit(user1, 1, 60000)).toThrow();
      expect(() => checkRateLimit(user2, 1, 60000)).not.toThrow();
    });
  });
});
