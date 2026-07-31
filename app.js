// Reiseplan – 1:1 aus der AIDA-Bestätigung übernommen.
// Die beiden Seetage haben keine offizielle Position; lat/lon sind grob aus dem
// Routenverlauf im Reiseplan-Screenshot geschätzt (Kattegat/Skagerrak-Bereich).
const ITINERARY = [
  { date: '2026-08-01', weekday: 'Samstag',   country: 'Deutschland', port: 'Warnemünde',        note: 'Abfahrt',  isSeaDay: false, lat: 54.1811, lon: 12.0879 },
  { date: '2026-08-02', weekday: 'Sonntag',    country: null,          port: 'Erholung auf See',  note: null,       isSeaDay: true,  lat: 57.60,   lon: 9.70 },
  { date: '2026-08-03', weekday: 'Montag',     country: 'Norwegen',    port: 'Kristiansand',      note: null,       isSeaDay: false, lat: 58.1467, lon: 7.9956 },
  { date: '2026-08-04', weekday: 'Dienstag',   country: 'Norwegen',    port: 'Haugesund',         note: null,       isSeaDay: false, lat: 59.4138, lon: 5.2680 },
  { date: '2026-08-05', weekday: 'Mittwoch',   country: 'Norwegen',    port: 'Vik',                note: null,       isSeaDay: false, lat: 61.0873, lon: 6.5768 },
  { date: '2026-08-06', weekday: 'Donnerstag', country: 'Norwegen',    port: 'Eidfjord',          note: null,       isSeaDay: false, lat: 60.4661, lon: 7.0705 },
  { date: '2026-08-07', weekday: 'Freitag',    country: null,          port: 'Erholung auf See',  note: null,       isSeaDay: true,  lat: 57.90,   lon: 7.50 },
  { date: '2026-08-08', weekday: 'Samstag',    country: 'Deutschland', port: 'Warnemünde',        note: 'Ankunft',  isSeaDay: false, lat: 54.1811, lon: 12.0879 },
];

// Zusätzliche Wegpunkte auf offener See/in den Fjorden, nur für die Routenlinie
// auf der Karte – damit die Linie nicht quer über Land, sondern entlang
// plausibler Seewege (Kattegat/Skagerrak, Fjordeinfahrten) verläuft.
const ROUTE_PATH = [
  [54.1811, 12.0879], // Warnemünde
  [55.65, 12.70],      // Öresund
  [56.90, 11.30],      // Kattegat
  [57.60, 9.70],        // Skagerrak (Seetag 1)
  [58.1467, 7.9956],   // Kristiansand
  [58.85, 5.90],        // vor der Südküste Norwegens
  [59.4138, 5.2680],   // Haugesund
  [61.00, 4.85],        // Einfahrt Sognefjord
  [61.0873, 6.5768],   // Vik
  [61.00, 4.85],        // Ausfahrt Sognefjord
  [60.10, 4.75],        // Küstentransit südwärts
  [59.86, 5.25],         // Einfahrt Hardangerfjord
  [60.4661, 7.0705],   // Eidfjord
  [59.86, 5.25],         // Ausfahrt Hardangerfjord
  [58.85, 5.90],        // vor der Südküste Norwegens
  [57.90, 7.50],         // Skagerrak (Seetag 2)
  [56.90, 11.30],       // Kattegat
  [55.65, 12.70],        // Öresund
  [54.1811, 12.0879],  // zurück nach Warnemünde
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

function formatTime(iso) {
  return iso ? iso.split('T')[1] : '–';
}

function tripStatus(todayStr) {
  const first = ITINERARY[0].date;
  const last = ITINERARY[ITINERARY.length - 1].date;
  if (todayStr < first) return 'before';
  if (todayStr > last) return 'after';
  return 'during';
}

async function fetchWeather() {
  const lats = ITINERARY.map(s => s.lat).join(',');
  const lons = ITINERARY.map(s => s.lon).join(',');
  const start = ITINERARY[0].date;
  const end = ITINERARY[ITINERARY.length - 1].date;
  const daily = [
    'weathercode', 'temperature_2m_max', 'temperature_2m_min',
    'precipitation_sum', 'windspeed_10m_max', 'uv_index_max', 'sunrise', 'sunset',
  ].join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&start_date=${start}&end_date=${end}&daily=${daily}&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Wetter-API nicht erreichbar');
  const data = await res.json();
  const results = Array.isArray(data) ? data : [data];

  ITINERARY.forEach((stop, i) => {
    const d = results[i]?.daily;
    if (!d) return;
    const idx = d.time.indexOf(stop.date);
    if (idx === -1) return;
    stop.weather = {
      code: d.weathercode[idx],
      tmax: Math.round(d.temperature_2m_max[idx]),
      tmin: Math.round(d.temperature_2m_min[idx]),
      precipitation: d.precipitation_sum[idx],
      windspeed: Math.round(d.windspeed_10m_max[idx]),
      uv: d.uv_index_max[idx],
      sunrise: formatTime(d.sunrise[idx]),
      sunset: formatTime(d.sunset[idx]),
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

  ITINERARY.forEach(s => {
    if (s.isSeaDay) {
      L.circleMarker([s.lat, s.lon], {
        radius: 7, color: '#1d3557', weight: 2, fillColor: '#a8dadc', fillOpacity: 0.9,
      }).addTo(map).bindPopup(`<strong>Erholung auf See</strong><br>${formatDateDisplay(s.date)} · ungefähre Position`);
    } else {
      L.marker([s.lat, s.lon]).addTo(map)
        .bindPopup(`<strong>${s.port}</strong><br>${formatDateDisplay(s.date)}`);
    }
  });

  L.polyline(ROUTE_PATH, { color: '#e63946', weight: 3, dashArray: '6 8', smoothFactor: 2 }).addTo(map);
  map.fitBounds(L.latLngBounds(ROUTE_PATH), { padding: [30, 30] });
}

function heroCardMarkup(label, stop) {
  const w = stop.weather;
  if (!w) return `<p class="hero-sub">Wetter konnte nicht geladen werden.</p>`;
  return `
    <div class="hero-weather-main">
      <span class="hero-icon">${weatherInfo(w.code)[0]}</span>
      <span class="hero-temp">${w.tmin}° / ${w.tmax}°C</span>
    </div>
    <p class="hero-sub">${weatherInfo(w.code)[1]}${label ? ` in ${label}` : ''}</p>`;
}

function renderHero(todayStr) {
  const el = document.getElementById('hero-weather');
  const status = tripStatus(todayStr);

  if (status === 'before') {
    const first = ITINERARY[0];
    const diffDays = Math.round((new Date(first.date) - new Date(todayStr)) / 86400000);
    el.innerHTML = `
      <div class="hero-inner" data-date="${first.date}">
        <p class="hero-label">Noch ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tage'} bis zur Abfahrt ⚓</p>
        ${heroCardMarkup(`${first.port} am ${formatDateDisplay(first.date)}`, first)}
      </div>`;
    attachHeroClick(first.weather ? first.date : null);
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
  if (stop.isSeaDay) {
    el.innerHTML = `
      <div class="hero-inner" data-date="${stop.date}">
        <p class="hero-label">Heute: Erholung auf See 🌊</p>
        ${heroCardMarkup('ungefähre Position', stop)}
      </div>`;
    attachHeroClick(stop.weather ? stop.date : null);
    return;
  }

  el.innerHTML = `
    <div class="hero-inner" data-date="${stop.date}">
      <p class="hero-label">Heute in ${stop.port}</p>
      ${heroCardMarkup(null, stop)}
    </div>`;
  attachHeroClick(stop.weather ? stop.date : null);
}

function attachHeroClick(date) {
  const inner = document.querySelector('.hero-inner');
  if (!inner || !date) return;
  inner.classList.add('clickable');
  inner.addEventListener('click', () => openModalByDate(date));
}

function renderWeatherSlider(todayStr) {
  const el = document.getElementById('weather-slider');
  el.innerHTML = ITINERARY.map(stop => {
    const isToday = stop.date === todayStr;
    const w = stop.weather;
    return `
      <div class="weather-card ${isToday ? 'is-today' : ''}" data-date="${stop.date}">
        <p class="wc-date">${formatDateDisplay(stop.date)}</p>
        <p class="wc-port">${stop.port}</p>
        ${w ? `
          <span class="wc-icon">${weatherInfo(w.code)[0]}</span>
          <p class="wc-temp">${w.tmin}° / ${w.tmax}°C</p>
          <p class="wc-desc">${weatherInfo(w.code)[1]}</p>
          ${stop.isSeaDay ? '<p class="wc-approx">≈ Position</p>' : ''}
        ` : `<p class="wc-desc">n/a</p>`}
      </div>`;
  }).join('');

  el.querySelectorAll('.weather-card').forEach(card => {
    card.addEventListener('click', () => openModalByDate(card.dataset.date));
  });
}

function openModalByDate(date) {
  const stop = ITINERARY.find(s => s.date === date);
  if (!stop || !stop.weather) return;
  const w = stop.weather;
  const [icon, desc] = weatherInfo(w.code);

  document.getElementById('modal-date').textContent = `${formatDateDisplay(stop.date)} · ${stop.weekday}`;
  document.getElementById('modal-title').textContent = stop.isSeaDay ? 'Erholung auf See' : stop.port;
  document.getElementById('modal-icon').textContent = icon;
  document.getElementById('modal-temp').textContent = `${w.tmin}° / ${w.tmax}°C`;
  document.getElementById('modal-desc').textContent = desc + (stop.isSeaDay ? ' (ungefähre Position)' : '');
  document.getElementById('modal-stats').innerHTML = `
    <div class="stat"><span class="stat-label">Niederschlag</span><span class="stat-value">${w.precipitation} mm</span></div>
    <div class="stat"><span class="stat-label">Wind (Böen)</span><span class="stat-value">${w.windspeed} km/h</span></div>
    <div class="stat"><span class="stat-label">UV-Index</span><span class="stat-value">${w.uv}</span></div>
    <div class="stat"><span class="stat-label">Sonnenaufgang</span><span class="stat-value">${w.sunrise}</span></div>
    <div class="stat"><span class="stat-label">Sonnenuntergang</span><span class="stat-value">${w.sunset}</span></div>
  `;

  document.getElementById('modal-backdrop').hidden = false;
}

function closeModal() {
  document.getElementById('modal-backdrop').hidden = true;
}

function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', e => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

async function main() {
  const todayStr = todayISO();
  renderItineraryTable(todayStr);
  initMap();
  initModal();

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
