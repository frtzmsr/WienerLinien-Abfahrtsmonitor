// ==========================
// Konfiguration
// ==========================

const stations = [
  {
    name: "Brüßlgasse",
    diva: 60200179,
    entries: [
      { line: "48A", towards: "Ring, Volkstheater U" },
      { line: "48A", towards: "Klinik Penzing" }
    ]
  },
  {
    name: "Panikengasse",
    diva: 60200941,
    entries: [{ line: "9", towards: "Westbahnhof" }]
  },
  {
    name: "Possingergasse",
    diva: 60201014,
    entries: [{ line: "10A", towards: "Heiligenstadt" }]
  },
  {
    name: "Feßtgasse",
    diva: 60200446,
    entries: [{ line: "46", towards: "Ring, Volkstheater" }]
  }
];

function key(line, towards) {
  return line + "||" + towards;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ==========================
// Wiener Linien API: einmal laden, dann mappen
// ==========================

async function fetchStationMap(diva) {
  const url = "https://www.wienerlinien.at/ogd_realtime/monitor?diva=" + diva;

  const res = await fetch(url);
  const json = await res.json();

  // Wenn CORS/Netzwerk kaputt ist, landet man nicht hier, sondern im catch weiter unten.
  if (!json || !json.data || !json.data.monitors) {
    return { ok: false, map: {}, available: {}, error: "Unerwartete API-Antwort" };
  }

  const map = {};          // key(line,towards) -> departures[]
  const available = {};    // line -> [towards1, towards2, ...]

  for (let i = 0; i < json.data.monitors.length; i++) {
    const lines = json.data.monitors[i].lines || [];
    for (let j = 0; j < lines.length; j++) {
      const ln = lines[j].name;
      const tw = lines[j].towards;
      if (!ln || !tw) continue;

      if (!available[ln]) available[ln] = [];
      if (available[ln].indexOf(tw) === -1) available[ln].push(tw);

      const deps = (lines[j].departures && lines[j].departures.departure) ? lines[j].departures.departure : [];
      const k = key(ln, tw);
      if (!map[k]) map[k] = [];

      for (let d = 0; d < deps.length; d++) {
        map[k].push(deps[d]);
      }
    }
  }

  // sortieren & kürzen
  for (const k in map) {
    map[k].sort(function(a, b) {
      return a.departureTime.countdown - b.departureTime.countdown;
    });
    map[k] = map[k].slice(0, 3);
  }

  return { ok: true, map, available, error: null };
}

// ==========================
// UI
// ==========================

function renderErrorBanner(msg) {
  // Falls du mal CORS/Netzwerk-Probleme hast, siehst du’s sofort.
  const w = document.getElementById("weather");
  w.innerText = msg;
}

async function refresh() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  // Wetter bleibt vorerst dummy, damit klar ist: Seite läuft.
  document.getElementById("weather").innerText = "Wiener Linien live…";

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];

    const stationDiv = document.createElement("div");
    stationDiv.className = "station";
    stationDiv.innerHTML = '<div class="station-name">' + escapeHtml(station.name) + "</div>";

    let stationData;
    try {
      stationData = await fetchStationMap(station.diva);
    } catch (e) {
      console.error("Fetch fehlgeschlagen:", e);
      renderErrorBanner("API-Zugriff fehlgeschlagen (Netzwerk/CORS). Öffne die Browser-Konsole für Details.");
      stationDiv.innerHTML += '<div class="departure">API Fehler (siehe Konsole)</div>';
      grid.appendChild(stationDiv);
      continue;
    }

    for (let j = 0; j < station.entries.length; j++) {
      const entry = station.entries[j];
      const k = key(entry.line, entry.towards);
      const deps = stationData.map[k] || [];

      let html = '<div class="line">' + escapeHtml(entry.line + " → " + entry.towards) + "</div>";

      if (deps.length === 0) {
        // Debug-Info: welche Richtungen gibt’s für diese Linie laut API?
        const av = stationData.available[entry.line] || [];
        if (av.length > 0) {
          html += '<div class="departure">keine Daten (Richtungen laut API: ' + escapeHtml(av.join(" | ")) + ')</div>';
        } else {
          html += '<div class="departure">keine Daten (Linie nicht gefunden)</div>';
        }
      } else {
        for (let d = 0; d < deps.length; d++) {
          html += '<div class="departure">' + deps[d].departureTime.countdown + " min</div>";
        }
      }

      stationDiv.innerHTML += html;
    }

    grid.appendChild(stationDiv);
  }
}

refresh();
setInterval(refresh, 60000);
