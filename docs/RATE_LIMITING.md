# Rate Limiting - Documentação

## 📋 Visão Geral

Sistema de proteção contra brute force e DoS attacks implementado em `lib/rate-limit.ts`. O sistema usa memória em tempo de execução (Map) com limpeza automática de entradas expiradas.

## 🛡️ Políticas Implementadas

### 1. **Login** - 5 tentativas por 15 minutos
- **Arquivo:** `app/api/auth/login/route.ts`
- **Objetivo:** Proteger contra ataques de força bruta
- **Limite:** 5 tentativas por IP
- **Janela:** 15 minutos
- **Resposta:** HTTP 429 com header `Retry-After: 900`

### 2. **Registro** - 3 contas por hora
- **Arquivo:** `app/api/auth/register/route.ts`
- **Objetivo:** Prevenir spam e criação em massa de contas
- **Limite:** 3 registros por IP
- **Janela:** 1 hora
- **Resposta:** HTTP 429 com header `Retry-After: 3600`

### 3. **Ocorrências** - 10 por hora por usuário
- **Arquivo:** `app/api/ocorrencias/route.ts`
- **Objetivo:** Evitar spam de reportes
- **Limite:** 10 ocorrências por usuário
- **Janela:** 1 hora
- **Resposta:** HTTP 429 com mensagem dinâmica

### 4. **Geocodificação** - 20 por minuto
- **Arquivo:** `app/api/geocode/route.ts`
- **Objetivo:** Proteger contra consumo excessivo do Nominatim
- **Limite:** 20 requisições por IP
- **Janela:** 1 minuto
- **Resposta:** HTTP 429 com header `Retry-After`

## 🔧 Como Usar

### Em Novos Endpoints

```typescript
import { 
  getClientIp, 
  createRateLimitKey, 
  checkRateLimit,
  RATE_LIMITS 
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Rate limiting
  try {
    const ip = getClientIp(request);
    const key = createRateLimitKey('meu_endpoint', ip);
    checkRateLimit(key, 10, 60 * 1000); // 10 por minuto
  } catch (error: any) {
    return NextResponse.json(
      { error: "Limite excedido. Tente novamente em " + Math.ceil(error.resetIn / 1000) + " segundos." },
      { 
        status: 429,
        headers: {
          'Retry-After': error.retryAfter?.toString() || '60',
        }
      }
    );
  }

  // ... resto do código
}
```

### Usando Middleware Centralizado

```typescript
import { RouteLimiter } from "@/lib/rate-limit-middleware";
import { getClientIp } from "@/lib/rate-limit";

const limiter = new RouteLimiter({
  limit: 10,
  window: 60 * 1000,
  prefix: 'search'
});

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const result = limiter.check(ip);

  if (!result.success) {
    return limiter.getErrorResponse(result);
  }

  // ... resto do código
}
```

## 📊 Headers Retornados (429)

Quando rate limit é excedido, a resposta inclui:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Reset: 2026-01-26T10:30:45.000Z
X-RateLimit-Limit: 10
X-RateLimit-Window: 60000
```

## 🧪 Testando

```bash
# Executar suite de testes
npx tsx test-rate-limit.ts
```

Resultado esperado:
- ✅ Login: bloqueado na 6ª tentativa
- ✅ Registro: bloqueado no 4º registro
- ✅ Ocorrências: bloqueado na 11ª ocorrência
- ✅ Geocode: bloqueado na 21ª requisição
- ✅ Reset funciona corretamente

## 🔐 Segurança

### Extração de IP

O sistema tenta extrair o IP do cliente em ordem de prioridade:

1. Header `x-forwarded-for` (proxies)
2. `request.socket.remoteAddress` (conexão direta)
3. `'unknown'` (fallback)

### Limpeza Automática

- Entradas expiradas são removidas a cada 1 minuto
- Memória não cresce infinitamente
- Ideal para até ~1000 usuários simultâneos

## 📈 Escalabilidade Futura

Para produção com grande volume:

```typescript
// Usar Redis em vez de Map
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimitRedis(key: string, limit: number, windowMs: number) {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000));
  }
  if (count > limit) {
    throw new Error('Rate limit exceeded');
  }
}
```

## 📝 Melhorias Futuras

- [ ] Persistência em Redis para estado entre deploys
- [ ] Dashboard de monitoramento de rate limits
- [ ] Whitelist de IPs confiáveis
- [ ] Rate limits dinâmicos baseados em carga do servidor
- [ ] Integration com Sentry para alertas

## 🐛 Troubleshooting

### "Rate limit exceeded" nos testes locais?

Aguarde 15 minutos ou execute:

```typescript
import { limiter } from '@/lib/rate-limit';

// Resetar manualmente
limiter.reset('login:seu_ip');
```

### IP incorreto em ambiente de produção?

Configure proxy headers no nginx/Apache:

```nginx
# nginx.conf
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Real-IP $remote_addr;
```

---

**Última atualização:** 26 de janeiro de 2026  
**Status:** ✅ Implementado e testado
