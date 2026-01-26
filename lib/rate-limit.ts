/**
 * Rate Limiting System
 * Protege APIs contra brute force e DoS attacks
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Armazenamento em memória com limpeza automática
class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs = 60000) {
    // Limpar entradas expiradas a cada minuto
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Verifica e incrementa contador de rate limit
   * @param key Identificador único (IP, user_id, email, etc)
   * @param limit Máximo de requisições permitidas
   * @param windowMs Janela de tempo em milissegundos
   * @returns { success: boolean, remaining: number, resetIn: number }
   */
  check(
    key: string,
    limit: number,
    windowMs: number
  ): {
    success: boolean;
    remaining: number;
    resetIn: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const entry = this.store.get(key);

    // Primeira requisição ou janela expirou
    if (!entry || entry.resetTime < now) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        success: true,
        remaining: limit - 1,
        resetIn: windowMs,
      };
    }

    // Janela ativa
    entry.count++;
    const remaining = Math.max(0, limit - entry.count);
    const resetIn = Math.max(0, entry.resetTime - now);

    if (entry.count > limit) {
      return {
        success: false,
        remaining: 0,
        resetIn,
        retryAfter: Math.ceil(resetIn / 1000), // em segundos
      };
    }

    return {
      success: true,
      remaining,
      resetIn,
    };
  }

  reset(key?: string) {
    if (!key) {
      this.store.clear();
      return;
    }
    this.store.delete(key);
  }

  getStatus(key: string) {
    const entry = this.store.get(key);
    if (!entry) return null;
    return {
      count: entry.count,
      resetTime: new Date(entry.resetTime),
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Instância global
export const limiter = new RateLimiter();

/**
 * Políticas de rate limit pré-configuradas
 */
export const RATE_LIMITS = {
  // Login: 5 tentativas por 15 minutos (protege contra brute force)
  LOGIN: { limit: 5, window: 15 * 60 * 1000, key: 'login' },

  // Registro: 3 contas por hora por IP (protege contra spam)
  REGISTER: { limit: 3, window: 60 * 60 * 1000, key: 'register' },

  // Ocorrências: 10 por hora por usuário
  CREATE_OCORRENCIA: { limit: 10, window: 60 * 60 * 1000, key: 'ocorrencia' },

  // Geocoding: 20 por minuto por IP (limite Nominatim é 1 req/s)
  GEOCODE: { limit: 20, window: 60 * 1000, key: 'geocode' },

  // API geral: 100 por minuto por IP
  API_GENERAL: { limit: 100, window: 60 * 1000, key: 'api' },

  // Busca: 30 por minuto
  SEARCH: { limit: 30, window: 60 * 1000, key: 'search' },
};

/**
 * Extrai o IP do cliente da requisição
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

/**
 * Cria uma chave de rate limit combinando tipo + identificador
 */
export function createRateLimitKey(
  type: string,
  identifier: string | number
): string {
  return `${type}:${identifier}`;
}

/**
 * Função utilitária para verificar rate limit e lançar erro
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
) {
  const result = limiter.check(key, limit, windowMs);

  if (!result.success) {
    const error = new Error('Too Many Requests');
    (error as any).status = 429;
    (error as any).retryAfter = result.retryAfter;
    (error as any).resetIn = result.resetIn;
    throw error;
  }

  return result;
}

/**
 * Exemplo de uso:
 * 
 * // Em um endpoint
 * export async function POST(request: Request) {
 *   const ip = getClientIp(request);
 *   const key = createRateLimitKey('login', ip);
 *   
 *   try {
 *     checkRateLimit(key, 5, 15 * 60 * 1000);
 *   } catch (error) {
 *     return NextResponse.json(
 *       { error: 'Too many login attempts. Try again later.' },
 *       { 
 *         status: 429,
 *         headers: {
 *           'Retry-After': error.retryAfter.toString(),
 *         }
 *       }
 *     );
 *   }
 *   
 *   // ... resto do código
 * }
 */
