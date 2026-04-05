# CLAUDE.md

## Project Overview

Web app to customize and export 3D Mercosul license plate keychains as STL files. Built with Svelte 5 + Vite + Three.js. Users configure plate parameters via a sidebar form, see a real-time 3D preview, and export the result as a binary STL for 3D printing.

## Commands

- `mise run dev` — start dev server (http://localhost:5173)
- `mise run build` — production build
- `mise run preview` — preview production build
- `bun run check` — type check (svelte-check + tsc)

## Architecture

- **Package manager**: bun (version managed by mise via `mise.toml`)
- **Tasks**: mise file tasks in `.mise/tasks/`
- **Web Worker**: geometry is built in a worker (`src/lib/worker/plate-worker.ts`), serialized as `Float32Array` with transfer, deserialized in the main thread
- **Svelte 5 runes**: use `$state.snapshot()` before sending params to worker (Proxy objects can't be cloned via `postMessage`)
- **No CSS framework**: pure scoped Svelte `<style>` blocks + minimal `app.css`
- **UI language**: Portuguese (Brazilian)

## Key Files

- `src/lib/types.ts` — `PlateParams` interface, `DEFAULT_PARAMS`, `CountryTemplate`, `FlagBuilder` type
- `src/lib/plate-geometry.ts` — `buildPlateGroup()`: builds the full plate as a `THREE.Group`. Contains text fitting logic (shrink/wrap)
- `src/lib/rounded-rect.ts` — `createRoundedRectShape()`: rounded rectangle as `THREE.Shape`
- `src/lib/flag-brazil.ts` — `buildBrazilFlag()`: Brazilian flag with flat/relief modes
- `src/lib/stl-export.ts` — STL export helpers
- `src/lib/worker/plate-worker.ts` — Web Worker handling build + STL export. Also handles dev model switching
- `src/components/PreviewCanvas.svelte` — Three.js scene, camera, lights, OrbitControls, worker communication, font loading via TTFLoader
- `src/components/ConfigPanel.svelte` — form with all plate parameters, country templates, flag toggles
- `src/App.svelte` — layout (sidebar + preview), export button, dev model selector, credits

## Geometry Approach

- **Coordinate system**: X = plate length, Y = plate width, Z = up (extrusion direction)
- **No CSG for base plate**: border uses `Shape` with `Path` holes, blue strip uses a manual shape with rounded top corners. This is simpler and faster than boolean operations
- **Text**: `TextGeometry` from Three.js, centered via bounding box translation. Extrudes in Z+ from the plate surface. The readable face is the back face of the extrusion (z=depth), which faces +Z (upward) — no rotation needed
- **Text fitting**: two modes controlled by `textFit` param:
  - `shrink`: reduces font size until text fits the available width
  - `wrap`: splits text by spaces into multiple lines, then shrinks font until all lines fit both width and height
- **Flags**: each visual layer (e.g., green rect, yellow diamond, blue circle, white band) is a separate extruded `Shape`. In flat mode, each shape has holes cut for the layer above to prevent z-fighting. In relief mode, layers stack at increasing Z offsets
- **Nested groups**: flags are `THREE.Group` instances added as children of the plate group. The worker uses `getWorldPosition()` to serialize absolute positions for correct rendering

## Building 3D Models — Development Process

When creating or modifying 3D geometry (new flag, new plate element, etc.), follow this incremental process:

1. **Start with the simplest shape** — render just a basic rectangle or circle in isolation. Use the dev model selector to view it without the full plate
2. **Add detail one layer at a time** — add each visual element separately, verifying after each addition
3. **Verify visually after each step** — take screenshots or ask the user to confirm. Don't add the next layer until the current one looks correct
4. **Only integrate into the full model after the isolated version works** — once all layers render correctly in isolation, add it to the plate

### Visual verification

Take screenshots or ask the user to send them manually. Always ask before taking screenshots automatically — never assume permission.

## Taking Screenshots

If the `agent-browser` skill or executable is available, prefer using it — it can navigate to the dev server URL and take screenshots directly without depending on the user's desktop environment.

Otherwise, the method depends on the user's desktop environment. Always ask the user which method works for them if unsure. After taking a screenshot, read it with the `Read` tool to view the result.

### Examples by environment

**Hyprland** (grim + hyprctl — capture a specific window by class name):

```bash
grim -g "$(hyprctl -j clients | python3 -c "
import json, sys
clients = json.load(sys.stdin)
for c in clients:
    if 'firefox' in c.get('class', '').lower():
        at = c['at']
        sz = c['size']
        print(f'{at[0]},{at[1]} {sz[0]}x{sz[1]}')
        break
")" /tmp/screenshot.png
```

**macOS**:

```bash
screencapture -l $(osascript -e 'tell app "Firefox" to id of window 1') /tmp/screenshot.png
```

**X11** (xdotool + import):

```bash
import -window "$(xdotool search --name Firefox | head -1)" /tmp/screenshot.png
```

If none of these work, ask the user to send screenshots manually.

## Adding or Editing Country Flags

**Always use the `/create-flag` skill** when the user wants to add a new flag or edit an existing one. The skill (`.claude/skills/create-flag.md`) contains the full step-by-step process, code patterns, and caveats. Do not attempt to create or modify flags without invoking it first.

## Dev Mode

- A model selector dropdown appears in the top-right corner (only in dev, via `import.meta.env.DEV`)
- Options: "Placa completa", "Bandeira (flat)", "Bandeira (relief)"
- Flag dev models use the currently selected `flagCountry` from params; shows a grey rectangle placeholder if no flag builder exists for that country
- Use this to develop and debug geometry in isolation before integrating

## Common Pitfalls

- **Svelte 5 `$state` Proxy**: always use `$state.snapshot()` before `postMessage` to the worker
- **Nested Group positions**: the worker serializer must use `getWorldPosition()` not `child.position` (which is local to parent)
- **ExtrudeGeometry direction**: extrudes from z=0 to z=+depth. The shape face at z=0 has normals pointing -Z, the back face at z=depth has normals pointing +Z. For text/elements that should be readable from above, place them at z=thickness and let them extrude upward
- **Z-fighting**: when two shapes occupy the same Z range, use holes (`Shape.holes.push(new Path(...))`) to cut out overlapping areas instead of relying on render order
- **Flag depth on plate**: flat flags use 0.2mm depth, relief flags use `borderHeight * 0.5`. Flags are positioned at `z = thickness + borderHeight` (on top of the border/strip)

## Git

- Always use [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`)
- Never add self-credit to commits (no "Co-Authored-By" or similar attribution to the AI agent)
