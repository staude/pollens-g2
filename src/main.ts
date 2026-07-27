// pollens-g2 (PolLens) — Pollenbelastung am eigenen Standort auf der Brille.
//
// Ablauf:  Standort ermitteln -> Vorhersage laden (Open-Meteo, 4 Tage)
//          -> Uebersicht (Liste: 6 Pollenarten mit Belastungsbalken)
//          -> Pollenart antippen -> Detail (Tagesverlauf frueh/mittags/abends)
//          -> unterste Listenzeile wechselt zum naechsten Tag (zyklisch).
//
// Bedienung:
//   Swipe hoch/runter  Liste scrollen (Firmware, kein Event)
//   Einfachtipp        Pollenart -> Detail; "naechster Tag"-Zeile -> Tag weiter
//   Doppeltipp         zurueck; auf der Uebersicht: beenden

import {
  waitForEvenAppBridge,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'
import { getLocation, type GeoResult } from './location'
import { pollenForecast, type DayForecast, type SpeciesDay } from './pollen'
import { clamp, dayLabel, detailBody, overviewTitle, speciesRow } from './format'
import { Renderer } from './render'
import { initPhoneUi } from './phone'

const TITLE = 'POLLEN'

type OverviewState = {
  name: 'overview'
  geo: GeoResult
  days: DayForecast[]
  dayIndex: number
}
type DetailState = { name: 'detail'; from: OverviewState; entry: SpeciesDay }
type State =
  | { name: 'loading' }
  | OverviewState
  | DetailState
  | { name: 'error'; message: string }

async function main(): Promise<void> {
  // Handy-Seite sofort aufbauen, damit das WebView nie leer ist (Review).
  const phone = initPhoneUi()

  const bridge = await waitForEvenAppBridge()
  const view = new Renderer(bridge)

  let state: State = { name: 'loading' }
  let busy = false

  function errMsg(e: unknown): string {
    const m = e instanceof Error ? e.message : String(e)
    return clamp(m, 120)
  }

  // ----- Uebergaenge -------------------------------------------------------

  async function loadForecast(): Promise<void> {
    if (busy) return
    busy = true
    try {
      state = { name: 'loading' }
      phone.setStatus('Standort wird ermittelt ...')
      await view.text(TITLE, 'Standort wird ermittelt ...')
      const geo = await getLocation(bridge)

      phone.setStatus('Lade Pollenvorhersage ...')
      await view.text(TITLE, 'Lade Pollenvorhersage ...')
      const days = await pollenForecast(geo.lat, geo.lon)

      if (days.length === 0) {
        phone.setStatus('Keine Vorhersagedaten erhalten.')
        state = { name: 'error', message: 'Keine Vorhersagedaten erhalten.' }
        await renderError()
        return
      }
      phone.setForecast(days[0], geo)
      state = { name: 'overview', geo, days, dayIndex: 0 }
      await renderOverview()
    } catch (e) {
      phone.setStatus(`Fehler beim Laden: ${errMsg(e)}`)
      state = { name: 'error', message: errMsg(e) }
      await renderError()
    } finally {
      busy = false
    }
  }

  // ----- Rendering der aktuellen State ------------------------------------

  async function renderOverview(): Promise<void> {
    if (state.name !== 'overview') return
    const day = state.days[state.dayIndex]
    const title = overviewTitle(day, state.dayIndex, state.geo.source === 'ip')
    const nextIndex = (state.dayIndex + 1) % state.days.length
    const nextDay = state.days[nextIndex]
    // Zeile 0 = No-Op-Kopfzeile (Firmware-Auto-Select), Arten ab Zeile 1,
    // letzte Zeile wechselt den Tag.
    const items = [
      '- Pollenart wählen -',
      ...day.species.map(speciesRow),
      `> ${dayLabel(nextDay.date, nextIndex)} anzeigen`,
    ]
    await view.list(title, items)
  }

  async function renderDetail(): Promise<void> {
    if (state.name !== 'detail') return
    const { from, entry } = state
    const title = `${entry.species.name.toUpperCase()} — ${dayLabel(
      from.days[from.dayIndex].date,
      from.dayIndex,
    )}`
    await view.text(clamp(title, 60), detailBody(entry))
  }

  async function renderError(): Promise<void> {
    if (state.name !== 'error') return
    await view.text(
      'FEHLER',
      `${state.message}\n\nTipp: erneut versuchen\nDoppeltipp: beenden`,
    )
  }

  async function rerender(): Promise<void> {
    switch (state.name) {
      case 'overview':
        return renderOverview()
      case 'detail':
        return renderDetail()
      case 'error':
        return renderError()
      case 'loading':
        return view.text(TITLE, 'Lade Pollenvorhersage ...')
    }
  }

  // ----- Eingaben ----------------------------------------------------------

  function onListSelect(index: number): void {
    if (busy || state.name !== 'overview') return
    const day = state.days[state.dayIndex]
    // Zeile 0 ist die Kopfzeile (Auto-Select-Falle) -> ignorieren.
    if (index >= 1 && index <= day.species.length) {
      state = { name: 'detail', from: state, entry: day.species[index - 1] }
      void renderDetail()
    } else if (index === day.species.length + 1) {
      state = { ...state, dayIndex: (state.dayIndex + 1) % state.days.length }
      void renderOverview()
    }
  }

  function onSingleClick(): void {
    // Klicks auf Text-Container kommen als sysEvent (nicht textEvent).
    // Auf der Fehlerseite: erneut versuchen.
    if (busy) return
    if (state.name === 'error') void loadForecast()
  }

  function onDoubleClick(): void {
    if (busy) return // waehrend Ladevorgang keinen harten Abbruch
    if (state.name === 'detail') {
      // zurueck zur Uebersicht (ohne neu zu laden)
      state = state.from
      void renderOverview()
    } else {
      // Uebersicht / Fehler / loading: Plugin beenden (Dialog)
      bridge.shutDownPageContainer(1)
    }
  }

  const unsubscribe = bridge.onEvenHubEvent((event: any) => {
    if (event.listEvent) {
      onListSelect(event.listEvent.currentSelectItemIndex ?? 0)
      return
    }
    if (event.sysEvent) {
      switch (event.sysEvent.eventType ?? 0) {
        case OsEventTypeList.CLICK_EVENT:
          onSingleClick()
          break
        case OsEventTypeList.DOUBLE_CLICK_EVENT:
          onDoubleClick()
          break
        case OsEventTypeList.FOREGROUND_ENTER_EVENT:
          void rerender()
          break
        case OsEventTypeList.ABNORMAL_EXIT_EVENT:
        case OsEventTypeList.SYSTEM_EXIT_EVENT:
          unsubscribe()
          break
      }
    }
  })

  window.addEventListener('beforeunload', () => unsubscribe())

  // Los geht's.
  await loadForecast()
}

main().catch((err) => console.error('pollens-g2:', err))
