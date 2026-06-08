

# Animação Premium no Login/Signup

Vou substituir o visual atual da `AuthPage` pela animação de slide com toggle panel, mantendo 100% da lógica de autenticação Supabase já existente (login, signup, validação, redirect, traduções de erro, link "Esqueci minha senha").

## O Que Muda

### `src/pages/AuthPage.tsx` (refatoração visual)

**Mantém intocado:**
- Hook `useEffect` com `onAuthStateChange` + `getSession` → redirect para `/dashboard`
- `handleLogin` → `supabase.auth.signInWithPassword`
- `handleSignup` → `supabase.auth.signUp` + validações (senha ≥ 6 chars, confirmação)
- Função `translateError` (mensagens em PT-BR)
- Toasts de sucesso/erro
- Estado `loading`, campos controlados
- Link para `/forgot-password`

**Substitui:**
- Layout de Tabs (`Tabs`/`TabsList`/`TabsContent`) → estrutura de 2 painéis com toggle animado
- Adiciona estado `isActive` (false = login visível, true = registro visível)
- Estrutura: `.container` com `.form-box.login`, `.form-box.register`, `.toggle-box` com `.toggle-panel.toggle-left` e `.toggle-panel.toggle-right`
- Animação de slide do painel azul (`#7494ec`) cruzando o card via `::before` com `border-radius: 150px` e `transition: 1.8s ease-in-out`
- Form boxes deslizam horizontalmente com `transition: .6s ease-in-out` e delays escalonados
- Inputs com ícones Lucide à direita (`User`, `Lock`, `Mail`) substituindo `<i>` do código original
- Botões "Login"/"Register" nos painéis trocam o estado `isActive`

### Adaptações ao Design System "Viver de IA"

Em vez de copiar `#7494ec` (azul claro genérico) e `#fff` puro, vou ajustar para a paleta atual:
- Painel toggle: `hsl(var(--accent-primary))` (Indigo `#6366F1`) em vez de `#7494ec`
- Background do card: `hsl(var(--card))` em vez de `#fff` puro
- Inputs: usar `bg-muted` em vez de `#eee`
- Texto/títulos: `text-foreground` e `text-primary-foreground` (no painel azul)
- Fonte: manter **Inter** (já carregada globalmente) — NÃO importar Poppins, isso violaria o DS
- Sombra do card: `shadow-elevation-4` em vez de `box-shadow` inline
- Border-radius do container: `rounded-3xl`
- Manter ícone `BarChart3` + título "Google Ads Manager" acima do card (header existente)

### Estrutura Visual Final

```text
┌─────────────────────────────────────────┐
│  [BarChart3] Google Ads Manager         │
│  Gerencie suas campanhas com IA         │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Login form  │  ░░ Toggle Panel ░░ │  │ ← isActive=false
│  │ (50%)       │  ░░ "Hello,Welcome"░│  │
│  │             │  ░░ [Register btn] ░│  │
│  └───────────────────────────────────┘  │
│                                         │
│  Ao clicar "Register":                  │
│  ┌───────────────────────────────────┐  │
│  │ ░░ Toggle Panel ░░ │ Signup form  │  │ ← isActive=true
│  │ ░░ "Welcome Back" ░│ (50%)        │  │
│  │ ░░ [Login btn]    ░│              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### CSS

CSS do componente injetado via `<style>` tag dentro do JSX (mesmo padrão do código fornecido), com classes `.auth-container`, `.auth-form-box`, `.auth-toggle-box`, `.auth-toggle-panel` (prefixo `auth-` para evitar colisões globais).

Responsividade:
- `< 650px`: layout vertical (form embaixo, painel toggle em cima/baixo) — adaptado do CSS original
- `< 400px`: padding reduzido + título menor

### Remoções

- Componentes `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` (não usados mais)
- Ícones de redes sociais (`Github`, `Facebook`, `Linkedin`) do código original — **NÃO** vou adicionar pois login social Google será via Supabase OAuth no futuro (não está no escopo). Mantenho apenas os campos email/senha.

## Arquivos Não Modificados

- `src/App.tsx` — rota `/login` continua apontando para `AuthPage`
- `src/pages/ForgotPasswordPage.tsx` e `ResetPasswordPage.tsx` — fluxo de reset intacto
- `src/integrations/supabase/client.ts` — cliente intocado
- `AuthGuard.tsx` — proteção de rotas inalterada

## Validação

1. `npm run build` — 0 erros TypeScript
2. Testar visualmente: clicar "Register" → painel azul desliza da direita para esquerda, form de signup aparece
3. Confirmar que login real ainda funciona (toast de sucesso, redirect para `/dashboard`)
4. Testar responsividade em viewport mobile (< 650px)

