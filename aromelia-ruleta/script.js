const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spin-btn");
const finalValue = document.getElementById("final-value");

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRROamPqvJSXPr9ndmpLMHdQn5Nj9cXxQF2hD-hNBGlZvenhYepKUUdPFG8SRnaRXeZzddjTfnsQJvQ/pub?gid=0&single=true&output=csv";

let myChart = null;
let segments = [];

// Parse CSV text into array of {label, color}
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

// Build rotation values based on number of segments
function buildRotationValues(count) {
  const degPerSegment = 360 / count;
  const values = [];
  for (let i = 0; i < count; i++) {
    values.push({
      minDegree: Math.round(i * degPerSegment),
      maxDegree: Math.round((i + 1) * degPerSegment - 1),
      value: i + 1,
    });
  }
  return values;
}

function createChart(segs) {
  if (myChart) myChart.destroy();

  const data = new Array(segs.length).fill(Math.floor(360 / segs.length));
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

const valueGenerator = (angleValue) => {
  const rotationValues = buildRotationValues(segments.length);
  for (let i of rotationValues) {
    if (angleValue >= i.minDegree && angleValue <= i.maxDegree) {
      const won = segments[i.value - 1]?.label || "Premio";
      finalValue.innerHTML = `<p>🎉 ¡Felicidades! Ganaste: <strong>${won}</strong></p>`;
      spinBtn.disabled = false;
      break;
    }
  }
};

let count = 0;
let resultValue = 101;

spinBtn.addEventListener("click", () => {
  spinBtn.disabled = true;
  finalValue.innerHTML = `<p>¡Buena suerte! 🍀</p>`;
  let randomDegree = Math.floor(Math.random() * (355 - 0 + 1) + 0);
  let rotationInterval = window.setInterval(() => {
    myChart.options.rotation = myChart.options.rotation + resultValue;
    myChart.update();
    if (myChart.options.rotation >= 360) {
      count += 1;
      resultValue -= 5;
      myChart.options.rotation = 0;
    } else if (count > 15 && myChart.options.rotation == randomDegree) {
      valueGenerator(randomDegree);
      clearInterval(rotationInterval);
      count = 0;
      resultValue = 101;
    }
  }, 10);
});

// Load on start
loadFromSheet();
