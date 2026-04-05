import {
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
} from 'three'

// Helpers to create reusable shape paths

function diamondPoints(dw: number, dh: number) {
  return [
    { x: -dw, y: 0 },
    { x: 0, y: dh },
    { x: dw, y: 0 },
    { x: 0, y: -dh },
  ]
}

function makeDiamondShape(dw: number, dh: number): Shape {
  const s = new Shape()
  const pts = diamondPoints(dw, dh)
  s.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i].x, pts[i].y)
  s.lineTo(pts[0].x, pts[0].y)
  return s
}

function makeDiamondPath(dw: number, dh: number): Path {
  const p = new Path()
  const pts = diamondPoints(dw, dh)
  p.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i].x, pts[i].y)
  p.lineTo(pts[0].x, pts[0].y)
  return p
}

function makeCircleShape(r: number): Shape {
  const s = new Shape()
  s.absarc(0, 0, r, 0, Math.PI * 2, false)
  return s
}

function makeCirclePath(r: number): Path {
  const p = new Path()
  p.absarc(0, 0, r, 0, Math.PI * 2, false)
  return p
}

interface BandPoints {
  upper: { x: number, y: number }[]
  lower: { x: number, y: number }[]
}

function computeBandPoints(cr: number): BandPoints {
  const bandHalfHeight = cr * 0.12
  const segments = 32
  const arcRadius = cr * 3.5
  const arcCenterY = -arcRadius + bandHalfHeight + cr * 0.08

  const upper: { x: number, y: number }[] = []
  const lower: { x: number, y: number }[] = []

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = -cr + t * 2 * cr
    const maxY = Math.sqrt(Math.max(0, cr * cr - x * x))
    const yArc = arcCenterY + Math.sqrt(Math.max(0, arcRadius * arcRadius - x * x))

    const yU = Math.min(yArc + bandHalfHeight, maxY)
    const yL = Math.max(yArc - bandHalfHeight, -maxY)

    if (yU > yL) {
      upper.push({ x, y: yU })
      lower.push({ x, y: yL })
    }
  }
  return { upper, lower }
}

function makeBandShape(band: BandPoints): Shape | null {
  if (band.upper.length < 3)
    return null
  const s = new Shape()
  s.moveTo(band.upper[0].x, band.upper[0].y)
  for (let i = 1; i < band.upper.length; i++) {
    s.lineTo(band.upper[i].x, band.upper[i].y)
  }
  for (let i = band.lower.length - 1; i >= 0; i--) {
    s.lineTo(band.lower[i].x, band.lower[i].y)
  }
  s.lineTo(band.upper[0].x, band.upper[0].y)
  return s
}

function makeBandPath(band: BandPoints): Path | null {
  if (band.upper.length < 3)
    return null
  const p = new Path()
  p.moveTo(band.upper[0].x, band.upper[0].y)
  for (let i = 1; i < band.upper.length; i++) {
    p.lineTo(band.upper[i].x, band.upper[i].y)
  }
  for (let i = band.lower.length - 1; i >= 0; i--) {
    p.lineTo(band.lower[i].x, band.lower[i].y)
  }
  p.lineTo(band.upper[0].x, band.upper[0].y)
  return p
}

/**
 * Build a 3D Brazilian flag centered at origin.
 *
 * "flat": no overlap, each layer has holes for the layer above (for multi-material)
 * "relief": stacked Z layers (for single-material, visible by height difference)
 */
export function buildBrazilFlag(
  width: number,
  height: number,
  depth: number,
  style: 'flat' | 'relief' = 'relief',
): Group {
  const group = new Group()

  const green = new MeshStandardMaterial({ color: 0x009739 })
  const yellow = new MeshStandardMaterial({ color: 0xFEDD00 })
  const blue = new MeshStandardMaterial({ color: 0x012169 })
  const white = new MeshStandardMaterial({ color: 0xFFFFFF })

  const border = height * 0.06 // white border thickness
  const totalW = width / 2 + border
  const totalH = height / 2 + border
  const w = width / 2
  const h = height / 2

  const dw = w * 0.85
  const dh = h * 0.85
  const cr = h * 0.45
  const band = computeBandPoints(cr)

  const numberOfLayers = 5
  const layerDepth = depth / numberOfLayers
  const flat = style === 'flat'

  // Relief: all start at z=0, each layer is progressively taller
  // Each color gets its own unique depth tier for filament-swap printing
  const d0 = flat ? depth : layerDepth        // white border (thinnest)
  const d1 = flat ? depth : layerDepth * 2    // green rectangle
  const d2 = flat ? depth : layerDepth * 3    // yellow diamond
  const d3 = flat ? depth : layerDepth * 4    // blue circle
  const d4 = flat ? depth : depth             // white band (tallest = full depth)

  // 0. White border around the flag
  const borderShape = new Shape()
  borderShape.moveTo(-totalW, -totalH)
  borderShape.lineTo(totalW, -totalH)
  borderShape.lineTo(totalW, totalH)
  borderShape.lineTo(-totalW, totalH)
  borderShape.lineTo(-totalW, -totalH)

  // Hole for the green area (avoids z-fighting in both modes)
  const greenHole = new Path()
  greenHole.moveTo(-w, -h)
  greenHole.lineTo(w, -h)
  greenHole.lineTo(w, h)
  greenHole.lineTo(-w, h)
  greenHole.lineTo(-w, -h)
  borderShape.holes.push(greenHole)

  const borderGeo = new ExtrudeGeometry(borderShape, { depth: d0, bevelEnabled: false })
  const borderMesh = new Mesh(borderGeo, white)
  group.add(borderMesh)

  // 1. Green rectangle (with diamond hole in flat mode)
  const rectShape = new Shape()
  rectShape.moveTo(-w, -h)
  rectShape.lineTo(w, -h)
  rectShape.lineTo(w, h)
  rectShape.lineTo(-w, h)
  rectShape.lineTo(-w, -h)

  if (flat) {
    rectShape.holes.push(makeDiamondPath(dw, dh))
  }

  const rectGeo = new ExtrudeGeometry(rectShape, { depth: d1, bevelEnabled: false })
  const rectMesh = new Mesh(rectGeo, green)
  group.add(rectMesh)

  // 2. Yellow diamond (with circle hole in flat mode)
  const diamondShape = makeDiamondShape(dw, dh)

  if (flat) {
    diamondShape.holes.push(makeCirclePath(cr))
  }

  const diamondGeo = new ExtrudeGeometry(diamondShape, { depth: d2, bevelEnabled: false })
  const diamondMesh = new Mesh(diamondGeo, yellow)
  group.add(diamondMesh)

  // 3. Blue circle (with band hole in flat mode)
  const circleShape = makeCircleShape(cr)

  if (flat) {
    const bandPath = makeBandPath(band)
    if (bandPath)
      circleShape.holes.push(bandPath)
  }

  const circleGeo = new ExtrudeGeometry(circleShape, { depth: d3, bevelEnabled: false })
  const circleMesh = new Mesh(circleGeo, blue)
  group.add(circleMesh)

  // 4. White curved band
  const bandShape = makeBandShape(band)
  if (bandShape) {
    const bandGeo = new ExtrudeGeometry(bandShape, { depth: d4, bevelEnabled: false })
    const bandMesh = new Mesh(bandGeo, white)
    group.add(bandMesh)
  }

  return group
}
