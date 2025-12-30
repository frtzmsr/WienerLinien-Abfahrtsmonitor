alert("app.js läuft");
const stations = [
  {
    name: "Brüßlgasse",
    entries: [
      { line: "48A", towards: "Ring, Volkstheater U" },
      { line: "48A", towards: "Klinik Penzing" }
    ]
  },
  {
    name: "Panikengasse",
    entries: [
      { line: "9", towards: "Westbahnhof" }
    ]
  },
  {
    name: "Possingergasse",
    entries: [
      { line: "10A", towards: "Heiligenstadt" }
    ]
  },
  {
    name: "Feßtgasse",
    entries: [
      { line: "46", towards: "Ring, Volkstheater" }
    ]
  }
];

async function loadDepartures(stopName, lineName, towards) {
  const url =
    "https://www.wienerlinien.at/ogd_realtime/monitor?stopName=" +
    encodeURIComponent(stopName);

  const res = await fetch(url);
  const json = await res.json();

  if (!json.data || !json.data.monitors) return [];

  for (let i = 0; i < json.data.monitors.length; i++) {
    const lines = json.data.monitors[i].lines;

    for (let j = 0; j < lines.length; j++) {
      if (lines[j].name === lineName) {
        const deps = lines[j].departures.departure;
        const result = [];

        for (let k = 0; k < deps.length; k++) {
          if (
            deps[k].vehicle &&
            deps[k].vehicle.towards === towards
          ) {
            result.push(deps[k]);
          }
          if (result.length === 3) break;
        }
        return result;
      }
    }
  }
  return [];
}

async function refresh() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    const stationDiv = document.createElement("div");
    stationDiv.className = "station";
    stationDiv.innerHTML =
      '<div class="station-name">' + s.name + "</div>";

    for (let j = 0; j < s.entries.length; j++) {
      const e = s.entries[j];
      const deps = await loadDepartures(
        s.name,
        e.line,
        e.towards
      );

      let html =
        '<div class="line">' +
        e.line +
        " → " +
        e.towards +
        "</div>";

      if (deps.length === 0) {
        html += '<div class="departure">keine Daten</div>';
      }

      for (let k = 0; k < deps.length; k++) {
        html +=
          '<div class="departure">' +
          deps[k].departureTime.countdown +
          " min</div>";
      }

      stationDiv.innerHTML += html;
    }

    grid.appendChild(stationDiv);
  }
}

refresh();
setInterval(refresh, 60000);
