const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spin-btn");
const finalValue = document.getElementById("final-value");

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRROamPqvJSXPr9ndmpLMHdQn5Nj9cXxQF2hD-hNBGlZvenhYepKUUdPFG8SRnaRXeZzddjTfnsQJvQ/pub?gid=0&single=true&output=csv";

let myChart = null;
let segments = [];

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length >= 2) {
      result.push({
        label: cols[0].trim(),
        color: cols[1].trim(),
      });
    }
  }
  return result;
}

function createChart(segs) {
  if (myChart) myChart.destroy();
  const data = new Array(segs.length).fill(1); // equal slices
  const labels = segs.map((s) => s.label);
  const colors = segs.map((s) => s.color);

  myChart = new Chart(wheel, {
    plugins: [ChartDataLabels],
    type: "pie",
    data: {
      labels: labels,
      datasets: [{ backgroundColor: colors, data: data }],
    },
    options: {
      responsive: true,
      animation: { duration: 0 },
      rotation: -90, // start from top
      plugins: {
        tooltip: false,
        legend: { display: false },
        datalabels: {
          color: "#ffffff",
          formatter: (_, context) =>
            context.chart.data.labels[context.dataIndex],
          font: { size: 20, weight: "600" },
          textStrokeColor: "rgba(0,0,0,0.3)",
          textStrokeWidth: 3,
        },
      },
    },
  });
}

// The arrow points RIGHT (3 o'clock = 0°).
// Chart starts at rotation offset (top = -90°).
// We need to find which segment is at the arrow position.
function getWinningSegment(currentRotation) {
  const count = segments.length;
  const degPerSegment = 360 / count;

  // Normalize the rotation so we know where "0° of the chart" is relative to arrow
  // Arrow is at 0° (right). Chart rotation starts at top (-90°).
  // The angle under the arrow = (360 - currentRotation) % 360
  let arrowAngle = ((360 - (currentRotation % 360)) + 360) % 360;

  // Find which segment index falls under arrowAngle
  const index = Math.floor(arrowAngle / degPerSegment) % count;
  return segments[index]?.label || "Premio";
}

async function loadFromSheet() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    const text = await res.text();
    segments = parseCSV(text);
    if (segments.length > 0) {
      createChart(segments);
      finalValue.innerHTML = `<p>¡Da click en "Girar" para empezar! 🎂🎉</p>`;
    }
  } catch (e) {
    console.error("Error cargando Sheet:", e);
    finalValue.innerHTML = `<p>Error cargando la ruleta. Intenta de nuevo.</p>`;
  }
}

let count = 0;
let resultValue = 101;
let currentRotation = -90; // track total rotation (starts at top)

spinBtn.addEventListener("click", () => {
  spinBtn.disabled = true;
  finalValue.innerHTML = `<p>¡Buena suerte! 🍀</p>`;

  let randomDegree = Math.floor(Math.random() * (355 - 0 + 1) + 0);

  let rotationInterval = window.setInterval(() => {
    currentRotation += resultValue;
    myChart.options.rotation = currentRotation % 360;
    myChart.update();

    if (currentRotation % 360 >= 360 || currentRotation % 360 < resultValue) {
      count += 1;
      resultValue -= 5;
    }

    if (count > 15 && Math.round(currentRotation % 360) === randomDegree) {
      clearInterval(rotationInterval);
      const won = getWinningSegment(currentRotation);
      finalValue.innerHTML = `<p>🎉 ¡Felicidades! Ganaste: <strong>${won}</strong></p>`;
      spinBtn.disabled = false;
      count = 0;
      resultValue = 101;
      currentRotation = myChart.options.rotation;
    }
  }, 10);
});

loadFromSheet();
