<script lang='ts'>
  import type { PlateParams } from '../lib/types'
  import { COUNTRY_TEMPLATES, DEFAULT_PARAMS } from '../lib/types'
  import { t } from '../lib/i18n.svelte'

  let { params = $bindable() }: { params: PlateParams } = $props()

  const hasFlag = $derived(
    !!COUNTRY_TEMPLATES.find(t => t.name === params.flagCountry)?.flag,
  )

  function reset() {
    params = { ...DEFAULT_PARAMS }
  }

  function applyCountry(e: Event) {
    const name = (e.target as HTMLSelectElement).value
    if (!name)
      return
    const tmpl = COUNTRY_TEMPLATES.find(t => t.name === name)
    if (tmpl) {
      params.countryText = tmpl.countryText
      params.brText = tmpl.brText
      params.flagCountry = tmpl.name
      params.showFlag = !!tmpl.flag
    }
  }

  const openSections = $state<Record<string, boolean>>({
    text: true,
    secondary: true,
    dimensions: false,
    border: false,
    hole: false,
    textPosition: false,
    colors: true,
  })

  function toggle(section: string) {
    openSections[section] = !openSections[section]
  }
</script>

<div class='config-panel'>
  <section>
    <button class='section-header' onclick={() => toggle('text')}>
      <span class='arrow' class:open={openSections.text}></span>
      {t('sectionPlateText')}
    </button>
    {#if openSections.text}
      <div class='section-body'>
        <label>
          {t('plate')}
          <input type='text' bind:value={params.text} maxlength='30' />
        </label>
        <div class='toggle-row'>
          <span>{t('longText')}</span>
          <label class='toggle-option'>
            <input type='radio' bind:group={params.textFit} value='shrink' />
            {t('shrink')}
          </label>
          <label class='toggle-option'>
            <input type='radio' bind:group={params.textFit} value='wrap' />
            {t('wrap')}
          </label>
        </div>
      </div>
    {/if}
  </section>

  <section>
    <button class='section-header' onclick={() => toggle('secondary')}>
      <span class='arrow' class:open={openSections.secondary}></span>
      {t('sectionSecondaryTexts')}
    </button>
    {#if openSections.secondary}
      <div class='section-body'>
        <label>
          {t('template')}
          <select onchange={applyCountry}>
            <option value="">{t('selectCountry')}</option>
            {#each COUNTRY_TEMPLATES as tmpl}
              <option value={tmpl.name}>{tmpl.name}</option>
            {/each}
          </select>
        </label>
        <label>
          {t('country')}
          <input type='text' bind:value={params.countryText} maxlength='20' />
        </label>
        <label>
          {t('code')}
          <input type='text' bind:value={params.brText} maxlength='5' />
        </label>
        {#if hasFlag}
          <label class='toggle-option checkbox-option'>
            <input type='checkbox' bind:checked={params.showFlag} />
            {t('showFlag')}
          </label>
          {#if params.showFlag}
            <div class='toggle-row'>
              <span>{t('style')}</span>
              <label class='toggle-option'>
                <input type='radio' bind:group={params.flagStyle} value='relief' />
                {t('relief')}
              </label>
              <label class='toggle-option'>
                <input type='radio' bind:group={params.flagStyle} value='flat' />
                {t('flat')}
              </label>
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </section>

  <section>
    <button class='section-header' onclick={() => toggle('dimensions')}>
      <span class='arrow' class:open={openSections.dimensions}></span>
      {t('sectionDimensions')}
    </button>
    {#if openSections.dimensions}
      <div class='section-body'>
        <label>
          {t('length')}: {params.length}mm
          <input
            type='range'
            bind:value={params.length}
            min='20'
            max='230'
            step='1'
          />
        </label>
        <label>
          {t('width')}: {params.width}mm
          <input
            type='range'
            bind:value={params.width}
            min='10'
            max='200'
            step='1'
          />
        </label>
        <label>
          {t('thickness')}: {params.thickness}mm
          <input
            type='range'
            bind:value={params.thickness}
            min='0.5'
            max='5'
            step='0.5'
          />
        </label>
        <label>
          {t('cornerRadius')}: {params.cornerRadius}mm
          <input
            type='range'
            bind:value={params.cornerRadius}
            min='0'
            max='10'
            step='0.5'
          />
        </label>
      </div>
    {/if}
  </section>

  <section>
    <button class='section-header' onclick={() => toggle('border')}>
      <span class='arrow' class:open={openSections.border}></span>
      {t('sectionBorderStrip')}
    </button>
    {#if openSections.border}
      <div class='section-body'>
        <label>
          {t('borderWidth')}: {params.borderWidth}mm
          <input
            type='range'
            bind:value={params.borderWidth}
            min='0.5'
            max='5'
            step='0.5'
          />
        </label>
        <label>
          {t('reliefHeight')}: {params.borderHeight}mm
          <input
            type='range'
            bind:value={params.borderHeight}
            min='0.5'
            max='3'
            step='0.5'
          />
        </label>
        <label>
          {t('blueStrip')}: {params.blueStripHeight}mm
          <input
            type='range'
            bind:value={params.blueStripHeight}
            min='3'
            max='15'
            step='0.1'
          />
        </label>
      </div>
    {/if}
  </section>

  <section>
    <button class='section-header' onclick={() => toggle('hole')}>
      <span class='arrow' class:open={openSections.hole}></span>
      {t('sectionHole')}
    </button>
    {#if openSections.hole}
      <div class='section-body'>
        <label class='toggle-option checkbox-option'>
          <input type='checkbox' bind:checked={params.showHole} />
          {t('showHole')}
        </label>
        {#if params.showHole}
        <label>
          {t('diameter')}: {params.holeDiameter}mm
          <input
            type='range'
            bind:value={params.holeDiameter}
            min='2'
            max='10'
            step='0.5'
          />
        </label>
        <label>
          {t('positionX')}: {params.holeX}mm
          <input
            type='range'
            bind:value={params.holeX}
            min='-100'
            max='100'
            step='1'
          />
        </label>
        <label>
          {t('positionY')}: {params.holeY}mm
          <input
            type='range'
            bind:value={params.holeY}
            min='-50'
            max='50'
            step='1'
          />
        </label>
        {/if}
      </div>
    {/if}
  </section>

  <section>
    <button class='section-header' onclick={() => toggle('textPosition')}>
      <span class='arrow' class:open={openSections.textPosition}></span>
      {t('sectionTextPositions')}
    </button>
    {#if openSections.textPosition}
      <div class='section-body'>
        <fieldset>
          <legend>{t('mainText')}</legend>
          <label>
            {t('size')}: {params.textSize}
            <input
              type='range'
              bind:value={params.textSize}
              min='4'
              max='20'
              step='0.5'
            />
          </label>
          <label>
            X: {params.textX}
            <input
              type='range'
              bind:value={params.textX}
              min='-50'
              max='50'
              step='0.5'
            />
          </label>
          <label>
            Y: {params.textY}
            <input
              type='range'
              bind:value={params.textY}
              min='-20'
              max='20'
              step='0.5'
            />
          </label>
          <label>
            {t('spacing')}: {params.textSpacing}
            <input
              type='range'
              bind:value={params.textSpacing}
              min='0.8'
              max='1.5'
              step='0.05'
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>{t('countryText')}</legend>
          <label>
            {t('size')}: {params.countryTextSize}
            <input
              type='range'
              bind:value={params.countryTextSize}
              min='1'
              max='10'
              step='0.5'
            />
          </label>
          <label>
            X: {params.countryTextX}
            <input
              type='range'
              bind:value={params.countryTextX}
              min='-50'
              max='50'
              step='0.5'
            />
          </label>
          <label>
            Y: {params.countryTextY}
            <input
              type='range'
              bind:value={params.countryTextY}
              min='-10'
              max='10'
              step='0.5'
            />
          </label>
          <label>
            {t('spacing')}: {params.countryTextSpacing}
            <input
              type='range'
              bind:value={params.countryTextSpacing}
              min='0.8'
              max='1.5'
              step='0.05'
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>{t('brText')}</legend>
          <label>
            {t('size')}: {params.brTextSize}
            <input
              type='range'
              bind:value={params.brTextSize}
              min='1'
              max='8'
              step='0.5'
            />
          </label>
          <label>
            X: {params.brTextX}
            <input
              type='range'
              bind:value={params.brTextX}
              min='-50'
              max='50'
              step='0.5'
            />
          </label>
          <label>
            Y: {params.brTextY}
            <input
              type='range'
              bind:value={params.brTextY}
              min='-20'
              max='20'
              step='0.5'
            />
          </label>
        </fieldset>
      </div>
    {/if}
  </section>

  <section>
    <button class='section-header' onclick={() => toggle('colors')}>
      <span class='arrow' class:open={openSections.colors}></span>
      {t('sectionColors')}
    </button>
    {#if openSections.colors}
      <div class='section-body colors'>
        <label>
          {t('colorBaseCountry')}
          <input type='color' bind:value={params.baseColor} />
        </label>
        <label>
          {t('colorBorderPlate')}
          <input type='color' bind:value={params.borderColor} />
        </label>
        <label>
          {t('colorTopStrip')}
          <input type='color' bind:value={params.stripColor} />
        </label>
      </div>
    {/if}
  </section>

  <button class='reset-btn' onclick={reset}>{t('resetDefaults')}</button>
</div>

<style>
  .config-panel {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
  }

  section {
    border-bottom: 1px solid #e0e0e0;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 10px 8px;
    border: none;
    background: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    color: #333;
    text-align: left;
  }

  .section-header:hover {
    background: #f5f5f5;
  }

  .arrow {
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 5px solid #666;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    transition: transform 0.15s;
  }

  .arrow.open {
    transform: rotate(90deg);
  }

  .section-body {
    padding: 4px 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: #555;
    font-size: 12px;
  }

  select {
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    background: white;
  }

  input[type="text"] {
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: monospace;
    text-transform: uppercase;
  }

  input[type="range"] {
    width: 100%;
  }

  input[type="color"] {
    width: 100%;
    height: 28px;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 2px;
    cursor: pointer;
  }

  fieldset {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 8px;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  legend {
    font-weight: 600;
    font-size: 12px;
    padding: 0 4px;
    color: #666;
  }

  .colors {
    gap: 10px;
  }

  .checkbox-option {
    flex-direction: row;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .toggle-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #555;
  }

  .toggle-option {
    flex-direction: row;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  .reset-btn {
    margin: 12px 8px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f8f8f8;
    cursor: pointer;
    font-size: 13px;
    color: #555;
  }

  .reset-btn:hover {
    background: #eee;
  }
</style>
