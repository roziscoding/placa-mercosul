# Placa Mercosul 3D

Web app para customizar e exportar como STL um modelo 3D de chaveiro de placa Mercosul.

Preview 3D em tempo real no browser, com export STL para impressão 3D.

**[Acessar o app](https://about.rjmunhoz.me/placa-mercosul/)**

## Features

- Texto da placa customizável com auto-fit (reduzir ou quebrar linha)
- Templates de países do Mercosul (Brasil, Argentina, Uruguai, Paraguai)
- Bandeiras dos 4 países na faixa azul com detalhes geométricos
- Bandeira flat (multifilamento) ou relevo (monofilamento)
- Dimensões, borda, faixa azul, furo — tudo configurável
- Cores customizáveis no preview
- Interface em Português e Espanhol
- Export STL binário

## Bandeiras

Cada bandeira suporta dois modos de renderização:

- **Flat**: camadas na mesma altura, com recortes (holes) para evitar z-fighting. Ideal para impressão multifilamento
- **Relief**: camadas empilhadas em Z com alturas crescentes. Ideal para impressão monofilamento — o relevo permite pintura manual

| País | Elementos |
|------|-----------|
| Brasil | Retângulo verde, losango amarelo, círculo azul, faixa branca |
| Argentina | Faixas azul claro e branca, Sol de Mayo |
| Uruguai | Faixas brancas e azuis, cantão branco, Sol de Mayo |
| Paraguai | Faixas vermelha, branca e azul, círculo central |

## Tech Stack

- **Svelte 5** (runes) + **Vite** + **TypeScript**
- **Three.js** — renderização 3D, geometria, STLExporter, TTFLoader
- **Web Worker** — geração 3D off-thread
- **bun** — package manager (versão gerenciada via mise)
- **GitHub Pages** — deploy automático via GitHub Actions

## Desenvolvimento

```bash
mise run dev
```

## Build

```bash
mise run build
```

## Preview do build

```bash
mise run preview
```

## Estrutura

```
src/
  App.svelte                     # Layout: sidebar + preview
  components/
    ConfigPanel.svelte            # Formulário de parâmetros
    PreviewCanvas.svelte          # Canvas Three.js + OrbitControls
  lib/
    types.ts                      # PlateParams, defaults, templates de país
    plate-geometry.ts             # Construção 3D da placa
    rounded-rect.ts               # Helper: retângulo arredondado
    flag-brazil.ts                # Bandeira do Brasil
    flag-argentina.ts             # Bandeira da Argentina
    flag-uruguay.ts               # Bandeira do Uruguai
    flag-paraguay.ts              # Bandeira do Paraguai
    i18n.svelte.ts                # Internacionalização (PT/ES)
    stl-export.ts                 # Export STL
    worker/
      plate-worker.ts             # Web Worker
```

## Adicionando bandeira de um novo país

1. Criar `src/lib/flag-<pais>.ts` exportando uma função com a assinatura [`FlagBuilder`](src/lib/types.ts)
2. Adicionar o import e a referência no campo `flag` do template correspondente em [`COUNTRY_TEMPLATES`](src/lib/types.ts)
3. A bandeira deve suportar os modos `flat` (sem sobreposição, com holes) e `relief` (layers empilhados em Z)

## Créditos

Baseado no modelo [MERCOSUR CAR LICENSE PLATE](https://makerworld.com/en/models/2218429-mercosur-car-license-plate) criado por [@yurizr](https://makerworld.com/en/@yurizr) no MakerWorld.
