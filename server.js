const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Massive Stock, Crypto & Commodity Universe (India + US + Crypto)
const STOCK_CATALOG = {
    // ==========================================
    // 🇮🇳 INDIA: BENCHMARK INDICES & MEGA-CAPS
    // ==========================================
    'NIFTY50': { name: 'NIFTY 50 Index', symbol: '^NSEI', market: 'IN', currency: '₹', basePrice: 24850.50, sector: 'Indian Benchmark' },
    'BANKNIFTY': { name: 'Bank Nifty Index', symbol: '^NSEBANK', market: 'IN', currency: '₹', basePrice: 51240.20, sector: 'Banking Benchmark' },
    'SENSEX': { name: 'BSE SENSEX', symbol: '^BSEN', market: 'IN', currency: '₹', basePrice: 81400.00, sector: 'Indian Benchmark' },
    'NIFTYIT': { name: 'Nifty IT Index', symbol: '^CNXIT', market: 'IN', currency: '₹', basePrice: 42150.00, sector: 'IT Sector Index' },
    'RELIANCE': { name: 'Reliance Industries', symbol: 'RELIANCE.NS', market: 'IN', currency: '₹', basePrice: 2740.80, sector: 'Energy & Telecom' },
    'TCS': { name: 'Tata Consultancy Services', symbol: 'TCS.NS', market: 'IN', currency: '₹', basePrice: 4120.50, sector: 'IT Services' },
    'HDFCBANK': { name: 'HDFC Bank Ltd', symbol: 'HDFCBANK.NS', market: 'IN', currency: '₹', basePrice: 1680.10, sector: 'Private Banking' },
    'ICICIBANK': { name: 'ICICI Bank Ltd', symbol: 'ICICIBANK.NS', market: 'IN', currency: '₹', basePrice: 1265.40, sector: 'Private Banking' },
    'INFY': { name: 'Infosys Ltd', symbol: 'INFY.NS', market: 'IN', currency: '₹', basePrice: 1860.25, sector: 'IT Services' },
    'SBIN': { name: 'State Bank of India', symbol: 'SBIN.NS', market: 'IN', currency: '₹', basePrice: 795.30, sector: 'Public Sector Bank' },
    'BHARTIARTL': { name: 'Bharti Airtel Ltd', symbol: 'BHARTIARTL.NS', market: 'IN', currency: '₹', basePrice: 1675.00, sector: 'Telecom & 5G' },
    'ITC': { name: 'ITC Ltd', symbol: 'ITC.NS', market: 'IN', currency: '₹', basePrice: 485.40, sector: 'FMCG & Cigarettes' },
    'LT': { name: 'Larsen & Toubro', symbol: 'LT.NS', market: 'IN', currency: '₹', basePrice: 3540.00, sector: 'Infrastructure & Defense' },
    'HINDUNILVR': { name: 'Hindustan Unilever', symbol: 'HINDUNILVR.NS', market: 'IN', currency: '₹', basePrice: 2650.00, sector: 'FMCG Consumer' },
    'TATAMOTORS': { name: 'Tata Motors Ltd', symbol: 'TATAMOTORS.NS', market: 'IN', currency: '₹', basePrice: 945.60, sector: 'Automobile & EV' },
    'BAJFINANCE': { name: 'Bajaj Finance Ltd', symbol: 'BAJFINANCE.NS', market: 'IN', currency: '₹', basePrice: 6850.00, sector: 'NBFC & Lending' },
    'MARUTI': { name: 'Maruti Suzuki India', symbol: 'MARUTI.NS', market: 'IN', currency: '₹', basePrice: 12150.00, sector: 'Automobile' },
    'KOTAKBANK': { name: 'Kotak Mahindra Bank', symbol: 'KOTAKBANK.NS', market: 'IN', currency: '₹', basePrice: 1780.00, sector: 'Private Banking' },
    'AXISBANK': { name: 'Axis Bank Ltd', symbol: 'AXISBANK.NS', market: 'IN', currency: '₹', basePrice: 1180.50, sector: 'Private Banking' },
    'SUNPHARMA': { name: 'Sun Pharmaceutical', symbol: 'SUNPHARMA.NS', market: 'IN', currency: '₹', basePrice: 1880.00, sector: 'Pharma & Healthcare' },
    'TITAN': { name: 'Titan Company Ltd', symbol: 'TITAN.NS', market: 'IN', currency: '₹', basePrice: 3380.00, sector: 'Jewellery & Watches' },
    'ADANIENT': { name: 'Adani Enterprises', symbol: 'ADANIENT.NS', market: 'IN', currency: '₹', basePrice: 2820.00, sector: 'Infra & Energy' },
    'ADANIPORTS': { name: 'Adani Ports & SEZ', symbol: 'ADANIPORTS.NS', market: 'IN', currency: '₹', basePrice: 1360.00, sector: 'Ports & Logistics' },
    'TATASTEEL': { name: 'Tata Steel Ltd', symbol: 'TATASTEEL.NS', market: 'IN', currency: '₹', basePrice: 152.40, sector: 'Metals & Mining' },
    'NTPC': { name: 'NTPC Ltd', symbol: 'NTPC.NS', market: 'IN', currency: '₹', basePrice: 412.00, sector: 'Power Utility' },
    'POWERGRID': { name: 'Power Grid Corporation', symbol: 'POWERGRID.NS', market: 'IN', currency: '₹', basePrice: 325.50, sector: 'Power Transmission' },
    'ASIANPAINT': { name: 'Asian Paints Ltd', symbol: 'ASIANPAINT.NS', market: 'IN', currency: '₹', basePrice: 2980.00, sector: 'Paints & Decor' },
    'MM': { name: 'Mahindra & Mahindra', symbol: 'M&M.NS', market: 'IN', currency: '₹', basePrice: 2790.00, sector: 'Auto & Tractors' },
    'WIPRO': { name: 'Wipro Ltd', symbol: 'WIPRO.NS', market: 'IN', currency: '₹', basePrice: 545.00, sector: 'IT Services' },
    'HCLTECH': { name: 'HCL Technologies', symbol: 'HCLTECH.NS', market: 'IN', currency: '₹', basePrice: 1840.00, sector: 'IT Services' },
    'COALINDIA': { name: 'Coal India Ltd', symbol: 'COALINDIA.NS', market: 'IN', currency: '₹', basePrice: 460.00, sector: 'Mining & Coal' },
    'ONGC': { name: 'Oil & Natural Gas Corp', symbol: 'ONGC.NS', market: 'IN', currency: '₹', basePrice: 278.00, sector: 'Oil Exploration' },
    'BAJAJAUTO': { name: 'Bajaj Auto Ltd', symbol: 'BAJAJ-AUTO.NS', market: 'IN', currency: '₹', basePrice: 10450.00, sector: 'Two-Wheelers & EV' },
    'NESTLEIND': { name: 'Nestle India', symbol: 'NESTLEIND.NS', market: 'IN', currency: '₹', basePrice: 2280.00, sector: 'Food & Beverages' },
    'CIPLA': { name: 'Cipla Ltd', symbol: 'CIPLA.NS', market: 'IN', currency: '₹', basePrice: 1540.00, sector: 'Pharmaceuticals' },
    'DRREDDY': { name: 'Dr. Reddys Laboratories', symbol: 'DRREDDY.NS', market: 'IN', currency: '₹', basePrice: 6580.00, sector: 'Pharmaceuticals' },
    'TATAPOWER': { name: 'Tata Power Ltd', symbol: 'TATAPOWER.NS', market: 'IN', currency: '₹', basePrice: 435.00, sector: 'Renewable Power' },
    'ZOMATO': { name: 'Zomato Ltd', symbol: 'ZOMATO.NS', market: 'IN', currency: '₹', basePrice: 262.50, sector: 'Quick Commerce' },
    'JIOFIN': { name: 'Jio Financial Services', symbol: 'JIOFIN.NS', market: 'IN', currency: '₹', basePrice: 320.00, sector: 'Fintech & Lending' },
    'HAL': { name: 'Hindustan Aeronautics Ltd', symbol: 'HAL.NS', market: 'IN', currency: '₹', basePrice: 4450.00, sector: 'Aerospace & Defence' },
    'BEL': { name: 'Bharat Electronics Ltd', symbol: 'BEL.NS', market: 'IN', currency: '₹', basePrice: 285.00, sector: 'Defence Electronics' },

    // ==========================================
    // 🇺🇸 US: BIG TECH, SEMICONDUCTORS & S&P 500
    // ==========================================
    'NASDAQ': { name: 'Nasdaq Composite', symbol: '^IXIC', market: 'US', currency: '$', basePrice: 18450.00, sector: 'US Tech Index' },
    'SP500': { name: 'S&P 500 Index', symbol: '^GSPC', market: 'US', currency: '$', basePrice: 5815.00, sector: 'US Large Cap' },
    'DOW': { name: 'Dow Jones Industrial', symbol: '^DJI', market: 'US', currency: '$', basePrice: 42800.00, sector: 'US Bluechips' },
    'NVDA': { name: 'NVIDIA Corporation', symbol: 'NVDA', market: 'US', currency: '$', basePrice: 142.50, sector: 'AI & GPU Compute' },
    'AAPL': { name: 'Apple Inc', symbol: 'AAPL', market: 'US', currency: '$', basePrice: 232.10, sector: 'Consumer Hardware' },
    'MSFT': { name: 'Microsoft Corporation', symbol: 'MSFT', market: 'US', currency: '$', basePrice: 428.50, sector: 'Cloud & AI Software' },
    'GOOGL': { name: 'Alphabet Inc (Google)', symbol: 'GOOGL', market: 'US', currency: '$', basePrice: 166.40, sector: 'Search & Cloud' },
    'AMZN': { name: 'Amazon.com Inc', symbol: 'AMZN', market: 'US', currency: '$', basePrice: 186.50, sector: 'E-Commerce & AWS' },
    'META': { name: 'Meta Platforms (Facebook)', symbol: 'META', market: 'US', currency: '$', basePrice: 575.20, sector: 'Social Media & AI' },
    'TSLA': { name: 'Tesla Inc', symbol: 'TSLA', market: 'US', currency: '$', basePrice: 218.40, sector: 'EV & Robotics' },
    'AMD': { name: 'Advanced Micro Devices', symbol: 'AMD', market: 'US', currency: '$', basePrice: 156.80, sector: 'Semiconductors' },
    'TSM': { name: 'Taiwan Semiconductor', symbol: 'TSM', market: 'US', currency: '$', basePrice: 198.00, sector: 'Foundry Giant' },
    'AVGO': { name: 'Broadcom Inc', symbol: 'AVGO', market: 'US', currency: '$', basePrice: 178.50, sector: 'Custom AI Chips' },
    'QCOM': { name: 'Qualcomm Inc', symbol: 'QCOM', market: 'US', currency: '$', basePrice: 172.00, sector: 'Wireless & Chips' },
    'INTC': { name: 'Intel Corporation', symbol: 'INTC', market: 'US', currency: '$', basePrice: 22.80, sector: 'Processors' },
    'PLTR': { name: 'Palantir Technologies', symbol: 'PLTR', market: 'US', currency: '$', basePrice: 43.50, sector: 'Enterprise AI & Defense' },
    'NFLX': { name: 'Netflix Inc', symbol: 'NFLX', market: 'US', currency: '$', basePrice: 755.00, sector: 'Streaming Media' },
    'ORCL': { name: 'Oracle Corporation', symbol: 'ORCL', market: 'US', currency: '$', basePrice: 172.50, sector: 'Database & Cloud' },
    'CRM': { name: 'Salesforce Inc', symbol: 'CRM', market: 'US', currency: '$', basePrice: 288.00, sector: 'Enterprise Cloud' },
    'ADBE': { name: 'Adobe Inc', symbol: 'ADBE', market: 'US', currency: '$', basePrice: 505.00, sector: 'Creative Software' },
    'JPM': { name: 'JPMorgan Chase & Co', symbol: 'JPM', market: 'US', currency: '$', basePrice: 222.00, sector: 'Investment Banking' },
    'BAC': { name: 'Bank of America', symbol: 'BAC', market: 'US', currency: '$', basePrice: 42.10, sector: 'Commercial Banking' },
    'V': { name: 'Visa Inc', symbol: 'V', market: 'US', currency: '$', basePrice: 282.00, sector: 'Payments Network' },
    'MA': { name: 'Mastercard Inc', symbol: 'MA', market: 'US', currency: '$', basePrice: 495.00, sector: 'Financial Network' },
    'BRKB': { name: 'Berkshire Hathaway', symbol: 'BRK.B', market: 'US', currency: '$', basePrice: 452.00, sector: 'Diversified Conglomerate' },
    'LLY': { name: 'Eli Lilly and Company', symbol: 'LLY', market: 'US', currency: '$', basePrice: 905.00, sector: 'Biopharma & GLP-1' },
    'JNJ': { name: 'Johnson & Johnson', symbol: 'JNJ', market: 'US', currency: '$', basePrice: 162.00, sector: 'Healthcare & MedTech' },
    'PFE': { name: 'Pfizer Inc', symbol: 'PFE', market: 'US', currency: '$', basePrice: 28.50, sector: 'Vaccines & Pharma' },
    'UNH': { name: 'UnitedHealth Group', symbol: 'UNH', market: 'US', currency: '$', basePrice: 570.00, sector: 'Managed Healthcare' },
    'WMT': { name: 'Walmart Inc', symbol: 'WMT', market: 'US', currency: '$', basePrice: 82.40, sector: 'Hypermarket Retail' },
    'COST': { name: 'Costco Wholesale', symbol: 'COST', market: 'US', currency: '$', basePrice: 902.00, sector: 'Wholesale Retail' },
    'KO': { name: 'The Coca-Cola Company', symbol: 'KO', market: 'US', currency: '$', basePrice: 68.20, sector: 'Beverages' },
    'MCD': { name: 'McDonalds Corporation', symbol: 'MCD', market: 'US', currency: '$', basePrice: 298.00, sector: 'Restaurants' },
    'DIS': { name: 'Walt Disney Co', symbol: 'DIS', market: 'US', currency: '$', basePrice: 96.50, sector: 'Entertainment' },
    'NKE': { name: 'Nike Inc', symbol: 'NKE', market: 'US', currency: '$', basePrice: 81.20, sector: 'Apparel & Footwear' },
    'XOM': { name: 'Exxon Mobil', symbol: 'XOM', market: 'US', currency: '$', basePrice: 121.50, sector: 'Oil & Energy' },
    'CVX': { name: 'Chevron Corporation', symbol: 'CVX', market: 'US', currency: '$', basePrice: 152.00, sector: 'Energy & Gas' },
    'BA': { name: 'Boeing Company', symbol: 'BA', market: 'US', currency: '$', basePrice: 154.00, sector: 'Aerospace & Defence' },
    'UBER': { name: 'Uber Technologies', symbol: 'UBER', market: 'US', currency: '$', basePrice: 78.50, sector: 'Rideshare & Freight' },
    'COIN': { name: 'Coinbase Global', symbol: 'COIN', market: 'US', currency: '$', basePrice: 215.00, sector: 'Crypto Exchange' },

    // ==========================================
    // 🪙 TOP CRYPTO ASSETS
    // ==========================================
    'BTC': { name: 'Bitcoin (BTC)', symbol: 'BTC-USD', market: 'CRYPTO', currency: '$', basePrice: 68450.00, sector: 'Digital Gold (Crypto)' },
    'ETH': { name: 'Ethereum (ETH)', symbol: 'ETH-USD', market: 'CRYPTO', currency: '$', basePrice: 2645.50, sector: 'Smart Contracts (Crypto)' },
    'SOL': { name: 'Solana (SOL)', symbol: 'SOL-USD', market: 'CRYPTO', currency: '$', basePrice: 174.20, sector: 'Layer 1 Blockchain' },
    'BNB': { name: 'Binance Coin (BNB)', symbol: 'BNB-USD', market: 'CRYPTO', currency: '$', basePrice: 592.80, sector: 'Exchange Ecosystem' },
    'XRP': { name: 'Ripple (XRP)', symbol: 'XRP-USD', market: 'CRYPTO', currency: '$', basePrice: 0.5420, sector: 'Cross-Border Payments' },
    'DOGE': { name: 'Dogecoin (DOGE)', symbol: 'DOGE-USD', market: 'CRYPTO', currency: '$', basePrice: 0.1435, sector: 'Meme & Payments' },
    'ADA': { name: 'Cardano (ADA)', symbol: 'ADA-USD', market: 'CRYPTO', currency: '$', basePrice: 0.3650, sector: 'PoS Blockchain' },
    'AVAX': { name: 'Avalanche (AVAX)', symbol: 'AVAX-USD', market: 'CRYPTO', currency: '$', basePrice: 28.40, sector: 'DeFi & Enterprise' },
    'LINK': { name: 'Chainlink (LINK)', symbol: 'LINK-USD', market: 'CRYPTO', currency: '$', basePrice: 11.85, sector: 'Decentralized Oracle' },
    'SHIB': { name: 'Shiba Inu (SHIB)', symbol: 'SHIB-USD', market: 'CRYPTO', currency: '$', basePrice: 0.0000185, sector: 'Meme Ecosystem' },
    'NEAR': { name: 'NEAR Protocol', symbol: 'NEAR-USD', market: 'CRYPTO', currency: '$', basePrice: 4.95, sector: 'AI & Sharded L1' },
    'DOT': { name: 'Polkadot (DOT)', symbol: 'DOT-USD', market: 'CRYPTO', currency: '$', basePrice: 4.25, sector: 'Interoperability L0' },
    'SUI': { name: 'Sui Network (SUI)', symbol: 'SUI-USD', market: 'CRYPTO', currency: '$', basePrice: 2.15, sector: 'Move Language L1' },

    // ==========================================
    // 🥇 COMMODITIES
    // ==========================================
    'GOLD': { name: 'Gold Spot', symbol: 'GC=F', market: 'COMMODITY', currency: '$', basePrice: 2735.60, sector: 'Precious Metals' },
    'SILVER': { name: 'Silver Spot', symbol: 'SI=F', market: 'COMMODITY', currency: '$', basePrice: 33.80, sector: 'Precious & Industrial' },
    'CRUDEOIL': { name: 'Brent Crude Oil', symbol: 'BZ=F', market: 'COMMODITY', currency: '$', basePrice: 74.20, sector: 'Global Energy' }
};

function roundPrice(val, basePrice = 100) {
    if (basePrice < 0.0001) return Math.round(val * 100000000) / 100000000;
    if (basePrice < 0.01) return Math.round(val * 1000000) / 1000000;
    if (basePrice < 1) return Math.round(val * 10000) / 10000;
    if (basePrice < 10) return Math.round(val * 1000) / 1000;
    return Math.round(val * 100) / 100;
}

// In-Memory Live Cache (TTL: 45 seconds to avoid API rate limits)
const liveCache = new Map();
const CACHE_TTL_MS = 45 * 1000;

// Fetch Real Live Candlestick & Tick Data from Binance (Crypto) & Yahoo Finance (Stocks)
async function fetchLiveCandles(symbol) {
    const meta = STOCK_CATALOG[symbol] || { basePrice: 1500, currency: '₹', market: 'IN' };
    const now = Date.now();

    // Check cache first
    const cached = liveCache.get(symbol);
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
        return { candles: cached.candles, isLive: true, source: cached.source };
    }

    // 1. If Crypto -> Fetch Real-time from Binance Public API
    if (meta.market === 'CRYPTO') {
        try {
            const pair = `${symbol}USDT`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4500);
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1d&limit=90`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const raw = await res.json();
                if (Array.isArray(raw) && raw.length > 10) {
                    const candles = raw.map(k => ({
                        date: new Date(k[0]).toISOString().split('T')[0],
                        time: k[0],
                        open: parseFloat(k[1]),
                        high: parseFloat(k[2]),
                        low: parseFloat(k[3]),
                        close: parseFloat(k[4]),
                        volume: parseFloat(k[5])
                    }));
                    liveCache.set(symbol, { candles, timestamp: now, source: 'Binance Live Exchange Feed' });
                    return { candles, isLive: true, source: 'Binance Live Exchange Feed' };
                }
            }
        } catch (err) {
            // Silently handle network timeout
        }
    }

    // 2. If Stock, Index or Commodity -> Fetch Real-time from Yahoo Finance
    try {
        const yahooSymbol = meta.symbol || symbol;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=3mo`, {
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
                    if (q.close[i] !== null && q.open[i] !== null) {
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
                if (candles.length > 10) {
                    liveCache.set(symbol, { candles, timestamp: now, source: 'Yahoo Finance Real-Time Market Feed' });
                    return { candles, isLive: true, source: 'Yahoo Finance Real-Time Market Feed' };
                }
            }
        }
    } catch (err) {
        // Silently handle network timeout
    }

    // Fallback to high-fidelity calibrated simulation if offline
    const fallbackCandles = generateHistoricalCandles(symbol, 90);
    return { candles: fallbackCandles, isLive: false, source: 'Calibrated Algorithmic Simulation (Offline Fallback)' };
}

// Indicator: Average True Range (ATR 14) for Accurate Dynamic Volatility & Risk Levels
function calculateATR(candles, period = 14) {
    if (candles.length < 2) return 1;
    const trs = [];
    for (let i = 1; i < candles.length; i++) {
        const h = candles[i].high;
        const l = candles[i].low;
        const prevC = candles[i - 1].close;
        const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
        trs.push(tr);
    }
    const slice = trs.slice(-period);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    return avg || 1;
}

// Realistic candle data generator for consistent technical analysis fallback
function generateHistoricalCandles(symbol, count = 100) {
    const meta = STOCK_CATALOG[symbol] || { basePrice: 1500, currency: '₹' };
    let price = meta.basePrice;
    const candles = [];
    
    // Seed with a deterministic walk based on symbol name
    let seed = 0;
    for (let i = 0; i < symbol.length; i++) seed += symbol.charCodeAt(i);
    
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const now = new Date();
    // Daily candles
    for (let i = count; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        // Volatility factor
        const volatility = (meta.basePrice > 10000) ? 0.009 : 0.016;
        const trendFactor = Math.sin(i * 0.15) * 0.005; // Cyclical wave
        const changePercent = (random() - 0.485 + trendFactor) * volatility;
        
        const open = roundPrice(price, meta.basePrice);
        const close = roundPrice(open * (1 + changePercent), meta.basePrice);
        const high = roundPrice(Math.max(open, close) * (1 + random() * 0.008), meta.basePrice);
        const low = roundPrice(Math.min(open, close) * (1 - random() * 0.008), meta.basePrice);
        const volume = Math.floor(500000 + random() * 2500000);

        candles.push({
            date: date.toISOString().split('T')[0],
            time: date.getTime(),
            open,
            high,
            low,
            close,
            volume
        });

        price = close;
    }

    return candles;
}

// Indicator: Exponential Moving Average (EMA)
function calculateEMA(prices, period) {
    if (prices.length < period) return [];
    const k = 2 / (period + 1);
    const emaArray = [];
    
    // Initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) sum += prices[i];
    let ema = sum / period;
    emaArray.push(ema);

    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] * k) + (ema * (1 - k));
        emaArray.push(ema);
    }
    return emaArray;
}

// Indicator: Relative Strength Index (RSI)
function calculateRSI(closes, period = 14) {
    if (closes.length <= period) return 50;
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change >= 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        const gain = change >= 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Math.round((100 - (100 / (1 + rs))) * 10) / 10;
}

// Indicator: MACD (12, 26, 9)
function calculateMACD(closes) {
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    
    const offset = 26 - 12;
    const macdLine = [];
    for (let i = 0; i < ema26.length; i++) {
        macdLine.push(ema12[i + offset] - ema26[i]);
    }
    
    const signalLine = calculateEMA(macdLine, 9);
    const currentMacd = macdLine[macdLine.length - 1] || 0;
    const currentSignal = signalLine[signalLine.length - 1] || 0;
    const histogram = currentMacd - currentSignal;

    return {
        macd: Math.round(currentMacd * 100) / 100,
        signal: Math.round(currentSignal * 100) / 100,
        histogram: Math.round(histogram * 100) / 100,
        bullishCross: currentMacd > currentSignal && histogram > 0
    };
}

// Indicator: Bollinger Bands (20 periods, 2 std dev)
function calculateBollingerBands(closes, period = 20) {
    if (closes.length < period) return null;
    const slice = closes.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = Math.round((mean + 2 * stdDev) * 100) / 100;
    const lower = Math.round((mean - 2 * stdDev) * 100) / 100;
    const middle = Math.round(mean * 100) / 100;
    const bandwidth = Math.round(((upper - lower) / middle) * 10000) / 100;

    return { upper, middle, lower, bandwidth };
}

// Pivot Points (Support & Resistance)
function calculatePivots(high, low, close, basePrice = 100) {
    const pp = (high + low + close) / 3;
    const r1 = (2 * pp) - low;
    const s1 = (2 * pp) - high;
    const r2 = pp + (high - low);
    const s2 = pp - (high - low);

    return {
        pivot: roundPrice(pp, basePrice),
        r1: roundPrice(r1, basePrice),
        r2: roundPrice(r2, basePrice),
        s1: roundPrice(s1, basePrice),
        s2: roundPrice(s2, basePrice)
    };
}

function formatNumber(num, basePrice = 100) {
    return roundPrice(num, basePrice).toString();
}

// Complete Algorithmic Market Directional Analyzer
async function analyzeMarket(symbol) {
    const meta = STOCK_CATALOG[symbol] || { name: symbol, currency: '₹', sector: 'Equities', basePrice: 100 };
    const { candles, isLive, source } = await fetchLiveCandles(symbol);
    const closes = candles.map(c => c.close);
    const latest = candles[candles.length - 1];
    const prev = candles[candles.length - 2] || latest;

    const currentPrice = roundPrice(latest.close, meta.basePrice);
    const priceChange = roundPrice(currentPrice - prev.close, meta.basePrice);
    const percentChange = prev.close ? Math.round(((priceChange / prev.close) * 100) * 100) / 100 : 0;

    // Technical Indicators
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const ema20Arr = calculateEMA(closes, 20);
    const ema50Arr = calculateEMA(closes, 50);
    const ema200Arr = calculateEMA(closes, Math.min(closes.length, 100)); // proxy
    
    const ema20 = roundPrice(ema20Arr[ema20Arr.length - 1] || currentPrice, meta.basePrice);
    const ema50 = roundPrice(ema50Arr[ema50Arr.length - 1] || currentPrice, meta.basePrice);
    const ema200 = roundPrice(ema200Arr[ema200Arr.length - 1] || currentPrice, meta.basePrice);
    const bb = calculateBollingerBands(closes, 20);
    const pivots = calculatePivots(latest.high, latest.low, latest.close, meta.basePrice);
    const atr = calculateATR(candles, 14);

    // Multi-factor directional scoring: range -100 (Deep Bearish) to +100 (Deep Bullish)
    let score = 0;
    const reasons = [];
    const signals = [];

    // 1. RSI Factor
    if (rsi < 32) {
        score += 25;
        signals.push({ indicator: 'RSI', signal: 'Oversold Reversal (Bullish)', bias: 'UP', points: +25 });
        reasons.push(`RSI at ${rsi} is in deep oversold territory (<32) — statistical mean-reversion strongly favors an upward bounce.`);
    } else if (rsi > 68) {
        score -= 25;
        signals.push({ indicator: 'RSI', signal: 'Overbought Exhaustion (Bearish)', bias: 'DOWN', points: -25 });
        reasons.push(`RSI at ${rsi} is in overbought territory (>68) — high probability of profit-taking and downside consolidation.`);
    } else if (rsi >= 50 && rsi <= 65) {
        score += 15;
        signals.push({ indicator: 'RSI', signal: 'Bullish Momentum', bias: 'UP', points: +15 });
        reasons.push(`RSI at ${rsi} is sustaining strong positive momentum within the healthy expansion zone (50-65).`);
    } else {
        score -= 10;
        signals.push({ indicator: 'RSI', signal: 'Weak Momentum', bias: 'DOWN', points: -10 });
        reasons.push(`RSI is trading below the neutral 50 threshold (${rsi}), confirming ongoing seller dominance.`);
    }

    // 2. Moving Average Crossover & Trend
    if (currentPrice > ema20) {
        score += 15;
        signals.push({ indicator: '20 EMA', signal: 'Price above 20 EMA (Short-term UP)', bias: 'UP', points: +15 });
    } else {
        score -= 15;
        signals.push({ indicator: '20 EMA', signal: 'Price below 20 EMA (Short-term DOWN)', bias: 'DOWN', points: -15 });
    }

    if (ema20 > ema50) {
        score += 20;
        signals.push({ indicator: 'EMA Crossover', signal: 'Golden Cross Trend (20 > 50 EMA)', bias: 'UP', points: +20 });
        reasons.push(`20 EMA (${meta.currency}${formatNumber(ema20, meta.basePrice)}) is trending above 50 EMA, confirming a sustained bullish medium-term trend.`);
    } else {
        score -= 20;
        signals.push({ indicator: 'EMA Crossover', signal: 'Bearish Alignment (20 < 50 EMA)', bias: 'DOWN', points: -20 });
        reasons.push(`20 EMA is lagging below 50 EMA, maintaining systematic downward pressure.`);
    }

    // 3. MACD Momentum
    if (macd.bullishCross) {
        score += 20;
        signals.push({ indicator: 'MACD', signal: 'Bullish Crossover', bias: 'UP', points: +20 });
        reasons.push(`MACD line has crossed above the signal line with positive histogram expansion (Bullish confirmation).`);
    } else {
        score -= 20;
        signals.push({ indicator: 'MACD', signal: 'Bearish Divergence / Below Signal', bias: 'DOWN', points: -20 });
        reasons.push(`MACD line remains below the signal line, reflecting ongoing negative momentum.`);
    }

    // 4. Volume Trend Check
    const vols = candles.map(c => c.volume);
    const avgVol = vols.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, vols.length);
    if (latest.volume > avgVol * 1.25) {
        if (latest.close >= latest.open) {
            score += 12;
            signals.push({ indicator: 'Volume Surge', signal: 'High Volume Bullish Accumulation', bias: 'UP', points: +12 });
            reasons.push(`Volume expanded significantly above the 20-day average on a green candle, confirming institutional accumulation.`);
        } else {
            score -= 12;
            signals.push({ indicator: 'Volume Surge', signal: 'High Volume Bearish Distribution', bias: 'DOWN', points: -12 });
            reasons.push(`Elevated selling volume detected above historical average, indicating institutional distribution.`);
        }
    }

    // 5. Short-term Price Action Trend
    let trendPaction = 0;
    const recent = closes.slice(-5);
    for (let i = 1; i < recent.length; i++) {
        if (recent[i] > recent[i - 1]) trendPaction += 3;
        else if (recent[i] < recent[i - 1]) trendPaction -= 3;
    }
    score += trendPaction;

    // Determine Final Direction & Verdict
    let verdict = 'RANGEBOUND - CONSOLIDATION ↔';
    let direction = 'NEUTRAL';
    let actionBadge = 'HOLD / WAIT FOR BREAKOUT';
    let colorClass = 'neutral';
    let confidence = 58;

    if (score >= 28) {
        verdict = 'BULLISH - UPWARD TRAJECTORY ↗';
        direction = 'UP';
        actionBadge = 'STRONG BUY / LONG';
        colorClass = 'bullish';
        confidence = Math.min(94, Math.round(65 + (score / 100) * 30));
    } else if (score <= -28) {
        verdict = 'BEARISH - DOWNWARD TRAJECTORY ↘';
        direction = 'DOWN';
        actionBadge = 'STRONG SELL / SHORT';
        colorClass = 'bearish';
        confidence = Math.min(94, Math.round(65 + (Math.abs(score) / 100) * 30));
    } else {
        verdict = 'RANGEBOUND - CONSOLIDATION ↔';
        direction = 'SIDEWAYS';
        actionBadge = 'WAIT FOR CLEAR BREAKOUT';
        colorClass = 'neutral';
        confidence = 60;
    }

    // Accurate ATR-based Dynamic Targets & Stop Loss
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
        target1 = roundPrice(pivots.r1, meta.basePrice);
        target2 = roundPrice(pivots.r2, meta.basePrice);
        stopLoss = roundPrice(pivots.s1, meta.basePrice);
    }

    const fearGreedScore = Math.max(5, Math.min(95, Math.round(50 + (score * 0.45))));
    let fearGreedLabel = 'Neutral (Balanced)';
    if (fearGreedScore > 75) fearGreedLabel = 'Extreme Greed (Aggressive Buying)';
    else if (fearGreedScore > 58) fearGreedLabel = 'Greed (Bullish Sentiment)';
    else if (fearGreedScore < 25) fearGreedLabel = 'Extreme Fear (Panic Capitulation)';
    else if (fearGreedScore < 42) fearGreedLabel = 'Fear (Elevated Selling Pressure)';

    return {
        symbol,
        meta,
        currentPrice,
        priceChange,
        percentChange,
        direction,
        verdict,
        actionBadge,
        colorClass,
        confidence,
        score,
        target1,
        target2,
        stopLoss,
        riskReward: '1 : 2.2',
        isLive,
        source,
        timing: {
            timeframe: 'Daily Swing (1D Klines)',
            target1Eta: '1 – 2 Trading Sessions (Days)',
            target2Eta: '3 – 5 Trading Sessions (Days)',
            invalidation: 'Active until Stop-Loss Safeguard is hit',
            bestWindow: meta.market === 'IN' ? '09:30 AM – 11:00 AM IST' :
                       meta.market === 'US' ? '07:30 PM – 09:30 PM IST (09:30 – 11:30 AM EST)' :
                       meta.market === 'CRYPTO' ? '24/7 (Peak Liquidity: 05:30 PM – 10:30 PM IST)' :
                       '09:30 AM – 11:30 AM & 05:00 PM – 09:00 PM IST'
        },
        indicators: {
            rsi,
            macd,
            ema20,
            ema50,
            ema200,
            bollingerBands: bb,
            pivots,
            atr: roundPrice(atr, meta.basePrice)
        },
        signals,
        reasons,
        fearGreed: {
            score: fearGreedScore,
            label: fearGreedLabel
        },
        chartData: candles.slice(-60)
    };
}

// API Routes
app.get('/api/stocks', (req, res) => {
    const list = Object.keys(STOCK_CATALOG).map(key => ({
        key,
        ...STOCK_CATALOG[key]
    }));
    res.json(list);
});

app.get('/api/analyze/:symbol', async (req, res) => {
    const symbol = (req.params.symbol || 'NIFTY50').toUpperCase();
    try {
        const analysis = await analyzeMarket(symbol);
        res.json(analysis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Macro Market Pulse: Overall direction of India, US and Crypto Markets
app.get('/api/market-pulse', async (req, res) => {
    try {
        const [btc, eth, sol, nifty, banknifty, sensex, nasdaq, sp500, nvda] = await Promise.all([
            analyzeMarket('BTC'),
            analyzeMarket('ETH'),
            analyzeMarket('SOL'),
            analyzeMarket('NIFTY50'),
            analyzeMarket('BANKNIFTY'),
            analyzeMarket('SENSEX'),
            analyzeMarket('NASDAQ'),
            analyzeMarket('SP500'),
            analyzeMarket('NVDA')
        ]);

        const cryptoScore = Math.round((btc.score + eth.score + sol.score) / 3);
        const indiaScore = Math.round((nifty.score + banknifty.score + sensex.score) / 3);
        const usScore = Math.round((nasdaq.score + sp500.score + nvda.score) / 3);

        const getSummary = (score) => {
            if (score >= 25) return { verdict: 'BULLISH (UPWARD ↗)', color: '#10b981', bias: 'UP' };
            if (score <= -25) return { verdict: 'BEARISH (DOWNWARD ↘)', color: '#ef4444', bias: 'DOWN' };
            return { verdict: 'RANGEBOUND (SIDEWAYS ↔)', color: '#eab308', bias: 'NEUTRAL' };
        };

        res.json({
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
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/custom-analyze', async (req, res) => {
    const { name, currentPrice, high, low, previousClose } = req.body;
    try {
        const price = parseFloat(currentPrice) || 1000;
        const h = parseFloat(high) || price * 1.02;
        const l = parseFloat(low) || price * 0.98;
        const pClose = parseFloat(previousClose) || price * 0.995;
        
        STOCK_CATALOG['CUSTOM'] = {
            name: name || 'Custom Stock',
            symbol: 'CUSTOM',
            market: 'CUSTOM',
            currency: '₹',
            basePrice: price,
            sector: 'Custom Input'
        };

        const result = await analyzeMarket('CUSTOM');
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Vectivor Terminal Server running at: http://localhost:${PORT}`);
});
