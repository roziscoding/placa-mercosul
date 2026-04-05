<script lang='ts'>
  import ConfigPanel from './components/ConfigPanel.svelte'
  import PreviewCanvas from './components/PreviewCanvas.svelte'
  import { DEFAULT_PARAMS } from './lib/types'

  let params = $state({ ...DEFAULT_PARAMS })
  let exportFn: (() => void) | null = $state(null)
  let exporting = $state(false)
  let devModel = $state('plate')
  const isDev = import.meta.env.DEV

  function handleExport() {
    if (!exportFn)
      return
    exporting = true
    exportFn()
    // Reset after a short delay (export is async via worker)
    setTimeout(() => (exporting = false), 2000)
  }
</script>

<div class='app'>
  <aside class='sidebar'>
    <h1>Placa Mercosul 3D</h1>
    <div class='config-scroll'>
      <ConfigPanel bind:params />
    </div>
    <div class='export-bar'>
      <button class='export-btn' onclick={handleExport} disabled={exporting || !exportFn}>
        {exporting ? 'Exportando...' : 'Exportar STL'}
      </button>
      <div class='credits'>
        Inspirado no <a href='https://makerworld.com/en/models/2218429-mercosur-car-license-plate' target='_blank' rel='noopener'>modelo de @yurizr</a>
      </div>
    </div>
  </aside>
  <main class='preview'>
    {#if isDev}
      <div class='dev-select'>
        <select bind:value={devModel}>
          <option value='plate'>Placa completa</option>
          <option value='flag-flat'>Bandeira (flat)</option>
          <option value='flag-relief'>Bandeira (relief)</option>
        </select>
      </div>
    {/if}
    <PreviewCanvas
      {params}
      {devModel}
      onExportReady={fn => (exportFn = fn)}
    />
  </main>
</div>

<style>
  .app {
    display: flex;
    height: 100%;
  }

  .sidebar {
    width: 320px;
    min-width: 320px;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-right: 1px solid #e0e0e0;
  }

  h1 {
    font-size: 16px;
    font-weight: 700;
    padding: 14px 12px;
    border-bottom: 1px solid #e0e0e0;
    color: #222;
  }

  .config-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .export-bar {
    padding: 10px 12px;
    border-top: 1px solid #e0e0e0;
  }

  .export-btn {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 6px;
    background: #003DA5;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }

  .export-btn:hover:not(:disabled) {
    background: #002d7a;
  }

  .export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .credits {
    margin-top: 6px;
    font-size: 11px;
    color: #999;
    text-align: center;
  }

  .credits a {
    color: #777;
  }

  .preview {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .dev-select {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
  }

  .dev-select select {
    padding: 4px 8px;
    border: 1px solid #999;
    border-radius: 4px;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.9);
  }

  @media (max-width: 768px) {
    .app {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      min-width: unset;
      max-height: 50vh;
      border-right: none;
      border-bottom: 1px solid #e0e0e0;
    }

    .preview {
      min-height: 50vh;
    }
  }
</style>
