// ==============================================================================
// VECTIVOR MARKET DATA ENGINE (REAL-TIME, HISTORICAL OHLCV & MULTI-PROVIDER)
// Supported: Indian Equities/Indices, US Stocks/Indices, Crypto, Forex, Commodities
// ==============================================================================

const https = require('https');

// Universal Stock, Crypto, Forex & Commodity Universe
const INSTRUMENT_CATALOG = {
    // --- 🇮🇳 INDIAN BENCHMARK INDICES & MEGA-CAPS ---
    'NIFTY50': { name: 'NIFTY 50 Index', symbol: '^NSEI', market: 'IN', currency: '₹', basePrice: 24850.50, sector: 'Indian Benchmark', assetClass: 'INDEX' },
    'BANKNIFTY': { name: 'Bank Nifty Index', symbol: '^NSEBANK', market: 'IN', currency: '₹', basePrice: 51240.20, sector: 'Banking Benchmark', assetClass: 'INDEX' },
    'SENSEX': { name: 'BSE SENSEX', symbol: '^BSEN', market: 'IN', currency: '₹', basePrice: 81400.00, sector: 'Indian Benchmark', assetClass: 'INDEX' },
    'NIFTYIT': { name: 'Nifty IT Index', symbol: '^CNXIT', market: 'IN', currency: '₹', basePrice: 42150.00, sector: 'IT Sector Index', assetClass: 'INDEX' },
    'RELIANCE': { name: 'Reliance Industries', symbol: 'RELIANCE.NS', market: 'IN', currency: '₹', basePrice: 2740.80, sector: 'Energy & Telecom', assetClass: 'STOCK' },
    'TCS': { name: 'Tata Consultancy Services', symbol: 'TCS.NS', market: 'IN', currency: '₹', basePrice: 4120.50, sector: 'IT Services', assetClass: 'STOCK' },
    'HDFCBANK': { name: 'HDFC Bank Ltd', symbol: 'HDFCBANK.NS', market: 'IN', currency: '₹', basePrice: 1680.10, sector: 'Private Banking', assetClass: 'STOCK' },
    'ICICIBANK': { name: 'ICICI Bank Ltd', symbol: 'ICICIBANK.NS', market: 'IN', currency: '₹', basePrice: 1265.40, sector: 'Private Banking', assetClass: 'STOCK' },
    'INFY': { name: 'Infosys Ltd', symbol: 'INFY.NS', market: 'IN', currency: '₹', basePrice: 1860.25, sector: 'IT Services', assetClass: 'STOCK' },
    'SBIN': { name: 'State Bank of India', symbol: 'SBIN.NS', market: 'IN', currency: '₹', basePrice: 795.30, sector: 'Public Sector Bank', assetClass: 'STOCK' },
    'BHARTIARTL': { name: 'Bharti Airtel Ltd', symbol: 'BHARTIARTL.NS', market: 'IN', currency: '₹', basePrice: 1675.00, sector: 'Telecom & 5G', assetClass: 'STOCK' },
    'ITC': { name: 'ITC Ltd', symbol: 'ITC.NS', market: 'IN', currency: '₹', basePrice: 485.40, sector: 'FMCG Consumer', assetClass: 'STOCK' },
    'LT': { name: 'Larsen & Toubro', symbol: 'LT.NS', market: 'IN', currency: '₹', basePrice: 3540.00, sector: 'Infrastructure & Defense', assetClass: 'STOCK' },
    'TATAMOTORS': { name: 'Tata Motors Ltd', symbol: 'TATAMOTORS.NS', market: 'IN', currency: '₹', basePrice: 945.60, sector: 'Automobile & EV', assetClass: 'STOCK' },
    'BAJFINANCE': { name: 'Bajaj Finance Ltd', symbol: 'BAJFINANCE.NS', market: 'IN', currency: '₹', basePrice: 6850.00, sector: 'NBFC & Lending', assetClass: 'STOCK' },

    // --- 🇺🇸 US BIG TECH & INDICES ---
    'NASDAQ': { name: 'Nasdaq Composite', symbol: '^IXIC', market: 'US', currency: '$', basePrice: 18450.00, sector: 'US Tech Index', assetClass: 'INDEX' },
    'SP500': { name: 'S&P 500 Index', symbol: '^GSPC', market: 'US', currency: '$', basePrice: 5815.00, sector: 'US Large Cap', assetClass: 'INDEX' },
    'DOW': { name: 'Dow Jones Industrial', symbol: '^DJI', market: 'US', currency: '$', basePrice: 42800.00, sector: 'US Bluechips', assetClass: 'INDEX' },
    'NVDA': { name: 'NVIDIA Corporation', symbol: 'NVDA', market: 'US', currency: '$', basePrice: 142.50, sector: 'AI & GPU Compute', assetClass: 'STOCK' },
    'AAPL': { name: 'Apple Inc', symbol: 'AAPL', market: 'US', currency: '$', basePrice: 232.10, sector: 'Consumer Hardware', assetClass: 'STOCK' },
    'MSFT': { name: 'Microsoft Corporation', symbol: 'MSFT', market: 'US', currency: '$', basePrice: 428.50, sector: 'Cloud & AI Software', assetClass: 'STOCK' },
    'GOOGL': { name: 'Alphabet Inc (Google)', symbol: 'GOOGL', market: 'US', currency: '$', basePrice: 166.40, sector: 'Search & Cloud', assetClass: 'STOCK' },
    'AMZN': { name: 'Amazon.com Inc', symbol: 'AMZN', market: 'US', currency: '$', basePrice: 186.50, sector: 'E-Commerce & AWS', assetClass: 'STOCK' },
    'META': { name: 'Meta Platforms', symbol: 'META', market: 'US', currency: '$', basePrice: 575.20, sector: 'Social Media & AI', assetClass: 'STOCK' },
    'TSLA': { name: 'Tesla Inc', symbol: 'TSLA', market: 'US', currency: '$', basePrice: 218.40, sector: 'EV & Robotics', assetClass: 'STOCK' },

    // --- 🪙 CRYPTOCURRENCY (24/7 LIVE) ---
    'BTC': { name: 'Bitcoin (BTC)', symbol: 'BTC-USD', market: 'CRYPTO', currency: '$', basePrice: 68450.00, sector: 'Digital Gold (Crypto)', assetClass: 'CRYPTO' },
    'ETH': { name: 'Ethereum (ETH)', symbol: 'ETH-USD', market: 'CRYPTO', currency: '$', basePrice: 2645.50, sector: 'Smart Contracts (Crypto)', assetClass: 'CRYPTO' },
    'SOL': { name: 'Solana (SOL)', symbol: 'SOL-USD', market: 'CRYPTO', currency: '$', basePrice: 174.20, sector: 'Layer 1 Blockchain', assetClass: 'CRYPTO' },
    'BNB': { name: 'Binance Coin (BNB)', symbol: 'BNB-USD', market: 'CRYPTO', currency: '$', basePrice: 592.80, sector: 'Exchange Ecosystem', assetClass: 'CRYPTO' },
    'XRP': { name: 'Ripple (XRP)', symbol: 'XRP-USD', market: 'CRYPTO', currency: '$', basePrice: 0.5420, sector: 'Cross-Border Payments', assetClass: 'CRYPTO' },
    'DOGE': { name: 'Dogecoin (DOGE)', symbol: 'DOGE-USD', market: 'CRYPTO', currency: '$', basePrice: 0.1435, sector: 'Meme & Payments', assetClass: 'CRYPTO' },

    // --- 🥇 COMMODITIES ---
    'GOLD': { name: 'Gold Spot', symbol: 'GC=F', market: 'COMMODITY', currency: '$', basePrice: 2735.60, sector: 'Precious Metals', assetClass: 'COMMODITY' },
    'SILVER': { name: 'Silver Spot', symbol: 'SI=F', market: 'COMMODITY', currency: '$', basePrice: 33.80, sector: 'Precious & Industrial', assetClass: 'COMMODITY' },
    'CRUDEOIL': { name: 'Brent Crude Oil', symbol: 'BZ=F', market: 'COMMODITY', currency: '$', basePrice: 74.20, sector: 'Global Energy', assetClass: 'COMMODITY' },

    // --- 💱 FOREX MAJOR PAIRS ---
    'EURUSD': { name: 'EUR / USD Spot', symbol: 'EURUSD=X', market: 'FOREX', currency: '$', basePrice: 1.0820, sector: 'Major FX Pair', assetClass: 'FOREX' },
    'GBPUSD': { name: 'GBP / USD Spot', symbol: 'GBPUSD=X', market: 'FOREX', currency: '$', basePrice: 1.2980, sector: 'Major FX Pair', assetClass: 'FOREX' },
    'USDJPY': { name: 'USD / JPY Spot', symbol: 'JPY=X', market: 'FOREX', currency: '¥', basePrice: 152.40, sector: 'Major FX Pair', assetClass: 'FOREX' },

    // --- 🌐 GLOBAL MACRO BENCHMARKS ---
    'DXY': { name: 'US Dollar Index', symbol: 'DX-Y.NYB', market: 'US', currency: '$', basePrice: 104.25, sector: 'Global Currency Reserve', assetClass: 'MACRO' },
    'US10Y': { name: 'US 10Y Bond Yield', symbol: '^TNX', market: 'US', currency: '%', basePrice: 4.24, sector: 'Sovereign Debt', assetClass: 'MACRO' }
};

// Bounded In-Memory Cache (TTL: 45s for live/active, 30m for weekend closed markets)
const dataCache = new Map();
const CACHE_TTL_LIVE = 45 * 1000;
const CACHE_TTL_CLOSED = 30 * 60 * 1000;

function roundPrice(val, basePrice = 100) {
    if (isNaN(val)) return 0;
    const num = Number(val);
    const ref = basePrice !== null ? Math.abs(basePrice) : Math.abs(num);
    if (ref < 0.0001) return Math.round(num * 100000000) / 100000000;
    if (ref < 0.01) return Math.round(num * 1000000) / 1000000;
    if (ref < 1) return Math.round(num * 10000) / 10000;
    if (ref < 10) return Math.round(num * 1000) / 1000;
    return Math.round(num * 100) / 100;
}

/**
 * Fetch Candles from legitimate providers (Binance Public API for Crypto, Yahoo Finance for Equities/FX)
 */
async function fetchOHLCV(symbol, timeframe = '1D') {
    const meta = INSTRUMENT_CATALOG[symbol] || {
        name: symbol,
        symbol: symbol,
        market: 'IN',
        currency: '₹',
        basePrice: 1000,
        sector: 'Equities',
        assetClass: 'STOCK'
    };

    const cacheKey = `${symbol}_${timeframe}`;
    const cached = dataCache.get(cacheKey);
    const now = Date.now();

    const isWeekend = [0, 6].includes(new Date().getDay());
    const effectiveTtl = (meta.market === 'IN' || meta.market === 'US') && isWeekend ? CACHE_TTL_CLOSED : CACHE_TTL_LIVE;

    if (cached && (now - cached.timestamp < effectiveTtl)) {
        return cached.data;
    }

    // 1. If Crypto -> Fetch from Binance Public API (Reliable 24/7)
    if (meta.market === 'CRYPTO') {
        try {
            const pair = `${symbol}USDT`;
            const intervalMap = { '1M': '1m', '5M': '5m', '15M': '15m', '1H': '1h', '4H': '4h', '1D': '1d', '1W': '1w' };
            const binanceInterval = intervalMap[timeframe.toUpperCase()] || '1d';
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${binanceInterval}&limit=90`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const raw = await res.json();
                if (Array.isArray(raw) && raw.length > 5) {
                    const candles = raw.map(k => ({
                        date: new Date(k[0]).toISOString().split('T')[0],
                        time: k[0],
                        open: roundPrice(parseFloat(k[1]), meta.basePrice),
                        high: roundPrice(parseFloat(k[2]), meta.basePrice),
                        low: roundPrice(parseFloat(k[3]), meta.basePrice),
                        close: roundPrice(parseFloat(k[4]), meta.basePrice),
                        volume: parseFloat(k[5])
                    }));

                    const payload = {
                        symbol,
                        meta,
                        candles,
                        timeframe,
                        isLive: true,
                        source: 'Binance Live Public Market Feed',
                        dataStatus: 'VERIFIED_LIVE',
                        timestamp: new Date().toISOString()
                    };

                    dataCache.set(cacheKey, { timestamp: now, data: payload });
                    return payload;
                }
            }
        } catch (err) {
            // Silently fall through to Yahoo fallback
        }
    }

    // 2. Fetch from Yahoo Finance (Stocks, Indices, Commodities, Forex, Crypto fallback)
    try {
        const yahooSymbol = meta.symbol || symbol;
        const rangeMap = { '1M': '1d', '5M': '5d', '15M': '5d', '1H': '1mo', '1D': '3mo', '1W': '1y', '1MO': '2y' };
        const intervalMap = { '1M': '1m', '5M': '5m', '15M': '15m', '1H': '1h', '1D': '1d', '1W': '1wk', '1MO': '1mo' };

        const range = rangeMap[timeframe.toUpperCase()] || '3mo';
        const interval = intervalMap[timeframe.toUpperCase()] || '1d';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=${range}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const json = await res.json();
            const result = json?.chart?.result?.[0];
            if (result && result.timestamp && result.indicators?.quote?.[0]) {
                const ts = result.timestamp;
                const q = result.indicators.quote[0];
                const candles = [];

                for (let i = 0; i < ts.length; i++) {
                    if (q.close[i] !== null && q.open[i] !== null && q.high[i] !== null && q.low[i] !== null) {
                        const d = new Date(ts[i] * 1000);
                        candles.push({
                            date: d.toISOString().split('T')[0],
                            time: ts[i] * 1000,
                            open: roundPrice(q.open[i], meta.basePrice),
                            high: roundPrice(q.high[i], meta.basePrice),
                            low: roundPrice(q.low[i], meta.basePrice),
                            close: roundPrice(q.close[i], meta.basePrice),
                            volume: q.volume[i] || 1000000
                        });
                    }
                }

                if (candles.length > 5) {
                    const isClosedLTP = (meta.market === 'IN' || meta.market === 'US') && isWeekend;
                    const payload = {
                        symbol,
                        meta,
                        candles,
                        timeframe,
                        isLive: !isClosedLTP,
                        source: 'Yahoo Finance Real-Time Market Feed',
                        dataStatus: isClosedLTP ? 'OFFICIAL_CLOSE_LTP' : 'VERIFIED_LIVE',
                        timestamp: new Date().toISOString()
                    };

                    dataCache.set(cacheKey, { timestamp: now, data: payload });
                    return payload;
                }
            }
        }
    } catch (err) {
        // Fallback to cache or deterministic calibrated simulation
    }

    // 3. Fallback: Return previously cached data if available
    if (cached) {
        return {
            ...cached.data,
            dataStatus: 'CACHED_HISTORICAL',
            isLive: false,
            source: `${cached.data.source} (Cached Fallback)`
        };
    }

    // 4. Deterministic Calibrated Seed (clearly labeled as SIMULATED FALLBACK)
    const fallbackCandles = generateDeterministicCandles(symbol, meta.basePrice, 90);
    return {
        symbol,
        meta,
        candles: fallbackCandles,
        timeframe,
        isLive: false,
        source: 'Calibrated Algorithmic Historical Seed (Offline Safe Mode)',
        dataStatus: 'SIMULATED_OFFLINE',
        timestamp: new Date().toISOString()
    };
}

/**
 * Deterministic Candle Generator with realistic geometric Brownian motion
 */
function generateDeterministicCandles(symbol, basePrice, count = 90) {
    const candles = [];
    let current = basePrice || 1000;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Seeded pseudo-random using symbol characters
    let seed = 0;
    for (let i = 0; i < symbol.length; i++) seed = (seed << 5) - seed + symbol.charCodeAt(i);

    function pseudoRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }

    for (let i = count; i >= 0; i--) {
        const time = now - (i * oneDay);
        const d = new Date(time);
        
        // Skip weekend dates for realistic calendar
        if (d.getDay() === 0 || d.getDay() === 6) continue;

        const volatility = current * 0.015;
        const change = (pseudoRandom() - 0.49) * volatility;
        const open = roundPrice(current, basePrice);
        const close = roundPrice(current + change, basePrice);
        const high = roundPrice(Math.max(open, close) + (pseudoRandom() * volatility * 0.6), basePrice);
        const low = roundPrice(Math.min(open, close) - (pseudoRandom() * volatility * 0.6), basePrice);
        const volume = Math.floor(100000 + pseudoRandom() * 900000);

        candles.push({
            date: d.toISOString().split('T')[0],
            time,
            open,
            high,
            low,
            close,
            volume
        });

        current = close;
    }

    return candles;
}

module.exports = {
    INSTRUMENT_CATALOG,
    fetchOHLCV,
    roundPrice
};
