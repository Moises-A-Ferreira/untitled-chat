# Institutional Loading Screen

Uma tela de loading profissional e institucional para aplicações web de prefeituras e órgãos públicos.

## Características

- **Design institucional**: Fundo azul elegante com alto contraste
- **Logo animado**: Pulsação suave da logo sem exageros
- **Indicador discreto**: Spinner circular branco
- **Mensagens dinâmicas**: Texto informativo que pode mudar durante o carregamento
- **Transição suave**: Fade-out elegante ao completar
- **Responsivo**: Funciona em desktop e mobile
- **Performance**: Animações leves sem impacto no desempenho

## Como usar

### Método 1: Componente direto

```jsx
import InstitutionalLoadingScreen from '@/components/InstitutionalLoadingScreen';

function MyApp() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <InstitutionalLoadingScreen 
        isLoading={isLoading}
        message="Carregando sistema..."
        onLoaded={() => console.log('Loading completed')}
      />
      
      {/* Seu conteúdo principal */}
      <div className={!isLoading ? 'opacity-100' : 'opacity-0'}>
        {/* Conteúdo da aplicação */}
      </div>
    </>
  );
}
```

### Método 2: Hook (Recomendado)

```jsx
import { useInstitutionalLoading } from '@/hooks/use-institutional-loading';

function MyApp() {
  const { isLoading, currentMessage, showLoading, hideLoading } = useInstitutionalLoading({
    initialLoading: true,
    messages: [
      "Carregando sistema...",
      "Inicializando serviços...",
      "Conectando ao banco..."
    ]
  });

  return (
    <>
      <InstitutionalLoadingScreen 
        isLoading={isLoading}
        message={currentMessage}
      />
      
      <main className={!isLoading ? 'opacity-100' : 'opacity-0'}>
        {/* Conteúdo principal */}
      </main>
    </>
  );
}
```

## Propriedades

### InstitutionalLoadingScreen Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `isLoading` | boolean | `true` | Controla a visibilidade da tela |
| `onLoaded` | function | `undefined` | Callback quando o loading termina |
| `logoSrc` | string | `"/brasao.png"` | Caminho para a logo |
| `message` | string | `"Carregando sistema..."` | Mensagem de carregamento |

### useInstitutionalLoading Options

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `initialLoading` | boolean | `true` | Estado inicial do loading |
| `autoHideDelay` | number | `0` | Tempo automático para esconder (ms) |
| `messages` | string[] | `["Carregando sistema..."]` | Array de mensagens rotativas |

## Personalização

### Cores
As cores podem ser modificadas no arquivo CSS global (`app/globals.css`) nas classes de animação.

### Animações
As animações estão definidas em `@keyframes` no mesmo arquivo CSS e podem ser ajustadas conforme necessário.

## Exemplos práticos

Veja a demonstração em: `/loading-demo`

## Compatibilidade

- Next.js 13+
- React 18+
- Tailwind CSS
- Navegadores modernos (Chrome, Firefox, Safari, Edge)

## Boas práticas

1. **Tempo adequado**: Mantenha o loading entre 2-4 segundos para UX ideal
2. **Mensagens úteis**: Use mensagens que reflitam o processo real
3. **Fallback**: Sempre tenha um fallback caso a logo não carregue
4. **Performance**: Evite muitas animações simultâneas
5. **Acessibilidade**: Certifique-se de que o conteúdo fique acessível após o loading

## Estrutura do projeto

```
components/
  └── InstitutionalLoadingScreen.tsx
hooks/
  └── use-institutional-loading.ts
app/
  └── loading-demo/
      └── page.tsx
styles/
  └── globals.css (animações adicionais)
```