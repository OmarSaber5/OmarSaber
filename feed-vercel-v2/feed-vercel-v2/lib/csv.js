function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(value.trim()); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = []; value = '';
    } else value += char;
  }
  row.push(value.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);
  return rows;
}

function number(value) {
  const result = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(result) ? result : 0;
}

function isAccountTransaction(row) {
  return row[1] === 'عميل' || row[1] === 'مورد';
}

function normalized(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function extractClientName(csvText, fallback) {
  const transaction = parseCsv(csvText).find((row) => isAccountTransaction(row) && row[2]);
  return transaction?.[2]?.trim() || fallback;
}

function clientData(csvText, fallbackName) {
  const rows = parseCsv(csvText);
  const accountRows = rows.filter(isAccountTransaction);
  const firstTransaction = accountRows.find((row) => row[2]);
  const name = firstTransaction?.[2]?.trim() || fallbackName;
  const matchingRows = accountRows.filter((row) => normalized(row[2]) === normalized(name));

  // Some exported account files omit the account name on a few lines.
  // In that case, all transaction rows in that file belong to the account.
  const transactions = matchingRows.length ? matchingRows : accountRows;
  return { name, accountType: firstTransaction?.[1] || 'حساب', balance: number(rows[0]?.[14]), transactions };
}

function dashboardData(csvText) {
  const rows = parseCsv(csvText);
  const clients = [];
  const suppliers = [];
  const transactions = rows.filter(isAccountTransaction);

  for (const row of rows) {
    if (row[0] && row[1] && row[3] && !isAccountTransaction(row) && row[1] !== 'العملاء') {
      clients.push({ name: row[1], balance: number(row[3]) });
    }
    if (!isAccountTransaction(row) && row[5] && row[6] && row[8] && row[6] !== 'الموردين') {
      suppliers.push({ name: row[6], balance: number(row[8]) });
    }
  }

  const cashBalance = clients.find((client) => client.name === 'الخزنة')?.balance || 0;
  const profitRow = rows.find((row) => row.includes('صافي الربح'));
  const netProfit = profitRow ? number(profitRow[profitRow.indexOf('صافي الربح') + 3]) : 0;

  // This card is intentionally the cash balance plus net profit, not the sum of all transactions.
  const totalValue = cashBalance + netProfit;
  return { clients, suppliers, transactions, cashBalance, netProfit, totalValue };
}

module.exports = { parseCsv, extractClientName, clientData, dashboardData };
