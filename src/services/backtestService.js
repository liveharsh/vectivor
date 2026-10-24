// ==============================================================================
// VECTIVOR QUANTITATIVE STRATEGY BACKTESTER
// Zero-lookahead historical execution engine with realistic slippage & metrics
// ==============================================================================

const { calculateEMA, calculateRSI } = require('./indicatorService');

/**
 * Run Quantitative Backtest on historical candles
 */
function runBacktest(candles, options = {}) {
    const {
        strategy = 'EMA_CROSS',
        initialCapital = 100000,
        riskPerTradePercent = 1.5,
        stopLossPercent = 1.5,
        targetMultiple = 2.0, // Risk-to-Reward 1:2.0
        slippagePercent = 0.05
    } = options;

    if (!candles || candles.length < 30) {
        return {
            error: 'Insufficient historical candle data for rigorous backtesting (minimum 30 bars required).'
        };
    }

    const closes = candles.map(c => c.close);
    const emaFast = calculateEMA(closes, 9);
    const emaSlow = calculateEMA(closes, 21);
    const rsi14 = [];
    for (let i = 14; i < closes.length; i++) {
        rsi14.push(calculateRSI(closes.slice(0, i + 1), 14));
    }

    let capital = initialCapital;
    let peakCapital = initialCapital;
    let maxDrawdown = 0;

    const trades = [];
    let currentPosition = null; // { type: 'LONG', entryPrice, entryIndex, stopLoss, target, size, entryDate }
    const equityCurve = [{ date: candles[0].date, equity: initialCapital }];

    const startIndex = Math.max(25, candles.length - closes.length + 22);

    for (let i = startIndex; i < candles.length - 1; i++) {
        const c = candles[i];
        const next = candles[i + 1];

        // 1. Manage Open Position first (Exit Check on next bar OHLC without lookahead)
        if (currentPosition) {
            let exited = false;
            let exitPrice = 0;
            let exitReason = '';

            if (currentPosition.type === 'LONG') {
                // Check Stop Loss hit
                if (next.low <= currentPosition.stopLoss) {
                    exitPrice = currentPosition.stopLoss * (1 - (slippagePercent / 100));
                    exitReason = 'STOP_LOSS_HIT';
                    exited = true;
                }
                // Check Target hit
                else if (next.high >= currentPosition.target) {
                    exitPrice = currentPosition.target * (1 - (slippagePercent / 100));
                    exitReason = 'TARGET_REACHED';
                    exited = true;
                }
            }

            if (exited) {
                const pnl = (exitPrice - currentPosition.entryPrice) * currentPosition.size;
                capital += pnl;
                if (capital > peakCapital) peakCapital = capital;
                const dd = ((peakCapital - capital) / peakCapital) * 100;
                if (dd > maxDrawdown) maxDrawdown = dd;

                trades.push({
                    id: trades.length + 1,
                    type: currentPosition.type,
                    entryDate: currentPosition.entryDate,
                    exitDate: next.date,
                    entryPrice: Math.round(currentPosition.entryPrice * 100) / 100,
                    exitPrice: Math.round(exitPrice * 100) / 100,
                    pnl: Math.round(pnl * 100) / 100,
                    returnPercent: Math.round(((exitPrice - currentPosition.entryPrice) / currentPosition.entryPrice) * 10000) / 100,
                    exitReason,
                    capitalAfter: Math.round(capital * 100) / 100
                });

                equityCurve.push({ date: next.date, equity: Math.round(capital * 100) / 100 });
                currentPosition = null;
            }
        }

        // 2. Strategy Entry Signals (Generated at close of candle [i], executed on open of [i+1])
        if (!currentPosition) {
            let signal = false;

            if (strategy === 'EMA_CROSS') {
                const fastPrev = emaFast[i - 1];
                const fastCurr = emaFast[i];
                const slowPrev = emaSlow[i - 1];
                const slowCurr = emaSlow[i];
                // Golden Cross
                if (fastPrev <= slowPrev && fastCurr > slowCurr) signal = true;
            } else if (strategy === 'RSI_REVERSAL') {
                const rsiIndex = i - (candles.length - closes.length);
                const currentRSI = rsi14[rsiIndex];
                if (currentRSI && currentRSI < 35 && c.close > c.open) signal = true;
            } else {
                // Breakout Momentum
                const prevHigh20 = Math.max(...candles.slice(Math.max(0, i - 15), i).map(x => x.high));
                if (c.close > prevHigh20) signal = true;
            }

            if (signal) {
                const entryPrice = next.open * (1 + (slippagePercent / 100));
                const slDistance = entryPrice * (stopLossPercent / 100);
                const stopLoss = entryPrice - slDistance;
                const target = entryPrice + (slDistance * targetMultiple);

                const riskAmount = capital * (riskPerTradePercent / 100);
                const size = slDistance > 0 ? riskAmount / slDistance : 1;

                currentPosition = {
                    type: 'LONG',
                    entryPrice,
                    stopLoss,
                    target,
                    size,
                    entryDate: next.date
                };
            }
        }
    }

    // Performance Calculations
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl <= 0);
    const winRate = trades.length > 0 ? Math.round((wins.length / trades.length) * 1000) / 10 : 0;
    
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : (grossProfit > 0 ? 99 : 0);
    const totalReturnPercent = Math.round(((capital - initialCapital) / initialCapital) * 10000) / 100;

    return {
        strategyName: strategy === 'EMA_CROSS' ? '9/21 EMA Golden Momentum Cross' : (strategy === 'RSI_REVERSAL' ? 'RSI 14 Mean-Reversion Oversold' : '20-Bar Structural Range Breakout'),
        initialCapital,
        endingCapital: Math.round(capital * 100) / 100,
        totalReturnPercent,
        totalTrades: trades.length,
        winningTrades: wins.length,
        losingTrades: losses.length,
        winRatePercent: winRate,
        profitFactor,
        maxDrawdownPercent: Math.round(maxDrawdown * 100) / 100,
        averageTradePnl: trades.length > 0 ? Math.round((grossProfit - grossLoss) / trades.length) : 0,
        riskRewardRatio: `1 : ${targetMultiple}`,
        equityCurve,
        trades: trades.slice(-25) // Return last 25 detailed records
    };
}

module.exports = {
    runBacktest
};
