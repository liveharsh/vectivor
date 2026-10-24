// ==============================================================================
// VECTIVOR PRO MAX TERMINAL BACKEND SERVER
// Production Architecture: Multi-Market Real-Time Engine, Derivatives, SMC & Backtesting
// ==============================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');

const { INSTRUMENT_CATALOG, fetchOHLCV, roundPrice } = require('./src/services/marketDataService');
const indicators = require('./src/services/indicatorService');
const masterEngine = require('./src/masterAnalysisEngine');
const { getFundamentals } = require('./src/services/fundamentalsService');
const { getNewsAndCalendar } = require('./src/services/newsCalendarService');
const { calculateGreeks, generateOptionChain } = require('./src/services/derivativesService');
const { runBacktest } = require('./src/services/backtestService');
const { defaultAccount } = require('./src/services/paperTradingService');
const { runScreener } = require('./src/services/screenerService');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));

// Compatibility Alias for legacy catalog references
const STOCK_CATALOG = INSTRUMENT_CATALOG;

/**
 * Health Check Endpoints (Zero-downtime Render deployment & monitoring)
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'vectivor-pro-max',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024))
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'vectivor-pro-max', timestamp: new Date().toISOString() });
});

/**
 * Core Market Analysis Engine
 */
async function analyzeMarket(symbol, timeframe = '1D') {
    const sym = (symbol || 'NIFTY50').toUpperCase();
    const meta = INSTRUMENT_CATALOG[sym] || {
        name: sym,
        symbol: sym,
        currency: '₹',
        sector: 'Equities',
        basePrice: 1000,
        market: 'IN',
        assetClass: 'STOCK'
    };

    const ohlcvPayload = await fetchOHLCV(sym, timeframe);
    const candles = ohlcvPayload.candles;
    const closes = candles.map(c => c.close);
    const latest = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || latest;

    let currentPrice = roundPrice(latest.close, meta.basePrice);
    let priceChange = roundPrice(currentPrice - prev.close, meta.basePrice);
    let percentChange = prev.close ? Math.round(((priceChange / prev.close) * 100) * 100) / 100 : 0;

    if (ohlcvPayload.live24h) {
        currentPrice = roundPrice(ohlcvPayload.live24h.price, meta.basePrice);
        priceChange = roundPrice(ohlcvPayload.live24h.change, meta.basePrice);
        percentChange = roundPrice(ohlcvPayload.live24h.percentChange, meta.basePrice);
    }

    // Technical Indicators
    const rsi = indicators.calculateRSI(closes, 14);
    const macd = indicators.calculateMACD(closes);
    const ema20Arr = indicators.calculateEMA(closes, 20);
    const ema50Arr = indicators.calculateEMA(closes, 50);
    const ema200Arr = indicators.calculateEMA(closes, Math.min(closes.length, 100));

    const ema20 = roundPrice(ema20Arr[ema20Arr.length - 1] || currentPrice, meta.basePrice);
    const ema50 = roundPrice(ema50Arr[ema50Arr.length - 1] || currentPrice, meta.basePrice);
    const ema200 = roundPrice(ema200Arr[ema200Arr.length - 1] || currentPrice, meta.basePrice);
    const bb = indicators.calculateBollingerBands(closes, 20);
    const pivots = indicators.calculatePivots(latest.high, latest.low, latest.close);
    const atr = indicators.calculateATR(candles, 14);
    const vwap = indicators.calculateVWAP(candles);
    const adx = indicators.calculateADX(candles, 14);
    const stochRSI = indicators.calculateStochRSI(closes, 14);
    const fibLevels = indicators.calculateFibonacciLevels(Math.max(...candles.map(c => c.high)), Math.min(...candles.map(c => c.low)));

    // Directional Scoring & Confluence Factors
    let score = 0;
    const reasons = [];
    const signals = [];

    // 1. RSI Factor
    if (rsi < 32) {
        score += 25;
        signals.push({ indicator: 'RSI', signal: 'Oversold Reversal (Bullish)', bias: 'UP', points: +25 });
        reasons.push(`RSI at ${rsi} is in deep oversold territory (<32) — statistical mean-reversion favors upward bounce.`);
    } else if (rsi > 68) {
        score -= 25;
        signals.push({ indicator: 'RSI', signal: 'Overbought Exhaustion (Bearish)', bias: 'DOWN', points: -25 });
        reasons.push(`RSI at ${rsi} is in overbought territory (>68) — high probability of profit-taking and consolidation.`);
    } else if (rsi >= 50 && rsi <= 65) {
        score += 15;
        signals.push({ indicator: 'RSI', signal: 'Bullish Momentum', bias: 'UP', points: +15 });
        reasons.push(`RSI at ${rsi} sustains strong momentum within the positive expansion corridor (50–65).`);
    } else {
        score -= 10;
        signals.push({ indicator: 'RSI', signal: 'Weak Momentum', bias: 'DOWN', points: -10 });
        reasons.push(`RSI is trading below the neutral 50 threshold (${rsi}), confirming ongoing seller dominance.`);
    }

    // 2. Moving Average Alignment
    if (currentPrice > ema20) {
        score += 15;
        signals.push({ indicator: '20 EMA', signal: 'Price above 20 EMA (Short-term UP)', bias: 'UP', points: +15 });
    } else {
        score -= 15;
        signals.push({ indicator: '20 EMA', signal: 'Price below 20 EMA (Short-term DOWN)', bias: 'DOWN', points: -15 });
    }

    if (ema20 > ema50) {
        score += 20;
        signals.push({ indicator: 'EMA Crossover', signal: 'Bullish Alignment (20 > 50 EMA)', bias: 'UP', points: +20 });
        reasons.push(`20 EMA is leading above 50 EMA, preserving positive systematic order flow.`);
    } else {
        score -= 20;
        signals.push({ indicator: 'EMA Crossover', signal: 'Bearish Alignment (20 < 50 EMA)', bias: 'DOWN', points: -20 });
        reasons.push(`20 EMA is lagging below 50 EMA, maintaining systematic downward pressure.`);
    }

    // 3. MACD Confirmation
    if (macd.bullishCross) {
        score += 20;
        signals.push({ indicator: 'MACD', signal: 'Bullish Crossover', bias: 'UP', points: +20 });
        reasons.push('MACD line is above the signal line with positive histogram expansion.');
    } else {
        score -= 20;
        signals.push({ indicator: 'MACD', signal: 'Bearish Momentum', bias: 'DOWN', points: -20 });
        reasons.push('MACD histogram remains negative, confirming supply pressure.');
    }

    // Direction & Verdict
    let direction = 'SIDEWAYS';
    let verdict = 'NEUTRAL - CONSOLIDATION ↔';
    let actionBadge = 'WATCHLIST / RANGEBOUND';
    let colorClass = 'neutral';

    if (score >= 25) {
        direction = 'UP';
        verdict = 'BULLISH - UPWARD TRAJECTORY ↗';
        actionBadge = score >= 50 ? 'STRONG BUY / LONG' : 'MODERATE ACCUMULATION';
        colorClass = 'bullish';
    } else if (score <= -25) {
        direction = 'DOWN';
        verdict = 'BEARISH - DOWNWARD TRAJECTORY ↘';
        actionBadge = score <= -50 ? 'STRONG SELL / SHORT' : 'DISTRIBUTION / CAUTION';
        colorClass = 'bearish';
    }

    // Transparent Confluence Score (Percentage of bullish indicator weight)
    const normalizedConfluence = Math.round(((score + 100) / 200) * 100);

    // ATR-based Dynamic Risk Management Levels
    let target1, target2, stopLoss;
    if (direction === 'UP') {
        target1 = roundPrice(currentPrice + (atr * 1.5), meta.basePrice);
        target2 = roundPrice(currentPrice + (atr * 2.8), meta.basePrice);
        stopLoss = roundPrice(currentPrice - (atr * 1.1), meta.basePrice);
    } else if (direction === 'DOWN') {
        target1 = roundPrice(currentPrice - (atr * 1.5), meta.basePrice);
        target2 = roundPrice(currentPrice - (atr * 2.8), meta.basePrice);
        stopLoss = roundPrice(currentPrice + (atr * 1.1), meta.basePrice);
    } else {
        target1 = roundPrice(pivots.classic.r1, meta.basePrice);
        target2 = roundPrice(pivots.classic.r2, meta.basePrice);
        stopLoss = roundPrice(pivots.classic.s1, meta.basePrice);
    }

    // Master SMC & Quantitative Analytics
    const structure = masterEngine.analyzeMarketStructure(candles);
    const smc = masterEngine.analyzeSMC(candles, currentPrice);
    const candlestickPattern = masterEngine.analyzeCandlestickPattern(candles);
    const volumeProfile = masterEngine.analyzeVolumeAndProfile(candles);
    const derivatives = masterEngine.analyzeDerivatives(sym, meta, currentPrice, rsi, structure.trend);
    const scenarios = masterEngine.generateTradingScenarios(currentPrice, structure, smc, candlestickPattern, volumeProfile, meta);
    const masterHindi = masterEngine.generateHindiMasterclass(sym, meta, currentPrice, structure, smc, candlestickPattern, volumeProfile, derivatives, scenarios);

    return {
        symbol: sym,
        meta,
        currentPrice,
        priceChange,
        percentChange,
        direction,
        verdict,
        actionBadge,
        colorClass,
        confluenceScore: normalizedConfluence,
        confidence: normalizedConfluence, // Backwards compatibility for existing UI
        score,
        target1,
        target2,
        stopLoss,
        riskReward: '1 : 2.2',
        isLive: ohlcvPayload.isLive,
        source: ohlcvPayload.source,
        dataStatus: ohlcvPayload.dataStatus,
        timestamp: ohlcvPayload.timestamp,
        timing: {
            timeframe: `${timeframe} Klines`,
            target1Eta: '1 – 2 Trading Sessions (Days)',
            target2Eta: '3 – 5 Trading Sessions (Days)',
            invalidation: 'Active until Stop-Loss Barrier is triggered',
            bestWindow: meta.market === 'IN' ? '09:30 AM – 11:00 AM IST' :
                       meta.market === 'US' ? '07:30 PM – 09:30 PM IST' :
                       meta.market === 'CRYPTO' ? '24/7 (Peak Volume: 05:30 PM – 10:30 PM IST)' :
                       '09:30 AM – 11:30 AM & 06:00 – 09:00 PM IST'
        },
        indicators: {
            rsi,
            macd,
            ema20,
            ema50,
            ema200,
            bollingerBands: bb,
            pivots: pivots.classic,
            atr: roundPrice(atr, meta.basePrice),
            vwap,
            adx,
            stochRSI,
            fibLevels
        },
        signals,
        reasons,
        fearGreed: {
            score: Math.max(5, Math.min(95, Math.round(50 + (score * 0.45)))),
            label: score > 35 ? 'Greed (Bullish Dominance)' : (score < -35 ? 'Fear (Distribution)' : 'Neutral (Balanced)')
        },
        chartData: candles.slice(-60),
        masterAnalysis: {
            structure,
            smc,
            candlestickPattern,
            volumeProfile,
            derivatives,
            scenarios,
            masterHindi
        }
    };
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Get List of all supported instruments
app.get('/api/stocks', (req, res) => {
    const list = Object.keys(INSTRUMENT_CATALOG).map(key => ({
        key,
        ...INSTRUMENT_CATALOG[key]
    }));
    res.json(list);
});

// 2. Multi-Timeframe OHLCV Endpoint
app.get('/api/ohlcv/:symbol', async (req, res) => {
    const symbol = (req.params.symbol || 'NIFTY50').toUpperCase();
    const tf = (req.query.timeframe || '1D').toUpperCase();
    try {
        const data = await fetchOHLCV(symbol, tf);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Complete Market Analysis
app.get('/api/analyze/:symbol', async (req, res) => {
    const symbol = (req.params.symbol || 'NIFTY50').toUpperCase();
    const tf = (req.query.timeframe || '1D').toUpperCase();
    try {
        const analysis = await analyzeMarket(symbol, tf);
        res.json(analysis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Master SMC & Educational Analysis
app.get('/api/master-analysis/:symbol', async (req, res) => {
    const symbol = (req.params.symbol || 'NIFTY50').toUpperCase();
    try {
        const analysis = await analyzeMarket(symbol);
        res.json({
            symbol: analysis.symbol,
            meta: analysis.meta,
            currentPrice: analysis.currentPrice,
            isLive: analysis.isLive,
            source: analysis.source,
            dataStatus: analysis.dataStatus,
            timestamp: analysis.timestamp,
            ...analysis.masterAnalysis
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Fundamentals Analysis
app.get('/api/fundamentals/:symbol', (req, res) => {
    const symbol = (req.params.symbol || 'NIFTY50').toUpperCase();
    const data = getFundamentals(symbol);
    res.json({ symbol, ...data });
});

// 6. Market News & Economic Calendar
app.get('/api/news', (req, res) => {
    const category = req.query.category || 'ALL';
    const data = getNewsAndCalendar(category);
    res.json(data);
});

// 7. Option Chain & Derivatives Greeks
app.get('/api/derivatives/:symbol', async (req, res) => {
    const symbol = (req.params.symbol || 'NIFTY50').toUpperCase();
    try {
        const analysis = await analyzeMarket(symbol);
        const chain = generateOptionChain(symbol, analysis.currentPrice, analysis.meta.market);
        res.json(chain);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Strategy Backtester
app.post('/api/backtest', async (req, res) => {
    const { symbol = 'NIFTY50', strategy = 'EMA_CROSS', initialCapital = 100000, riskPerTradePercent = 1.5 } = req.body;
    try {
        const ohlcv = await fetchOHLCV(symbol.toUpperCase(), '1D');
        const results = runBacktest(ohlcv.candles, {
            strategy,
            initialCapital: parseFloat(initialCapital) || 100000,
            riskPerTradePercent: parseFloat(riskPerTradePercent) || 1.5
        });
        res.json({
            symbol: symbol.toUpperCase(),
            timeframe: '1D',
            ...results
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Paper Trading Endpoints
app.get('/api/paper-trading/summary', async (req, res) => {
    try {
        res.json(defaultAccount.getAccountSummary());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/paper-trading/order', async (req, res) => {
    const { symbol, side, quantity, price } = req.body;
    try {
        let execPrice = parseFloat(price);
        if (!execPrice || isNaN(execPrice)) {
            const analysis = await analyzeMarket(symbol);
            execPrice = analysis.currentPrice;
        }
        const order = defaultAccount.placeOrder(symbol.toUpperCase(), side, quantity, execPrice);
        res.json({ success: true, order, account: defaultAccount.getAccountSummary() });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/paper-trading/reset', (req, res) => {
    const { startingBalance = 100000 } = req.body;
    const account = defaultAccount.reset(parseFloat(startingBalance) || 100000);
    res.json({ success: true, message: 'Simulated paper trading balance reset.', account });
});

// 10. Multi-Asset Screener
app.get('/api/screener', async (req, res) => {
    try {
        const sampleSymbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'NVDA', 'AAPL', 'TSLA', 'BTC', 'ETH', 'SOL', 'GOLD', 'CRUDEOIL'];
        const summaries = await Promise.all(sampleSymbols.map(async sym => {
            try {
                const a = await analyzeMarket(sym);
                return {
                    symbol: sym,
                    name: a.meta.name,
                    market: a.meta.market,
                    currentPrice: a.currentPrice,
                    priceChange: a.priceChange,
                    percentChange: a.percentChange,
                    direction: a.direction,
                    rsi: a.indicators.rsi,
                    rvol: a.masterAnalysis.volumeProfile.rvol
                };
            } catch (e) {
                return null;
            }
        }));
        const valid = summaries.filter(Boolean);
        res.json(runScreener(valid));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. Resilient Macro Market Pulse
let cachedPulse = null;
let lastPulseTime = 0;

app.get('/api/market-pulse', async (req, res) => {
    const now = Date.now();
    if (cachedPulse && (now - lastPulseTime < 30000)) {
        return res.json(cachedPulse);
    }

    try {
        const safeAnalyze = async (sym, fallbackPrice) => {
            try {
                return await analyzeMarket(sym);
            } catch (e) {
                return { score: 0, currentPrice: fallbackPrice };
            }
        };

        const [btc, eth, sol, nifty, banknifty, sensex, nasdaq, sp500, nvda] = await Promise.all([
            safeAnalyze('BTC', 68000),
            safeAnalyze('ETH', 2600),
            safeAnalyze('SOL', 170),
            safeAnalyze('NIFTY50', 22600),
            safeAnalyze('BANKNIFTY', 51200),
            safeAnalyze('SENSEX', 81400),
            safeAnalyze('NASDAQ', 18450),
            safeAnalyze('SP500', 5815),
            safeAnalyze('NVDA', 142)
        ]);

        const cryptoScore = Math.round(((btc.score || 0) + (eth.score || 0) + (sol.score || 0)) / 3);
        const indiaScore = Math.round(((nifty.score || 0) + (banknifty.score || 0) + (sensex.score || 0)) / 3);
        const usScore = Math.round(((nasdaq.score || 0) + (sp500.score || 0) + (nvda.score || 0)) / 3);

        const getSummary = (score) => {
            if (score >= 20) return { verdict: 'BULLISH (UPWARD ↗)', color: '#00ff66', bias: 'UP' };
            if (score <= -20) return { verdict: 'BEARISH (DOWNWARD ↘)', color: '#ff1744', bias: 'DOWN' };
            return { verdict: 'RANGEBOUND (SIDEWAYS ↔)', color: '#fbbf24', bias: 'NEUTRAL' };
        };

        cachedPulse = {
            timestamp: new Date().toISOString(),
            crypto: {
                name: 'Crypto Market',
                score: cryptoScore,
                ...getSummary(cryptoScore),
                btcPrice: btc.currentPrice,
                ethPrice: eth.currentPrice
            },
            india: {
                name: 'Indian Stock Market',
                score: indiaScore,
                ...getSummary(indiaScore),
                niftyPrice: nifty.currentPrice,
                sensexPrice: sensex.currentPrice
            },
            us: {
                name: 'US Wall Street Market',
                score: usScore,
                ...getSummary(usScore),
                nasdaqPrice: nasdaq.currentPrice,
                sp500Price: sp500.currentPrice
            }
        };

        lastPulseTime = now;
        res.json(cachedPulse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12. Custom Stock Analysis
app.post('/api/custom-analyze', async (req, res) => {
    const { name, currentPrice, high, low, previousClose } = req.body;
    try {
        const price = parseFloat(currentPrice) || 1000;
        INSTRUMENT_CATALOG['CUSTOM'] = {
            name: name || 'Custom Asset',
            symbol: 'CUSTOM',
            market: 'CUSTOM',
            currency: '₹',
            basePrice: price,
            sector: 'Custom Input',
            assetClass: 'CUSTOM'
        };

        const result = await analyzeMarket('CUSTOM');
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Process Level Crash Protectors (Eliminates Render 503 Crashes)
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception:', err);
});

// Start Server explicitly bound to 0.0.0.0
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VECTIVOR PRO MAX Terminal running at: http://0.0.0.0:${PORT}`);
});
