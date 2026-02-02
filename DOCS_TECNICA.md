# Documentação Técnica - Sistema de Ocorrências São Manuel

## 📋 Índice

1. [Arquitetura do Sistema](#arquitetura-do-sistema)
2. [Fluxo de Dados](#fluxo-de-dados)
3. [Banco de Dados](#banco-de-dados)
4. [Sistema de Geocodificação](#sistema-de-geocodificação)
5. [Autenticação](#autenticação)
6. [Upload de Arquivos](#upload-de-arquivos)
7. [API Reference](#api-reference)
8. [Manutenção](#manutenção)
9. [Expansões Futuras](#expansões-futuras)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 16)           │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  React 19    │  │  TypeScript     │ │
│  │  Tailwind    │  │  shadcn/ui      │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         API Routes (Next.js)            │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  /api/auth   │  │ /api/ocorrencias│ │
│  │  /api/geocode│  │ /api/admin      │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Camada de Dados                 │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  SQLite      │  │  Supabase       │ │
│  │  (local)     │  │  (storage)      │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘
```

### Padrões de Projeto

- **Server-Side Rendering (SSR)** - Next.js App Router
- **API Routes** - Endpoints RESTful com Next.js
- **Client Components** - Componentes interativos com `"use client"`
- **Separation of Concerns** - Lógica separada em `lib/`

---

## 🔄 Fluxo de Dados

### Registro de Ocorrência

```
Usuário → InteractiveLocationSelector → geocodificação
                                            ↓
                                    precise-geocoding.ts
                                            ↓
                            (encontrou no banco local?)
                              ↙              ↘
                            SIM              NÃO
                             ↓                ↓
                    retorna coords     OpenStreetMap API
                                            ↓
                                    filtra por São Manuel
                                            ↓
                                      retorna coords
                                            ↓
                                    /api/ocorrencias POST
                                            ↓
                                       SQLite DB
                                            ↓
                                    Supabase Storage (foto)
                                            ↓
                                       Confirmação
```

### Busca de Endereço

```
Input do usuário → normalização
                      ↓
              precise-geocoding.ts
                      ↓
              regex patterns match?
                ↙              ↘
              SIM              NÃO
               ↓                ↓
        interpolação      OpenStreetMap
          linear              Nominatim
               ↓                ↓
          coordenadas    coordenadas
                 ↘          ↙
                  validação
                      ↓
              dentro de São Manuel?
                ↙              ↘
              SIM              NÃO
               ↓                ↓
          aceitar          rejeitar
```

---

## 💾 Banco de Dados

### Schema SQLite

#### Tabela: `users`
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user', -- 'user' ou 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabela: `ocorrencias`
```sql
CREATE TABLE ocorrencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  endereco TEXT,
  bairro TEXT,
  foto_url TEXT,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'em_analise', 'resolvido'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Localização do Banco

- **Desenvolvimento:** `c:\Users\murilo.martins\untitled-chat\data\ocorrencias.db`
- **Produção:** Configurável via variável de ambiente

### Backup

```bash
# Backup manual
cp data/ocorrencias.db data/backup/ocorrencias-$(date +%Y%m%d).db

# Backup automatizado (adicionar ao cron)
0 2 * * * cd /path/to/project && npm run backup-db
```

---

## 🗺️ Sistema de Geocodificação

### Arquitetura Híbrida

#### 1. Banco Local (`lib/precise-geocoding.ts`)

**Estrutura de Dados:**
```typescript
interface AddressPattern {
  pattern: RegExp;           // Regex para matching
  street: string;            // Nome da rua
  start?: {                  // Ponto inicial
    number: number;
    lat: number;
    lng: number;
  };
  end?: {                    // Ponto final
    number: number;
    lat: number;
    lng: number;
  };
  fixed?: {                  // Ponto fixo (sem número)
    lat: number;
    lng: number;
  };
  neighborhood: string;
  city: string;
}
```

**Processo de Matching:**
1. Normaliza input (lowercase, remove vírgulas, normaliza espaços)
2. Tenta match com cada pattern no array `saoManuelAddresses`
3. Se encontrar número, faz interpolação linear:
   ```typescript
   const ratio = (number - start.number) / (end.number - start.number);
   const lat = start.lat + (end.lat - start.lat) * ratio;
   const lng = start.lng + (end.lng - start.lng) * ratio;
   ```

**Vantagens:**
- ✅ Extremamente rápido (sem requisição externa)
- ✅ Coordenadas precisas
- ✅ Funciona offline
- ❌ Requer cadastro manual de ruas

#### 2. Fallback OpenStreetMap (`lib/geocoding-api.ts`)

**Nominatim API:**
```typescript
const url = 'https://nominatim.openstreetmap.org/search';
const params = {
  q: `${address}, São Manuel, SP, Brasil`,
  format: 'json',
  addressdetails: 1,
  limit: 5,
  countrycodes: 'BR',
  viewbox: '-48.6000,-22.7000,-48.5400,-22.7600', // Área de São Manuel
  bounded: 1  // Prioriza viewbox
};
```

**Filtro de Distância:**
```typescript
const centerLat = -22.7311;
const centerLng = -48.5706;
const distance = Math.sqrt(
  Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
);
const isInSaoManuel = distance < 0.05; // ~5km
```

**Rate Limiting:**
- Nominatim: 1 requisição/segundo
- Implementado: delay de 1000ms entre requisições
- Cache local para evitar requisições repetidas

### Adicionar Nova Rua

1. **Encontrar Coordenadas:**
   - Google Maps: clique com botão direito → copiar coordenadas
   - OpenStreetMap: mesma funcionalidade
   - Ferramenta: https://www.openstreetmap.org/

2. **Adicionar em `lib/precise-geocoding.ts`:**
```typescript
// Exemplo: Rua Nova, 1-500, Bairro Centro
{
  pattern: /^rua\s+nova\s+(\d+)$/i,
  street: "Rua Nova",
  start: { number: 1, lat: -22.7300, lng: -48.5700 },
  end: { number: 500, lat: -22.7250, lng: -48.5650 },
  neighborhood: "Centro",
  city: "São Manuel"
},
// Variação sem "rua"
{
  pattern: /^nova\s+(\d+)$/i,
  street: "Rua Nova",
  start: { number: 1, lat: -22.7300, lng: -48.5700 },
  end: { number: 500, lat: -22.7250, lng: -48.5650 },
  neighborhood: "Centro",
  city: "São Manuel"
}
```

3. **Testar:**
```bash
curl "http://localhost:3000/api/test-address-pattern?address=Rua%20Nova%20250"
```

---

## 🔐 Autenticação

### Fluxo de Login

```
Usuário → /api/auth/login-simple
            ↓
    Valida email/senha
            ↓
    Compara hash bcrypt
            ↓
       (válido?)
      ↙        ↘
    SIM        NÃO
     ↓          ↓
  Cookie    Erro 401
   httpOnly
     ↓
  Redirect
```

### Implementação

**Hash de Senha:**
```typescript
import bcrypt from 'bcryptjs';

// Criar usuário
const hashedPassword = await bcrypt.hash(password, 10);

// Validar login
const isValid = await bcrypt.compare(password, user.password);
```

**Session Management:**
- Cookie httpOnly com ID do usuário
- Validação em cada requisição protegida
- Middleware em `/api/auth/me`

### Proteger Rotas

```typescript
// Em API Route
const { user } = await req.json();
if (!user || !user.id) {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
}

// Em página
useEffect(() => {
  const checkAuth = async () => {
    const res = await fetch('/api/auth/me');
    if (!res.ok) router.push('/login');
  };
  checkAuth();
}, []);
```

---

## 📤 Upload de Arquivos

### Supabase Storage

**Configuração:**
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Upload de Imagem:**
```typescript
const file = e.target.files[0];
const fileName = `${Date.now()}_${file.name}`;
const { data, error } = await supabase.storage
  .from('ocorrencias')
  .upload(fileName, file);
```

**URL Pública:**
```typescript
const { data } = supabase.storage
  .from('ocorrencias')
  .getPublicUrl(fileName);
const publicUrl = data.publicUrl;
```

### Validações

- Tamanho máximo: 5MB
- Formatos aceitos: JPEG, PNG, WEBP
- Validação no frontend e backend

---

## 🔌 API Reference

### Autenticação

#### POST `/api/auth/login-simple`
```json
// Request
{
  "email": "user@example.com",
  "password": "senha123"
}

// Response
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "João Silva",
    "role": "user"
  }
}
```

#### POST `/api/auth/register-simple`
```json
// Request
{
  "email": "novo@example.com",
  "password": "senha123",
  "name": "Novo Usuário"
}

// Response
{
  "success": true,
  "message": "Usuário criado com sucesso"
}
```

#### GET `/api/auth/me`
```json
// Response
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

### Ocorrências

#### POST `/api/ocorrencias`
```json
// Request
{
  "tipo": "buraco",
  "descricao": "Buraco grande na via",
  "latitude": -22.7311,
  "longitude": -48.5706,
  "endereco": "Rua Principal, 150",
  "bairro": "Centro",
  "foto_url": "https://...",
  "user_id": 1
}

// Response
{
  "success": true,
  "id": 42,
  "message": "Ocorrência registrada com sucesso"
}
```

#### GET `/api/ocorrencias?user_id=1`
```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 42,
      "tipo": "buraco",
      "descricao": "...",
      "latitude": -22.7311,
      "longitude": -48.5706,
      "status": "pendente",
      "created_at": "2026-01-23T10:00:00Z"
    }
  ]
}
```

### Geocodificação

#### GET `/api/geocode?address=Rua%20Principal%20150&type=forward`
```json
// Response
{
  "success": true,
  "data": {
    "lat": -22.7311,
    "lng": -48.5706,
    "displayName": "Rua Principal, 150, Centro, São Manuel - SP",
    "address": {
      "road": "Rua Principal",
      "neighbourhood": "Centro",
      "city": "São Manuel",
      "state": "São Paulo"
    }
  }
}
```

---

## 🔧 Manutenção

### Logs

**Visualizar Logs do Sistema:**
```bash
# Logs do Next.js
npm run dev 2>&1 | tee logs/app.log

# Logs do banco
sqlite3 data/ocorrencias.db ".log stdout"
```

**Monitorar Requisições Nominatim:**
```javascript
// Em lib/geocoding-api.ts
console.log(`[${new Date().toISOString()}] Nominatim request: ${query}`);
```

### Performance

**Otimizações Implementadas:**
- Cache de geocodificação (Map local)
- Lazy loading de componentes de mapa (dynamic import)
- Compressão de imagens no upload
- Índices em colunas frequentes (user_id, status)

**Monitorar:**
```bash
# Tamanho do banco
ls -lh data/ocorrencias.db

# Consultas lentas (adicionar ao código)
const start = Date.now();
// query
console.log(`Query time: ${Date.now() - start}ms`);
```

### Backup Automatizado

```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="data/backup"
DB_FILE="data/ocorrencias.db"

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/ocorrencias_$DATE.db"

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "*.db" -mtime +30 -delete

echo "Backup concluído: $DATE"
```

---

## 🚀 Expansões Futuras

### 1. Notificações Push

**Implementação Sugerida:**
- Firebase Cloud Messaging (FCM)
- Notificar usuário quando status mudar

```typescript
// lib/notifications.ts
import admin from 'firebase-admin';

export async function notifyUserStatusChange(userId: number, ocorrenciaId: number) {
  // Buscar token do usuário
  // Enviar notificação
}
```

### 2. Dashboard Analítico

**Métricas Importantes:**
- Ocorrências por tipo (gráfico pizza)
- Ocorrências por bairro (mapa de calor)
- Tempo médio de resolução
- Taxa de resolução mensal

**Biblioteca Sugerida:**
- Recharts (já instalado)
- Chart.js
- D3.js

### 3. Exportação de Relatórios

```typescript
// app/api/admin/export/route.ts
import ExcelJS from 'exceljs';

export async function GET() {
  const ocorrencias = await db.getAllOcorrencias();
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ocorrências');
  
  worksheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Tipo', key: 'tipo' },
    { header: 'Status', key: 'status' },
    { header: 'Data', key: 'created_at' }
  ];
  
  worksheet.addRows(ocorrencias);
  
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=ocorrencias.xlsx'
    }
  });
}
```

### 4. API Pública para Desenvolvedores

```typescript
// Autenticação via API Key
// Rate limiting
// Documentação OpenAPI/Swagger
```

### 5. Sistema de Comentários

```sql
CREATE TABLE comentarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ocorrencia_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  texto TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🐛 Troubleshooting

### Problema: Banco de dados não inicializa

**Sintoma:**
```
Error: SQLITE_ERROR: no such table: users
```

**Solução:**
```bash
# 1. Verificar se o diretório existe
mkdir -p data

# 2. Executar scripts de criação
sqlite3 data/ocorrencias.db < scripts/001-create-tables.sql
sqlite3 data/ocorrencias.db < scripts/002-create-admin-user.sql
```

### Problema: Geocodificação sempre falha

**Sintoma:**
```
Error: Endereço não encontrado no banco de dados local
```

**Solução:**
1. Verificar se `precise-geocoding.ts` tem a rua cadastrada
2. Testar endpoint: `/api/test-address-pattern?address=Rua%20X`
3. Verificar logs do console do navegador
4. Confirmar que Nominatim está respondendo:
   ```bash
   curl "https://nominatim.openstreetmap.org/search?q=São+Manuel,SP&format=json"
   ```

### Problema: Upload de imagem falha

**Sintoma:**
```
Error: Failed to upload image
```

**Solução:**
1. Verificar variáveis de ambiente Supabase
2. Confirmar que bucket 'ocorrencias' existe
3. Verificar permissões do bucket (deve ser público)
4. Verificar tamanho do arquivo (< 5MB)

### Problema: Mapa não carrega

**Sintoma:**
Área branca onde deveria ter o mapa

**Solução:**
1. Verificar console do navegador
2. Confirmar que Leaflet CSS está carregando:
   ```html
   <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
   ```
3. Usar `dynamic import` para componentes de mapa:
   ```typescript
   const Map = dynamic(() => import('@/components/DynamicMap'), { ssr: false });
   ```

### Problema: Session expira rapidamente

**Sintoma:**
Usuário deslogado frequentemente

**Solução:**
Aumentar tempo de expiração do cookie:
```typescript
// Em api/auth/login
res.setHeader('Set-Cookie', serialize('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 7, // 7 dias
  path: '/'
}));
```

---

## 📊 Métricas e Monitoramento

### KPIs Importantes

1. **Taxa de Sucesso de Geocodificação**
   - Meta: > 95%
   - Monitorar: logs de fallback para Nominatim

2. **Tempo Médio de Registro**
   - Meta: < 30 segundos
   - Monitorar: timestamp início → fim do formulário

3. **Taxa de Resolução**
   - Meta: > 80% em 30 dias
   - Calcular: `resolvidos / total`

4. **Uptime**
   - Meta: 99.9%
   - Ferramenta: UptimeRobot, Pingdom

### Alertas Sugeridos

```javascript
// Implementar alertas para:
// 1. Taxa de erro > 5%
// 2. Banco de dados > 1GB
// 3. Falha na conexão com Supabase
// 4. Rate limit excedido no Nominatim
```

---

## 🔒 Segurança

### Checklist de Segurança

- [x] Senhas hasheadas com bcrypt
- [x] Cookies httpOnly
- [x] Validação de input no backend
- [x] CORS configurado
- [x] SQL injection prevenido (prepared statements)
- [ ] Rate limiting em APIs públicas
- [ ] CAPTCHA no registro
- [ ] 2FA para admins
- [ ] Auditoria de ações administrativas

### Implementar Rate Limiting

```typescript
// lib/rate-limit.ts
const rateLimit = new Map();

export function checkRateLimit(ip: string, limit: number = 10): boolean {
  const now = Date.now();
  const requests = rateLimit.get(ip) || [];
  
  // Limpar requests antigos (última hora)
  const recentRequests = requests.filter((time: number) => now - time < 3600000);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
  return true;
}
```

---

## 📚 Referências Técnicas

### Documentação Oficial
- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap Nominatim](https://nominatim.org/release-docs/develop/api/Overview/)
- [Supabase](https://supabase.com/docs)
- [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3)

### Ferramentas Úteis
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Nominatim Query Tool](https://nominatim.openstreetmap.org/)
- [SQLite Browser](https://sqlitebrowser.org/)
- [Leaflet Playground](https://leafletjs.com/examples.html)

---

**Última Atualização:** 23 de janeiro de 2026  
**Versão:** 1.0.0
