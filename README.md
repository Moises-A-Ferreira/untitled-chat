# Sistema de Gestão de Ocorrências - São Manuel/SP

Sistema web para registro e gestão de ocorrências urbanas da Prefeitura Municipal de São Manuel/SP. Permite que cidadãos relatem problemas como buracos em vias públicas, iluminação, lixo irregular e outros, com localização precisa em mapa interativo.

## 🚀 Funcionalidades

### Para Cidadãos
- ✅ Registro de ocorrências com foto
- 📍 Localização precisa usando mapa interativo (Leaflet)
- 🔍 Busca inteligente de endereços (banco local + OpenStreetMap)
- 👤 Sistema de autenticação simples
- 📋 Visualização de ocorrências próprias
- 🏷️ Categorias: buraco na via, iluminação, lixo, calçada, sinalização, etc.

### Para Administradores
- 📊 Dashboard com estatísticas
- 📝 Gestão de ocorrências
- 🗺️ Visualização em mapa
- ✅ Atualização de status

## 🛠️ Tecnologias

- **Frontend:** Next.js 16, React 19, TypeScript
- **Estilização:** Tailwind CSS, shadcn/ui
- **Mapas:** Leaflet, React-Leaflet
- **Banco de Dados:** Better-SQLite3 (SQLite)
- **Geocodificação:** Sistema híbrido (banco local + OpenStreetMap Nominatim)
- **Autenticação:** Sistema personalizado com bcryptjs
- **Upload:** Supabase Storage

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou pnpm

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/MuriloM676/untitled-chat.git
cd untitled-chat
```

2. **Instale as dependências**
```bash
npm install
# ou
pnpm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env.local` na raiz:
```env
# Supabase (para upload de imagens)
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_key

# Opcional: Google Maps (se quiser usar em vez de Leaflet)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_google
```

4. **Inicialize o banco de dados**
```bash
# O banco SQLite será criado automaticamente na primeira execução
npm run dev
```

5. **Execute o projeto**
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 📂 Estrutura do Projeto

```
untitled-chat/
├── app/                      # Páginas e rotas Next.js
│   ├── api/                  # API Routes
│   │   ├── auth/            # Autenticação
│   │   ├── geocode/         # Geocodificação
│   │   ├── ocorrencias/     # CRUD de ocorrências
│   │   └── admin/           # Rotas administrativas
│   ├── registrar/           # Página de registro de ocorrência
│   ├── minhas-ocorrencias/  # Ocorrências do usuário
│   ├── admin/               # Painel administrativo
│   └── login/               # Autenticação
├── components/              # Componentes React
│   ├── ui/                  # Componentes shadcn/ui
│   ├── AddressSearch.tsx    # Busca de endereços
│   ├── InteractiveLocationSelector.tsx  # Seletor de localização
│   └── DynamicMap.tsx       # Mapa dinâmico
├── lib/                     # Bibliotecas e utilitários
│   ├── db/                  # Conexão com banco de dados
│   ├── geocoding-api.ts     # API de geocodificação
│   ├── precise-geocoding.ts # Banco de endereços local
│   └── utils.ts             # Utilitários gerais
├── docs/                    # Documentação
└── public/                  # Arquivos estáticos
```

## 🗺️ Sistema de Geocodificação

O sistema usa uma abordagem híbrida para localização precisa:

1. **Banco Local** - Ruas cadastradas de São Manuel com coordenadas precisas
2. **Fallback OpenStreetMap** - Para endereços não cadastrados
3. **Interpolação Linear** - Calcula posição exata com base no número da rua

### Ruas Cadastradas
- Rua Principal / Avenida Brasil
- Rua Quinze de Novembro
- Rua Coronel
- Rua São Paulo (Jardim São Paulo)
- Rua Vila Nova
- Rua Bela Vista
- Rua das Nações
- Rua América
- Rua Plinio Aristides Targa

Para adicionar mais ruas, veja: [docs/COMO_ADICIONAR_RUAS.md](docs/COMO_ADICIONAR_RUAS.md)

## 👥 Usuários Padrão

### Usuário Comum
- **Email:** user@example.com
- **Senha:** password123

### Administrador
- **Email:** admin@example.com
- **Senha:** admin123

## 📸 Upload de Imagens

As imagens são armazenadas no Supabase Storage. Configure o bucket conforme script em:
`scripts/003-create-storage-bucket.sql`

## 🧪 Testes de Geocodificação

Use os endpoints de teste para validar endereços:

```bash
# Testar um endereço
GET http://localhost:3000/api/test-geocode?address=Rua Principal 150

# Testar padrões de regex
GET http://localhost:3000/api/test-address-pattern?address=Plinio Targa 487
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t saomanuel-ocorrencias .
docker run -p 3000:3000 saomanuel-ocorrencias
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint
```

## 📝 Licença

Projeto desenvolvido para a Prefeitura Municipal de São Manuel/SP.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📧 Contato

Para dúvidas ou sugestões sobre o projeto, entre em contato com a equipe de desenvolvimento da Prefeitura Municipal de São Manuel.

## 📚 Documentação Adicional

- [Documentação Técnica](DOCS_TECNICA.md)
- [Como Adicionar Ruas](docs/COMO_ADICIONAR_RUAS.md)
- [API Reference](docs/API_REFERENCE.md)

---

Desenvolvido com ❤️ para São Manuel/SP
