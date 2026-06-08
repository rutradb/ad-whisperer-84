# Design System — Ad Manager Hub

Inspirado no branding "Freck" — estética moderna, gradientes suaves, tipografia bold e cores vibrantes.

---

## Paleta de Cores

### Cores Primárias

| Nome         | Hex       | HSL                  | Uso                                   |
|-------------|-----------|----------------------|---------------------------------------|
| Purple      | `#7C6AFF` | `247 100% 71%`      | Primary — botões, links, foco         |
| Lavender    | `#C9C0FF` | `249 100% 88%`      | Secondary — backgrounds suaves        |
| Neon Green  | `#BEFE01` | `75 99% 50%`        | Accent — destaques, badges de sucesso |
| Hot Pink    | `#FF0067` | `336 100% 50%`      | Destructive — alertas, erros          |

### Cores de Superfície

| Nome              | Hex       | HSL              | Uso                        |
|-------------------|-----------|------------------|----------------------------|
| Background        | `#FBFAFF` | `254 100% 99%`   | Fundo principal            |
| Card              | `#FFFFFF` | `0 0% 100%`      | Cards e surfaces           |
| Card Hover        | `#F8F5FF` | `254 100% 98%`   | Card hover/selected        |
| Muted             | `#F0EDFF` | `248 100% 96%`   | Áreas muted                |
| Muted Foreground  | `#7C7494` | `254 12% 52%`    | Texto secundário           |
| Foreground        | `#1A1430` | `254 40% 14%`    | Texto principal            |
| Border            | `#E8E4F5` | `250 40% 93%`    | Bordas sutis               |

### Sidebar (Light)

| Nome       | Hex       | Uso                      |
|-----------|-----------|--------------------------|
| Background | `#F7F4FF` | Fundo sidebar            |
| Active     | `#EDE8FF` | Item ativo               |
| Hover      | `#F0EDFF` | Item hover               |

### Dark Mode

| Token                | HSL               |
|---------------------|--------------------|
| `--background`      | `254 20% 7%`      |
| `--foreground`      | `250 20% 92%`     |
| `--card`            | `254 20% 10%`     |
| `--primary`         | `247 100% 75%`    |
| `--secondary`       | `254 30% 20%`     |
| `--muted`           | `254 20% 16%`     |
| `--muted-foreground`| `254 15% 55%`     |
| `--border`          | `254 20% 16%`     |
| `--sidebar-bg`      | `254 20% 9%`      |

---

## Gradientes

### Background Gradient (Hero/CTA)
```css
background: linear-gradient(135deg, #F7F4FF 0%, #E8E4F5 25%, #D4CFFF 50%, #B8E8FF 75%, #E8F4FF 100%);
```

### Brand Gradient (Sidebar header, banners)
```css
background: linear-gradient(135deg, #7C6AFF 0%, #A78BFA 50%, #C9C0FF 100%);
```

### Accent Gradient (Badges, highlights)
```css
background: linear-gradient(135deg, #7C6AFF, #FF0067);
```

### Mesh Gradient (Backgrounds decorativos)
```css
background:
  radial-gradient(ellipse at 20% 50%, rgba(124,106,255,0.15) 0%, transparent 50%),
  radial-gradient(ellipse at 80% 20%, rgba(184,232,255,0.2) 0%, transparent 50%),
  radial-gradient(ellipse at 60% 80%, rgba(190,254,1,0.08) 0%, transparent 50%);
```

---

## Tipografia

### Font Family
- **Headings**: `'Unbounded', system-ui, sans-serif` — bold, geometrica, display
- **Body**: `'Inter', system-ui, sans-serif` — legibilidade

### Escala

| Elemento     | Size    | Weight     | Line Height | Tracking    |
|-------------|---------|------------|-------------|-------------|
| H1          | 2rem    | 700 (Bold) | 1.2         | -0.025em   |
| H2          | 1.5rem  | 600 (Semi) | 1.3         | -0.02em    |
| H3          | 1.25rem | 600 (Semi) | 1.4         | -0.015em   |
| Body        | 0.875rem| 400 (Reg)  | 1.6         | 0          |
| Small       | 0.75rem | 500 (Med)  | 1.5         | 0.01em     |
| Badge       | 0.6875rem| 600 (Semi)| 1           | 0.02em     |

---

## Border Radius

| Token    | Value  | Uso                                |
|----------|--------|------------------------------------|
| `--radius` | `1rem` (16px) | Cards, dialogs, dropdowns  |
| `lg`     | `1rem`   | Containers                       |
| `md`     | `0.75rem`| Botões, inputs                   |
| `sm`     | `0.5rem` | Badges, chips                    |
| `full`   | `9999px` | Avatars, pills                   |

---

## Sombras

```css
--shadow-sm: 0 1px 3px rgba(124,106,255,0.04), 0 1px 2px rgba(0,0,0,0.03);
--shadow-md: 0 4px 12px rgba(124,106,255,0.08), 0 2px 4px rgba(0,0,0,0.03);
--shadow-lg: 0 12px 32px rgba(124,106,255,0.12), 0 4px 8px rgba(0,0,0,0.04);
--shadow-glow: 0 0 20px rgba(124,106,255,0.25);
```

---

## Animações

### Timing
- **Rápida**: `150ms` — hovers, focus
- **Normal**: `300ms` — transições de estado
- **Suave**: `500ms` — entrada de elementos
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` — default
- **Spring**: `cubic-bezier(0.34, 1.56, 0.64, 1)` — bouncy, interações

### Keyframes

```
fade-in         — opacity 0→1, translateY 8px→0 (500ms)
fade-in-up      — opacity 0→1, translateY 16px→0 (500ms)
scale-in        — opacity 0→1, scale 0.95→1 (300ms)
slide-in-left   — translateX -100%→0 (300ms)
slide-in-right  — translateX 100%→0 (300ms)
shimmer         — backgroundPosition -200%→200% (2s, infinite)
float           — translateY 0→-6px→0 (3s, infinite)
pulse-glow      — box-shadow glow 0→20px→0 (2s, infinite)
gradient-shift  — background-position 0%→100% (8s, infinite, alternate)
```

### Micro-interações
- **Botão hover**: `scale(1.02)` + shadow-md + brighten
- **Botão press**: `scale(0.98)` — feedback tátil
- **Card hover**: `translateY(-2px)` + shadow-lg
- **Badge**: glow sutil no hover
- **Sidebar item active**: left border 3px + bg accent
- **Page enter**: fade-in-up staggered (cada card 50ms delay)
- **Tooltip**: scale-in from origin

---

## Componentes — Diretrizes

### Botões
- Radius: `md` (0.75rem)
- Primary: bg gradient purple, text white, hover scale+glow
- Secondary: bg lavender, text purple-dark
- Ghost: transparent, hover bg-muted
- Destructive: bg hot-pink, hover darken

### Cards
- Radius: `lg` (1rem)
- Border: 1px solid border
- Background: card (white)
- Hover: translateY(-2px) + shadow-md
- Transition: all 300ms ease

### Badges
- Radius: `full` (pill)
- Variantes: default (purple), secondary (lavender), destructive (pink), success (neon-green), outline

### Inputs
- Radius: `md` (0.75rem)
- Border: 1px solid border
- Focus: ring-2 ring-primary/30 + border-primary
- Transition: border+shadow 200ms

### Sidebar
- Background: sutil lavender tint
- Item ativo: bg-accent + left-border 3px primary + text primary + font-medium
- Item hover: bg-muted/50
- Logo: gradient background circle/square

### Header
- Fundo: glass effect (backdrop-blur + bg-card/80)
- Border-bottom sutil
- Altura: 56px (3.5rem)

### Tabelas
- Header: bg-muted, font-medium
- Rows: hover bg-muted/30
- Borders: horizontal only

---

## Responsividade

| Breakpoint | Width    | Comportamento                    |
|-----------|----------|----------------------------------|
| Mobile    | < 640px  | Sidebar hidden, single column    |
| Tablet    | 640-1024 | Sidebar collapsed (icon only)    |
| Desktop   | > 1024px | Sidebar expanded, multi-column   |

---

## Ícones

- **Biblioteca**: Lucide React
- **Tamanho padrão**: 16px (h-4 w-4) para inline, 20px (h-5 w-5) para destaque
- **Stroke width**: 1.5 (padrão Lucide)

---

## Regra de Ouro

> Todo elemento interativo deve ter feedback visual em **< 100ms**.
> Transições de estado devem ser **suaves e previsíveis**.
> Gradientes e cores criam **hierarquia**, não distração.
