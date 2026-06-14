// DOM elements
let darkMode = localStorage.getItem("darkMode") === "true";
const darkToggle = document.getElementById("darkModeToggle");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const tabs = document.querySelectorAll(".tab-btn");
const signSearch = document.getElementById("signSearch");
const searchSignBtn = document.getElementById("searchSignBtn");
const prefectureSelect = document.getElementById("prefectureSelect");
const otaSelect = document.getElementById("otaSelect");
const otaCodeDisplay = document.getElementById("otaCodeDisplay");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// Dark mode
if (darkMode) document.body.classList.add("dark");
darkToggle.addEventListener("click", () => {
  darkMode = !darkMode;
  localStorage.setItem("darkMode", darkMode);
  if (darkMode) document.body.classList.add("dark");
  else document.body.classList.remove("dark");
  darkToggle.textContent = darkMode ? "☀️ Φωτεινή λειτουργία" : "🌙 Σκοτεινή λειτουργία";
});

// Tab switching
tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(tab => tab.style.display = "none");
    const tabName = btn.dataset.tab;
    if (tabName === "violations") document.getElementById("violationsTab").style.display = "block";
    if (tabName === "signs") document.getElementById("signsTab").style.display = "block";
    if (tabName === "ota") document.getElementById("otaTab").style.display = "block";
    if (tabName === "history") {
      document.getElementById("historyTab").style.display = "block";
      renderHistory();
    }
  });
});

// Search violations
function searchViolations() {
  const query = searchInput.value.toLowerCase();
  const results = violations.filter(v =>
    v.article?.toLowerCase().includes(query) ||
    v.desc?.toLowerCase().includes(query) ||
    v.keywords?.some(k => k.toLowerCase().includes(query))
  );
  renderViolations(results);
}

function renderViolations(violationsArray) {
  if (!violationsArray.length) {
    resultsDiv.innerHTML = "<div class='card'>Δεν βρέθηκαν παραβάσεις</div>";
    return;
  }
  resultsDiv.innerHTML = violationsArray.map(v => `
    <div class="card">
      <div class="violation-title">${v.article} ${v.desc}</div>
      <div class="grid-2">
        <div class="info-row"><strong>Κατηγορία ΚΟΚ:</strong> ${v.category}</div>
        <div class="info-row"><strong>Βαθμοί ΣΕΣΟ:</strong> ${v.seso_points}</div>
        <div class="info-row"><strong>Αφαίρεση άδειας:</strong> ${v.license_removal} ημέρες</div>
        <div class="info-row"><strong>Αφαίρεση πινακίδων:</strong> ${v.plates_removal} ημέρες</div>
        <div class="info-row"><strong>Προθεσμία πληρωμής:</strong> ${v.payment_deadline_days} ημέρες (${Math.floor(v.payment_deadline_days/30)} μήνες)</div>
        <div class="info-row"><strong>Καταβολή σε:</strong> ${v.payment_authority === "DOU" ? "ΔΟΥ" : "ΟΤΑ (Δήμος)"}</div>
        <div class="info-row"><strong>Επιστροφή εγγράφων μόνο μετά από πληρωμή:</strong> ${v.payment_required_for_return ? "✅ ΝΑΙ" : "❌ ΟΧΙ"}</div>
      </div>
      <table class="fine-table">
        <thead><tr><th>Είδος οχήματος</th><th>Πρόστιμο (€)</th></tr></thead>
        <tbody>
          <tr><td>Επιβατηγό ΙΧ</td><td>${v.fines.car}</td></tr>
          <tr><td>Φορτηγό ≤ 3,5 τόνους</td><td>${v.fines.truck_low}</td></tr>
          <tr><td>Φορτηγό > 3,5 τόνους</td><td>${v.fines.truck_high}</td></tr>
          <tr><td>Λεωφορείο</td><td>${v.fines.bus}</td></tr>
          <tr><td>Μοτοσικλέτα / Μοτοποδήλατο</td><td>${v.fines.moto}</td></tr>
        </tbody>
      </table>
      ${v.exceptions ? `<div class="exception">⚠️ Εξαίρεση / Σημείωση: ${v.exceptions}</div>` : ""}
      <div style="margin-top:12px;"><button class="addToHistoryBtn" data-violation='${JSON.stringify(v)}'>📌 Καταγραφή ελέγχου</button></div>
    </div>
  `).join("");
  document.querySelectorAll(".addToHistoryBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const v = JSON.parse(btn.dataset.violation);
      addToHistory(v);
      alert("Καταγράφηκε στο ιστορικό");
    });
  });
}

// History functions
function addToHistory(violation) {
  let history = JSON.parse(localStorage.getItem("checkHistory") || "[]");
  history.unshift({
    id: Date.now(),
    date: new Date().toLocaleString(),
    violation: violation
  });
  localStorage.setItem("checkHistory", JSON.stringify(history.slice(0, 200)));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("checkHistory") || "[]");
  if (!history.length) {
    historyList.innerHTML = "<div class='card'>Δεν υπάρχουν καταγεγραμμένοι έλεγχοι</div>";
    return;
  }
  historyList.innerHTML = history.map(h => `
    <div class="card">
      <div><strong>${h.date}</strong></div>
      <div>${h.violation.article} ${h.violation.desc}</div>
      <div>Πρόστιμο ΙΧ: ${h.violation.fines.car}€</div>
      <button onclick="removeFromHistory(${h.id})">❌ Διαγραφή</button>
    </div>
  `).join("");
}

window.removeFromHistory = function(id) {
  let history = JSON.parse(localStorage.getItem("checkHistory") || "[]");
  history = history.filter(h => h.id !== id);
  localStorage.setItem("checkHistory", JSON.stringify(history));
  renderHistory();
};

clearHistoryBtn?.addEventListener("click", () => {
  if (confirm("Διαγραφή όλου του ιστορικού;")) {
    localStorage.removeItem("checkHistory");
    renderHistory();
  }
});

// Signs
function renderSigns(signsArray, type) {
  const container = document.getElementById("signsList");
  if (!signsArray.length) {
    container.innerHTML = "<div class='card'>Δεν βρέθηκαν πινακίδες</div>";
    return;
  }
  container.innerHTML = signsArray.map(s => `
    <div class="card">
      <div class="violation-title">${s.code} ${s.name}</div>
      <div>${s.description}</div>
    </div>
  `).join("");
}

function searchSigns() {
  const query = signSearch.value.toLowerCase();
  const filtered = signs.filter(s => s.code.toLowerCase().includes(query) || s.name.toLowerCase().includes(query));
  renderSigns(filtered);
}

searchSignBtn.addEventListener("click", searchSigns);

// OTA
function loadOTAs() {
  const prefectures = Object.keys(otaData);
  prefectureSelect.innerHTML = "<option value=''>-- Επιλέξτε Νομό --</option>" + prefectures.map(p => `<option value="${p}">${p}</option>`).join("");
  prefectureSelect.addEventListener("change", () => {
    const selected = prefectureSelect.value;
    const municipalities = otaData[selected] || [];
    otaSelect.innerHTML = "<option value=''>-- Επιλέξτε ΟΤΑ --</option>" + municipalities.map(m => `<option value="${m.code}">${m.name} (${m.code})</option>`).join("");
    otaSelect.addEventListener("change", () => {
      const code = otaSelect.value;
      const name = otaSelect.options[otaSelect.selectedIndex]?.text || "";
      otaCodeDisplay.innerHTML = `<strong>Κωδικός ΟΤΑ:</strong> ${code}<br><strong>Δήμος/Κοινότητα:</strong> ${name}`;
    });
  });
}

// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(reg => console.log("SW registered", reg)).catch(err => console.log("SW failed", err));
}

searchBtn.addEventListener("click", searchViolations);
searchInput.addEventListener("keypress", (e) => { if (e.key === "Enter") searchViolations(); });

loadOTAs();
renderViolations(violations.slice(0, 30));