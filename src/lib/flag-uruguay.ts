import {
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
} from 'three'

/**
 * Build a 3D Uruguayan flag centered at origin.
 *
 * Simplified: 9 horizontal stripes (5 white, 4 blue) with a golden
 * Sol de Mayo circle in the upper-left canton.
 *
 * "flat": no overlap, each layer has holes for the layer above (for multi-material)
 * "relief": stacked Z layers (for single-material, visible by height difference)
 */
export function buildUruguayFlag(
  width: number,
  height: number,
  depth: number,
  style: 'flat' | 'relief' = 'relief',
): Group {
  const group = new Group()

  const blue = new MeshStandardMaterial({ color: 0x0038A8 })
  const white = new MeshStandardMaterial({ color: 0xFFFFFF })
  const golden = new MeshStandardMaterial({ color: 0xF6B40E })

  const border = height * 0.06
  const totalW = width / 2 + border
  const totalH = height / 2 + border
  const w = width / 2
  const h = height / 2

  const stripeH = height / 9
  const cantonSize = 5 * stripeH // canton is square, 5 stripes tall
  const cantonLeft = -w
  const cantonRight = -w + cantonSize
  const cantonTop = h

  const sunX = cantonLeft + cantonSize / 2
  const sunY = cantonTop - cantonSize / 2
  const sunRadius = cantonSize * 0.25

  const numberOfLayers = 4 // border, white bg, blue stripes, sun
  const layerDepth = depth / numberOfLayers
  const flat = style === 'flat'

  const z0 = 0
  const z1 = flat ? 0 : layerDepth
  const z2 = flat ? 0 : layerDepth * 2
  const d = flat ? depth : layerDepth

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

  function makeSunPath(cx: number, cy: number, r: number): Path {
    const p = new Path()
    p.absarc(cx, cy, r, 0, Math.PI * 2, false)
    return p
  }

  // Blue stripe Y positions (from top): stripes 2, 4, 6, 8
  // Stripe i (1-indexed from top): top = h - (i-1)*stripeH, bottom = h - i*stripeH
  const blueStripes: { top: number, bottom: number, inCanton: boolean }[] = [
    { top: h - 1 * stripeH, bottom: h - 2 * stripeH, inCanton: true }, // stripe 2
    { top: h - 3 * stripeH, bottom: h - 4 * stripeH, inCanton: true }, // stripe 4
    { top: h - 5 * stripeH, bottom: h - 6 * stripeH, inCanton: false }, // stripe 6
    { top: h - 7 * stripeH, bottom: h - 8 * stripeH, inCanton: false }, // stripe 8
  ]

  // 0. White border
  const borderShape = makeRectShape(-totalW, -totalH, totalW, totalH)
  borderShape.holes.push(makeRectPath(-w, -h, w, h))

  const borderGeo = new ExtrudeGeometry(borderShape, { depth: d, bevelEnabled: false })
  const borderMesh = new Mesh(borderGeo, white)
  borderMesh.position.z = z0
  group.add(borderMesh)

  // 1. White background (full rectangle, with holes for blue stripes + sun in flat mode)
  const bgShape = makeRectShape(-w, -h, w, h)
  if (flat) {
    for (const stripe of blueStripes) {
      const left = stripe.inCanton ? cantonRight : -w
      bgShape.holes.push(makeRectPath(left, stripe.bottom, w, stripe.top))
    }
    bgShape.holes.push(makeSunPath(sunX, sunY, sunRadius))
  }

  const bgGeo = new ExtrudeGeometry(bgShape, { depth: d, bevelEnabled: false })
  const bgMesh = new Mesh(bgGeo, white)
  bgMesh.position.z = z0
  group.add(bgMesh)

  // 2. Blue stripes (4 stripes, top 2 shortened to avoid canton)
  for (const stripe of blueStripes) {
    const left = stripe.inCanton ? cantonRight : -w
    const stripeShape = makeRectShape(left, stripe.bottom, w, stripe.top)

    const geo = new ExtrudeGeometry(stripeShape, { depth: d, bevelEnabled: false })
    const mesh = new Mesh(geo, blue)
    mesh.position.z = z1
    group.add(mesh)
  }

  // 3. Sol de Mayo (golden circle in canton center)
  const sunShape = new Shape()
  sunShape.absarc(sunX, sunY, sunRadius, 0, Math.PI * 2, false)

  const sunGeo = new ExtrudeGeometry(sunShape, { depth: d, bevelEnabled: false })
  const sunMesh = new Mesh(sunGeo, golden)
  sunMesh.position.z = z2
  group.add(sunMesh)

  return group
}
