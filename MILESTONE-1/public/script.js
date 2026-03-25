// TrackWise: Relational Expense Analytics Platform - Modern JS Rewrite
// Assumes backend API at /api/expenses (GET, POST, PUT, DELETE)

const API_URL = '/api/expenses';
const expenseForm = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const descInput = document.getElementById('desc');
const dateInput = document.getElementById('date');
const listEl = document.getElementById('list');
const statsEl = document.getElementById('stats');
const liveTotalEl = document.getElementById('live-total');
const loadingEl = document.getElementById('loading');
const toastEl = document.getElementById('toast');
const searchInput = document.getElementById('search');
const filterCategory = document.getElementById('filter-category');
const sortSelect = document.getElementById('sort');
const darkToggle = document.getElementById('dark-toggle');
const noExpensesEl = document.getElementById('no-expenses');

let expenses = [];
let editingId = null;

// --- Theme Toggle ---
darkToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark');
  localStorage.setItem('trackwise-theme', isDark ? '' : 'dark');
});
(function restoreTheme() {
  const theme = localStorage.getItem('trackwise-theme');
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();

// --- Toast ---
function showToast(msg, error = false) {
  toastEl.textContent = msg;
  toastEl.className = 'toast show' + (error ? ' error' : '');
  setTimeout(() => toastEl.className = 'toast', 2500);
}

// --- Loading Overlay ---
function setLoading(show) {
  loadingEl.style.display = show ? 'flex' : 'none';
}

// --- Fetch Expenses ---
async function fetchExpenses() {
  setLoading(true);
  try {
    const res = await fetch(API_URL);
    expenses = await res.json();
    renderAll();
  } catch {
    showToast('Failed to load expenses', true);
  }
  setLoading(false);
}

// --- Add/Edit Expense ---
expenseForm.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    desc: descInput.value,
    date: dateInput.value
  };
  if (!data.amount || !data.category || !data.desc || !data.date) return showToast('Fill all fields', true);
  setLoading(true);
  try {
    if (editingId) {
      await fetch(`${API_URL}/${editingId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
      showToast('Expense updated!');
      editingId = null;
    } else {
      await fetch(API_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
      showToast('Expense added!');
    }
    expenseForm.reset();
    fetchExpenses();
  } catch {
    showToast('Failed to save', true);
  }
  setLoading(false);
});

// --- Edit/Delete Handlers ---
listEl.addEventListener('click', async e => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = li.getAttribute('data-id');
  if (e.target.classList.contains('edit-btn')) {
    const exp = expenses.find(x => x.id === id);
    if (!exp) return;
    amountInput.value = exp.amount;
    categoryInput.value = exp.category;
    descInput.value = exp.desc;
    dateInput.value = exp.date.slice(0,10);
    editingId = id;
    amountInput.focus();
  }
  if (e.target.classList.contains('delete-btn')) {
    if (!confirm('Delete this expense?')) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      showToast('Expense deleted!');
      fetchExpenses();
    } catch {
      showToast('Delete failed', true);
    }
    setLoading(false);
  }
});

// --- Filter, Sort, Search ---
[searchInput, filterCategory, sortSelect].forEach(el => el.addEventListener('input', renderAll));

function getFilteredExpenses() {
  let arr = [...expenses];
  const q = searchInput.value.trim().toLowerCase();
  if (q) arr = arr.filter(e => e.desc.toLowerCase().includes(q));
  if (filterCategory.value) arr = arr.filter(e => e.category === filterCategory.value);
  switch (sortSelect.value) {
    case 'date-desc': arr.sort((a,b) => b.date.localeCompare(a.date)); break;
    case 'date-asc': arr.sort((a,b) => a.date.localeCompare(b.date)); break;
    case 'amount-desc': arr.sort((a,b) => b.amount - a.amount); break;
    case 'amount-asc': arr.sort((a,b) => a.amount - b.amount); break;
  }
  return arr;
}

// --- Renderers ---
function renderAll() {
  renderList();
  renderStats();
  renderCharts();
}

function renderList() {
  const arr = getFilteredExpenses();
  listEl.innerHTML = '';
  if (!arr.length) {
    noExpensesEl.style.display = 'block';
    liveTotalEl.textContent = '';
    return;
  }
  noExpensesEl.style.display = 'none';
  let total = 0;
  arr.forEach(exp => {
    total += exp.amount;
    const li = document.createElement('li');
    li.className = 'expense-item';
    li.setAttribute('data-id', exp.id);
    li.innerHTML = `
      <div class="expense-info">
        <strong>₹${exp.amount.toFixed(2)}</strong>
        <span>${exp.desc}</span>
        <span class="category-badge">${exp.category}</span>
        <span style="font-size:0.85em;color:var(--text-light)">${exp.date.slice(0,10)}</span>
      </div>
      <div class="expense-actions">
        <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    `;
    listEl.appendChild(li);
  });
  liveTotalEl.textContent = `Total: ₹${total.toFixed(2)}`;
}

function renderStats() {
  // Example: total, avg, highest, lowest
  if (!expenses.length) return statsEl.innerHTML = '';
  const total = expenses.reduce((a,b) => a + b.amount, 0);
  const avg = total / expenses.length;
  const max = Math.max(...expenses.map(e => e.amount));
  const min = Math.min(...expenses.map(e => e.amount));
  statsEl.innerHTML = `
    <div class="stat-card"><div class="stat-number">₹${total.toFixed(2)}</div><div>Total Spent</div></div>
    <div class="stat-card"><div class="stat-number">₹${avg.toFixed(2)}</div><div>Avg/Expense</div></div>
    <div class="stat-card"><div class="stat-number">₹${max.toFixed(2)}</div><div>Highest</div></div>
    <div class="stat-card"><div class="stat-number">₹${min.toFixed(2)}</div><div>Lowest</div></div>
    <div class="stat-card"><div class="stat-number">${expenses.length}</div><div>Transactions</div></div>
  `;
}

// --- Chart.js Analytics ---
let expenseChart, monthlyChart, flowChart;
function renderCharts() {
  // By Category Pie
  const catMap = {};
  expenses.forEach(e => catMap[e.category] = (catMap[e.category]||0) + e.amount);
  const catLabels = Object.keys(catMap);
  const catData = Object.values(catMap);
  if (!expenseChart) {
    expenseChart = new Chart(document.getElementById('expenseChart'), {
      type: 'pie',
      data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: genColors(catLabels.length) }] },
      options: { plugins: { legend: { position: 'bottom' } }, responsive: true }
    });
  } else {
    expenseChart.data.labels = catLabels;
    expenseChart.data.datasets[0].data = catData;
    expenseChart.data.datasets[0].backgroundColor = genColors(catLabels.length);
    expenseChart.update();
  }
  // Monthly Totals Bar
  const monthMap = {};
  expenses.forEach(e => {
    const m = e.date.slice(0,7);
    monthMap[m] = (monthMap[m]||0) + e.amount;
  });
  const months = Object.keys(monthMap).sort();
  const monthVals = months.map(m => monthMap[m]);
  if (!monthlyChart) {
    monthlyChart = new Chart(document.getElementById('monthlyChart'), {
      type: 'bar',
      data: { labels: months, datasets: [{ label: 'Total', data: monthVals, backgroundColor: genColors(months.length) }] },
      options: { plugins: { legend: { display: false } }, responsive: true }
    });
  } else {
    monthlyChart.data.labels = months;
    monthlyChart.data.datasets[0].data = monthVals;
    monthlyChart.data.datasets[0].backgroundColor = genColors(months.length);
    monthlyChart.update();
  }
  // Monthly Flow Line
  if (!flowChart) {
    flowChart = new Chart(document.getElementById('flowChart'), {
      type: 'line',
      data: { labels: months, datasets: [{ label: 'Flow', data: monthVals, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true }] },
      options: { plugins: { legend: { display: false } }, responsive: true }
    });
  } else {
    flowChart.data.labels = months;
    flowChart.data.datasets[0].data = monthVals;
    flowChart.update();
  }
}
function genColors(n) {
  const palette = [
    '#10b981','#3b82f6','#f59e42','#f43f5e','#6366f1','#fbbf24','#22d3ee','#a3e635','#e879f9','#f87171','#38bdf8','#facc15'
  ];
  return Array.from({length:n}, (_,i)=>palette[i%palette.length]);
}

// --- Initial Load ---
fetchExpenses();
