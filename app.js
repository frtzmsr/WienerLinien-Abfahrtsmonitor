const PROXY =
  "https://wienerlinien-proxy.people-02-reasons.workers.dev/";

const stations = [
  {
    name: "Brüßlgasse",
    diva: 60200179,
    lines: ["48A"]
  },
  {
    name: "Panikengasse",
    diva: 60200941,
    lines: ["9"]
  },
  {
    name: "Possingergasse",
    diva: 60201014,
    lines: ["10A"]
  },
  {
    name: "Feßtgasse",
    diva: 60200446,
    lines: ["46"]
  }
];

async function fetchAllDepartures(diva) {
  const res = await fetch(PROXY + "?diva=" + diva);
  const json = await res.json();
  if (!json.data?.monitors) return [];

  const all = [];

  for (const m of json.data.monitors) {
    for (const l of m.lines || []) {
      for (const d of l.departures?.departure || []) {
        all.push({
          line: l.name,
          towards: l.towards,
          countdown: d.departureTime.countdown
        });
      }
    }
  }

  all.sort((a, b) => a.countdown - b.countdown);
  return all;
}

async function refresh() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  document.getElementById("weather").innerText = "Wiener Linien live…";

  for (const s of stations) {
    const box = document.createElement("div");
    box.className = "station";
    box.innerHTML = `<div class="station-name">${s.name}</div>`;

    const deps = await fetchAllDepartures(s.diva);

    for (const line of s.lines) {
      const lineDeps = deps.filter(d => d.line === line).slice(0, 3);

      if (lineDeps.length === 0) {
        box.innerHTML +=
          `<div class="line">${line}</div>
           <div class="departure">keine Abfahrten</div>`;
      } else {
        for (const d of lineDeps) {
          box.innerHTML +=
            `<div class="line">${line} → ${d.towards}</div>
             <div class="departure">${d.countdown} min</div>`;
        }
      }
    }

    grid.appendChild(box);
  }
}

refresh();
setInterval(refresh, 60000);
