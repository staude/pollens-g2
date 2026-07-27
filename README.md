# PolLens (pollens-g2)

Even-G2-Plugin: Pollenflug im Blick — direkt auf der Brille.

Zeigt die Pollenbelastung am eigenen Standort für sechs Pollenarten
(Gräser, Birke, Erle, Beifuß, Ambrosia, Olive) als Belastungsstufen
(gering/mittel/hoch) für heute und die nächsten drei Tage. Ein Tipp auf
eine Pollenart öffnet den Tagesverlauf (früh/mittags/abends).

Daten: [Open-Meteo Air-Quality-API](https://open-meteo.com/en/docs/air-quality-api)
(CAMS-Europa-Modell, CC BY 4.0, ohne API-Key). Abdeckung: Europa.

## Setup

```bash
./setup.sh
```

(oder `npm install`; Node 20 LTS oder 22+)

## Entwicklung

```bash
npm run dev
```

und in einem zweiten Terminal:

```bash
evenhub-simulator http://localhost:5173
```

Test-Standort per URL-Parameter: `http://localhost:5173/?lat=49.31&lon=10.63`

## Auf die Brille (Prototype)

```bash
evenhub qr --url "http://<LAN-IP>:5173"
```

QR-Code in der Even-Realities-App scannen (Developer Mode nötig).

## Deploy

```bash
npm run build
evenhub pack app.json dist -o pollens-g2.ehpk
```

Einreichen im Dev Portal (hub.evenrealities.com).

## Bedienung

| Geste | Aktion |
|---|---|
| Wischen | Liste scrollen |
| Tippen | Pollenart öffnen (Tagesverlauf); unterste Zeile: nächster Tag |
| Doppeltippen | zurück / beenden |

Hinweis: Die Belastungsstufen sind Näherungswerte aus Konzentrationen
(Körner/m³), keine medizinische Beratung.
