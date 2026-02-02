/**
 * Middleware para Rate Limiting
 * Fornece funções auxiliares para proteger rotas facilmente
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { 
  getClientIp, 
  createRateLimitKey, 
  checkRateLimit 
} from "./rate-limit";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyGenerator?: (request: NextRequest) => string;
  onLimitExceeded?: (request: NextRequest, resetIn: number) => Response;
}

/**
 * Middleware para rate limiting
 * Uso:
 * 
 * export const middleware = withRateLimit({
 *   limit: 10,
 *   windowMs: 60000,
 *   keyGenerator: (req) => `api:${getClientIp(req)}`
 * });
 */
export function withRateLimit(options: RateLimitOptions) {
  const { limit, windowMs, keyGenerator, onLimitExceeded } = options;

  return async (request: NextRequest) => {
    try {
      const key = keyGenerator?.(request) || `rate-limit:${getClientIp(request)}`;
      checkRateLimit(key, limit, windowMs);
      // Se passou no rate limit, continua para o handler
      return undefined;
    } catch (error: any) {
      const resetIn = error.resetIn || windowMs;
      const retryAfter = error.retryAfter || Math.ceil(resetIn / 1000);

      if (onLimitExceeded) {
        return onLimitExceeded(request, resetIn);
      }

      // Resposta padrão
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Reset": new Date(Date.now() + resetIn).toISOString(),
          },
        }
      );
    }
  };
}

/**
 * Helper para proteção de rotas de API
 * Uso em app/api/exemplo/route.ts:
 * 
 * const limiter = new RouteLimiter({
 *   limit: 10,
 *   window: 60 * 1000
 * });
 * 
 * export async function POST(request: Request) {
 *   const ip = getClientIp(request);
 *   const result = limiter.check(ip);
 *   
 *   if (!result.success) {
 *     return NextResponse.json(
 *       { error: 'Rate limit exceeded' },
 *       { status: 429, headers: limiter.getHeaders(result) }
 *     );
 *   }
 * 
 *   // ... resto do código
 * }
 */
export class RouteLimiter {
  private limit: number;
  private window: number;
  private prefix: string;

  constructor(options: { limit: number; window: number; prefix?: string }) {
    this.limit = options.limit;
    this.window = options.window;
    this.prefix = options.prefix || "route";
  }

  check(identifier: string) {
    const key = createRateLimitKey(this.prefix, identifier);
    try {
      const result = checkRateLimit(key, this.limit, this.window);
      return { success: true, ...result };
    } catch (error: any) {
      return {
        success: false,
        resetIn: error.resetIn,
        retryAfter: error.retryAfter,
      };
    }
  }

  getHeaders(result: { resetIn?: number; retryAfter?: number } = {}) {
    const resetIn = result.resetIn || this.window;
    const retryAfter = result.retryAfter || Math.ceil(resetIn / 1000);

    return {
      "Retry-After": retryAfter.toString(),
      "X-RateLimit-Reset": new Date(Date.now() + resetIn).toISOString(),
      "X-RateLimit-Limit": this.limit.toString(),
      "X-RateLimit-Window": this.window.toString(),
    };
  }

  getErrorResponse(result: { resetIn?: number; retryAfter?: number }) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: this.getHeaders(result),
      }
    );
  }
}

/**
 * Exemplos de uso:
 * 
 * // 1. Rate limit simples
 * const limiter = new RouteLimiter({ limit: 10, window: 60000, prefix: 'search' });
 * const result = limiter.check(userId);
 * if (!result.success) return limiter.getErrorResponse(result);
 * 
 * // 2. Com mensagem customizada
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Muitas buscas. Tente novamente em ' + Math.ceil(result.resetIn / 1000) + ' segundos.' },
 *     { status: 429, headers: limiter.getHeaders(result) }
 *   );
 * }
 */
