import type { BufferAttribute, BufferGeometry } from 'three'
import type { FontData } from 'three/examples/jsm/loaders/FontLoader.js'
import type { PlateParams } from '../types'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { buildPlateGroup } from '../plate-geometry'
import { COUNTRY_TEMPLATES } from '../types'

let cachedFont: Font | null = null

export type WorkerRequest
  = | { type: 'build', params: PlateParams, fontData: object, devModel?: string }
    | { type: 'export', params: PlateParams, fontData: object, devModel?: string }

export type WorkerResponse
  = | { type: 'result', meshes: SerializedMesh[] }
    | { type: 'stl', buffer: ArrayBuffer }
    | { type: 'error', message: string }

interface SerializedMesh {
  position: number[]
  geometry: {
    position: Float32Array
    normal: Float32Array
    index: Uint32Array | null
  }
  color: string
}

function getFont(fontData: object): Font {
  if (!cachedFont) {
    cachedFont = new Font(fontData as FontData)
  }
  return cachedFont
}

function serializeGroup(group: Group): SerializedMesh[] {
  // Ensure world matrices are up to date for nested groups
  group.updateMatrixWorld(true)

  const meshes: SerializedMesh[] = []
  const worldPos = new Vector3()

  group.traverse((child) => {
    if (child instanceof Mesh) {
      const geo = child.geometry as BufferGeometry
      const mat = child.material as MeshStandardMaterial

      const posAttr = geo.getAttribute('position') as BufferAttribute
      const normAttr = geo.getAttribute('normal') as BufferAttribute
      const index = geo.index

      // Get world position (accumulates parent transforms)
      child.getWorldPosition(worldPos)

      meshes.push({
        position: [worldPos.x, worldPos.y, worldPos.z],
        geometry: {
          position: new Float32Array(posAttr.array),
          normal: new Float32Array(normAttr.array),
          index: index ? new Uint32Array(index.array) : null,
        },
        color: `#${mat.color.getHexString()}`,
      })
    }
  })
  return meshes
}

globalThis.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data

  try {
    const font = getFont(msg.fontData)
    let group: Group

    if (msg.devModel === 'flag-flat' || msg.devModel === 'flag-relief') {
      const style = msg.devModel === 'flag-flat' ? 'flat' as const : 'relief' as const
      const depth = style === 'flat' ? 0.2 : 1
      const tmpl = COUNTRY_TEMPLATES.find(t => t.name === msg.params.flagCountry)
      if (tmpl?.flag) {
        group = tmpl.flag(20, 14, depth, style)
      }
      else {
        // Grey placeholder rectangle
        group = new Group()
        const geo = new BoxGeometry(20, 14, depth)
        group.add(new Mesh(geo, new MeshStandardMaterial({ color: 0x999999 })))
      }
    }
    else {
      group = buildPlateGroup(msg.params, font)
    }

    if (msg.type === 'build') {
      const meshes = serializeGroup(group)

      // Collect transferable buffers
      const transferables: ArrayBuffer[] = []
      for (const m of meshes) {
        transferables.push(m.geometry.position.buffer as ArrayBuffer)
        transferables.push(m.geometry.normal.buffer as ArrayBuffer)
        if (m.geometry.index)
          transferables.push(m.geometry.index.buffer as ArrayBuffer)
      }

      (globalThis as unknown as Worker).postMessage(
        { type: 'result', meshes } satisfies WorkerResponse,
        { transfer: transferables },
      )
    }
    else if (msg.type === 'export') {
      const exporter = new STLExporter()
      const result = exporter.parse(group, { binary: true })
      const buffer = result as unknown as ArrayBuffer;

      (globalThis as unknown as Worker).postMessage(
        { type: 'stl', buffer } satisfies WorkerResponse,
        { transfer: [buffer] },
      )
    }
  }
  catch (err) {
    (globalThis as unknown as Worker).postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    } satisfies WorkerResponse)
  }
}
