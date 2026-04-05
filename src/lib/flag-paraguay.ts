import {
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
} from 'three'

/**
 * Build a 3D Paraguayan flag centered at origin.
 *
 * Simplified: 3 horizontal stripes (red / white / blue) with a simplified
 * emblem in the center — a green circle outline with a golden star inside.
 *
 * "flat": no overlap, each layer has holes for the layer above (for multi-material)
 * "relief": stacked Z layers (for single-material, visible by height difference)
 */
export function buildParaguayFlag(
  width: number,
  height: number,
  depth: number,
  style: 'flat' | 'relief' = 'relief',
): Group {
  const group = new Group()

  const red = new MeshStandardMaterial({ color: 0xD22F27 })
  const white = new MeshStandardMaterial({ color: 0xFFFFFF })
  const blue = new MeshStandardMaterial({ color: 0x1E50A0 })
  const green = new MeshStandardMaterial({ color: 0x5C9E31 })
  const golden = new MeshStandardMaterial({ color: 0xF1B31C })

  const border = height * 0.06
  const totalW = width / 2 + border
  const totalH = height / 2 + border
  const w = width / 2
  const h = height / 2

  const stripeH = height / 3
  const emblemRadius = stripeH * 0.4 // circle emblem in center white stripe
  const ringThickness = emblemRadius * 0.15 // green ring thickness
  const starRadius = emblemRadius * 0.45 // golden star inside the circle

  const numberOfLayers = 6
  const layerDepth = depth / numberOfLayers
  const flat = style === 'flat'

  const d0 = flat ? depth : layerDepth // white border (thinnest)
  const d1 = flat ? depth : layerDepth * 2 // red stripe
  const d2 = flat ? depth : layerDepth * 3 // white middle stripe
  const d3 = flat ? depth : layerDepth * 4 // blue stripe
  const d4 = flat ? depth : layerDepth * 5 // green emblem ring
  const d5 = flat ? depth : depth // golden star (tallest)

  // --- Helpers ---
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

  function makeCirclePath(cx: number, cy: number, r: number): Path {
    const p = new Path()
    p.absarc(cx, cy, r, 0, Math.PI * 2, false)
    return p
  }

  // Make a 5-point star shape centered at (cx, cy) with outer radius r
  function makeStarShape(cx: number, cy: number, r: number): Shape {
    const s = new Shape()
    const innerR = r * 0.4
    const points = 5
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2
      const radius = i % 2 === 0 ? r : innerR
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      if (i === 0) s.moveTo(x, y)
      else s.lineTo(x, y)
    }
    s.closePath()
    return s
  }

  function makeStarPath(cx: number, cy: number, r: number): Path {
    const p = new Path()
    const innerR = r * 0.4
    const points = 5
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2
      const radius = i % 2 === 0 ? r : innerR
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      if (i === 0) p.moveTo(x, y)
      else p.lineTo(x, y)
    }
    p.closePath()
    return p
  }

  // Stripe positions (centered at origin)
  const redTop = h
  const redBottom = h - stripeH
  const whiteTop = redBottom
  const whiteBottom = whiteTop - stripeH
  const blueTop = whiteBottom
  const blueBottom = -h

  // 0. White border
  const borderShape = makeRectShape(-totalW, -totalH, totalW, totalH)
  borderShape.holes.push(makeRectPath(-w, -h, w, h))

  const borderGeo = new ExtrudeGeometry(borderShape, { depth: d0, bevelEnabled: false })
  const borderMesh = new Mesh(borderGeo, white)
  group.add(borderMesh)

  // 1. Red stripe (top)
  const redShape = makeRectShape(-w, redBottom, w, redTop)
  if (flat) {
    // No layer above overlaps the red stripe (emblem is in white stripe)
  }

  const redGeo = new ExtrudeGeometry(redShape, { depth: d1, bevelEnabled: false })
  const redMesh = new Mesh(redGeo, red)
  group.add(redMesh)

  // 2. White stripe (middle, with hole for green ring in flat mode)
  const whiteShape = makeRectShape(-w, whiteBottom, w, whiteTop)
  if (flat) {
    whiteShape.holes.push(makeCirclePath(0, 0, emblemRadius))
  }

  const whiteGeo = new ExtrudeGeometry(whiteShape, { depth: d2, bevelEnabled: false })
  const whiteMesh = new Mesh(whiteGeo, white)
  group.add(whiteMesh)

  // 3. Blue stripe (bottom)
  const blueShape = makeRectShape(-w, blueBottom, w, blueTop)
  if (flat) {
    // No layer above overlaps the blue stripe
  }

  const blueGeo = new ExtrudeGeometry(blueShape, { depth: d3, bevelEnabled: false })
  const blueMesh = new Mesh(blueGeo, blue)
  group.add(blueMesh)

  // 4. Green ring (circle with hole for inner area)
  const ringShape = new Shape()
  ringShape.absarc(0, 0, emblemRadius, 0, Math.PI * 2, false)

  // Cut inner circle to make it a ring
  const innerHole = new Path()
  innerHole.absarc(0, 0, emblemRadius - ringThickness, 0, Math.PI * 2, false)
  ringShape.holes.push(innerHole)

  if (flat) {
    // No need to cut star hole from ring — star is inside the inner circle, not overlapping the ring
  }

  const ringGeo = new ExtrudeGeometry(ringShape, { depth: d4, bevelEnabled: false })
  const ringMesh = new Mesh(ringGeo, green)
  group.add(ringMesh)

  // 5. Inner circle fill (white, inside the ring, with hole for star in flat mode)
  const innerShape = new Shape()
  innerShape.absarc(0, 0, emblemRadius - ringThickness, 0, Math.PI * 2, false)
  if (flat) {
    innerShape.holes.push(makeStarPath(0, 0, starRadius))
  }

  const innerGeo = new ExtrudeGeometry(innerShape, { depth: d2, bevelEnabled: false }) // white — same layer as white stripe
  const innerMesh = new Mesh(innerGeo, white)
  group.add(innerMesh)

  // 6. Golden star (5-point star in center)
  const starShape = makeStarShape(0, 0, starRadius)

  const starGeo = new ExtrudeGeometry(starShape, { depth: d5, bevelEnabled: false })
  const starMesh = new Mesh(starGeo, golden)
  group.add(starMesh)

  return group
}
