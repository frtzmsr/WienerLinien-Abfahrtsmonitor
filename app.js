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
// Wiener Linien API
// ==========================

async function loadDepartures(diva, lineName) {
  const url =
    "https://www.wienerlinien.at/ogd_realtime/monitor?diva=" + diva;

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (!json.data || !json.data.monitors) return [];

    const result = [];

    for (let i = 0; i < json.data.monitors.length; i++) {
      const lines = json.data.monitors[i].lines;

      for (let j = 0; j < lines.length; j++) {
        if (lines[j].name === lineName) {
          const deps = lines[j].departures.departure;
          for (let k = 0; k < deps.length; k++) {
            result.push(deps[k]);
          }
        }
      }
    }

    result.sort(function (a, b) {
      return a.departureTime.countdown - b.departureTime.countdown;
    });

    return result.slice(0, 3);

  } catch (e) {
    console.error("API Fehler", e);
    return [];
  }
}

// ==========================
// Rendering
// ==========================

async function refresh() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];

    const stationDiv = document.createElement("div");
    stationDiv.className = "station";

    stationDiv.innerHTML =
      '<div class="station-name">' + station.name + "</div>";

    for (let j = 0; j < station.entries.length; j++) {
      const entry = station.entries[j];

      const deps = await loadDepartures(
        station.diva,
        entry.line,
        entry.towards
      );

      let html =
        '<div class="line">' +
        entry.line +
        " → " +
        entry.towards +
        "</div>";

      if (deps.length === 0) {
        html += '<div class="departure">keine Daten</div>';
      } else {
        for (let k = 0; k < deps.length; k++) {
          html +=
            '<div class="departure">' +
            deps[k].departureTime.countdown +
            " min</div>";
        }
      }

      stationDiv.innerHTML += html;
    }

    grid.appendChild(stationDiv);
  }
}

// ==========================
// Start + Auto-Refresh
// ==========================

refresh();
setInterval(refresh, 60000);
