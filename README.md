# pollens-g2

**PolLens** — Pollenflug im Blick, direkt auf der Even-Realities-G2-Brille.
Ablauf: Standort bestimmen -> Pollenbelastung für sechs Arten (Gräser,
Birke, Erle, Beifuß, Ambrosia, Olive) als Stufen gering/mittel/hoch,
absteigend nach Belastung sortiert -> Art antippen -> Tagesverlauf
(früh/mittags/abends); die unterste Listenzeile blättert durch heute + 3
Folgetage.

Daten: [Open-Meteo Air-Quality-API](https://open-meteo.com/en/docs/air-quality-api)
(CAMS-Europa-Modell, CC BY 4.0, ohne API-Key). Abdeckung: Europa.

## Screenshots

Brillen-Display (576 x 288, monochrom grün):

| Übersicht (heute) | Tagesverlauf einer Art |
|---|---|
| ![Übersicht](docs/store-overview-de.png) | ![Detail](docs/store-detail-de.png) |

Die Blockbalken (■/□) zeigen die Belastungsstufe; die Übersicht sortiert
die stärkste Belastung nach oben.

## Bedienung auf der Brille

| Eingabe | Wirkung |
|---|---|
| Swipe hoch/runter | Liste scrollen |
| Einfachtipp | Pollenart -> Tagesverlauf; unterste Zeile: nächster Tag |
| Doppeltipp | zurück; auf der Übersicht: Plugin beenden |

## Setup und Start

- Installieren: `./setup.sh` (oder `npm install`; Node 20 LTS oder 22+)
- Lokal starten: `npm run dev` und in einem zweiten Terminal
  `evenhub-simulator http://localhost:5173`
- Typecheck: `npm run typecheck`
- Auf die Brille: `evenhub qr --url "http://<LAN-IP>:5173"` und den QR-Code
  in der Even-Realities-App scannen (Developer Mode nötig)
- Test-Standort: `?lat=49.31&lon=10.63`; Sprache erzwingen: `?lang=de|en`

## Deploy

- Packen: `npm run build`, dann
  `evenhub pack app.json dist -o pollens-g2.ehpk` (globales `evenhub`,
  nicht `npx`). Einreichen im Dev Portal (hub.evenrealities.com); das
  Menü-Icon `docs/icon-24.png` wird dort separat hochgeladen.

## Besonderheiten

- `package_id`: `net.staude.pollensg2`
- Die Belastungsstufen sind Näherungswerte aus Konzentrationen (Körner/m³)
  mit artspezifischen Schwellen — keine offizielle DWD-Skala und keine
  medizinische Beratung.
- Pollen liefert die API nur für Europa; außerhalb meldet das Plugin einen
  Fehler statt leerer Werte.
- Standort-Reihenfolge: `?lat/?lon`-Override -> `bridge.getAppLocation()`
  -> `navigator.geolocation` -> IP-Ortung; Ortsname per Reverse-Geocoding
  (BigDataCloud, optional).
- Balken-Zeichen sind ■/□ statt █/░ — die Schattierungsblöcke fehlen im
  G2-Font.
- Firmware-Listen: Zeile 0 ist eine No-Op-Kopfzeile (Auto-Select-Falle),
  echte Einträge ab Zeile 1.
- Zweisprachig de/en; Sprache folgt der Systemsprache des Handys.
