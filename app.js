// Reiseplan – 1:1 aus der AIDA-Bestätigung übernommen
const ITINERARY = [
  { date: '2026-08-01', weekday: 'Samstag',   country: 'Deutschland', port: 'Warnemünde',        note: 'Abfahrt',  lat: 54.1811, lon: 12.0879 },
  { date: '2026-08-02', weekday: 'Sonntag',    country: null,          port: 'Erholung auf See',  note: null,       lat: null,    lon: null },
  { date: '2026-08-03', weekday: 'Montag',     country: 'Norwegen',    port: 'Kristiansand',      note: null,       lat: 58.1467, lon: 7.9956 },
  { date: '2026-08-04', weekday: 'Dienstag',   country: 'Norwegen',    port: 'Haugesund',         note: null,       lat: 59.4138, lon: 5.2680 },
  { date: '2026-08-05', weekday: 'Mittwoch',   country: 'Norwegen',    port: 'Vik',                note: null,       lat: 61.0873, lon: 6.5768 },
  { date: '2026-08-06', weekday: 'Donnerstag', country: 'Norwegen',    port: 'Eidfjord',          note: null,       lat: 60.4661, lon: 7.0705 },
  { date: '2026-08-07', weekday: 'Freitag',    country: null,          port: 'Erholung auf See',  note: null,       lat: null,    lon: null },
  { date: '2026-08-08', weekday: 'Samstag',    country: 'Deutschland', port: 'Warnemünde',        note: 'Ankunft',  lat: 54.1811, lon: 12.0879 },
];

const WEATHER_CODES = {
  0: ['☀️', 'Klarer Himmel'], 1: ['🌤️', 'Meist klar'], 2: ['⛅', 'Teilweise bewölkt'], 3: ['☁️', 'Bedeckt'],
  45: ['🌫️', 'Nebel'], 48: ['🌫️', 'Reifnebel'],
  51: ['🌦️', 'Leichter Nieselregen'], 53: ['🌦️', 'Nieselregen'], 55: ['🌦️', 'Starker Nieselregen'],
  56: ['🌧️', 'Gefrierender Niesel'], 57: ['🌧️', 'Starker gefr. Niesel'],
  61: ['🌧️', 'Leichter Regen'], 63: ['🌧️', 'Regen'], 65: ['🌧️', 'Starker Regen'],
  66: ['🌧️', 'Gefrierender Regen'], 67: ['🌧️', 'Starker gefr. Regen'],
  71: ['🌨️', 'Leichter Schneefall'], 73: ['🌨️', 'Schneefall'], 75: ['🌨️', 'Starker Schneefall'], 77: ['🌨️', 'Schneegriesel'],
  80: ['🌦️', 'Leichte Schauer'], 81: ['🌦️', 'Schauer'], 82: ['⛈️', 'Heftige Schauer'],
  85: ['🌨️', 'Leichte Schneeschauer'], 86: ['🌨️', 'Starke Schneeschauer'],
  95: ['⛈️', 'Gewitter'], 96: ['⛈️', 'Gewitter mit Hagel'], 99: ['⛈️', 'Starkes Gewitter mit Hagel'],
};

function weatherInfo(code) {
  return WEATHER_CODES[code] || ['❔', 'Unbekannt'];
}

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDateDisplay(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function tripStatus(todayStr) {
  const first = ITINERARY[0].date;
  const last = ITINERARY[ITINERARY.length - 1].date;
  if (todayStr < first) return 'before';
  if (todayStr > last) return 'after';
  return 'during';
}

async function fetchWeather() {
  const stopsWithCoords = ITINERARY.filter(s => s.lat != null);
  const lats = stopsWithCoords.map(s => s.lat).join(',');
  const lons = stopsWithCoords.map(s => s.lon).join(',');
  const start = ITINERARY[0].date;
  const end = ITINERARY[ITINERARY.length - 1].date;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&start_date=${start}&end_date=${end}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Wetter-API nicht erreichbar');
  const data = await res.json();
  const results = Array.isArray(data) ? data : [data];

  stopsWithCoords.forEach((stop, i) => {
    const daily = results[i]?.daily;
    if (!daily) return;
    const idx = daily.time.indexOf(stop.date);
    if (idx === -1) return;
    stop.weather = {
      code: daily.weathercode[idx],
      tmax: Math.round(daily.temperature_2m_max[idx]),
      tmin: Math.round(daily.temperature_2m_min[idx]),
    };
  });
}

function renderItineraryTable(todayStr) {
  const body = document.getElementById('itinerary-body');
  body.innerHTML = ITINERARY.map(stop => `
    <tr class="${stop.date === todayStr ? 'today-row' : ''}">
      <td>${formatDateDisplay(stop.date)} - ${stop.weekday}</td>
      <td>${stop.country || ''}</td>
      <td>${stop.port}${stop.note ? ` <span class="note">(${stop.note})</span>` : ''}</td>
    </tr>
  `).join('');
}

function initMap() {
  const map = L.map('map', { scrollWheelZoom: false }).setView([58.5, 8.5], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> Mitwirkende',
    maxZoom: 12,
  }).addTo(map);

  const stopsWithCoords = ITINERARY.filter(s => s.lat != null);
  const latlngs = stopsWithCoords.map(s => [s.lat, s.lon]);

  stopsWithCoords.forEach(s => {
    L.marker([s.lat, s.lon]).addTo(map)
      .bindPopup(`<strong>${s.port}</strong><br>${formatDateDisplay(s.date)}`);
  });

  L.polyline(latlngs, { color: '#e63946', weight: 3, dashArray: '6 8' }).addTo(map);
  map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
}

function renderHero(todayStr) {
  const el = document.getElementById('hero-weather');
  const status = tripStatus(todayStr);

  if (status === 'before') {
    const first = ITINERARY[0];
    const diffDays = Math.round((new Date(first.date) - new Date(todayStr)) / 86400000);
    const w = first.weather;
    el.innerHTML = `
      <div class="hero-inner">
        <p class="hero-label">Noch ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tage'} bis zur Abfahrt ⚓</p>
        ${w ? `
          <div class="hero-weather-main">
            <span class="hero-icon">${weatherInfo(w.code)[0]}</span>
            <span class="hero-temp">${w.tmin}° / ${w.tmax}°C</span>
          </div>
          <p class="hero-sub">${weatherInfo(w.code)[1]} in ${first.port} am ${formatDateDisplay(first.date)}</p>
        ` : `<p class="hero-sub">Wetter für ${first.port} konnte nicht geladen werden.</p>`}
      </div>`;
    return;
  }

  if (status === 'after') {
    el.innerHTML = `
      <div class="hero-inner">
        <p class="hero-label">Die Reise ist vorbei ⚓</p>
        <p class="hero-sub">Wir hoffen, es war eine wunderschöne Fahrt durch die Fjorde!</p>
      </div>`;
    return;
  }

  const stop = ITINERARY.find(s => s.date === todayStr);
  if (!stop.lat) {
    el.innerHTML = `
      <div class="hero-inner">
        <p class="hero-label">Heute: Erholung auf See 🌊</p>
        <p class="hero-sub">Kein fester Hafen – die AIDAdiva ist unterwegs.</p>
      </div>`;
    return;
  }

  const w = stop.weather;
  el.innerHTML = `
    <div class="hero-inner">
      <p class="hero-label">Heute in ${stop.port}</p>
      ${w ? `
        <div class="hero-weather-main">
          <span class="hero-icon">${weatherInfo(w.code)[0]}</span>
          <span class="hero-temp">${w.tmin}° / ${w.tmax}°C</span>
        </div>
        <p class="hero-sub">${weatherInfo(w.code)[1]}</p>
      ` : `<p class="hero-sub">Wetter konnte nicht geladen werden.</p>`}
    </div>`;
}

function renderWeatherSlider(todayStr) {
  const el = document.getElementById('weather-slider');
  el.innerHTML = ITINERARY.map(stop => {
    const isToday = stop.date === todayStr;
    if (!stop.lat) {
      return `
        <div class="weather-card ${isToday ? 'is-today' : ''}">
          <p class="wc-date">${formatDateDisplay(stop.date)}</p>
          <p class="wc-port">Erholung auf See</p>
          <span class="wc-icon">🌊</span>
          <p class="wc-desc">Kein fester Ort</p>
        </div>`;
    }
    const w = stop.weather;
    return `
      <div class="weather-card ${isToday ? 'is-today' : ''}">
        <p class="wc-date">${formatDateDisplay(stop.date)}</p>
        <p class="wc-port">${stop.port}</p>
        ${w ? `
          <span class="wc-icon">${weatherInfo(w.code)[0]}</span>
          <p class="wc-temp">${w.tmin}° / ${w.tmax}°C</p>
          <p class="wc-desc">${weatherInfo(w.code)[1]}</p>
        ` : `<p class="wc-desc">n/a</p>`}
      </div>`;
  }).join('');
}

async function main() {
  const todayStr = todayISO();
  renderItineraryTable(todayStr);
  initMap();

  try {
    await fetchWeather();
    renderHero(todayStr);
    renderWeatherSlider(todayStr);
  } catch (err) {
    document.getElementById('hero-weather').innerHTML =
      `<div class="hero-inner"><p class="hero-label">Wetterdaten aktuell nicht verfügbar</p></div>`;
    document.getElementById('weather-slider').innerHTML =
      `<p class="loading">Wetterdaten konnten nicht geladen werden.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', main);
