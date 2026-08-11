function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  row.push(value.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);
  return rows;
}

function number(value) {
  const result = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(result) ? result : 0;
}

function extractClientName(csvText, fallback) {
  const rows = parseCsv(csvText);
  const firstTransaction = rows.find((row) => row[1] === 'عميل' && row[2]);
  return firstTransaction?.[2]?.trim() || fallback;
}

function clientData(csvText, fallbackName) {
  const rows = parseCsv(csvText);
  const firstTransaction = rows.find((row) => row[1] === 'عميل' && row[2]);
  const name = firstTransaction?.[2]?.trim() || fallbackName;
  const transactions = rows.filter((row) => row[1] === 'عميل' && row[2] === name);
  return { name, balance: number(rows[0]?.[14]), transactions };
}

function dashboardData(csvText) {
  const rows = parseCsv(csvText);
  const clients = [];
  const suppliers = [];
  const transactions = rows.filter((row) => row[1] === 'عميل' || row[1] === 'مورد');

  for (const row of rows) {
    if (row[0] && row[1] && row[3] && row[1] !== 'عميل' && row[1] !== 'مورد' && row[1] !== 'العملاء') {
      clients.push({ name: row[1], balance: number(row[3]) });
    }
    if (row[1] !== 'عميل' && row[1] !== 'مورد' && row[5] && row[6] && row[8] && row[6] !== 'الموردين') {
      suppliers.push({ name: row[6], balance: number(row[8]) });
    }
  }

  const cashRow = clients.find((client) => client.name === 'الخزنة');
  const profitRow = rows.find((row) => row.includes('صافي الربح'));
  const cashBalance = cashRow?.balance || 0;
  const netProfit = profitRow ? number(profitRow[profitRow.indexOf('صافي الربح') + 3]) : 0;
  const totalValue = transactions.reduce((total, row) => total + number(row[9]), 0);

  return { clients, suppliers, transactions, cashBalance, netProfit, totalValue };
}

module.exports = { parseCsv, extractClientName, clientData, dashboardData };
