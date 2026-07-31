# KreuzfahrtInfos

Kleine Übersichtsseite für unsere Kreuzfahrt "Norwegens Fjorde ab Warnemünde" (01.–08.08.2026, AIDAdiva).

- Interaktive Karte der Route (Leaflet + OpenStreetMap)
- Reiseplan-Tabelle
- Live-Wettervorhersage pro Hafen (Open-Meteo, kein API-Key nötig)

Reine statische Seite (HTML/CSS/JS), kein Build-Schritt nötig.

## Lokal ansehen

Einfach `index.html` im Browser öffnen, oder mit einem kleinen lokalen Server (empfohlen, damit `fetch` sauber läuft):

```bash
npx serve .
```

## Deployment auf Vercel (kostenlos, keine eigene Domain nötig)

1. Diesen Ordner nach GitHub pushen (Repo `KreuzfahrtInfos` ist schon verbunden):
   ```bash
   git add .
   git commit -m "Kreuzfahrt-Seite hinzufügen"
   git push
   ```
2. Auf [vercel.com](https://vercel.com) mit dem GitHub-Account einloggen.
3. **"Add New" → "Project"** → Repo `KreuzfahrtInfos` auswählen und importieren.
4. Framework Preset: **"Other"** (statische Seite), Build Command leer lassen, Output Directory: `.` (Root).
5. **Deploy** klicken — nach wenigen Sekunden ist die Seite unter einer `*.vercel.app`-URL live.

Jeder weitere `git push` auf `main` deployed automatisch neu.

### Alternative: GitHub Pages

Repo-Einstellungen → **Pages** → Branch `main`, Ordner `/ (root)` → Speichern. Seite ist dann unter `https://<username>.github.io/KreuzfahrtInfos/` erreichbar.
