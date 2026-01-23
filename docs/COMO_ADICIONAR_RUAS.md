## Como Adicionar Ruas ao Banco de Dados de Geocodificação

Arquivo: `/lib/precise-geocoding.ts`

### Estrutura Básica

Cada rua é um objeto com a seguinte estrutura:

```typescript
{
  pattern: /^rua\s+nome\s+(\d+)$/i,  // Regex para capturar a busca
  street: "Rua Nome",                 // Nome exato da rua
  start: { 
    number: 1,                        // Número inicial
    lat: -22.7300,                    // Latitude do início
    lng: -48.5700                     // Longitude do início
  },
  end: { 
    number: 1000,                     // Número final
    lat: -22.7200,                    // Latitude do final
    lng: -48.5600                     // Longitude do final
  },
  neighborhood: "Bairro",             // Nome do bairro
  city: "São Manuel"
}
```

### Como Encontrar as Coordenadas

1. **Abra o Google Maps ou OpenStreetMap**
   - Pesquise a rua em São Manuel
   - Clique no ponto inicial e final da rua
   - Anote as coordenadas (lat, lng)

2. **Use o serviço de geocodificação**
   - http://nominatim.openstreetmap.org/
   - Pesquise "Rua X, São Manuel, SP"
   - Note as coordenadas retornadas

### Exemplo Prático

Para adicionar "Rua Flores 123":

```typescript
{
  pattern: /^rua\s+flores\s+(\d+)$/i,
  street: "Rua Flores",
  start: { number: 1, lat: -22.7285, lng: -48.5688 },
  end: { number: 600, lat: -22.7265, lng: -48.5650 },
  neighborhood: "Vila Nova",
  city: "São Manuel"
},

// Variação sem "rua"
{
  pattern: /^flores\s+(\d+)$/i,
  street: "Rua Flores",
  start: { number: 1, lat: -22.7285, lng: -48.5688 },
  end: { number: 600, lat: -22.7265, lng: -48.5650 },
  neighborhood: "Vila Nova",
  city: "São Manuel"
}
```

### Padrões de Regex Comuns

- **Com "rua"**: `/^rua\s+nome\s+(\d+)$/i`
- **Sem "rua"**: `/^nome\s+(\d+)$/i`
- **Com "avenida"**: `/^avenida\s+nome\s+(\d+)$/i`
- **Alternativas**: `/^(rua|avenida)\s+nome\s+(\d+)$/i`
- **Com múltiplos nomes**: `/^rua\s+nome1\s+nome2\s+(\d+)$/i`

### Sistema de Fallback

Se a rua não estiver cadastrada:
1. O sistema tenta o banco local
2. Se não encontrar, consulta OpenStreetMap (Nominatim)
3. Se encontrar em São Manuel, usa a coordenada
4. Se não encontrar, exibe erro ao usuário

### Próximos Passos

Para adicionar TODAS as ruas de São Manuel:
1. Você pode fornecer uma lista de ruas com coordenadas
2. Ou fornecei um mapa/arquivo com as coordenadas
3. Ou podemos fazer um script para importar de um CSV/JSON

Qual formato você tem os dados das ruas?
