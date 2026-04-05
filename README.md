# Placa Mercosul 3D

Web app para customizar e exportar como STL um modelo 3D de chaveiro de placa Mercosul.

Preview 3D em tempo real no browser, com export STL para impressão 3D.

## Features

- Texto da placa customizável com auto-fit (reduzir ou quebrar linha)
- Templates de países do Mercosul (Brasil, Argentina, Uruguai, etc.)
- Bandeira do país na faixa azul (Brasil implementado, extensível)
- Bandeira flat (multifilamento) ou relevo (monofilamento)
- Dimensões, borda, faixa azul, furo — tudo configurável
- Cores customizáveis no preview
- Export STL binário

## Tech Stack

- **Svelte 5** (runes) + **Vite** + **TypeScript**
- **Three.js** — renderização 3D, geometria, STLExporter, TTFLoader
- **three-bvh-csg** — operações booleanas CSG
- **Web Worker** — geração 3D off-thread
- **bun** — package manager (versão gerenciada via mise)

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
    flag-brazil.ts                # Bandeira do Brasil (flat + relief)
    stl-export.ts                 # Export STL
    worker/
      plate-worker.ts             # Web Worker
```

## Adicionando bandeira de um novo país

1. Criar `src/lib/flag-<pais>.ts` exportando uma função com a assinatura [`FlagBuilder`](src/lib/types.ts#L94) (ver [`flag-brazil.ts`](src/lib/flag-brazil.ts#L116) como referência)
2. Adicionar o import e a referência no campo `flag` do template correspondente em [`COUNTRY_TEMPLATES`](src/lib/types.ts#L111)
3. A bandeira deve suportar os modos `flat` (sem sobreposição, com holes) e `relief` (layers empilhados em Z)

## Créditos

Baseado no modelo [MERCOSUR CAR LICENSE PLATE](https://makerworld.com/en/models/2218429-mercosur-car-license-plate) criado por [@yurizr](https://makerworld.com/en/@yurizr) no MakerWorld.
