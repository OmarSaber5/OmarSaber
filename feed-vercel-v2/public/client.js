const money = (number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(number || 0));
const dateTime = (value) => new Date(value).toLocaleString('en-GB', { hour12: true });
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
let transactions = [];

function render(rows) {
  document.getElementById('transactions').innerHTML = rows.map((row) => `<tr><td>${esc(row[3])}</td><td>${esc(row[4])}</td><td dir="ltr">${money(row[5])}</td><td dir="ltr">${money(row[6])}</td><td>${esc(row[7])}</td><td dir="ltr">${money(row[9])}</td><td dir="ltr">${esc(row[10])}</td><td>${esc(row[12])}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">لا توجد عمليات مسجلة لهذا الحساب.</td></tr>';
}

async function load() {
  const token = new URLSearchParams(location.search).get('token');
  if (!token) { document.getElementById('message').textContent = 'هذا الرابط غير صالح.'; document.getElementById('message').classList.add('error'); return; }
  const response = await fetch(`/api/client?token=${encodeURIComponent(token)}`);
  const data = await response.json();
  if (!response.ok) { document.getElementById('message').textContent = data.error || 'تعذر فتح كشف الحساب.'; document.getElementById('message').classList.add('error'); return; }
  document.title = `كشف حساب ${data.name}`;
  document.getElementById('name').textContent = data.name;
  document.getElementById('accountType').textContent = data.accountType === 'مورد' ? 'كشف حساب مورد' : 'كشف حساب عميل';
  document.getElementById('balance').textContent = money(data.balance);
  document.getElementById('count').textContent = money(data.transactions.length);
  document.getElementById('updatedAt').textContent = `آخر تحديث: ${dateTime(data.updatedAt)}`;
  transactions = data.transactions;
  render(transactions);
  document.getElementById('message').classList.add('hidden');
  document.getElementById('portal').classList.remove('hidden');
}
document.getElementById('search').oninput = (event) => render(transactions.filter((row) => row.join(' ').includes(event.target.value.trim())));
load();
