// ==========================
// Konfiguration
// ==========================

const PROXY =
  "https://wienerlinien-proxy.people-02-reasons.workers.dev/";

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
    entries: [
      { line: "9", towards: "Westbahnhof" }
    ]
  },
  {
    name: "Possingergasse",
    diva: 60201014,
    entries: [
      { line: "10A", towards: "Heiligenstadt" }
    ]
  },
  {
    name: "Feßtgasse",
    diva: 60200446,
    entries: [
      { line: "46", towards: "Ring, Volkstheater" }
    ]
  }
];

// ==========================
// API: alle Abfahrten holen
// ==========================

async function fetchAllDepartures(diva) {
  const url = PROXY + "?diva=" + diva;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.data || !json.data.monitors) return [];

  const all = [];

  for (const monitor of json.data.monitors) {
    if (!monitor.lines) continue;

    for (const line of monitor.lines) {
      const deps = line.departures?.departure || [];

      for (const d of deps) {
        all.push({
          line: line.name,
          towards: line.towards,
          countdown: d.departureTime.countdown
        });
      }
    }
  }

  all.sort((a, b) => a.countdown - b.countdown);
  return all;
}

// ==========================
// Rendering
// ==========================

async function refresh() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  document.getElementById("weather").innerText =
    "Wiener Linien live…";

  for (const station of stations) {
    const box = document.createElement("div");
    box.className = "station";
    box.innerHTML =
      `<div class="station-name">${station.name}</div>`;

    let departures = [];
    try {
      departures = await fetchAllDepartures(station.diva);
    } catch (e) {
      box.innerHTML += `<div class="departure">API Fehler</div>`;
      grid.appendChild(box);
      continue;
    }

    for (const entry of station.entries) {
      box.innerHTML +=
        `<div class="line">${entry.line} → ${entry.towards}</div>`;

      const matches = departures
        .filter(d =>
          d.line === entry.line &&
          d.towards === entry.towards
        )
        .slice(0, 3);

      if (matches.length === 0) {
        box.innerHTML +=
          `<div class="departure">keine Abfahrten</div>`;
      } else {
        for (const m of matches) {
          box.innerHTML +=
            `<div class="departure">${m.countdown} min</div>`;
        }
      }
    }

    grid.appendChild(box);
  }
}

// ==========================
// Start + Auto-Refresh
// ==========================

refresh();
setInterval(refresh, 60000);
