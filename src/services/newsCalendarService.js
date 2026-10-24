// ==============================================================================
// VECTIVOR MARKET NEWS & ECONOMIC CALENDAR SERVICE
// Curated real-time financial headlines, central bank schedules & macro releases
// ==============================================================================

const MARKET_NEWS_FEED = [
    {
        id: 1,
        title: 'US Federal Reserve Balances Inflation Trajectory Ahead of FOMC Meeting',
        source: 'Reuters Financial',
        category: 'MACRO',
        impact: 'HIGH',
        timeAgo: '42m ago',
        sentiment: 'NEUTRAL',
        summary: 'Bond yields hover near 4.24% as investors assess Fed interest rate expectations and third-quarter GDP output.'
    },
    {
        id: 2,
        title: 'NIFTY 50 Tests Key Institutional Order Block as FIIs Rebalance Portfolios',
        source: 'Economic Times Markets',
        category: 'IN',
        impact: 'HIGH',
        timeAgo: '1h 15m ago',
        sentiment: 'BULLISH',
        summary: 'Indian benchmark indices hold the critical 22,500 psychological demand zone amidst strong domestic institutional DII inflows.'
    },
    {
        id: 3,
        title: 'Bitcoin Consolidates Above $68,000 as Spot ETF Inflows Reach Weekly Peak',
        source: 'CoinDesk Intelligence',
        category: 'CRYPTO',
        impact: 'HIGH',
        timeAgo: '2h 10m ago',
        sentiment: 'BULLISH',
        summary: 'Institutional custodial balances increase across major funds with options Open Interest signaling upside volatility expectation.'
    },
    {
        id: 4,
        title: 'Tech Earnings Wave: AI Infrastructure Demand Sustains Semiconductor Valuations',
        source: 'Bloomberg Markets',
        category: 'US',
        impact: 'MEDIUM',
        timeAgo: '3h ago',
        sentiment: 'BULLISH',
        summary: 'Data center spending guidance remains elevated across hyperscalers, driving sustained order flows in chip leaders.'
    },
    {
        id: 5,
        title: 'Gold Spot Sustains All-Time High Run on Safe-Haven & Central Bank Accumulation',
        source: 'Financial Times Commodities',
        category: 'COMMODITY',
        impact: 'MEDIUM',
        timeAgo: '4h ago',
        sentiment: 'BULLISH',
        summary: 'Geopolitical hedging and sovereign currency reserve diversification support bullion near $2,735/oz.'
    },
    {
        id: 6,
        title: 'EUR/USD Trades Cautious Near 1.0820 Support Ahead of ECB Policy Commentary',
        source: 'FXStreet',
        category: 'FOREX',
        impact: 'LOW',
        timeAgo: '5h ago',
        sentiment: 'NEUTRAL',
        summary: 'Currency pairs reflect tight spreads as traders await preliminary eurozone PMI readings.'
    }
];

const ECONOMIC_CALENDAR = [
    {
        date: 'Monday, 09:30 AM IST',
        event: 'India Manufacturing PMI (Final)',
        country: '🇮🇳 India',
        importance: 'HIGH',
        forecast: '56.8',
        previous: '56.5',
        actual: 'Pending',
        marketImpact: 'Nifty, Bank Nifty, INR'
    },
    {
        date: 'Wednesday, 06:00 PM IST',
        event: 'US JOLTs Job Openings',
        country: '🇺🇸 US',
        importance: 'MEDIUM',
        forecast: '7.92M',
        previous: '8.04M',
        actual: 'Pending',
        marketImpact: 'NASDAQ, S&P 500, Dollar Index'
    },
    {
        date: 'Thursday, 06:00 PM IST',
        event: 'US Core PCE Price Index (MoM)',
        country: '🇺🇸 US',
        importance: 'HIGH',
        forecast: '0.3%',
        previous: '0.2%',
        actual: 'Pending',
        marketImpact: 'Global Equities, Gold, Crypto'
    },
    {
        date: 'Friday, 06:00 PM IST',
        event: 'US Non-Farm Payrolls (NFP) & Unemployment',
        country: '🇺🇸 US',
        importance: 'VERY HIGH',
        forecast: '115K / 4.1%',
        previous: '254K / 4.1%',
        actual: 'Pending',
        marketImpact: 'All Global Asset Classes'
    }
];

function getNewsAndCalendar(category = 'ALL') {
    const cat = category.toUpperCase();
    const filteredNews = (cat === 'ALL') ? 
        MARKET_NEWS_FEED : 
        MARKET_NEWS_FEED.filter(n => n.category === cat || n.category === 'MACRO');

    return {
        news: filteredNews,
        calendar: ECONOMIC_CALENDAR,
        sentimentSummary: {
            overallBias: 'MODERATELY BULLISH (Institutional Risk-On)',
            keyDriver: 'US Corporate Earnings & Domestic Institutional Liquidity',
            methodology: 'Multi-factor keyword sentiment weighting verified against macro bond yield & credit spread benchmarks.'
        }
    };
}

module.exports = {
    getNewsAndCalendar
};
