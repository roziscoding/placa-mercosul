import {
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
} from "three";

// Helpers to create reusable shape paths

function diamondPoints(dw: number, dh: number) {
  return [
    { x: -dw, y: 0 },
    { x: 0, y: dh },
    { x: dw, y: 0 },
    { x: 0, y: -dh },
  ];
}

function makeDiamondShape(dw: number, dh: number): Shape {
  const s = new Shape();
  const pts = diamondPoints(dw, dh);
  s.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i].x, pts[i].y);
  s.lineTo(pts[0].x, pts[0].y);
  return s;
}

function makeDiamondPath(dw: number, dh: number): Path {
  const p = new Path();
  const pts = diamondPoints(dw, dh);
  p.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i].x, pts[i].y);
  p.lineTo(pts[0].x, pts[0].y);
  return p;
}

function makeCircleShape(r: number): Shape {
  const s = new Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  return s;
}

function makeCirclePath(r: number): Path {
  const p = new Path();
  p.absarc(0, 0, r, 0, Math.PI * 2, false);
  return p;
}

interface BandPoints {
  upper: { x: number; y: number }[];
  lower: { x: number; y: number }[];
}

function computeBandPoints(cr: number): BandPoints {
  const bandHalfHeight = cr * 0.12;
  const segments = 32;
  const arcRadius = cr * 3.5;
  const arcCenterY = -arcRadius + bandHalfHeight + cr * 0.08;

  const upper: { x: number; y: number }[] = [];
  const lower: { x: number; y: number }[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = -cr + t * 2 * cr;
    const maxY = Math.sqrt(Math.max(0, cr * cr - x * x));
    const yArc = arcCenterY + Math.sqrt(Math.max(0, arcRadius * arcRadius - x * x));

    const yU = Math.min(yArc + bandHalfHeight, maxY);
    const yL = Math.max(yArc - bandHalfHeight, -maxY);

    if (yU > yL) {
      upper.push({ x, y: yU });
      lower.push({ x, y: yL });
    }
  }
  return { upper, lower };
}

function makeBandShape(band: BandPoints): Shape | null {
  if (band.upper.length < 3) return null;
  const s = new Shape();
  s.moveTo(band.upper[0].x, band.upper[0].y);
  for (let i = 1; i < band.upper.length; i++) {
    s.lineTo(band.upper[i].x, band.upper[i].y);
  }
  for (let i = band.lower.length - 1; i >= 0; i--) {
    s.lineTo(band.lower[i].x, band.lower[i].y);
  }
  s.lineTo(band.upper[0].x, band.upper[0].y);
  return s;
}

function makeBandPath(band: BandPoints): Path | null {
  if (band.upper.length < 3) return null;
  const p = new Path();
  p.moveTo(band.upper[0].x, band.upper[0].y);
  for (let i = 1; i < band.upper.length; i++) {
    p.lineTo(band.upper[i].x, band.upper[i].y);
  }
  for (let i = band.lower.length - 1; i >= 0; i--) {
    p.lineTo(band.lower[i].x, band.lower[i].y);
  }
  p.lineTo(band.upper[0].x, band.upper[0].y);
  return p;
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
  style: "flat" | "relief" = "relief",
): Group {
  const group = new Group();

  const green = new MeshStandardMaterial({ color: 0x009739 });
  const yellow = new MeshStandardMaterial({ color: 0xFEDD00 });
  const blue = new MeshStandardMaterial({ color: 0x012169 });
  const white = new MeshStandardMaterial({ color: 0xffffff });

  const border = height * 0.06; // white border thickness
  const totalW = width / 2 + border;
  const totalH = height / 2 + border;
  const w = width / 2;
  const h = height / 2;

  const dw = w * 0.85;
  const dh = h * 0.85;
  const cr = h * 0.45;
  const band = computeBandPoints(cr);

  const layerDepth = depth / 4;
  const flat = style === "flat";

  const z0 = 0;
  const z1 = flat ? 0 : layerDepth;
  const z2 = flat ? 0 : layerDepth * 2;
  const z3 = flat ? 0 : layerDepth * 3;
  const d = flat ? depth : layerDepth;

  // 0. White border around the flag
  const borderShape = new Shape();
  borderShape.moveTo(-totalW, -totalH);
  borderShape.lineTo(totalW, -totalH);
  borderShape.lineTo(totalW, totalH);
  borderShape.lineTo(-totalW, totalH);
  borderShape.lineTo(-totalW, -totalH);

  // Hole for the green area (avoids z-fighting in both modes)
  const greenHole = new Path();
  greenHole.moveTo(-w, -h);
  greenHole.lineTo(w, -h);
  greenHole.lineTo(w, h);
  greenHole.lineTo(-w, h);
  greenHole.lineTo(-w, -h);
  borderShape.holes.push(greenHole);

  const borderGeo = new ExtrudeGeometry(borderShape, { depth: d, bevelEnabled: false });
  const borderMesh = new Mesh(borderGeo, white);
  borderMesh.position.z = z0;
  group.add(borderMesh);

  // 1. Green rectangle (with diamond hole in flat mode)
  const rectShape = new Shape();
  rectShape.moveTo(-w, -h);
  rectShape.lineTo(w, -h);
  rectShape.lineTo(w, h);
  rectShape.lineTo(-w, h);
  rectShape.lineTo(-w, -h);

  if (flat) {
    rectShape.holes.push(makeDiamondPath(dw, dh));
  }

  const rectGeo = new ExtrudeGeometry(rectShape, { depth: d, bevelEnabled: false });
  const rectMesh = new Mesh(rectGeo, green);
  rectMesh.position.z = z0;
  group.add(rectMesh);

  // 2. Yellow diamond (with circle hole in flat mode)
  const diamondShape = makeDiamondShape(dw, dh);

  if (flat) {
    diamondShape.holes.push(makeCirclePath(cr));
  }

  const diamondGeo = new ExtrudeGeometry(diamondShape, { depth: d, bevelEnabled: false });
  const diamondMesh = new Mesh(diamondGeo, yellow);
  diamondMesh.position.z = z1;
  group.add(diamondMesh);

  // 3. Blue circle (with band hole in flat mode)
  const circleShape = makeCircleShape(cr);

  if (flat) {
    const bandPath = makeBandPath(band);
    if (bandPath) circleShape.holes.push(bandPath);
  }

  const circleGeo = new ExtrudeGeometry(circleShape, { depth: d, bevelEnabled: false });
  const circleMesh = new Mesh(circleGeo, blue);
  circleMesh.position.z = z2;
  group.add(circleMesh);

  // 4. White curved band
  const bandShape = makeBandShape(band);
  if (bandShape) {
    const bandGeo = new ExtrudeGeometry(bandShape, { depth: d, bevelEnabled: false });
    const bandMesh = new Mesh(bandGeo, white);
    bandMesh.position.z = z3;
    group.add(bandMesh);
  }

  return group;
}
