const assert = require('assert');
const {
  calculateRSI,
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateATR,
  calculateMACD,
  calculateVWAP,
  calculateFibonacciLevels
} = require('../src/services/indicatorService');
const { calculateGreeks, generateOptionChain } = require('../src/services/derivativesService');
const { runBacktest } = require('../src/services/backtestService');

console.log("=== VECTIVOR QUANT & INDICATOR TEST SUITE ===");

// 1. RSI test
const prices = [
  44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84,
  46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41,
  46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 45.78, 45.35, 44.03
];
const lastRsi = calculateRSI(prices, 14);
assert(typeof lastRsi === 'number', "RSI is a number");
assert(lastRsi >= 0 && lastRsi <= 100, `RSI bounds [0, 100]: got ${lastRsi}`);
console.log("✔ RSI (Wilder's 14) test passed. Last RSI:", lastRsi);

// 2. EMA & SMA tests
const sma5 = calculateSMA(prices, 5);
const ema5 = calculateEMA(prices, 5);
assert(sma5.length === prices.length - 5 + 1);
assert(ema5.length === prices.length - 5 + 1);
console.log("✔ SMA & EMA test passed. Last SMA5:", sma5[sma5.length-1], "Last EMA5:", ema5[ema5.length-1]);

// 3. Bollinger Bands
const bb = calculateBollingerBands(prices, 20, 2);
assert(bb.upper >= bb.middle, "Bollinger upper >= middle");
assert(bb.middle >= bb.lower, "Bollinger middle >= lower");
console.log("✔ Bollinger Bands (20, 2) test passed. Upper:", bb.upper, "Middle:", bb.middle, "Lower:", bb.lower);

// 4. ATR test
const testCandles = [];
for (let i = 0; i < prices.length; i++) {
  testCandles.push({
    high: prices[i] + 1.5,
    low: prices[i] - 1.2,
    close: prices[i]
  });
}
const atr = calculateATR(testCandles, 14);
assert(typeof atr === 'number' && atr > 0, "ATR must be a positive number");
console.log("✔ ATR (14) test passed. Last ATR:", atr);

// 5. Fibonacci Retracement
const fib = calculateFibonacciLevels(200, 100);
assert(fib.level0 === 200, "Fib 0% is High");
assert(fib.level100 === 100, "Fib 100% is Low");
assert(fib.level500 === 150, "Fib 50% is midpoint");
console.log("✔ Fibonacci Retracement test passed. 38.2%:", fib.level382, "50%:", fib.level500, "61.8%:", fib.level618);

// 6. Black-Scholes Greeks test
const greeks = calculateGreeks(22500, 22500, 7 / 365, 0.065, 0.15);
assert(greeks.call.delta > 0 && greeks.call.delta < 1, "Call Delta in (0, 1)");
assert(greeks.call.gamma > 0, "Call Gamma > 0");
assert(greeks.call.vega > 0, "Call Vega > 0");
console.log("✔ Black-Scholes Call Greeks test passed:", greeks.call);

assert(greeks.put.delta < 0 && greeks.put.delta > -1, "Put Delta in (-1, 0)");
console.log("✔ Black-Scholes Put Greeks test passed:", greeks.put);

// 7. Option Chain test
const chain = generateOptionChain('NIFTY50', 22500);
assert(chain.strikes.length > 0, "Strikes generated");
assert(chain.pcr > 0, "PCR generated");
console.log("✔ Option Chain generation test passed. Strikes:", chain.strikes.length, "PCR:", chain.pcr);

// 8. Strategy Backtester test
const candles = [];
let base = 22000;
for (let i = 0; i < 100; i++) {
  const change = (Math.sin(i / 5) * 40) + ((i % 3 === 0) ? 25 : -15);
  const open = base;
  const close = base + change;
  const high = Math.max(open, close) + 20;
  const low = Math.min(open, close) - 20;
  candles.push({
    date: new Date(Date.now() - (100 - i) * 86400000).toISOString(),
    open, high, low, close, volume: 500000
  });
  base = close;
}

const backtestResult = runBacktest(candles, 'ema_cross', { fastPeriod: 5, slowPeriod: 12, initialCapital: 100000 });
assert(backtestResult.strategyName, "Backtest returned strategyName");
assert(typeof backtestResult.totalTrades === 'number', "Total trades is number");
assert(typeof backtestResult.winRatePercent === 'number', "Win rate is number");
console.log("✔ Strategy Backtester test passed:", {
  totalTrades: backtestResult.totalTrades,
  winRate: backtestResult.winRatePercent + "%",
  totalReturn: backtestResult.totalReturnPercent + "%",
  maxDrawdown: backtestResult.maxDrawdownPercent + "%"
});

console.log("\n============================================");
console.log("🎉 ALL 8 QUANT/ANALYTICS TESTS PASSED WITH 100% SUCCESS!");
console.log("============================================");
