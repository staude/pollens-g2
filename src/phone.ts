// Handy-Seite (Flutter-WebView im Even Hub). Die Brille zeigt das eigentliche
// UI; diese Seite macht das WebView sinnvoll statt leer (Review-Anforderung):
// Kopf mit App-Identitaet, Pollen-Tabelle fuer heute (gleiche Daten wie die
// Brille), Bedienhinweise. Farben/Typo nach den Even-Design-Guidelines
// (Phone-Side Tokens, hell/dunkel; Akzent #FEF991 sparsam, NIE das
// Brillen-Gruen).

import type { DayForecast } from './pollen'
import { levelName } from './format'
import { t } from './i18n'
import type { GeoResult } from './location'

const CSS = `
:root {
  --text: #232323;
  --text-dim: #7B7B7B;
  --bg: #FFFFFF;
  --surface: #EEEEEE;
  --accent: #FEF991;
}
@media (prefers-color-scheme: dark) {
  :root {
    --text: #FFFFFF;
    --text-dim: #8A8A8A;
    --bg: #111111;
    --surface: #1A1A1A;
  }
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: "FK Grotesk Neue", -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 640px; margin: 0 auto; padding: 24px 20px 32px; }
.head { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.head svg { width: 40px; height: 40px; flex: none; color: var(--text); }
h1 { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; }
.tagline { font-size: 13px; color: var(--text-dim); margin: 4px 0 24px; }
.status {
  background: var(--surface); border-radius: 12px; padding: 12px 16px;
  font-size: 13px; color: var(--text-dim); margin-bottom: 24px;
}
.status b { color: var(--text); font-weight: 500; }
.label {
  font-size: 11px; font-weight: 500; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px;
}
.rows { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
.row {
  background: var(--surface); border-radius: 12px; padding: 12px 16px;
  display: flex; gap: 12px; align-items: center;
}
.row .name { font-size: 16px; font-weight: 500; letter-spacing: -0.01em; flex: 1; }
.row .lvl { font-size: 13px; color: var(--text-dim); white-space: nowrap; }
.row .chip {
  font-size: 12px; font-weight: 500; padding: 2px 10px; border-radius: 999px;
  background: var(--bg); color: var(--text-dim); flex: none;
}
.row .chip.hoch { background: var(--accent); color: #232323; }
.hints { font-size: 13px; color: var(--text-dim); line-height: 1.7; margin-bottom: 24px; }
.hints b { color: var(--text); font-weight: 500; }
.foot { font-size: 11px; color: var(--text-dim); }
`

// Pollen-Silhouette (Bluete), currentColor.
const ICON_SVG = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="3"/>
  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>
</svg>`

export interface PhoneUi {
  setStatus(text: string): void
  setForecast(today: DayForecast, geo: GeoResult, place: string | null): void
}

/** Baut die Handy-Seite in #app auf. Sofort aufrufen (vor dem Bridge-Await),
 *  damit das WebView nie leer ist. */
export function initPhoneUi(): PhoneUi {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return { setStatus: () => {}, setForecast: () => {} }

  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)

  app.innerHTML = `
    <main class="wrap">
      <div class="head">${ICON_SVG}<h1>PolLens</h1></div>
      <p class="tagline">${t('phTagline')}</p>
      <div class="status" id="ph-status">${t('locating')}</div>
      <div class="label">${t('phToday')}</div>
      <div class="rows" id="ph-rows"></div>
      <div class="label">${t('phControls')}</div>
      <p class="hints">${t('phHints')}</p>
      <p class="foot">${t('phFooter')}</p>
    </main>`

  const statusEl = app.querySelector<HTMLDivElement>('#ph-status')!
  const rowsEl = app.querySelector<HTMLDivElement>('#ph-rows')!

  return {
    setStatus(text: string): void {
      statusEl.textContent = text
    },
    setForecast(today: DayForecast, geo: GeoResult, place: string | null): void {
      const src = geo.source === 'ip' ? t('phApprox') : ''
      const loc = place ? `<b>${escapeHtml(place)}</b> &ndash; ` : ''
      const worst = today.species[0]
      const summary =
        worst && worst.level > 0
          ? t('phSummary', {
              name: escapeHtml(worst.species.name),
              lvl: levelName(worst.level),
            })
          : t('phNone')
      statusEl.innerHTML = `${loc}${summary}${src} ${t('phOnGlasses')}`
      rowsEl.innerHTML = today.species
        .map((d) => {
          const lvl = levelName(d.level)
          return `
          <div class="row">
            <span class="name">${escapeHtml(d.species.name)}</span>
            <span class="lvl">${d.level > 0 ? `${Math.round(d.peak)}/m³` : ''}</span>
            <span class="chip${d.level === 3 ? ' hoch' : ''}">${lvl}</span>
          </div>`
        })
        .join('')
    },
  }
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c,
  )
}
