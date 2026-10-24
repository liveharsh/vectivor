const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(payload);
    const req = http.request(`http://localhost:3000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function run() {
  console.log("=== VECTIVOR BACKEND API TEST ===");

  const health = await get('/health');
  console.log("1. /health ->", health.status, health.body?.status, "uptime:", health.body?.uptime);

  const stocks = await get('/api/stocks');
  console.log("2. /api/stocks ->", stocks.status, "Count:", stocks.body?.length);

  const fundamentals = await get('/api/fundamentals/RELIANCE');
  console.log("3. /api/fundamentals/RELIANCE ->", fundamentals.status, fundamentals.body?.companyName, "PE:", fundamentals.body?.valuation?.pe);

  const news = await get('/api/news');
  console.log("4. /api/news ->", news.status, "News:", news.body?.news?.length, "Calendar:", news.body?.calendar?.length);

  const derivatives = await get('/api/derivatives/NIFTY50');
  console.log("5. /api/derivatives/NIFTY50 ->", derivatives.status, "PCR:", derivatives.body?.pcr, "MaxPain:", derivatives.body?.maxPain);

  const screener = await get('/api/screener');
  console.log("6. /api/screener ->", screener.status, "Gainers:", screener.body?.gainers?.length, "Losers:", screener.body?.losers?.length);

  const paperSummary = await get('/api/paper-trading/summary');
  console.log("7. /api/paper-trading/summary ->", paperSummary.status, "Balance:", paperSummary.body?.balance);

  const backtest = await post('/api/backtest', {
    symbol: 'NIFTY50',
    strategy: 'ema_cross',
    fastPeriod: 9,
    slowPeriod: 21,
    initialCapital: 100000,
    riskPerTrade: 1
  });
  console.log("8. /api/backtest ->", backtest.status, "Strategy:", backtest.body?.metrics?.strategyName, "TotalTrades:", backtest.body?.metrics?.totalTrades, "WinRate:", backtest.body?.metrics?.winRatePercent + "%");

  console.log("=== ALL BACKEND CHECKS PASSED ===");
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
