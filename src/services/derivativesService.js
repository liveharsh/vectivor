// ==============================================================================
// VECTIVOR DERIVATIVES & OPTIONS ANALYTICS ENGINE
// Option Chain, Black-Scholes Greeks (Delta, Gamma, Theta, Vega), PCR & Max Pain
// ==============================================================================

/**
 * Standard Normal Cumulative Distribution Function (Phi approximation)
 */
function cdf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = (x < 0) ? -1 : 1;
    const absX = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return 0.5 * (1.0 + sign * y);
}

/**
 * Standard Normal Probability Density Function
 */
function pdf(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Black-Scholes Formula & Options Greeks
 * S = Spot Price, K = Strike Price, T = Time to Expiration (Years), r = Risk-Free Rate, v = Implied Volatility
 */
function calculateGreeks(S, K, T = 0.08, r = 0.065, v = 0.16) {
    if (T <= 0 || v <= 0) return { delta: 0.5, gamma: 0, theta: 0, vega: 0 };

    const d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / (v * Math.sqrt(T));
    const d2 = d1 - (v * Math.sqrt(T));

    const callDelta = cdf(d1);
    const putDelta = callDelta - 1;
    const gamma = pdf(d1) / (S * v * Math.sqrt(T));
    const vega = (S * pdf(d1) * Math.sqrt(T)) / 100;
    const callTheta = (-(S * pdf(d1) * v) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * cdf(d2)) / 365;
    const putTheta = (-(S * pdf(d1) * v) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * cdf(-d2)) / 365;

    return {
        call: {
            delta: Math.round(callDelta * 1000) / 1000,
            gamma: Math.round(gamma * 10000) / 10000,
            theta: Math.round(callTheta * 100) / 100,
            vega: Math.round(vega * 100) / 100
        },
        put: {
            delta: Math.round(putDelta * 1000) / 1000,
            gamma: Math.round(gamma * 10000) / 10000,
            theta: Math.round(putTheta * 100) / 100,
            vega: Math.round(vega * 100) / 100
        }
    };
}

/**
 * Generate Complete Option Chain with strikes around spot
 */
function generateOptionChain(symbol, spotPrice, market = 'IN') {
    const isHighValue = spotPrice > 10000;
    const strikeInterval = isHighValue ? 100 : (spotPrice > 1000 ? 20 : (spotPrice > 100 ? 5 : 1));
    const atmStrike = Math.round(spotPrice / strikeInterval) * strikeInterval;
    const iv = market === 'IN' ? 0.142 : 0.185; // Implied Volatility
    const timeToExpiry = 7 / 365; // 7 days weekly expiry

    const strikes = [];
    let totalCallOI = 0;
    let totalPutOI = 0;

    for (let i = -6; i <= 6; i++) {
        const strike = atmStrike + (i * strikeInterval);
        const greeks = calculateGreeks(spotPrice, strike, timeToExpiry, 0.065, iv);
        
        // Realistic OI distribution: Higher call OI above ATM, higher put OI below ATM
        const distanceRatio = (strike - spotPrice) / spotPrice;
        const callOI = Math.max(1200, Math.floor(45000 * Math.exp(-Math.pow(distanceRatio - 0.015, 2) / 0.001)));
        const putOI = Math.max(1200, Math.floor(48000 * Math.exp(-Math.pow(distanceRatio + 0.015, 2) / 0.001)));

        totalCallOI += callOI;
        totalPutOI += putOI;

        const intrinsicCall = Math.max(0, spotPrice - strike);
        const intrinsicPut = Math.max(0, strike - spotPrice);
        const timeValue = Math.max(spotPrice * 0.006 * Math.sqrt(7 / 30), 1);

        const callLTP = Math.round((intrinsicCall + timeValue) * 100) / 100;
        const putLTP = Math.round((intrinsicPut + timeValue) * 100) / 100;

        strikes.push({
            strike,
            isATM: strike === atmStrike,
            isITMCall: spotPrice > strike,
            isITMPut: spotPrice < strike,
            call: {
                ltp: callLTP,
                oi: callOI,
                volume: Math.floor(callOI * 1.8),
                iv: `${Math.round(iv * 100 * 10) / 10}%`,
                ...greeks.call
            },
            put: {
                ltp: putLTP,
                oi: putOI,
                volume: Math.floor(putOI * 1.6),
                iv: `${Math.round(iv * 100 * 10) / 10}%`,
                ...greeks.put
            }
        });
    }

    // Put-Call Ratio
    const pcr = totalCallOI > 0 ? Math.round((totalPutOI / totalCallOI) * 100) / 100 : 1.0;
    let pcrVerdict = 'NEUTRAL / BALANCED';
    if (pcr > 1.2) pcrVerdict = 'BULLISH (Put Writers In Control)';
    else if (pcr < 0.75) pcrVerdict = 'BEARISH (Call Writing Overhead Cap)';

    // Max Pain (Strike where option sellers lose the least)
    let minLoss = Infinity;
    let maxPainStrike = atmStrike;
    strikes.forEach(s => {
        let totalLoss = 0;
        strikes.forEach(other => {
            if (s.strike > other.strike) totalLoss += (s.strike - other.strike) * other.call.oi;
            if (s.strike < other.strike) totalLoss += (other.strike - s.strike) * other.put.oi;
        });
        if (totalLoss < minLoss) {
            minLoss = totalLoss;
            maxPainStrike = s.strike;
        }
    });

    return {
        symbol,
        spotPrice,
        atmStrike,
        maxPain: maxPainStrike,
        totalCallOI,
        totalPutOI,
        pcr,
        pcrVerdict,
        impliedVolatility: `${Math.round(iv * 100 * 10) / 10}%`,
        expiryDate: 'Upcoming Thursday (Weekly Exchange Settlement)',
        strikes
    };
}

module.exports = {
    calculateGreeks,
    generateOptionChain
};
