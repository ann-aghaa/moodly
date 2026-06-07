const storageKey = "moodmap-entries";

const moodDate = document.querySelector("#moodDate");
const moodNote = document.querySelector("#moodNote");
const moodButtons = document.querySelectorAll(".mood-button");
const saveMood = document.querySelector("#saveMood");
const saveMessage = document.querySelector("#saveMessage");
const todayLabel = document.querySelector("#todayLabel");
const averageMood = document.querySelector("#averageMood");
const bestDay = document.querySelector("#bestDay");
const entryCount = document.querySelector("#entryCount");
const moodChart = document.querySelector("#moodChart");
const emptyState = document.querySelector("#emptyState");
const historyList = document.querySelector("#historyList");
const toggleButtons = document.querySelectorAll(".toggle-button");
const clearAll = document.querySelector("#clearAll");

const ctx = moodChart.getContext("2d");

let entries = loadEntries();
let selectedMood = null;
let currentView = "daily";

const moodNames = {
  1: "Rough",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great"
};

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateText) {
  return new Date(`${dateText}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function loadEntries() {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : [];
}

function saveEntries() {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

function setSelectedMood(score, label) {
  selectedMood = { score: Number(score), label };
  moodButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.score === String(score));
  });
}

function saveCurrentMood() {
  if (!selectedMood) {
    saveMessage.textContent = "Choose a mood before saving.";
    return;
  }

  const date = moodDate.value || getTodayValue();
  const existingIndex = entries.findIndex((entry) => entry.date === date);
  const entry = {
    date,
    score: selectedMood.score,
    label: selectedMood.label,
    note: moodNote.value.trim()
  };

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }

  entries.sort((a, b) => a.date.localeCompare(b.date));
  saveEntries();
  saveMessage.textContent = `Saved ${entry.label} for ${formatDate(date)}.`;
  moodNote.value = "";
  render();
}

function getWeeklyData() {
  const groups = {};

  entries.forEach((entry) => {
    const date = new Date(`${entry.date}T00:00:00`);
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const key = start.toISOString().slice(0, 10);

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(entry.score);
  });

  return Object.keys(groups).sort().map((key) => {
    const scores = groups[key];
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return {
      label: `Week of ${formatDate(key)}`,
      score: Number(average.toFixed(1))
    };
  });
}

function getDailyData() {
  return entries.map((entry) => ({
    label: formatDate(entry.date),
    score: entry.score
  }));
}

function drawChart() {
  const data = currentView === "weekly" ? getWeeklyData() : getDailyData();
  const width = moodChart.width;
  const height = moodChart.height;
  const padding = 42;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  ctx.clearRect(0, 0, width, height);
  emptyState.style.display = data.length ? "none" : "grid";

  if (!data.length) return;

  ctx.strokeStyle = "#dde5ef";
  ctx.lineWidth = 1;
  ctx.font = "13px Arial";
  ctx.fillStyle = "#667085";

  for (let score = 1; score <= 5; score += 1) {
    const y = padding + chartHeight - ((score - 1) / 4) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.fillText(score, 16, y + 4);
  }

  const step = data.length === 1 ? chartWidth : chartWidth / (data.length - 1);
  const points = data.map((item, index) => ({
    x: padding + (data.length === 1 ? chartWidth / 2 : index * step),
    y: padding + chartHeight - ((item.score - 1) / 4) * chartHeight,
    label: item.label,
    score: item.score
  }));

  ctx.strokeStyle = "#20796f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();

  points.forEach((point) => {
    ctx.fillStyle = "#f2b84b";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1d2636";
    ctx.font = "bold 13px Arial";
    ctx.fillText(point.score, point.x - 5, point.y - 13);

    ctx.fillStyle = "#667085";
    ctx.font = "12px Arial";
    ctx.fillText(point.label, point.x - 24, height - 14);
  });
}

function renderStats() {
  entryCount.textContent = entries.length;

  if (!entries.length) {
    averageMood.textContent = "--";
    bestDay.textContent = "--";
    return;
  }

  const average = entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length;
  const best = entries.reduce((top, entry) => entry.score > top.score ? entry : top, entries[0]);

  averageMood.textContent = `${average.toFixed(1)} / 5`;
  bestDay.textContent = `${formatDate(best.date)} (${best.label})`;
}

function renderHistory() {
  const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  historyList.innerHTML = "";

  if (!latest.length) {
    historyList.innerHTML = '<p class="empty-history">No moods saved yet.</p>';
    return;
  }

  latest.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <div class="history-date">${formatDate(entry.date)}</div>
      <div class="history-mood">${entry.label}</div>
      <div class="history-note">${entry.note || "No note added."}</div>
    `;
    historyList.append(item);
  });
}

function render() {
  renderStats();
  renderHistory();
  drawChart();
}

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setSelectedMood(button.dataset.score, button.dataset.label);
  });
});

toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;
    toggleButtons.forEach((item) => item.classList.toggle("active", item === button));
    drawChart();
  });
});

saveMood.addEventListener("click", saveCurrentMood);

clearAll.addEventListener("click", () => {
  if (!entries.length) return;

  const shouldClear = confirm("Clear all saved moods from this browser?");
  if (!shouldClear) return;

  entries = [];
  saveEntries();
  render();
});

const today = getTodayValue();
moodDate.value = today;
todayLabel.textContent = formatDate(today);
render();
