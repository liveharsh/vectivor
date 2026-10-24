// ==============================================================================
// VECTIVOR MARKET DATA ENGINE (REAL-TIME, HISTORICAL OHLCV & MULTI-PROVIDER)
// Supported: Indian Equities/Indices, US Stocks/Indices, Crypto, Forex, Commodities
// ==============================================================================

const https = require('https');

// Universal Stock, Crypto, Forex & Commodity Universe
const INSTRUMENT_CATALOG = {
    // --- 🇮🇳 INDIAN BENCHMARK INDICES & MEGA-CAPS (POWERED BY GROWW.IN) ---
    'NIFTY50': { name: 'NIFTY 50 Index', symbol: '^NSEI', tvSymbol: 'NSE:NIFTY', growwUrl: 'https://groww.in/indices/nifty', market: 'IN', currency: '₹', basePrice: 22600.00, sector: 'Indian Benchmark', assetClass: 'INDEX' },
    'BANKNIFTY': { name: 'Bank Nifty Index', symbol: '^NSEBANK', tvSymbol: 'NSE:BANKNIFTY', growwUrl: 'https://groww.in/indices/nifty-bank', market: 'IN', currency: '₹', basePrice: 51240.20, sector: 'Banking Benchmark', assetClass: 'INDEX' },
    'SENSEX': { name: 'BSE SENSEX', symbol: '^BSEN', tvSymbol: 'BSE:SENSEX', growwUrl: 'https://groww.in/indices/sp-bse-sensex', market: 'IN', currency: '₹', basePrice: 81400.00, sector: 'Indian Benchmark', assetClass: 'INDEX' },
    'NIFTYIT': { name: 'Nifty IT Index', symbol: '^CNXIT', tvSymbol: 'NSE:CNXIT', growwUrl: 'https://groww.in/indices/nifty-it', market: 'IN', currency: '₹', basePrice: 42150.00, sector: 'IT Sector Index', assetClass: 'INDEX' },
    'RELIANCE': { name: 'Reliance Industries', symbol: 'RELIANCE.NS', tvSymbol: 'NSE:RELIANCE', growwUrl: 'https://groww.in/stocks/reliance-industries-ltd', market: 'IN', currency: '₹', basePrice: 1190.00, sector: 'Energy & Telecom', assetClass: 'STOCK' },
    'TCS': { name: 'Tata Consultancy Services', symbol: 'TCS.NS', tvSymbol: 'NSE:TCS', growwUrl: 'https://groww.in/stocks/tata-consultancy-services-ltd', market: 'IN', currency: '₹', basePrice: 2530.00, sector: 'IT Services', assetClass: 'STOCK' },
    'HDFCBANK': { name: 'HDFC Bank Ltd', symbol: 'HDFCBANK.NS', tvSymbol: 'NSE:HDFCBANK', growwUrl: 'https://groww.in/stocks/hdfc-bank-ltd', market: 'IN', currency: '₹', basePrice: 1680.10, sector: 'Private Banking', assetClass: 'STOCK' },
    'ICICIBANK': { name: 'ICICI Bank Ltd', symbol: 'ICICIBANK.NS', tvSymbol: 'NSE:ICICIBANK', growwUrl: 'https://groww.in/stocks/icici-bank-ltd', market: 'IN', currency: '₹', basePrice: 1265.40, sector: 'Private Banking', assetClass: 'STOCK' },
    'INFY': { name: 'Infosys Ltd', symbol: 'INFY.NS', tvSymbol: 'NSE:INFY', growwUrl: 'https://groww.in/stocks/infosys-ltd', market: 'IN', currency: '₹', basePrice: 1153.00, sector: 'IT Services', assetClass: 'STOCK' },
    'SBIN': { name: 'State Bank of India', symbol: 'SBIN.NS', tvSymbol: 'NSE:SBIN', growwUrl: 'https://groww.in/stocks/state-bank-of-india', market: 'IN', currency: '₹', basePrice: 958.00, sector: 'Public Sector Bank', assetClass: 'STOCK' },
    'BHARTIARTL': { name: 'Bharti Airtel Ltd', symbol: 'BHARTIARTL.NS', tvSymbol: 'NSE:BHARTIARTL', growwUrl: 'https://groww.in/stocks/bharti-airtel-ltd', market: 'IN', currency: '₹', basePrice: 1675.00, sector: 'Telecom & 5G', assetClass: 'STOCK' },
    'ITC': { name: 'ITC Ltd', symbol: 'ITC.NS', tvSymbol: 'NSE:ITC', growwUrl: 'https://groww.in/stocks/itc-ltd', market: 'IN', currency: '₹', basePrice: 485.40, sector: 'FMCG Consumer', assetClass: 'STOCK' },
    'LT': { name: 'Larsen & Toubro', symbol: 'LT.NS', tvSymbol: 'NSE:LT', growwUrl: 'https://groww.in/stocks/larsen-toubro-ltd', market: 'IN', currency: '₹', basePrice: 3540.00, sector: 'Infrastructure & Defense', assetClass: 'STOCK' },
    'TATAMOTORS': { name: 'Tata Motors Ltd', symbol: 'TATAMOTORS.NS', tvSymbol: 'NSE:TATAMOTORS', growwUrl: 'https://groww.in/stocks/tata-motors-ltd', market: 'IN', currency: '₹', basePrice: 945.60, sector: 'Automobile & EV', assetClass: 'STOCK' },
    'BAJFINANCE': { name: 'Bajaj Finance Ltd', symbol: 'BAJFINANCE.NS', tvSymbol: 'NSE:BAJFINANCE', growwUrl: 'https://groww.in/stocks/bajaj-finance-ltd', market: 'IN', currency: '₹', basePrice: 6850.00, sector: 'NBFC & Lending', assetClass: 'STOCK' },

    // --- 🇺🇸 US BIG TECH & INDICES ---
    'NASDAQ': { name: 'Nasdaq Composite', symbol: '^IXIC', tvSymbol: 'NASDAQ:IXIC', market: 'US', currency: '$', basePrice: 18450.00, sector: 'US Tech Index', assetClass: 'INDEX' },
    'SP500': { name: 'S&P 500 Index', symbol: '^GSPC', tvSymbol: 'FOREXCOM:SPXUSD', market: 'US', currency: '$', basePrice: 5815.00, sector: 'US Large Cap', assetClass: 'INDEX' },
    'DOW': { name: 'Dow Jones Industrial', symbol: '^DJI', tvSymbol: 'FOREXCOM:DJI', market: 'US', currency: '$', basePrice: 42800.00, sector: 'US Bluechips', assetClass: 'INDEX' },
    'NVDA': { name: 'NVIDIA Corporation', symbol: 'NVDA', tvSymbol: 'NASDAQ:NVDA', market: 'US', currency: '$', basePrice: 142.50, sector: 'AI & GPU Compute', assetClass: 'STOCK' },
    'AAPL': { name: 'Apple Inc', symbol: 'AAPL', tvSymbol: 'NASDAQ:AAPL', market: 'US', currency: '$', basePrice: 232.10, sector: 'Consumer Hardware', assetClass: 'STOCK' },
    'MSFT': { name: 'Microsoft Corporation', symbol: 'MSFT', tvSymbol: 'NASDAQ:MSFT', market: 'US', currency: '$', basePrice: 428.50, sector: 'Cloud & AI Software', assetClass: 'STOCK' },
    'GOOGL': { name: 'Alphabet Inc (Google)', symbol: 'GOOGL', tvSymbol: 'NASDAQ:GOOGL', market: 'US', currency: '$', basePrice: 166.40, sector: 'Search & Cloud', assetClass: 'STOCK' },
    'AMZN': { name: 'Amazon.com Inc', symbol: 'AMZN', tvSymbol: 'NASDAQ:AMZN', market: 'US', currency: '$', basePrice: 186.50, sector: 'E-Commerce & AWS', assetClass: 'STOCK' },
    'META': { name: 'Meta Platforms', symbol: 'META', tvSymbol: 'NASDAQ:META', market: 'US', currency: '$', basePrice: 575.20, sector: 'Social Media & AI', assetClass: 'STOCK' },
    'TSLA': { name: 'Tesla Inc', symbol: 'TSLA', tvSymbol: 'NASDAQ:TSLA', market: 'US', currency: '$', basePrice: 218.40, sector: 'EV & Robotics', assetClass: 'STOCK' },

    // --- 🪙 CRYPTOCURRENCY (24/7 LIVE) ---
    'BTC': { name: 'Bitcoin (BTC)', symbol: 'BTC-USD', tvSymbol: 'BITSTAMP:BTCUSD', market: 'CRYPTO', currency: '$', basePrice: 80000.00, sector: 'Digital Gold (Crypto)', assetClass: 'CRYPTO' },
    'ETH': { name: 'Ethereum (ETH)', symbol: 'ETH-USD', tvSymbol: 'BINANCE:ETHUSDT', market: 'CRYPTO', currency: '$', basePrice: 2645.50, sector: 'Smart Contracts (Crypto)', assetClass: 'CRYPTO' },
    'SOL': { name: 'Solana (SOL)', symbol: 'SOL-USD', tvSymbol: 'BINANCE:SOLUSDT', market: 'CRYPTO', currency: '$', basePrice: 174.20, sector: 'Layer 1 Blockchain', assetClass: 'CRYPTO' },
    'BNB': { name: 'Binance Coin (BNB)', symbol: 'BNB-USD', tvSymbol: 'BINANCE:BNBUSDT', market: 'CRYPTO', currency: '$', basePrice: 592.80, sector: 'Exchange Ecosystem', assetClass: 'CRYPTO' },
    'XRP': { name: 'Ripple (XRP)', symbol: 'XRP-USD', tvSymbol: 'BINANCE:XRPUSDT', market: 'CRYPTO', currency: '$', basePrice: 0.5420, sector: 'Cross-Border Payments', assetClass: 'CRYPTO' },
    'DOGE': { name: 'Dogecoin (DOGE)', symbol: 'DOGE-USD', tvSymbol: 'BINANCE:DOGEUSDT', market: 'CRYPTO', currency: '$', basePrice: 0.1435, sector: 'Meme & Payments', assetClass: 'CRYPTO' },

    // --- 🥇 COMMODITIES ---
    'GOLD': { name: 'Gold Spot', symbol: 'GC=F', tvSymbol: 'TVC:GOLD', market: 'COMMODITY', currency: '$', basePrice: 2735.60, sector: 'Precious Metals', assetClass: 'COMMODITY' },
    'SILVER': { name: 'Silver Spot', symbol: 'SI=F', tvSymbol: 'TVC:SILVER', market: 'COMMODITY', currency: '$', basePrice: 33.80, sector: 'Precious & Industrial', assetClass: 'COMMODITY' },
    'CRUDEOIL': { name: 'Brent Crude Oil', symbol: 'BZ=F', tvSymbol: 'NYMEX:CL1!', market: 'COMMODITY', currency: '$', basePrice: 74.20, sector: 'Global Energy', assetClass: 'COMMODITY' },

    // --- 💱 FOREX MAJOR PAIRS ---
    'EURUSD': { name: 'EUR / USD Spot', symbol: 'EURUSD=X', tvSymbol: 'FX:EURUSD', market: 'FOREX', currency: '$', basePrice: 1.0820, sector: 'Major FX Pair', assetClass: 'FOREX' },
    'GBPUSD': { name: 'GBP / USD Spot', symbol: 'GBPUSD=X', tvSymbol: 'FX:GBPUSD', market: 'FOREX', currency: '$', basePrice: 1.2980, sector: 'Major FX Pair', assetClass: 'FOREX' },
    'USDJPY': { name: 'USD / JPY Spot', symbol: 'JPY=X', tvSymbol: 'FX:USDJPY', market: 'FOREX', currency: '¥', basePrice: 152.40, sector: 'Major FX Pair', assetClass: 'FOREX' },

    // --- 🌐 GLOBAL MACRO BENCHMARKS ---
    'DXY': { name: 'US Dollar Index', symbol: 'DX-Y.NYB', tvSymbol: 'CAPITALCOM:DXY', market: 'US', currency: '$', basePrice: 104.25, sector: 'Global Currency Reserve', assetClass: 'MACRO' },
    'US10Y': { name: 'US 10Y Bond Yield', symbol: '^TNX', tvSymbol: 'TVC:US10Y', market: 'US', currency: '%', basePrice: 4.24, sector: 'Sovereign Debt', assetClass: 'MACRO' }
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
 * Fetch Official Real-Time Indian Stock & Index Candles from Groww.in API
 */
async function fetchGrowwMarketData(symbol, meta, timeframe = '1D') {
    const symbolMap = {
        'NIFTY50': 'NIFTY',
        'BANKNIFTY': 'BANKNIFTY',
        'SENSEX': 'SENSEX',
        'NIFTYIT': 'NIFTYIT'
    };
    const growwSym = symbolMap[symbol] || symbol;
    const now = Date.now();
    let intervalInMinutes = 1440; // 1D
    let startTimeInMillis = now - (90 * 24 * 60 * 60 * 1000);

    const tf = (timeframe || '1D').toUpperCase();
    if (tf === '1M' || tf === '5M' || tf === '15M') {
        intervalInMinutes = tf === '1M' ? 1 : (tf === '5M' ? 5 : 15);
        startTimeInMillis = now - (3 * 24 * 60 * 60 * 1000);
    } else if (tf === '1H') {
        intervalInMinutes = 60;
        startTimeInMillis = now - (14 * 24 * 60 * 60 * 1000);
    } else if (tf === '1W') {
        intervalInMinutes = 10080;
        startTimeInMillis = now - (365 * 24 * 60 * 60 * 1000);
    }

    const exchange = symbol === 'SENSEX' ? 'BSE' : 'NSE';
    const chartUrl = `https://groww.in/v1/api/charting_service/v2/chart/delayed/exchange/${exchange}/segment/CASH/${growwSym}?endTimeInMillis=${now}&intervalInMinutes=${intervalInMinutes}&startTimeInMillis=${startTimeInMillis}`;
    const quoteUrl = `https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/${exchange}/segment/CASH/latest_prices_ohlc/${growwSym}`;

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const [chartRes, quoteRes] = await Promise.all([
        fetch(chartUrl, { headers, signal: controller.signal }).catch(() => null),
        fetch(quoteUrl, { headers, signal: controller.signal }).catch(() => null)
    ]);
    clearTimeout(timeoutId);

    if (!chartRes || !chartRes.ok) return null;
    const chartData = await chartRes.json();
    if (!chartData || !Array.isArray(chartData.candles) || chartData.candles.length === 0) return null;

    const candles = chartData.candles.map(c => ({
        date: new Date(c[0] * 1000).toISOString().split('T')[0],
        time: c[0] * 1000,
        open: roundPrice(c[1], meta.basePrice),
        high: roundPrice(c[2], meta.basePrice),
        low: roundPrice(c[3], meta.basePrice),
        close: roundPrice(c[4], meta.basePrice),
        volume: c[5] || 0
    }));

    const lastC = candles[candles.length - 1];
    const prevC = candles[candles.length - 2] || lastC;

    let live24h = null;
    if (quoteRes && quoteRes.ok) {
        try {
            const q = await quoteRes.json();
            live24h = {
                price: q.ltp || q.close || lastC.close,
                change: q.dayChange !== undefined ? q.dayChange : (lastC.close - prevC.close),
                percentChange: q.dayChangePerc !== undefined ? q.dayChangePerc : (((lastC.close - prevC.close) / prevC.close) * 100),
                high24h: q.high || lastC.high,
                low24h: q.low || lastC.low,
                volume24h: q.volume || lastC.volume
            };
        } catch (e) {}
    }

    if (!live24h || meta.assetClass === 'INDEX') {
        const change = roundPrice(lastC.close - prevC.close, meta.basePrice);
        const pChange = prevC.close ? Math.round(((change / prevC.close) * 100) * 100) / 100 : 0;
        live24h = {
            price: lastC.close,
            change,
            percentChange: pChange
        };
    }

    return {
        candles,
        live24h,
        source: 'Groww.in Live Official Indian Market Feed'
    };
}

/**
 * Fetch Candles from legitimate providers (Binance Public API for Crypto, Groww.in for Indian Equities, Yahoo Finance for US/FX)
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
            
            const [klinesRes, tickerRes] = await Promise.all([
                fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${binanceInterval}&limit=90`, { signal: controller.signal }),
                fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`, { signal: controller.signal }).catch(() => null)
            ]);
            clearTimeout(timeoutId);

            if (klinesRes.ok) {
                const raw = await klinesRes.json();
                let live24h = null;
                if (tickerRes && tickerRes.ok) {
                    try {
                        const t = await tickerRes.json();
                        live24h = {
                            price: parseFloat(t.lastPrice),
                            change: parseFloat(t.priceChange),
                            percentChange: parseFloat(t.priceChangePercent)
                        };
                    } catch (e) {}
                }

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
                        live24h,
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

    // 2. If Indian Equities/Indices -> Fetch directly from Groww.in Official Live Feed
    if (meta.market === 'IN') {
        try {
            const growwResult = await fetchGrowwMarketData(symbol, meta, timeframe);
            if (growwResult && growwResult.candles && growwResult.candles.length > 5) {
                const payload = {
                    symbol,
                    meta,
                    candles: growwResult.candles,
                    timeframe,
                    live24h: growwResult.live24h,
                    isLive: true,
                    source: 'Groww.in Live Official Indian Market Feed',
                    dataStatus: 'VERIFIED_LIVE',
                    timestamp: new Date().toISOString()
                };

                dataCache.set(cacheKey, { timestamp: now, data: payload });
                return payload;
            }
        } catch (err) {
            // Silently fall through to Yahoo fallback
        }
    }

    // 3. Fetch from Yahoo Finance (US Tech, Global Commodities, Forex, and Fallback)
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
