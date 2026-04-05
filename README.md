# Placa Mercosul 3D

Web app para customizar e exportar como STL um modelo 3D de chaveiro de placa Mercosul.

Preview 3D em tempo real no browser, com export STL para impressao 3D.

## Features

- Texto da placa customizavel com auto-fit (reduzir ou quebrar linha)
- Templates de paises do Mercosul (Brasil, Argentina, Uruguai, etc.)
- Bandeira do pais na faixa azul (Brasil implementado, extensivel)
- Bandeira flat (multifilamento) ou relevo (monofilamento)
- Dimensoes, borda, faixa azul, furo — tudo configuravel
- Cores customizaveis no preview
- Export STL binario

## Tech Stack

- **Svelte 5** (runes) + **Vite** + **TypeScript**
- **Three.js** — renderizacao 3D, geometria, STLExporter, TTFLoader
- **three-bvh-csg** — operacoes booleanas CSG
- **Web Worker** — geracao 3D off-thread
- **bun** — package manager (versao gerenciada via mise)

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
    ConfigPanel.svelte            # Formulario de parametros
    PreviewCanvas.svelte          # Canvas Three.js + OrbitControls
  lib/
    types.ts                      # PlateParams, defaults, templates de pais
    plate-geometry.ts             # Construcao 3D da placa
    rounded-rect.ts               # Helper: retangulo arredondado
    flag-brazil.ts                # Bandeira do Brasil (flat + relief)
    stl-export.ts                 # Export STL
    worker/
      plate-worker.ts             # Web Worker
```

## Adicionando bandeira de um novo pais

1. Criar `src/lib/flag-<pais>.ts` exportando uma funcao com a assinatura `FlagBuilder` (ver `types.ts`)
2. Adicionar o import e a referencia no `flag` do template correspondente em `COUNTRY_TEMPLATES`
3. A bandeira deve suportar os modos `flat` (sem sobreposicao, com holes) e `relief` (layers empilhados em Z)

## Creditos

Baseado no modelo [MERCOSUR CAR LICENSE PLATE](https://makerworld.com/en/models/2218429-mercosur-car-license-plate) criado por [@yurizr](https://makerworld.com/en/@yurizr) no MakerWorld.
