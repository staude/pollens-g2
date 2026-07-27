# pollens-g2 (PolLens) - Projektregeln

## Plattform

@../../_shared/platform-glasses.md
@../../_shared/design-evenapps.md

## Zweck

Even-G2-Plugin: Pollenbelastung am eigenen Standort. Sechs Pollenarten
(Graeser, Birke, Erle, Beifuss, Ambrosia, Olive) mit Belastungsstufen fuer
heute + 3 Folgetage, Detailansicht mit Tagesverlauf (frueh/mittags/abends).
Daten von Open-Meteo (Air-Quality-API, CAMS-Europa-Modell).

## Setup und Start

- Installieren: `./setup.sh` (oder `npm install`)
- Lokal starten: `npm run dev` und in zweitem Terminal
  `evenhub-simulator http://localhost:5173`
- Typecheck: `npm run typecheck`
- Test-Standort: `?lat=49.31&lon=10.63` (URL-Override, s. location.ts)
- Auf die Brille: `evenhub qr --url "http://<LAN-IP>:5173"` und den
  QR-Code in der Even-Realities-App scannen (Developer Mode noetig)

## Deploy

- Packen: `npm run build`, dann `evenhub pack app.json dist -o pollens-g2.ehpk`
  (globales `evenhub`-Binary, NICHT `npx evenhub` - das sucht ein npm-Paket).
- Einreichen im Dev Portal (hub.evenrealities.com). Icon `docs/icon-24.png`
  dort hochladen (steckt nicht in der .ehpk).

## Architektur

- `src/pollen.ts` - API-Client (Open-Meteo Air Quality): 4 Tage stuendlich,
  Aggregation je Tag (Spitzenwert + Tagesabschnitte), Stufen-Klassifikation.
- `src/location.ts` - Standort: URL-Override, getAppLocation, navigator, IP.
- `src/format.ts` - Labels, Blockbalken (░/█), Tages-Labels, clamp.
- `src/render.ts` - Renderer (text/list), prueft rebuild-Ergebnis, Fallback.
- `src/phone.ts` - Handy-Seite (WebView), Pflicht fuers Store-Review.
- `src/main.ts` - State-Machine (loading/overview/detail/error).

`http.ts`, `location.ts`, `render.ts` sind 1:1 aus abfahrtszeit-g2
uebernommen -> Kandidaten fuer das Shared-Paket `evenapps-ui`
(drittes Plugin mit denselben Teilen; siehe evenapps/CLAUDE.md).

## Besonderheiten

- package_id: net.staude.pollensg2
- SDK exakt auf 0.0.12 gepinnt: `getAppLocation` gibt es erst ab 0.0.12.
  Kein Bild-Container -> der 0.0.12-Bild-Bug (dorfkino-g2) trifft hier nicht.
- Datenquelle: https://air-quality-api.open-meteo.com (CAMS-Europa, stuendlich,
  4 Tage, CORS `*`, kein Key, CC BY 4.0). Pollen gibt es NUR fuer Europa —
  ausserhalb liefert die API null-Reihen, pollen.ts meldet das als Fehler.
- Belastungsstufen (gering/mittel/hoch) sind NAEHERUNGEN aus Koerner/m³,
  je Artgruppe eigene Schwellen (SPECIES in pollen.ts): Graeser 1/20/50,
  Baeume 1/10/100, Beifuss 1/10/30, Ambrosia 1/5/20. Keine offizielle
  DWD-Skala; bei Bedarf dort nachjustieren.
- FIRMWARE-AUTO-SELECT: Zeile 0 der Uebersichts-Liste ist eine No-Op-
  Kopfzeile ("- Pollenart waehlen -"), Arten ab Index 1, letzte Zeile
  (Index species.length + 1) wechselt den Tag. Ohne die Kopfzeile wuerde
  jeder Listenaufbau sofort eine Pollenart oeffnen (vgl. abfahrtszeit-g2).
- Uebersicht sortiert die Arten absteigend nach Belastung ("Ein Blick
  genuegt") — die Zeilenposition einer Art ist also NICHT stabil.
- Handy-Seite (`phone.ts`) ist Pflicht: ein leeres WebView ist ein
  Store-Ablehnungsgrund. Zeigt Identitaet, Tages-Tabelle, Bedienhinweise.
  Akzent `#FEF991` nur fuer "hoch"-Chips, NIE das Brillen-Gruen.
- Standort wie abfahrtszeit-g2: primaer `bridge.getAppLocation()`,
  Fallback navigator.geolocation (nur sicherer Origin), dann IP
  (ipwho.is, ipapi.co — beide in der network-whitelist).
- Navigation: Einfachtipp waehlt, Doppeltipp zurueck bzw. beendet auf der
  Uebersicht. Text-Detailseite scrollt auf Hardware NICHT — Rumpf ist
  bewusst kurz gehalten (7 Zeilen).
