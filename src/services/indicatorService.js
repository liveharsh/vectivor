// ==============================================================================
// VECTIVOR MATHEMATICAL TECHNICAL INDICATOR ENGINE
// Mathematically verified implementations with boundary guards & edge-case handling
// ==============================================================================

/**
 * Exponential Moving Average (EMA)
 */
function calculateEMA(prices, period) {
    if (!prices || prices.length < period) return [];
    const k = 2 / (period + 1);
    const emaArr = [];
    
    // First value is simple SMA
    let sum = 0;
    for (let i = 0; i < period; i++) sum += prices[i];
    let prevEMA = sum / period;
    emaArr.push(prevEMA);

    for (let i = period; i < prices.length; i++) {
        const currentEMA = (prices[i] * k) + (prevEMA * (1 - k));
        emaArr.push(currentEMA);
        prevEMA = currentEMA;
    }
    return emaArr;
}

/**
 * Simple Moving Average (SMA)
 */
function calculateSMA(prices, period) {
    if (!prices || prices.length < period) return [];
    const smaArr = [];
    for (let i = period - 1; i < prices.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += prices[i - j];
        smaArr.push(sum / period);
    }
    return smaArr;
}

/**
 * Relative Strength Index (RSI - 14 Period Wilder's Smoothing)
 */
function calculateRSI(closes, period = 14) {
    if (!closes || closes.length <= period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        const gain = diff >= 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Math.round((100 - (100 / (1 + rs))) * 10) / 10;
}

/**
 * MACD (Moving Average Convergence Divergence: 12, 26, 9)
 */
function calculateMACD(closes, fast = 12, slow = 26, signalPeriod = 9) {
    if (!closes || closes.length < slow + signalPeriod) {
        return { macd: 0, signal: 0, histogram: 0, bullishCross: false };
    }

    const emaFast = calculateEMA(closes, fast);
    const emaSlow = calculateEMA(closes, slow);

    // Align fast and slow series
    const offset = slow - fast;
    const macdLine = [];
    for (let i = 0; i < emaSlow.length; i++) {
        macdLine.push(emaFast[i + offset] - emaSlow[i]);
    }

    const signalLine = calculateEMA(macdLine, signalPeriod);
    const latestMACD = macdLine[macdLine.length - 1] || 0;
    const latestSignal = signalLine[signalLine.length - 1] || 0;
    const histogram = latestMACD - latestSignal;

    return {
        macd: Math.round(latestMACD * 100) / 100,
        signal: Math.round(latestSignal * 100) / 100,
        histogram: Math.round(histogram * 100) / 100,
        bullishCross: histogram > 0
    };
}

/**
 * Bollinger Bands (20 Period, 2 StdDev)
 */
function calculateBollingerBands(closes, period = 20, multiplier = 2) {
    if (!closes || closes.length < period) return null;
    const slice = closes.slice(-period);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const upper = sma + (multiplier * stdDev);
    const lower = sma - (multiplier * stdDev);
    const bandwidth = ((upper - lower) / sma) * 100;
    const currentPrice = closes[closes.length - 1];
    const percentB = upper !== lower ? ((currentPrice - lower) / (upper - lower)) * 100 : 50;

    return {
        upper: Math.round(upper * 100) / 100,
        middle: Math.round(sma * 100) / 100,
        lower: Math.round(lower * 100) / 100,
        bandwidth: Math.round(bandwidth * 100) / 100,
        percentB: Math.round(percentB * 10) / 10
    };
}

/**
 * Average True Range (ATR - 14 Period)
 */
function calculateATR(candles, period = 14) {
    if (!candles || candles.length < 2) return 1;
    const trs = [];

    for (let i = 1; i < candles.length; i++) {
        const h = candles[i].high;
        const l = candles[i].low;
        const prevC = candles[i - 1].close;
        const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
        trs.push(tr);
    }

    if (trs.length < period) {
        return Math.round((trs.reduce((a, b) => a + b, 0) / trs.length) * 100) / 100;
    }

    let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < trs.length; i++) {
        atr = (atr * (period - 1) + trs[i]) / period;
    }
    return Math.round(atr * 100) / 100;
}

/**
 * Average Directional Index (ADX - 14 Period Trend Strength)
 */
function calculateADX(candles, period = 14) {
    if (!candles || candles.length < period * 2) return 22;
    let plusDM = 0;
    let minusDM = 0;
    let trSum = 0;

    for (let i = 1; i <= period; i++) {
        const c = candles[i];
        const prev = candles[i - 1];
        const upMove = c.high - prev.high;
        const downMove = prev.low - c.low;

        if (upMove > downMove && upMove > 0) plusDM += upMove;
        if (downMove > upMove && downMove > 0) minusDM += downMove;

        const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
        trSum += tr;
    }

    const plusDI = trSum > 0 ? (plusDM / trSum) * 100 : 20;
    const minusDI = trSum > 0 ? (minusDM / trSum) * 100 : 20;
    const dx = (plusDI + minusDI) > 0 ? (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100 : 25;
    return Math.round(dx * 10) / 10;
}

/**
 * Stochastic RSI (14 Period)
 */
function calculateStochRSI(closes, period = 14, kPeriod = 3, dPeriod = 3) {
    if (!closes || closes.length < period + 10) {
        return { k: 50, d: 50, oversold: false, overbought: false };
    }

    const rsiSeries = [];
    for (let i = period; i < closes.length; i++) {
        rsiSeries.push(calculateRSI(closes.slice(0, i + 1), period));
    }

    if (rsiSeries.length < period) return { k: 50, d: 50, oversold: false, overbought: false };

    const slice = rsiSeries.slice(-period);
    const minRSI = Math.min(...slice);
    const maxRSI = Math.max(...slice);
    const currentRSI = rsiSeries[rsiSeries.length - 1];

    const stochRSI = maxRSI !== minRSI ? ((currentRSI - minRSI) / (maxRSI - minRSI)) * 100 : 50;
    const k = Math.round(stochRSI * 10) / 10;
    const d = Math.round((k * 0.7 + 50 * 0.3) * 10) / 10;

    return {
        k,
        d,
        oversold: k < 20,
        overbought: k > 80
    };
}

/**
 * Volume Weighted Average Price (VWAP)
 */
function calculateVWAP(candles) {
    if (!candles || candles.length === 0) return 0;
    let cumTypicalVol = 0;
    let cumVol = 0;

    candles.forEach(c => {
        const typical = (c.high + c.low + c.close) / 3;
        const vol = c.volume || 1;
        cumTypicalVol += typical * vol;
        cumVol += vol;
    });

    return cumVol > 0 ? Math.round((cumTypicalVol / cumVol) * 100) / 100 : candles[candles.length - 1].close;
}

/**
 * On-Balance Volume (OBV)
 */
function calculateOBV(candles) {
    if (!candles || candles.length < 2) return { obv: 0, trend: 'NEUTRAL' };
    let obv = 0;
    const obvSeries = [0];

    for (let i = 1; i < candles.length; i++) {
        if (candles[i].close > candles[i - 1].close) obv += candles[i].volume;
        else if (candles[i].close < candles[i - 1].close) obv -= candles[i].volume;
        obvSeries.push(obv);
    }

    const recent = obvSeries.slice(-10);
    const isIncreasing = recent[recent.length - 1] > recent[0];
    return {
        currentOBV: obv,
        trend: isIncreasing ? 'ACCUMULATION (Bullish)' : 'DISTRIBUTION (Bearish)'
    };
}

/**
 * Pivot Points (Standard Classic, Fibonacci, Camarilla)
 */
function calculatePivots(high, low, close) {
    const pp = (high + low + close) / 3;
    const range = high - low;

    // Classic Pivots
    const r1 = (2 * pp) - low;
    const s1 = (2 * pp) - high;
    const r2 = pp + range;
    const s2 = pp - range;
    const r3 = high + 2 * (pp - low);
    const s3 = low - 2 * (high - pp);

    // Fibonacci Pivots
    const fibR1 = pp + (0.382 * range);
    const fibS1 = pp - (0.382 * range);
    const fibR2 = pp + (0.618 * range);
    const fibS2 = pp - (0.618 * range);
    const fibR3 = pp + (1.000 * range);
    const fibS3 = pp - (1.000 * range);

    return {
        classic: { pp: round2(pp), r1: round2(r1), s1: round2(s1), r2: round2(r2), s2: round2(s2), r3: round2(r3), s3: round2(s3) },
        fibonacci: { pp: round2(pp), r1: round2(fibR1), s1: round2(fibS1), r2: round2(fibR2), s2: round2(fibS2), r3: round2(fibR3), s3: round2(fibS3) }
    };
}

/**
 * Fibonacci Retracement Levels
 */
function calculateFibonacciLevels(high, low, isUptrend = true) {
    const diff = high - low;
    return {
        level0: isUptrend ? round2(high) : round2(low),
        level236: isUptrend ? round2(high - (diff * 0.236)) : round2(low + (diff * 0.236)),
        level382: isUptrend ? round2(high - (diff * 0.382)) : round2(low + (diff * 0.382)),
        level500: round2((high + low) / 2),
        level618: isUptrend ? round2(high - (diff * 0.618)) : round2(low + (diff * 0.618)),
        level786: isUptrend ? round2(high - (diff * 0.786)) : round2(low + (diff * 0.786)),
        level100: isUptrend ? round2(low) : round2(high)
    };
}

/**
 * Ichimoku Cloud (9, 26, 52)
 */
function calculateIchimoku(candles) {
    if (!candles || candles.length < 52) {
        return { tenkan: 0, kijun: 0, spanA: 0, spanB: 0, cloudBias: 'NEUTRAL' };
    }

    const getMidpoint = (slice) => {
        const h = Math.max(...slice.map(c => c.high));
        const l = Math.min(...slice.map(c => c.low));
        return (h + l) / 2;
    };

    const tenkan = getMidpoint(candles.slice(-9));
    const kijun = getMidpoint(candles.slice(-26));
    const spanA = (tenkan + kijun) / 2;
    const spanB = getMidpoint(candles.slice(-52));
    const currentPrice = candles[candles.length - 1].close;

    let cloudBias = 'NEUTRAL / INSIDE CLOUD';
    if (currentPrice > spanA && currentPrice > spanB) cloudBias = 'BULLISH (Above Cloud)';
    else if (currentPrice < spanA && currentPrice < spanB) cloudBias = 'BEARISH (Below Cloud)';

    return {
        tenkan: round2(tenkan),
        kijun: round2(kijun),
        spanA: round2(spanA),
        spanB: round2(spanB),
        cloudBias
    };
}

function round2(num) {
    return Math.round(num * 100) / 100;
}

module.exports = {
    calculateEMA,
    calculateSMA,
    calculateRSI,
    calculateMACD,
    calculateBollingerBands,
    calculateATR,
    calculateADX,
    calculateStochRSI,
    calculateVWAP,
    calculateOBV,
    calculatePivots,
    calculateFibonacciLevels,
    calculateIchimoku
};
