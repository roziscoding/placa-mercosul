import {
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
} from 'three'

/**
 * Build a 3D Argentine flag centered at origin.
 *
 * Simplified version: 3 horizontal stripes (light blue / white / light blue)
 * with a simplified Sol de Mayo (12-point star) in the center.
 *
 * "flat": no overlap, each layer has holes for the layer above (for multi-material)
 * "relief": stacked Z layers (for single-material, visible by height difference)
 */
export function buildArgentinaFlag(
  width: number,
  height: number,
  depth: number,
  style: 'flat' | 'relief' = 'relief',
): Group {
  const group = new Group()

  const lightBlue = new MeshStandardMaterial({ color: 0x74ACDF })
  const white = new MeshStandardMaterial({ color: 0xFFFFFF })
  const golden = new MeshStandardMaterial({ color: 0xF6B40E })

  const border = height * 0.06
  const totalW = width / 2 + border
  const totalH = height / 2 + border
  const w = width / 2
  const h = height / 2

  const stripeH = height / 3 // each stripe is 1/3 of height
  const sunRadius = stripeH * 0.35 // sun fits within white stripe

  const numberOfLayers = 4 // border, blue bg, white stripe, sun
  const layerDepth = depth / numberOfLayers
  const flat = style === 'flat'

  const z0 = 0
  const z1 = flat ? 0 : layerDepth
  const z2 = flat ? 0 : layerDepth * 2
  const d = flat ? depth : layerDepth

  // --- Helper: rectangle shape ---
  function makeRectShape(x1: number, y1: number, x2: number, y2: number): Shape {
    const s = new Shape()
    s.moveTo(x1, y1)
    s.lineTo(x2, y1)
    s.lineTo(x2, y2)
    s.lineTo(x1, y2)
    s.lineTo(x1, y1)
    return s
  }

  function makeRectPath(x1: number, y1: number, x2: number, y2: number): Path {
    const p = new Path()
    p.moveTo(x1, y1)
    p.lineTo(x2, y1)
    p.lineTo(x2, y2)
    p.lineTo(x1, y2)
    p.lineTo(x1, y1)
    return p
  }

  // --- Helper: sun (circle) shape/path ---
  function makeSunShape(r: number): Shape {
    const s = new Shape()
    s.absarc(0, 0, r, 0, Math.PI * 2, false)
    return s
  }

  function makeSunPath(r: number): Path {
    const p = new Path()
    p.absarc(0, 0, r, 0, Math.PI * 2, false)
    return p
  }

  // White stripe bounds (middle third)
  const whiteY1 = -stripeH / 2
  const whiteY2 = stripeH / 2

  // 0. White border
  const borderShape = makeRectShape(-totalW, -totalH, totalW, totalH)
  borderShape.holes.push(makeRectPath(-w, -h, w, h))

  const borderGeo = new ExtrudeGeometry(borderShape, { depth: d, bevelEnabled: false })
  const borderMesh = new Mesh(borderGeo, white)
  borderMesh.position.z = z0
  group.add(borderMesh)

  // 1. Blue background (full rectangle, with hole for white stripe in flat mode)
  const bgShape = makeRectShape(-w, -h, w, h)
  if (flat) {
    bgShape.holes.push(makeRectPath(-w, whiteY1, w, whiteY2))
  }

  const bgGeo = new ExtrudeGeometry(bgShape, { depth: d, bevelEnabled: false })
  const bgMesh = new Mesh(bgGeo, lightBlue)
  bgMesh.position.z = z0
  group.add(bgMesh)

  // 2. White stripe (middle third, with hole for sun in flat mode)
  const stripeShape = makeRectShape(-w, whiteY1, w, whiteY2)
  if (flat) {
    stripeShape.holes.push(makeSunPath(sunRadius))
  }

  const stripeGeo = new ExtrudeGeometry(stripeShape, { depth: d, bevelEnabled: false })
  const stripeMesh = new Mesh(stripeGeo, white)
  stripeMesh.position.z = z1
  group.add(stripeMesh)

  // 3. Sol de Mayo (12-point star)
  const sunShape = makeSunShape(sunRadius)
  const sunGeo = new ExtrudeGeometry(sunShape, { depth: d, bevelEnabled: false })
  const sunMesh = new Mesh(sunGeo, golden)
  sunMesh.position.z = z2
  group.add(sunMesh)

  return group
}
