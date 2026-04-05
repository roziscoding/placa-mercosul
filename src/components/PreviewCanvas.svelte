<script lang='ts'>
  import type { PlateParams } from '../lib/types'
  import type {
    WorkerRequest,
    WorkerResponse,
  } from '../lib/worker/plate-worker'
  import { onMount } from 'svelte'
  import {
    AmbientLight,
    BufferAttribute,
    BufferGeometry,
    Color,
    DirectionalLight,
    Group,
    Mesh,
    MeshStandardMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
  } from 'three'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js'

  const {
    params,
    devModel = 'plate',
    onExportReady,
  }: {
    params: PlateParams
    devModel?: string
    onExportReady?: (exportFn: () => void) => void
  } = $props()

  let canvas: HTMLCanvasElement
  let worker: Worker
  let fontData: object | null = null
  let scene: Scene
  let camera: PerspectiveCamera
  let renderer: WebGLRenderer
  let controls: OrbitControls
  let plateGroup: Group | null = null
  let animationId: number
  let debounceTimer: ReturnType<typeof setTimeout>
  let loading = $state(true)

  function deserializeMeshes(
    meshes: WorkerResponse & { type: 'result' },
  ): Group {
    const group = new Group()

    for (const m of meshes.meshes) {
      const geo = new BufferGeometry()
      geo.setAttribute('position', new BufferAttribute(m.geometry.position, 3))
      geo.setAttribute('normal', new BufferAttribute(m.geometry.normal, 3))
      if (m.geometry.index) {
        geo.setIndex(new BufferAttribute(m.geometry.index, 1))
      }

      const mat = new MeshStandardMaterial({ color: m.color })
      const mesh = new Mesh(geo, mat)
      mesh.position.set(m.position[0], m.position[1], m.position[2])
      group.add(mesh)
    }

    return group
  }

  function plainParams(): PlateParams {
    return $state.snapshot(params)
  }

  function requestBuild() {
    if (!fontData || !worker)
      return
    loading = true
    worker.postMessage({
      type: 'build',
      params: plainParams(),
      fontData,
      devModel,
    } satisfies WorkerRequest)
  }

  function requestExport() {
    if (!fontData || !worker)
      return
    worker.postMessage({
      type: 'export',
      params: plainParams(),
      fontData,
      devModel,
    } satisfies WorkerRequest)
  }

  function handleWorkerMessage(e: MessageEvent<WorkerResponse>) {
    const msg = e.data

    if (msg.type === 'result') {
      if (plateGroup) {
        plateGroup.traverse((child) => {
          if (child instanceof Mesh) {
            child.geometry.dispose();
            (child.material as MeshStandardMaterial).dispose()
          }
        })
        scene.remove(plateGroup)
      }
      plateGroup = deserializeMeshes(msg)
      scene.add(plateGroup)
      loading = false
    }
    else if (msg.type === 'stl') {
      const blob = new Blob([msg.buffer], {
        type: 'application/octet-stream',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `placa-${params.text || 'mercosul'}.stl`
      a.click()
      URL.revokeObjectURL(url)
    }
    else if (msg.type === 'error') {
      console.error('Worker error:', msg.message)
      loading = false
    }
  }

  function setupScene() {
    scene = new Scene()
    scene.background = new Color(0xF0F0F0)

    camera = new PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
    camera.position.set(0, -40, 60)
    camera.lookAt(0, 0, 0)

    renderer = new WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)

    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.1

    const ambient = new AmbientLight(0xFFFFFF, 0.6)
    scene.add(ambient)

    const dir = new DirectionalLight(0xFFFFFF, 0.8)
    dir.position.set(20, -20, 40)
    scene.add(dir)

    const dir2 = new DirectionalLight(0xFFFFFF, 0.3)
    dir2.position.set(-20, 20, 20)
    scene.add(dir2)
  }

  function animate() {
    animationId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }

  function handleResize() {
    const parent = canvas.parentElement!
    const w = parent.clientWidth
    const h = parent.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  onMount(() => {
    setupScene()
    animate()

    worker = new Worker(
      new URL('../lib/worker/plate-worker.ts', import.meta.url),
      { type: 'module' },
    )
    worker.onmessage = handleWorkerMessage

    // Load font on main thread, pass data to worker
    const ttfLoader = new TTFLoader()
    ttfLoader.load(`${import.meta.env.BASE_URL}fonts/RobotoCondensed-Bold.ttf`, (json) => {
      fontData = json
      requestBuild()
    })

    const resizeObs = new ResizeObserver(handleResize)
    resizeObs.observe(canvas.parentElement!)

    onExportReady?.(requestExport)

    return () => {
      cancelAnimationFrame(animationId)
      resizeObs.disconnect()
      worker.terminate()
      renderer.dispose()
      controls.dispose()
    }
  })

  $effect(() => {
    // Track all params + devModel for reactivity
    void JSON.stringify(params)
    void devModel

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(requestBuild, 150)
  })
</script>

<div class='preview-container'>
  <canvas bind:this={canvas}></canvas>
  {#if loading}
    <div class='loading'>Gerando modelo...</div>
  {/if}
</div>

<style>
  .preview-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  .loading {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
  }
</style>
