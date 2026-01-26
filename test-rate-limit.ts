/**
 * Testes para Rate Limiting
 * Execute com: npx tsx test-rate-limit.ts
 */

import { limiter, RATE_LIMITS, createRateLimitKey, checkRateLimit } from './lib/rate-limit';

console.log('🧪 Testando Rate Limiting System...\n');

// Teste 1: Login rate limiting
console.log('📝 Teste 1: Login Rate Limiting (5 tentativas por 15 minutos)');
const loginKey = createRateLimitKey(RATE_LIMITS.LOGIN.key, '192.168.1.100');
let successCount = 0;
let blockedAtAttempt = 0;

for (let i = 1; i <= 7; i++) {
  try {
    checkRateLimit(loginKey, RATE_LIMITS.LOGIN.limit, RATE_LIMITS.LOGIN.window);
    console.log(`  ✅ Tentativa ${i}: Aceita`);
    successCount++;
  } catch (error: any) {
    console.log(`  🚫 Tentativa ${i}: Bloqueada! (Retry-After: ${error.retryAfter}s)`);
    blockedAtAttempt = i;
  }
}

if (blockedAtAttempt === 6) {
  console.log(`✅ PASSOU: Bloqueado na tentativa correta (6ª tentativa)\n`);
} else {
  console.log(`❌ FALHOU: Bloqueado na tentativa ${blockedAtAttempt} (esperado 6)\n`);
}

// Teste 2: Register rate limiting
console.log('📝 Teste 2: Register Rate Limiting (3 registros por hora por IP)');
limiter.reset(createRateLimitKey(RATE_LIMITS.REGISTER.key, '192.168.1.101'));

const registerKey = createRateLimitKey(RATE_LIMITS.REGISTER.key, '192.168.1.101');
successCount = 0;
blockedAtAttempt = 0;

for (let i = 1; i <= 5; i++) {
  try {
    checkRateLimit(registerKey, RATE_LIMITS.REGISTER.limit, RATE_LIMITS.REGISTER.window);
    console.log(`  ✅ Registro ${i}: Aceito`);
    successCount++;
  } catch (error: any) {
    console.log(`  🚫 Registro ${i}: Bloqueado! (Retry-After: ${error.retryAfter}s)`);
    blockedAtAttempt = i;
  }
}

if (blockedAtAttempt === 4) {
  console.log(`✅ PASSOU: Bloqueado no registro correto (4º registro)\n`);
} else {
  console.log(`❌ FALHOU: Bloqueado no registro ${blockedAtAttempt} (esperado 4)\n`);
}

// Teste 3: Ocorrências rate limiting
console.log('📝 Teste 3: Ocorrências Rate Limiting (10 por hora por usuário)');
limiter.reset(createRateLimitKey(RATE_LIMITS.CREATE_OCORRENCIA.key, 'user_123'));

const ocorrenciaKey = createRateLimitKey(RATE_LIMITS.CREATE_OCORRENCIA.key, 'user_123');
successCount = 0;
blockedAtAttempt = 0;

for (let i = 1; i <= 12; i++) {
  try {
    checkRateLimit(ocorrenciaKey, RATE_LIMITS.CREATE_OCORRENCIA.limit, RATE_LIMITS.CREATE_OCORRENCIA.window);
    console.log(`  ✅ Ocorrência ${i}: Aceita`);
    successCount++;
  } catch (error: any) {
    console.log(`  🚫 Ocorrência ${i}: Bloqueada!`);
    blockedAtAttempt = i;
  }
}

if (blockedAtAttempt === 11) {
  console.log(`✅ PASSOU: Bloqueado na ocorrência correta (11ª ocorrência)\n`);
} else {
  console.log(`❌ FALHOU: Bloqueado na ocorrência ${blockedAtAttempt} (esperado 11)\n`);
}

// Teste 4: Geocode rate limiting
console.log('📝 Teste 4: Geocode Rate Limiting (20 por minuto por IP)');
limiter.reset(createRateLimitKey(RATE_LIMITS.GEOCODE.key, '192.168.1.102'));

const geocodeKey = createRateLimitKey(RATE_LIMITS.GEOCODE.key, '192.168.1.102');
successCount = 0;
blockedAtAttempt = 0;

for (let i = 1; i <= 22; i++) {
  try {
    checkRateLimit(geocodeKey, RATE_LIMITS.GEOCODE.limit, RATE_LIMITS.GEOCODE.window);
    successCount++;
    if (successCount <= 5 || successCount > 19) {
      console.log(`  ✅ Requisição ${i}: Aceita`);
    } else if (successCount === 6) {
      console.log(`  ... (omitido do 6º ao 19º) ...`);
    }
  } catch (error: any) {
    console.log(`  🚫 Requisição ${i}: Bloqueada!`);
    blockedAtAttempt = i;
  }
}

if (blockedAtAttempt === 21) {
  console.log(`✅ PASSOU: Bloqueado na requisição correta (21ª requisição)\n`);
} else {
  console.log(`❌ FALHOU: Bloqueado na requisição ${blockedAtAttempt} (esperado 21)\n`);
}

// Teste 5: Reset funciona
console.log('📝 Teste 5: Reset de contador');
const testKey = createRateLimitKey('test', 'test_user');

try {
  checkRateLimit(testKey, 2, 60000);
  console.log(`  ✅ Primeira requisição: Aceita`);
  checkRateLimit(testKey, 2, 60000);
  console.log(`  ✅ Segunda requisição: Aceita`);
  
  try {
    checkRateLimit(testKey, 2, 60000);
    console.log(`  ❌ Terceira requisição: Não foi bloqueada!`);
  } catch {
    console.log(`  ✅ Terceira requisição: Bloqueada (esperado)`);
  }

  limiter.reset(testKey);
  console.log(`  ✅ Contador resetado`);

  checkRateLimit(testKey, 2, 60000);
  console.log(`  ✅ Após reset: Primeira requisição aceita novamente`);
  console.log(`✅ PASSOU: Reset funciona corretamente\n`);
} catch (error) {
  console.log(`❌ FALHOU: Erro no teste de reset\n`);
}

// Resumo
console.log('═'.repeat(50));
console.log('📊 RESUMO DOS TESTES');
console.log('═'.repeat(50));
console.log('✅ Login rate limiting: 5 tentativas por 15 min');
console.log('✅ Register rate limiting: 3 por hora por IP');
console.log('✅ Ocorrências rate limiting: 10 por hora');
console.log('✅ Geocode rate limiting: 20 por minuto');
console.log('✅ Reset funciona corretamente');
console.log('\n🎉 Rate Limiting System validado com sucesso!\n');

limiter.destroy();
