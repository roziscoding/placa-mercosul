---
name: create-flag
description: Step-by-step guide to create a new country flag for the Mercosul plate
user_invocable: true
---

# Create a New Country Flag

You are creating a new country flag 3D model for the Mercosul license plate customizer.

## Prerequisites

- The dev server should be running (`mise run dev`)
- Ask the user which country they want to add
- Look up a reference image of that country's flag. For a simplified version of the flag (useful since the flag will be tiny on the plate), search for the country's flag emoji on [OpenMoji](https://openmoji.org/) — they simplify complex emblems well. Compare with the real flag to decide what level of detail is feasible

## Step-by-step Process

### 1. Create the flag file

Create `src/lib/flag-<country>.ts`. Use `src/lib/flag-brazil.ts` as a reference — read it fully before starting.

The function signature must match `FlagBuilder` from `src/lib/types.ts`:

```typescript
export function build<Country>Flag(
  width: number,
  height: number,
  depth: number,
  style: "flat" | "relief" = "relief",
): Group
```

### 2. Start with just a colored rectangle

Create the function returning only the base background shape of the flag (e.g., blue rectangle for Argentina, red/white/blue stripes for Paraguay). **Do not add any other elements yet.**

### 3. Switch the dev model selector to view the flag in isolation

In the worker file (`src/lib/worker/plate-worker.ts`), the dev model selector already handles this — it looks up the flag builder from `COUNTRY_TEMPLATES` by `flagCountry`. So you must register the flag in the template (step 7) before you can use the dev selector. Do that early with just the basic rectangle, then iterate.

**Quick dev switching:** To avoid needing to interact with UI dropdowns (which can be unreliable with browser automation), temporarily change the defaults in code:
- `DEFAULT_PARAMS.flagCountry` in `src/lib/types.ts` → set to the new country name
- `devModel` initial value in `src/App.svelte` → set to `"flag-flat"` or `"flag-relief"`

Remember to restore these defaults before committing.

### 4. Verify visually, then add the next layer

Take a screenshot or ask the user to verify. Only proceed to the next element after confirming the current one looks correct. Add elements one at a time:

- Background shape(s) (stripes, etc.)
- Central emblem/shape
- Details (stars, sun, coat of arms — simplify complex elements)

### 5. Implement both modes

The flag must support two modes:

**Flat mode** (`style === "flat"`):
- ALL shapes have the same Z position (z=0) and same depth
- Each shape MUST have holes cut for the shapes above it to prevent z-fighting
- Use `Shape.holes.push(new Path(...))` — create the Path version of the shape above and add it as a hole
- This is for multi-material 3D printing (different filament colors)

**Relief mode** (`style === "relief"`):
- Shapes stack at increasing Z offsets: `z0 = 0`, `z1 = layerDepth`, `z2 = layerDepth * 2`, etc.
- Each shape has `depth = layerDepth` (total depth divided by number of layers)
- No holes needed — shapes don't overlap in Z
- This is for single-material 3D printing (the relief is visible by height difference)

Common pattern:

```typescript
const layerDepth = depth / numberOfLayers;
const flat = style === "flat";

const z0 = 0;
const z1 = flat ? 0 : layerDepth;
const z2 = flat ? 0 : layerDepth * 2;
const d = flat ? depth : layerDepth;
```

### 6. Always add a white border

Every flag must have a white border rectangle as the outermost layer. This border MUST have a hole for the flag background shape (in both flat and relief modes) to avoid z-fighting.

```typescript
const border = height * 0.06;
const totalW = width / 2 + border;
const totalH = height / 2 + border;

const borderShape = new Shape();
borderShape.moveTo(-totalW, -totalH);
borderShape.lineTo(totalW, -totalH);
borderShape.lineTo(totalW, totalH);
borderShape.lineTo(-totalW, totalH);
borderShape.lineTo(-totalW, -totalH);

// Always cut hole for the background
const bgHole = new Path();
bgHole.moveTo(-w, -h);
bgHole.lineTo(w, -h);
bgHole.lineTo(w, h);
bgHole.lineTo(-w, h);
bgHole.lineTo(-w, -h);
borderShape.holes.push(bgHole);
```

### 7. Register the flag in COUNTRY_TEMPLATES

In `src/lib/types.ts`:

1. Add the import at the top (near the `buildBrazilFlag` import):
   ```typescript
   import { build<Country>Flag } from "./flag-<country>";
   ```

2. Add `flag: build<Country>Flag` to the matching entry in `COUNTRY_TEMPLATES`:
   ```typescript
   { name: "Argentina", countryText: "ARGENTINA", brText: "RA", flag: buildArgentinaFlag },
   ```

No other changes are needed — the ConfigPanel automatically shows the flag toggle when `flag` is present in the template.

### 8. Verify on the full plate

Switch the dev model selector back to "Placa completa" and verify the flag appears correctly on the blue strip. The flag is positioned automatically by `plate-geometry.ts`.

## Important Caveats

- **All shapes are centered at origin (0,0).** The flag function builds geometry centered at (0,0). Positioning on the plate is handled by `plate-geometry.ts`, not by the flag builder
- **Shapes use Three.js 2D primitives:** `Shape` for filled areas, `Path` for holes. Use `moveTo`, `lineTo`, `quadraticCurveTo`, `absarc` etc.
- **Every `Shape` needs a matching `Path` version** if it will be used as a hole in flat mode. Create helper functions for reusable shapes (see `makeDiamondShape`/`makeDiamondPath` pattern in `flag-brazil.ts`)
- **Printability over accuracy.** The flag will be tiny on the plate (~4mm tall). Complex shapes (stars with thin points, fine text, detailed emblems) won't print well — simplify to basic geometric shapes that a 3D printer can handle (e.g., use a circle instead of a star with points, rectangles instead of detailed coats of arms). Colors in the preview are just a visual reference — STL has no color, users choose filament colors when printing
- **Test flat mode for z-fighting.** If you see flickering/shimmering surfaces, a hole is missing. Every shape that overlaps with another at the same Z must have a hole cut
- **Do NOT use CSG/boolean operations.** Use `Shape` with `Path` holes instead — it's much simpler and faster
- **Mind the winding order.** Shapes should be defined counter-clockwise, holes clockwise (Three.js convention). If a hole appears inverted, reverse the point order
