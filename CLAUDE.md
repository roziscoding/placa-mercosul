# CLAUDE.md

## Project Overview

Web app to customize and export 3D Mercosul license plate keychains as STL files. Built with Svelte 5 + Vite + Three.js.

## Commands

- `mise run dev` — start dev server
- `mise run build` — production build
- `mise run preview` — preview production build
- `bun run check` — type check (svelte-check + tsc)

## Architecture

- **Package manager**: bun (version managed by mise via `mise.toml`)
- **Tasks**: mise file tasks in `.mise/tasks/`
- **Web Worker**: geometry is built in a worker (`src/lib/worker/plate-worker.ts`), serialized as `Float32Array` with transfer, deserialized in the main thread
- **Svelte 5 runes**: use `$state.snapshot()` before sending params to worker (Proxy objects can't be cloned)

## Key Files

- `src/lib/types.ts` — `PlateParams` interface, `DEFAULT_PARAMS`, `CountryTemplate`, `FlagBuilder` type
- `src/lib/plate-geometry.ts` — `buildPlateGroup()`: builds the full plate as a `THREE.Group`
- `src/lib/rounded-rect.ts` — `createRoundedRectShape()`: rounded rectangle as `THREE.Shape`
- `src/lib/flag-brazil.ts` — `buildBrazilFlag()`: Brazilian flag with flat/relief modes
- `src/lib/stl-export.ts` — STL export helpers
- `src/lib/worker/plate-worker.ts` — Web Worker handling build + STL export
- `src/components/PreviewCanvas.svelte` — Three.js scene, camera, lights, OrbitControls, worker communication
- `src/components/ConfigPanel.svelte` — form with all plate parameters

## Geometry Approach

- **No CSG for base plate**: border uses `Shape` with `Path` holes, blue strip uses a manual shape with rounded top corners
- **Text**: `TextGeometry` from Three.js, centered via bounding box translation. Extrudes in Z+, readable from above
- **Flags**: each layer is a separate extruded shape. In flat mode, each layer has holes for the layer above (no z-fighting). In relief mode, layers stack in Z

## Adding a New Country Flag

1. Create `src/lib/flag-<country>.ts` exporting a function matching the `FlagBuilder` type
2. The function receives `(width, height, depth, style: "flat" | "relief")` and returns a `THREE.Group`
3. In flat mode: shapes must have holes for overlapping layers (no z-fighting)
4. In relief mode: layers stack at increasing Z offsets
5. Add the builder to the corresponding entry in `COUNTRY_TEMPLATES` in `types.ts`

## Dev Mode

- A model selector appears in the top-right corner (only in dev, via `import.meta.env.DEV`)
- Options: "Placa completa", "Bandeira (flat)", "Bandeira (relief)"
- Flag dev models use the currently selected `flagCountry` from params; shows a grey rectangle if no flag builder exists

## Git

- Always use [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`)
- Never add self-credit to commits (no "Co-Authored-By" or similar attribution to the AI agent)

## Style

- CSS puro (scoped Svelte `<style>` blocks), no CSS framework
- Portuguese UI labels
