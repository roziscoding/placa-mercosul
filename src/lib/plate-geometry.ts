import type { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import type { PlateParams } from './types'
import {
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Path,
  Shape,
} from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { createRoundedRectShape } from './rounded-rect'
import { COUNTRY_TEMPLATES } from './types'

const WHITESPACE_RE = /\s+/

function createCenteredText(
  text: string,
  font: Font,
  size: number,
  depth: number,
): TextGeometry | null {
  if (!text)
    return null
  const geo = new TextGeometry(text.toUpperCase(), {
    font,
    size,
    depth,
    bevelEnabled: false,
  })
  geo.computeBoundingBox()
  const bb = geo.boundingBox!
  geo.translate(
    -(bb.max.x + bb.min.x) / 2,
    -(bb.max.y + bb.min.y) / 2,
    0,
  )
  return geo
}

function measureTextWidth(text: string, font: Font, size: number): number {
  const geo = new TextGeometry(text.toUpperCase(), {
    font,
    size,
    depth: 0.01,
    bevelEnabled: false,
  })
  geo.computeBoundingBox()
  const w = geo.boundingBox!.max.x - geo.boundingBox!.min.x
  geo.dispose()
  return w
}

function createFittedText(
  text: string,
  font: Font,
  baseSize: number,
  depth: number,
  maxWidth: number,
  maxHeight: number,
  mode: 'shrink' | 'wrap',
): { meshes: Mesh[], totalHeight: number } {
  const upper = text.toUpperCase()
  if (!upper)
    return { meshes: [], totalHeight: 0 }

  const mat = new MeshStandardMaterial({ color: 0x000000 }) // placeholder, caller sets color

  if (mode === 'shrink') {
    // Shrink font size until text fits width and height
    let size = baseSize
    while (size > 1 && measureTextWidth(upper, font, size) > maxWidth) {
      size -= 0.5
    }
    while (size > 1 && size > maxHeight) {
      size -= 0.5
    }
    const geo = createCenteredText(upper, font, size, depth)!
    const mesh = new Mesh(geo, mat)
    return { meshes: [mesh], totalHeight: size }
  }

  // Wrap mode: split into lines that fit
  const words = upper.split(WHITESPACE_RE)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (measureTextWidth(candidate, font, baseSize) <= maxWidth) {
      currentLine = candidate
    }
    else {
      if (currentLine)
        lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine)
    lines.push(currentLine)

  // Shrink until all lines fit width and total height fits
  let finalSize = baseSize
  const fitSize = () => {
    for (const line of lines) {
      while (finalSize > 1 && measureTextWidth(line, font, finalSize) > maxWidth) {
        finalSize -= 0.5
      }
    }
    // Also shrink if total height exceeds available space
    while (finalSize > 1 && finalSize * 1.3 * lines.length > maxHeight) {
      finalSize -= 0.5
    }
  }
  fitSize()

  const lineHeight = finalSize * 1.3
  const totalHeight = lineHeight * lines.length
  const meshes: Mesh[] = []

  for (let i = 0; i < lines.length; i++) {
    const geo = createCenteredText(lines[i], font, finalSize, depth)
    if (!geo)
      continue
    const mesh = new Mesh(geo, mat)
    // Stack lines: first line at top, last at bottom
    const yOffset = (lines.length - 1) / 2 * lineHeight - i * lineHeight
    mesh.position.y = yOffset
    meshes.push(mesh)
  }

  return { meshes, totalHeight }
}

export function buildPlateGroup(params: PlateParams, font: Font): Group {
  const {
    length: L,
    width: W,
    thickness,
    cornerRadius,
    borderWidth,
    borderHeight,
    baseColor,
    borderColor,
  } = params

  const group = new Group()

  // Helper: create a circular hole path for cutting through shapes
  function createCircleHolePath(cx: number, cy: number, radius: number): Path {
    const holePath = new Path()
    holePath.absarc(cx, cy, radius, 0, Math.PI * 2, false)
    return holePath
  }

  // 1. BASE — rounded rectangle extruded along Z
  const baseShape = createRoundedRectShape(L, W, cornerRadius)
  if (params.showHole) {
    baseShape.holes.push(createCircleHolePath(params.holeX, params.holeY, params.holeDiameter / 2))
  }
  const baseGeo = new ExtrudeGeometry(baseShape, {
    depth: thickness,
    bevelEnabled: false,
  })
  const baseMesh = new Mesh(
    baseGeo,
    new MeshStandardMaterial({ color: baseColor }),
  )
  group.add(baseMesh)

  // 2. BORDER — outer shape with inner hole, sits on top of base
  const innerRadius = Math.max(cornerRadius - borderWidth, 0.5)
  const borderShape = createRoundedRectShape(L, W, cornerRadius)
  const innerHole = createRoundedRectShape(
    L - borderWidth * 2,
    W - borderWidth * 2,
    innerRadius,
  )
  // Add the inner shape as a hole in the border
  borderShape.holes.push(new Path(innerHole.getPoints()))

  const borderGeo = new ExtrudeGeometry(borderShape, {
    depth: borderHeight,
    bevelEnabled: false,
  })
  const borderMesh = new Mesh(
    borderGeo,
    new MeshStandardMaterial({ color: borderColor }),
  )
  borderMesh.position.z = thickness
  group.add(borderMesh)

  // 3. BLUE STRIP — sits inside the border at the top
  const {
    blueStripHeight,
    stripColor,
  } = params
  const innerW = L - borderWidth * 2
  const innerH = W - borderWidth * 2
  const ir = innerRadius
  // The strip occupies the top portion of the inner area.
  // Top edge follows the inner rounded rect, bottom edge is a straight line.
  const stripTop = innerH / 2
  const stripBottom = stripTop - blueStripHeight
  const stripLeft = -innerW / 2
  const stripRight = innerW / 2

  const stripShape = new Shape()
  // Start bottom-left, go clockwise
  stripShape.moveTo(stripLeft, stripBottom)
  stripShape.lineTo(stripRight, stripBottom)
  // Right side up to the rounded corner
  stripShape.lineTo(stripRight, stripTop - ir)
  stripShape.quadraticCurveTo(stripRight, stripTop, stripRight - ir, stripTop)
  // Top edge
  stripShape.lineTo(stripLeft + ir, stripTop)
  stripShape.quadraticCurveTo(stripLeft, stripTop, stripLeft, stripTop - ir)
  // Left side back down
  stripShape.lineTo(stripLeft, stripBottom)

  const stripGeo = new ExtrudeGeometry(stripShape, {
    depth: borderHeight,
    bevelEnabled: false,
  })
  const stripMesh = new Mesh(
    stripGeo,
    new MeshStandardMaterial({ color: stripColor }),
  )
  stripMesh.position.z = thickness
  group.add(stripMesh)

  // 4. TEXT "BRASIL" (same color as base, on top of blue strip)
  const countryGeo = createCenteredText(
    params.countryText,
    font,
    params.countryTextSize,
    borderHeight + 0.2,
  )
  if (countryGeo) {
    const countryMesh = new Mesh(
      countryGeo,
      new MeshStandardMaterial({ color: baseColor }),
    )
    const countryY = W / 2 - borderWidth - blueStripHeight / 2 + params.countryTextY
    countryMesh.position.set(params.countryTextX, countryY, thickness)
    group.add(countryMesh)
  }

  // 5. MAIN PLATE TEXT (border color)
  // Available area for text: between bottom of blue strip and bottom border
  const textAreaTop = stripBottom // bottom edge of blue strip
  const textAreaBottom = -innerH / 2 // top edge of bottom border
  const textAreaCenterY = (textAreaTop + textAreaBottom) / 2

  const textMaxWidth = innerW - 4 // some padding from inner edges
  const textMaxHeight = textAreaTop - textAreaBottom - 1 // vertical space available
  const { meshes: textMeshes } = createFittedText(
    params.text,
    font,
    params.textSize,
    borderHeight,
    textMaxWidth,
    textMaxHeight,
    params.textFit,
  )
  const matTextColor = new MeshStandardMaterial({ color: borderColor })
  for (const tm of textMeshes) {
    tm.material = matTextColor
    tm.position.x += params.textX
    tm.position.y += textAreaCenterY + params.textY
    tm.position.z = thickness
    group.add(tm)
  }

  // 6. BR TEXT (border color)
  const brGeo = createCenteredText(
    params.brText,
    font,
    params.brTextSize,
    borderHeight,
  )
  if (brGeo) {
    const brMesh = new Mesh(
      brGeo,
      new MeshStandardMaterial({ color: borderColor }),
    )
    brMesh.position.set(params.brTextX, params.brTextY, thickness)
    group.add(brMesh)
  }

  // 7. FLAG (on the blue strip, right side)
  const countryTmpl = COUNTRY_TEMPLATES.find(t => t.name === params.flagCountry)
  if (params.showFlag && countryTmpl?.flag) {
    const flagHeight = blueStripHeight * 0.75
    const flagWidth = flagHeight * (20 / 14)
    const flagDepth = params.flagStyle === 'flat' ? 0.2 : borderHeight * 0.5
    const flag = countryTmpl.flag(flagWidth, flagHeight, flagDepth, params.flagStyle)
    const flagX = innerW / 2 - flagWidth / 2 - 1
    const flagY = W / 2 - borderWidth - blueStripHeight / 2
    flag.position.set(flagX, flagY, thickness + borderHeight)
    group.add(flag)
  }

  return group
}
