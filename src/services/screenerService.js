// ==============================================================================
// VECTIVOR MARKET SCREENER & QUANTITATIVE SCANNER
// Multi-asset scanner: Top Gainers, Losers, 52W Highs/Lows, Oversold RSI, High RVOL
// ==============================================================================

const { INSTRUMENT_CATALOG } = require('./marketDataService');

/**
 * Run Screener across catalog assets
 */
function runScreener(assetListWithMetrics) {
    const assets = assetListWithMetrics || [];

    const topGainers = [...assets].sort((a, b) => b.percentChange - a.percentChange).slice(0, 8);
    const topLosers = [...assets].sort((a, b) => a.percentChange - b.percentChange).slice(0, 8);
    const mostActive = [...assets].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 8);

    const oversoldRSI = assets.filter(a => a.rsi && a.rsi < 35).slice(0, 8);
    const overboughtRSI = assets.filter(a => a.rsi && a.rsi > 65).slice(0, 8);
    const highRVOL = assets.filter(a => a.rvol && a.rvol > 1.5).slice(0, 8);

    return {
        timestamp: new Date().toISOString(),
        totalScanned: assets.length,
        screeners: {
            topGainers,
            topLosers,
            mostActive,
            oversoldRSI,
            overboughtRSI,
            highRVOL
        }
    };
}

module.exports = {
    runScreener
};
