const money = (number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(number || 0));
const dateTime = (value) => new Date(value).toLocaleString('en-GB', { hour12: true });
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
let allTransactions = [];

function note(id, text, type = '') { const element = document.getElementById(id); element.textContent = text; element.className = `notice ${type}`; }

function renderTransactions(rows) {
  document.getElementById('transactions').innerHTML = rows.map((row) => `<tr><td>${esc(row[1])}</td><td>${esc(row[2])}</td><td>${esc(row[3])}</td><td>${esc(row[4])}</td><td dir="ltr">${money(row[5])}</td><td dir="ltr">${money(row[9])}</td><td dir="ltr">${esc(row[10])}</td><td>${esc(row[12])}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">لا توجد عمليات.</td></tr>';
}

function render(data) {
  document.getElementById('updatedAt').textContent = data.updatedAt ? `آخر تحديث: ${dateTime(data.updatedAt)}` : '';
  const dashboard = data.dashboard;
  document.getElementById('summary').innerHTML = [
    ['رصيد الخزنة', dashboard.cashBalance, 'green'],
    ['صافي الربح', dashboard.netProfit, 'yellow'],
    ['إجمالي العمليات', dashboard.totalValue, 'blue']
  ].map(([label, value, color]) => `<article class="card"><div class="label">${label}</div><div class="value ${color}" dir="ltr">${money(value)}</div></article>`).join('');

  document.getElementById('clientsBalances').innerHTML = dashboard.clients.map((client) => `<tr><td>${esc(client.name)}</td><td dir="ltr">${money(client.balance)}</td></tr>`).join('');
  document.getElementById('suppliersBalances').innerHTML = dashboard.suppliers.map((supplier) => `<tr><td>${esc(supplier.name)}</td><td dir="ltr">${money(supplier.balance)}</td></tr>`).join('');
  document.getElementById('clientLinks').innerHTML = data.clients.map((account) => `<tr><td>${esc(account.name)}</td><td class="link">${esc(account.url)}</td><td><button class="secondary" data-url="${esc(account.url)}">نسخ الرابط</button></td></tr>`).join('') || '<tr><td colspan="3" class="empty">لا توجد ملفات حسابات مرفوعة.</td></tr>';

  allTransactions = dashboard.transactions;
  renderTransactions(allTransactions);
  document.querySelectorAll('[data-url]').forEach((button) => {
    button.onclick = async () => { await navigator.clipboard.writeText(button.dataset.url); button.textContent = 'تم النسخ'; setTimeout(() => { button.textContent = 'نسخ الرابط'; }, 1400); };
  });
}

async function load() {
  const response = await fetch('/api/admin');
  if (response.status === 401) { document.getElementById('loginView').classList.remove('hidden'); return; }
  const data = await response.json();
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('dashboardView').classList.remove('hidden');
  if (data.configured) render(data); else note('uploadMessage', 'ارفع master.csv وملفات حسابات العملاء أو الموردين لبدء لوحة البيانات.');
}

document.getElementById('loginForm').onsubmit = async (event) => { event.preventDefault(); const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: document.getElementById('password').value }) }); if (response.ok) load(); else note('loginMessage', 'كلمة المرور غير صحيحة.', 'error'); };
document.getElementById('upload').onclick = async () => { const files = document.getElementById('files').files; if (!files.length) return note('uploadMessage', 'اختر الملفات أولًا.', 'error'); const form = new FormData(); [...files].forEach((file) => form.append('files', file)); note('uploadMessage', 'جارٍ رفع الملفات وتحديث البيانات...'); const response = await fetch('/api/upload', { method: 'POST', body: form }); const data = await response.json(); if (!response.ok) return note('uploadMessage', data.error || 'فشل الرفع.', 'error'); note('uploadMessage', `تم تحديث ${data.uploaded} حسابًا بنجاح.`, 'success'); load(); };
document.getElementById('logout').onclick = async () => { await fetch('/api/logout', { method: 'POST' }); location.reload(); };
document.getElementById('search').oninput = (event) => { const search = event.target.value.trim(); renderTransactions(allTransactions.filter((row) => row.join(' ').includes(search))); };
load();
