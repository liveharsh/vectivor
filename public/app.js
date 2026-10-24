// Vectivor Quantitative Terminal Application Logic
let currentSymbol = 'BTC';
let currentAnalysis = null;
let currentTimeframe = '1M';
let availableStocks = [];
let selectedCategory = 'ALL';
let autoRefreshTimer = null;

// DOM Elements
const quickChipsContainer = document.getElementById('quickChips');
const searchInput = document.getElementById('searchInput');
const customModal = document.getElementById('customModal');
const customAnalyzeBtn = document.getElementById('customAnalyzeBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const customStockForm = document.getElementById('customStockForm');

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    fetchStockList();
    fetchMacroMarketPulse();
    setupEventListeners();
    startAutoTickSimulation();
    initMarketClocks();

    // Auto-resize chart on phone rotation or window resize
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (currentAnalysis && currentAnalysis.chartData) {
                drawCandlestickChart(currentAnalysis.chartData);
            }
        }, 150);
    });
});

// Fetch Real Macro Pulse for India, US, and Crypto
async function fetchMacroMarketPulse() {
    try {
        const res = await fetch('/api/market-pulse');
        if (!res.ok) return;
        const data = await res.json();
        
        // India
        const inEl = document.getElementById('macroIndiaVerdict');
        const inDet = document.getElementById('macroIndiaDetails');
        inEl.textContent = data.india.verdict;
        inEl.className = `m-verdict ${data.india.bias === 'UP' ? 'bullish' : (data.india.bias === 'DOWN' ? 'bearish' : 'neutral')}`;
        inDet.textContent = `NIFTY: ₹${formatNumber(data.india.niftyPrice)} | SENSEX: ₹${formatNumber(data.india.sensexPrice)}`;

        // US
        const usEl = document.getElementById('macroUsVerdict');
        const usDet = document.getElementById('macroUsDetails');
        usEl.textContent = data.us.verdict;
        usEl.className = `m-verdict ${data.us.bias === 'UP' ? 'bullish' : (data.us.bias === 'DOWN' ? 'bearish' : 'neutral')}`;
        usDet.textContent = `NASDAQ: $${formatNumber(data.us.nasdaqPrice)} | S&P 500: $${formatNumber(data.us.sp500Price)}`;

        // Crypto
        const crEl = document.getElementById('macroCryptoVerdict');
        const crDet = document.getElementById('macroCryptoDetails');
        crEl.textContent = data.crypto.verdict;
        crEl.className = `m-verdict ${data.crypto.bias === 'UP' ? 'bullish' : (data.crypto.bias === 'DOWN' ? 'bearish' : 'neutral')}`;
        crDet.textContent = `BTC: $${formatNumber(data.crypto.btcPrice)} | ETH: $${formatNumber(data.crypto.ethPrice)}`;
    } catch (err) {
        console.error('Macro Pulse error:', err);
    }
}

// Setup Events
function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        filterChips(query);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.toUpperCase().trim();
            if (query) {
                loadStockAnalysis(query);
            }
        }
    });

    customAnalyzeBtn.addEventListener('click', () => {
        customModal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        customModal.style.display = 'none';
    });

    const marketHoursModal = document.getElementById('marketHoursModal');
    const marketHoursBtn = document.getElementById('marketHoursBtn');
    const closeHoursModalBtn = document.getElementById('closeHoursModalBtn');

    const masterModal = document.getElementById('masterModal');
    const openMasterModalBtn = document.getElementById('openMasterModalBtn');
    const closeMasterModalBtn = document.getElementById('closeMasterModalBtn');

    if (openMasterModalBtn && masterModal) {
        openMasterModalBtn.addEventListener('click', () => {
            masterModal.style.display = 'flex';
            loadMasterAnalysis(currentSymbol);
        });
    }

    if (closeMasterModalBtn && masterModal) {
        closeMasterModalBtn.addEventListener('click', () => {
            masterModal.style.display = 'none';
        });
    }

    if (marketHoursBtn && marketHoursModal) {
        marketHoursBtn.addEventListener('click', () => {
            marketHoursModal.style.display = 'flex';
        });
    }

    if (closeHoursModalBtn && marketHoursModal) {
        closeHoursModalBtn.addEventListener('click', () => {
            marketHoursModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === customModal) {
            customModal.style.display = 'none';
        }
        if (e.target === marketHoursModal) {
            marketHoursModal.style.display = 'none';
        }
        if (e.target === masterModal) {
            masterModal.style.display = 'none';
        }
    });

    // Master Modal Tabs switching
    document.querySelectorAll('.m-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.m-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.m-panel').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.dataset.tab;
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    customStockForm.addEventListener('submit', handleCustomStockSubmit);

    // Category Tabs Filter (All, Crypto, Indian, US)
    document.querySelectorAll('.cat-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedCategory = e.currentTarget.dataset.category;
            filterChips(searchInput.value.toLowerCase().trim());
        });
    });

    // Timeframe buttons
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTimeframe = e.target.dataset.tf;
            if (currentAnalysis) {
                drawCandlestickChart(currentAnalysis.chartData);
            }
        });
    });
}

// Fetch list of popular stocks & crypto
async function fetchStockList() {
    try {
        const res = await fetch('/api/stocks');
        availableStocks = await res.json();
        renderChips(availableStocks);
        // Load the initial selected asset (BTC by default, matching the active button)
        loadStockAnalysis(currentSymbol);
    } catch (err) {
        console.error('Error fetching stock list:', err);
    }
}

function renderChips(stocks) {
    quickChipsContainer.innerHTML = '';
    stocks.forEach(stock => {
        const btn = document.createElement('button');
        btn.className = `chip-btn ${stock.key === currentSymbol ? 'active' : ''}`;
        btn.dataset.symbol = stock.key;
        
        let icon = '📊 ';
        if (stock.market === 'CRYPTO') icon = '🪙 ';
        else if (stock.market === 'IN') icon = '🇮🇳 ';
        else if (stock.market === 'US') icon = '🇺🇸 ';
        else if (stock.market === 'COMMODITY') icon = '🥇 ';

        btn.textContent = `${icon}${stock.key}`;
        btn.title = `${stock.name} (${stock.sector})`;
        btn.addEventListener('click', () => {
            loadStockAnalysis(stock.key);
        });
        quickChipsContainer.appendChild(btn);
    });
}

function filterChips(query) {
    const filtered = availableStocks.filter(s => {
        const matchesCategory = (selectedCategory === 'ALL') || (s.market === selectedCategory);
        const matchesQuery = !query || 
            s.name.toLowerCase().includes(query) || 
            s.key.toLowerCase().includes(query) ||
            (s.sector && s.sector.toLowerCase().includes(query));

        return matchesCategory && matchesQuery;
    });
    renderChips(filtered);
}

// Load Stock Analysis from API
async function loadStockAnalysis(symbol) {
    currentSymbol = symbol;

    // Immediately synchronize the active state on all chip buttons
    document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.symbol === symbol);
    });

    const card = document.getElementById('predictionCard');
    if (card) card.style.opacity = '0.6';

    try {
        const res = await fetch(`/api/analyze/${symbol}`);
        if (!res.ok) throw new Error('Failed to analyze');
        const data = await res.json();
        currentAnalysis = data;
        renderAnalysis(data);
    } catch (err) {
        console.error('Analysis error:', err);
    } finally {
        if (card) card.style.opacity = '1';
    }
}

// Render complete analysis to UI
function renderAnalysis(data) {
    const currency = data.meta.currency || '₹';
    const base = data.meta.basePrice || data.currentPrice;
    
    // Check Market Operational Status for this specific asset
    const sessions = getMarketSessionInfo();
    const marketType = (data.meta && data.meta.market) ? data.meta.market : 'IN';
    let isMarketOpen = false;
    let statusBadgeText = '';

    if (marketType === 'CRYPTO') {
        isMarketOpen = true;
        statusBadgeText = '🟢 24/7 Live Crypto Feed (Binance)';
    } else if (marketType === 'US') {
        isMarketOpen = sessions.us.open;
        statusBadgeText = isMarketOpen ? '🟢 US Wall Street Live Session' : '🔴 US Market Closed • Official Close';
    } else if (marketType === 'COMMODITY') {
        isMarketOpen = sessions.commodity.open;
        statusBadgeText = isMarketOpen ? '🟢 MCX Live Commodity Feed' : '🔴 MCX Market Closed • Last Settlement';
    } else {
        // Indian Stock Market (NSE / BSE)
        isMarketOpen = sessions.india.open;
        statusBadgeText = isMarketOpen ? '🟢 NSE/BSE Live Exchange Session' : '🔴 Indian Market Closed • Official Close (LTP)';
    }

    // Header Info
    document.getElementById('stockSector').textContent = data.meta.sector || 'Equities';
    document.getElementById('stockTitle').textContent = data.meta.name || data.symbol;
    document.getElementById('stockPrice').textContent = `${currency}${formatNumber(data.currentPrice, base)}`;
    
    const dataTag = document.getElementById('dataSourceTag');
    if (dataTag) {
        dataTag.textContent = statusBadgeText;
        dataTag.className = `data-source-tag ${isMarketOpen ? 'live' : 'market-closed'}`;
    }

    // Header Live Pulse Indicator
    const headerPulse = document.getElementById('headerLivePulse');
    const headerText = document.getElementById('headerLiveText');
    if (headerPulse && headerText) {
        if (isMarketOpen) {
            headerPulse.className = 'live-pulse';
            headerText.textContent = 'Live Session: Active';
        } else {
            headerPulse.className = 'live-pulse closed-mode';
            headerText.textContent = 'Market Closed: Static LTP';
        }
    }

    const changeEl = document.getElementById('stockChange');
    const isUp = data.priceChange >= 0;
    changeEl.className = `price-change ${isUp ? 'up' : 'down'}`;
    changeEl.textContent = `${isUp ? '+' : ''}${formatNumber(data.priceChange, base)} (${isUp ? '+' : ''}${data.percentChange}%)`;

    // Big Verdict Badge
    const verdictBadge = document.getElementById('verdictBadge');
    const verdictText = document.getElementById('verdictText');
    const verdictArrow = document.getElementById('verdictArrow');

    verdictBadge.className = `big-verdict-badge ${data.colorClass}`;
    if (data.direction === 'UP') {
        verdictArrow.textContent = '↗';
        verdictText.textContent = 'BULLISH - UPWARD TRAJECTORY ↗';
    } else if (data.direction === 'DOWN') {
        verdictArrow.textContent = '↘';
        verdictText.textContent = 'BEARISH - DOWNWARD TRAJECTORY ↘';
    } else {
        verdictArrow.textContent = '↔';
        verdictText.textContent = 'RANGEBOUND - CONSOLIDATION ↔';
    }

    // Precision Speedometer Needle Rotation
    const svgNeedle = document.getElementById('svgNeedleGroup');
    const primaryReadout = document.getElementById('gaugePrimaryText');
    const subReadout = document.getElementById('gaugeSubText');

    let needleAngle = 0;
    const conf = data.confidence || 70;

    if (data.direction === 'DOWN') {
        // Map confidence (50% to 95%) directly into Deep Red Zone (-25deg to -85deg)
        needleAngle = -22 - ((conf - 50) / 45) * 62;
        needleAngle = Math.max(-88, Math.min(-20, needleAngle));
        if (primaryReadout) {
            primaryReadout.className = 'readout-primary bearish';
            primaryReadout.textContent = `${conf}% Bearish Trajectory`;
        }
        if (subReadout) {
            subReadout.textContent = `High Probability Downside Move • ATR ${currency}${formatNumber(data.indicators.atr, base)}`;
        }
    } else if (data.direction === 'UP') {
        // Map confidence (50% to 95%) directly into Deep Green Zone (+25deg to +85deg)
        needleAngle = 22 + ((conf - 50) / 45) * 62;
        needleAngle = Math.min(88, Math.max(20, needleAngle));
        if (primaryReadout) {
            primaryReadout.className = 'readout-primary bullish';
            primaryReadout.textContent = `${conf}% Bullish Trajectory`;
        }
        if (subReadout) {
            subReadout.textContent = `High Probability Upside Move • ATR ${currency}${formatNumber(data.indicators.atr, base)}`;
        }
    } else {
        // Rangebound / Sideways: stays around center (-12deg to +12deg)
        needleAngle = Math.max(-12, Math.min(12, (data.score / 25) * 12));
        if (primaryReadout) {
            primaryReadout.className = 'readout-primary neutral';
            primaryReadout.textContent = `${conf}% Rangebound Channel`;
        }
        if (subReadout) {
            subReadout.textContent = `Consolidating within S1-R1 Bands`;
        }
    }

    if (svgNeedle) {
        svgNeedle.style.transform = `rotate(${needleAngle}deg)`;
    }

    // Target & Stop Loss Levels
    document.getElementById('target1Val').textContent = `${currency}${formatNumber(data.target1, base)}`;
    document.getElementById('target2Val').textContent = `${currency}${formatNumber(data.target2, base)}`;
    document.getElementById('stopLossVal').textContent = `${currency}${formatNumber(data.stopLoss, base)}`;
    document.getElementById('riskRewardVal').textContent = data.riskReward || '1 : 2.2';

    // Forecast Horizon & Market Session Strip
    const thTarget1 = document.getElementById('thTarget1Eta');
    const thTarget2 = document.getElementById('thTarget2Eta');
    const thSession = document.getElementById('thSessionStatus');
    const thWindow = document.getElementById('thEntryWindow');

    if (thTarget1) thTarget1.textContent = (data.timing && data.timing.target1Eta) ? data.timing.target1Eta : '1 – 2 Trading Days';
    if (thTarget2) thTarget2.textContent = (data.timing && data.timing.target2Eta) ? data.timing.target2Eta : '3 – 5 Trading Days';

    let assetSession = sessions.india;
    if (marketType === 'US') assetSession = sessions.us;
    else if (marketType === 'CRYPTO') assetSession = sessions.crypto;
    else if (marketType === 'COMMODITY') assetSession = sessions.commodity;

    if (thSession) {
        thSession.textContent = assetSession.text;
        thSession.className = `th-strip-val ${assetSession.open ? 'open-val' : 'closed-val'}`;
    }

    if (thWindow) {
        thWindow.textContent = (data.timing && data.timing.bestWindow) ? data.timing.bestWindow : '09:30 AM – 11:00 AM IST';
    }

    // Reasons List
    const reasonsList = document.getElementById('reasonsList');
    reasonsList.innerHTML = '';
    data.reasons.forEach(r => {
        const li = document.createElement('li');
        li.textContent = typeof r === 'string' ? r : (r.en || r.hi);
        reasonsList.appendChild(li);
    });

    // Fear & Greed Index
    const fgFill = document.getElementById('fgFill');
    const fgScore = document.getElementById('fgScore');
    const fgLabel = document.getElementById('fgLabel');
    fgFill.style.width = `${data.fearGreed.score}%`;
    fgScore.textContent = `${data.fearGreed.score} / 100`;
    fgLabel.textContent = data.fearGreed.label;

    // Mini Signals List
    const miniSignalsList = document.getElementById('miniSignalsList');
    miniSignalsList.innerHTML = '';
    data.signals.forEach(sig => {
        const row = document.createElement('div');
        row.className = 'mini-signal-row';
        row.innerHTML = `
            <span><b>${sig.indicator}</b>: ${sig.signal}</span>
            <span class="sig-bias ${sig.bias.toLowerCase()}">${sig.bias === 'UP' ? '↗ BUY / LONG' : '↘ SELL / SHORT'}</span>
        `;
        miniSignalsList.appendChild(row);
    });

    // Technical Indicators Cards
    // RSI
    document.getElementById('rsiVal').textContent = data.indicators.rsi;
    const rsiMarker = document.getElementById('rsiMarker');
    rsiMarker.style.left = `${Math.min(100, Math.max(0, data.indicators.rsi))}%`;
    const rsiStatus = document.getElementById('rsiStatus');
    if (data.indicators.rsi < 35) {
        rsiStatus.textContent = 'Oversold (Mean Reversion)';
        rsiStatus.style.color = '#34d399';
    } else if (data.indicators.rsi > 65) {
        rsiStatus.textContent = 'Overbought (Caution)';
        rsiStatus.style.color = '#f87171';
    } else {
        rsiStatus.textContent = 'Balanced Momentum';
        rsiStatus.style.color = '#60a5fa';
    }

    // MACD
    const macd = data.indicators.macd;
    document.getElementById('macdVal').textContent = `${macd.histogram >= 0 ? '+' : ''}${macd.histogram}`;
    document.getElementById('macdLineVal').textContent = macd.macd;
    document.getElementById('macdSignalVal').textContent = macd.signal;
    document.getElementById('macdHistVal').textContent = `${macd.histogram >= 0 ? '+' : ''}${macd.histogram}`;
    document.getElementById('macdStatus').textContent = macd.bullishCross ? 'Bullish Cross' : 'Bearish Cross';

    // Moving Averages
    document.getElementById('ema20Val').textContent = `${currency}${formatNumber(data.indicators.ema20, base)}`;
    document.getElementById('ema50Val').textContent = `${currency}${formatNumber(data.indicators.ema50, base)}`;
    document.getElementById('ema200Val').textContent = `${currency}${formatNumber(data.indicators.ema200, base)}`;
    document.getElementById('emaStatus').textContent = (data.indicators.ema20 > data.indicators.ema50) ? 'Golden Bullish Trend' : 'Bearish Lag Alignment';

    // Bollinger Bands
    if (data.indicators.bollingerBands) {
        const bb = data.indicators.bollingerBands;
        document.getElementById('bbUpperVal').textContent = `${currency}${formatNumber(bb.upper, base)}`;
        document.getElementById('bbMiddleVal').textContent = `${currency}${formatNumber(bb.middle, base)}`;
        document.getElementById('bbLowerVal').textContent = `${currency}${formatNumber(bb.lower, base)}`;
    }

    // Pivot Points
    const piv = data.indicators.pivots;
    document.getElementById('pivotR2').textContent = `${currency}${formatNumber(piv.r2, base)}`;
    document.getElementById('pivotR1').textContent = `${currency}${formatNumber(piv.r1, base)}`;
    document.getElementById('pivotPP').textContent = `${currency}${formatNumber(piv.pivot, base)}`;
    document.getElementById('pivotS1').textContent = `${currency}${formatNumber(piv.s1, base)}`;
    document.getElementById('pivotS2').textContent = `${currency}${formatNumber(piv.s2, base)}`;

    // Action Pill & Strategy
    const actionPill = document.getElementById('actionPill');
    actionPill.textContent = data.actionBadge;
    if (data.direction === 'UP') {
        actionPill.style.background = 'var(--bullish-green)';
        document.getElementById('strategySummary').innerHTML = 
            `<b>Execution Plan:</b> Accumulate on pullbacks (Buy on Dips).<br><b>Optimal Entry Zone:</b> Near ${currency}${formatNumber(data.indicators.ema20, base)}.<br><b>ATR Dynamic Stop-Loss:</b> ${currency}${formatNumber(data.stopLoss, base)}`;
    } else if (data.direction === 'DOWN') {
        actionPill.style.background = 'var(--bearish-red)';
        document.getElementById('strategySummary').innerHTML = 
            `<b>Execution Plan:</b> Fade rallies / Short on overhead resistance.<br><b>Risk Management:</b> Protect capital & trail stops.<br><b>ATR Dynamic Stop-Loss:</b> ${currency}${formatNumber(data.stopLoss, base)}`;
    } else {
        actionPill.style.background = '#eab308';
        document.getElementById('strategySummary').innerHTML = 
            `<b>Execution Plan:</b> Rangebound consolidation. Wait for confirmed breakout.<br><b>Key Range:</b> ${currency}${formatNumber(data.indicators.pivots.s1, base)} to ${currency}${formatNumber(data.indicators.pivots.r1, base)}`;
    }

    document.getElementById('lastUpdated').textContent = `Last Analyzed: ${new Date().toLocaleTimeString()}`;

    // Draw Chart
    drawCandlestickChart(data.chartData);
}

// Custom Stock Form Submission
async function handleCustomStockSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('custName').value.trim();
    const price = document.getElementById('custPrice').value.trim();
    const high = document.getElementById('custHigh').value.trim();
    const low = document.getElementById('custLow').value.trim();

    try {
        const res = await fetch('/api/custom-analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                currentPrice: price,
                high,
                low,
                previousClose: price * 0.99
            })
        });
        const data = await res.json();
        currentAnalysis = data;
        customModal.style.display = 'none';
        renderAnalysis(data);
    } catch (err) {
        alert('Analysis error: ' + err.message);
    }
}

// Candlestick Chart Renderer with EMA Overlays
function drawCandlestickChart(candles) {
    const canvas = document.getElementById('marketChart');
    if (!canvas) return;

    // Mobile & Dynamic Screen Width Auto-Fit
    const wrapper = canvas.parentElement;
    if (wrapper && wrapper.clientWidth > 0) {
        canvas.width = wrapper.clientWidth;
        canvas.height = window.innerWidth < 650 ? 280 : 380;
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!candles || candles.length === 0) return;

    // Mobile-optimized chart margins
    const isMobile = window.innerWidth < 650;
    const margin = isMobile ? 
        { top: 15, right: 50, bottom: 25, left: 10 } : 
        { top: 20, right: 70, bottom: 35, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Calculate Min and Max Price
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    candles.forEach(c => {
        if (c.low < minPrice) minPrice = c.low;
        if (c.high > maxPrice) maxPrice = c.high;
    });

    const pricePadding = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= pricePadding;
    maxPrice += pricePadding;

    const priceRange = maxPrice - minPrice;

    // Helper functions for coordinates
    const getX = (index) => margin.left + (index + 0.5) * (chartWidth / candles.length);
    const getY = (price) => margin.top + (1 - (price - minPrice) / priceRange) * chartHeight;

    // Draw Gridlines & Right Price Axis
    ctx.strokeStyle = '#1a273e';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'left';

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const price = minPrice + (priceRange / gridLines) * i;
        const y = getY(price);
        
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();

        ctx.fillText(formatNumber(price), width - margin.right + 8, y + 3);
    }

    // Draw Candlesticks
    const candleWidth = Math.max(3, (chartWidth / candles.length) * 0.65);

    candles.forEach((c, i) => {
        const x = getX(i);
        const yOpen = getY(c.open);
        const yClose = getY(c.close);
        const yHigh = getY(c.high);
        const yLow = getY(c.low);

        const isBullish = c.close >= c.open;
        const color = isBullish ? '#10b981' : '#ef4444';

        // Draw wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Draw body
        ctx.fillStyle = color;
        const top = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
        ctx.fillRect(x - candleWidth / 2, top, candleWidth, bodyHeight);
    });

    // Draw 20 EMA Line (Cyan)
    const ema20 = calculateSimpleEMA(candles.map(c => c.close), 20);
    drawCurveLine(ctx, ema20, candles.length, getX, getY, '#06b6d4', 2);

    // Draw 50 EMA Line (Orange)
    const ema50 = calculateSimpleEMA(candles.map(c => c.close), 50);
    drawCurveLine(ctx, ema50, candles.length, getX, getY, '#f59e0b', 2);

    // Setup interactive tooltip on mousemove
    setupChartTooltip(canvas, candles, margin, chartWidth, minPrice, priceRange);
}

function drawCurveLine(ctx, values, totalCandles, getX, getY, color, lineWidth) {
    if (!values || values.length === 0) return;
    const startIndex = totalCandles - values.length;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    values.forEach((val, i) => {
        const x = getX(startIndex + i);
        const y = getY(val);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();
}

function calculateSimpleEMA(prices, period) {
    if (prices.length < period) return [];
    const k = 2 / (period + 1);
    const result = [];
    let sum = 0;
    for (let i = 0; i < period; i++) sum += prices[i];
    let ema = sum / period;
    result.push(ema);

    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] * k) + (ema * (1 - k));
        result.push(ema);
    }
    return result;
}

// Chart Tooltip Hover Logic
function setupChartTooltip(canvas, candles, margin, chartWidth, minPrice, priceRange) {
    const tooltip = document.getElementById('chartTooltip');

    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;

        if (mouseX < margin.left || mouseX > canvas.width - margin.right) {
            tooltip.style.display = 'none';
            return;
        }

        const candleIndex = Math.floor(((mouseX - margin.left) / chartWidth) * candles.length);
        if (candleIndex >= 0 && candleIndex < candles.length) {
            const c = candles[candleIndex];
            const isUp = c.close >= c.open;
            tooltip.style.display = 'block';
            tooltip.style.left = `${e.clientX - rect.left + 15}px`;
            tooltip.style.top = `${e.clientY - rect.top - 20}px`;
            tooltip.innerHTML = `
                <div><b>Date:</b> ${c.date}</div>
                <div><b>Open:</b> ${formatNumber(c.open, minPrice)}</div>
                <div><b>High:</b> ${formatNumber(c.high, minPrice)}</div>
                <div><b>Low:</b> ${formatNumber(c.low, minPrice)}</div>
                <div style="color: ${isUp ? '#10b981' : '#ef4444'}"><b>Close:</b> ${formatNumber(c.close, minPrice)}</div>
                <div><b>Vol:</b> ${c.volume.toLocaleString()}</div>
            `;
        }
    };

    canvas.onmouseleave = () => {
        tooltip.style.display = 'none';
    };
}

// Auto Tick Simulation (ONLY active when the exchange is actively OPEN)
function startAutoTickSimulation() {
    setInterval(() => {
        if (!currentAnalysis) return;

        // STRICT MARKET STATUS CHECK:
        // When market is closed (e.g. Indian market on weekends/nights), price MUST stay frozen!
        const sessions = getMarketSessionInfo();
        const marketType = (currentAnalysis.meta && currentAnalysis.meta.market) ? currentAnalysis.meta.market : 'IN';

        if (marketType === 'IN' && !sessions.india.open) {
            // Indian market closed: Freeze price 100%
            return;
        }
        if (marketType === 'US' && !sessions.us.open) {
            // US market closed: Freeze price 100%
            return;
        }
        if (marketType === 'COMMODITY' && !sessions.commodity.open) {
            // MCX closed: Freeze price 100%
            return;
        }

        const base = currentAnalysis.meta.basePrice || currentAnalysis.currentPrice;
        // Small realistic micro-tick ONLY during live active trading sessions (e.g. 24/7 Crypto)
        const delta = (Math.random() - 0.49) * (currentAnalysis.currentPrice * 0.0006);
        currentAnalysis.currentPrice += delta;
        currentAnalysis.priceChange += delta;
        currentAnalysis.percentChange = Math.round(((currentAnalysis.priceChange / (currentAnalysis.currentPrice - currentAnalysis.priceChange)) * 100) * 100) / 100;

        const currency = currentAnalysis.meta.currency || '₹';
        document.getElementById('stockPrice').textContent = `${currency}${formatNumber(currentAnalysis.currentPrice, base)}`;
        
        const changeEl = document.getElementById('stockChange');
        const isUp = currentAnalysis.priceChange >= 0;
        changeEl.className = `price-change ${isUp ? 'up' : 'down'}`;
        changeEl.textContent = `${isUp ? '+' : ''}${formatNumber(currentAnalysis.priceChange, base)} (${isUp ? '+' : ''}${currentAnalysis.percentChange}%)`;
    }, 3500);
}

// Universal Number formatter with Crypto Micro-Price Support
function formatNumber(num, basePrice = null) {
    if (isNaN(num)) return '0.00';
    const val = Number(num);
    const ref = basePrice !== null ? Math.abs(basePrice) : Math.abs(val);

    let decimals = 2;
    if (ref < 0.0001) decimals = 7;
    else if (ref < 0.01) decimals = 5;
    else if (ref < 1) decimals = 4;
    else if (ref < 10) decimals = 3;

    return val.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Calculate Market Session Timings & Live Operational Status (IST Based)
function getMarketSessionInfo() {
    const now = new Date();
    // Normalize to IST (UTC + 5:30)
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utcMs + (5.5 * 3600000));
    const day = istTime.getDay(); // 0 is Sunday, 6 is Saturday
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // 1. Indian Equities: Mon-Fri 09:15 to 15:30 IST (555 to 930 mins)
    const isIndiaWeekend = (day === 0 || day === 6);
    let indiaOpen = false;
    let indiaText = '';
    if (isIndiaWeekend) {
        indiaOpen = false;
        indiaText = 'CLOSED (Opens Mon 09:15 AM)';
    } else if (totalMinutes >= 555 && totalMinutes < 930) {
        indiaOpen = true;
        const minsLeft = 930 - totalMinutes;
        const h = Math.floor(minsLeft / 60);
        const m = minsLeft % 60;
        indiaText = `OPEN 🟢 (Closes in ${h}h ${m}m)`;
    } else if (totalMinutes >= 540 && totalMinutes < 555) {
        indiaOpen = false;
        indiaText = 'PRE-MARKET 🟡 (Opens 09:15 AM)';
    } else if (totalMinutes < 540) {
        indiaOpen = false;
        indiaText = 'CLOSED 🔴 (Opens 09:15 AM)';
    } else {
        indiaOpen = false;
        indiaText = 'CLOSED 🔴 (Opens 09:15 AM)';
    }

    // 2. US Wall Street: Regular 19:00 to 01:30 IST (Mon night to Fri night)
    let usOpen = false;
    let usText = '';
    const isUsSaturday = (day === 6 && totalMinutes >= 90);
    const isUsSunday = (day === 0);
    const isUsMondayMorning = (day === 1 && totalMinutes < 1140);

    if (isUsSunday || isUsSaturday || isUsMondayMorning) {
        usOpen = false;
        usText = 'CLOSED (Opens Mon 07:00 PM IST)';
    } else if (totalMinutes >= 1140 || totalMinutes < 90) {
        usOpen = true;
        usText = 'OPEN 🟢 (Closes 01:30 AM IST)';
    } else if (totalMinutes >= 810 && totalMinutes < 1140) {
        usOpen = false;
        usText = 'PRE-MARKET 🟡 (Opens 07:00 PM IST)';
    } else {
        usOpen = false;
        usText = 'CLOSED 🔴 (Opens 07:00 PM IST)';
    }

    // 3. Crypto: 24/7 Continuous
    const cryptoOpen = true;
    const cryptoText = 'OPEN 🟢 24/7 Active';

    // 4. MCX Commodities: Mon-Fri 09:00 to 23:30 IST (540 to 1410 mins)
    let commOpen = false;
    let commText = '';
    if (day === 0 || day === 6) {
        commOpen = false;
        commText = 'CLOSED (Opens Mon 09:00 AM)';
    } else if (totalMinutes >= 540 && totalMinutes <= 1410) {
        commOpen = true;
        commText = 'OPEN 🟢 (Closes 11:30 PM)';
    } else {
        commOpen = false;
        commText = 'CLOSED 🔴 (Opens 09:00 AM)';
    }

    return {
        istTime,
        india: { open: indiaOpen, text: indiaText },
        us: { open: usOpen, text: usText },
        crypto: { open: cryptoOpen, text: cryptoText },
        commodity: { open: commOpen, text: commText }
    };
}

// Live Clocks and Market Session Monitors
function initMarketClocks() {
    function updateClocks() {
        const now = new Date();
        const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
        
        // IST (UTC + 5.5)
        const ist = new Date(utcMs + (5.5 * 3600000));
        // EST (UTC - 5 / -4 depending on DST; standard -5)
        const est = new Date(utcMs - (4 * 3600000)); // EDT
        // UTC
        const utc = new Date(utcMs);

        const formatTime = (d) => d.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const istEl = document.getElementById('liveIstTime');
        const estEl = document.getElementById('liveEstTime');
        const utcEl = document.getElementById('liveUtcTime');

        if (istEl) istEl.textContent = formatTime(ist);
        if (estEl) estEl.textContent = formatTime(est);
        if (utcEl) utcEl.textContent = formatTime(utc);

        const sessions = getMarketSessionInfo();

        const istStatus = document.getElementById('liveIstStatus');
        const estStatus = document.getElementById('liveEstStatus');
        if (istStatus) {
            istStatus.textContent = sessions.india.text;
            istStatus.className = `clock-status ${sessions.india.open ? 'open-live' : 'closed-live'}`;
        }
        if (estStatus) {
            estStatus.textContent = sessions.us.text;
            estStatus.className = `clock-status ${sessions.us.open ? 'open-live' : 'closed-live'}`;
        }

        // Macro Cards Status Pills
        const macroIndia = document.getElementById('macroIndiaStatus');
        const macroUs = document.getElementById('macroUsStatus');
        const macroCrypto = document.getElementById('macroCryptoStatus');

        if (macroIndia) {
            macroIndia.textContent = sessions.india.open ? 'OPEN 🟢' : 'CLOSED 🔴';
            macroIndia.className = `session-pill ${sessions.india.open ? 'open' : 'closed'}`;
        }
        if (macroUs) {
            macroUs.textContent = sessions.us.open ? 'OPEN 🟢' : 'CLOSED 🔴';
            macroUs.className = `session-pill ${sessions.us.open ? 'open' : 'closed'}`;
        }
        if (macroCrypto) {
            macroCrypto.textContent = '24/7 OPEN 🟢';
            macroCrypto.className = 'session-pill open';
        }
    }

    updateClocks();
    setInterval(updateClocks, 1000);
}


// ==============================================================================
// MASTER PROFESSIONAL MARKET ANALYSIS AI RENDERER (SMC + MULTI-CONFLUENCE)
// ==============================================================================
async function loadMasterAnalysis(symbol) {
    const symbolClean = (symbol || currentSymbol || 'NIFTY50').toUpperCase();
    try {
        const res = await fetch(`/api/master-analysis/${symbolClean}`);
        if (!res.ok) throw new Error('Master analysis fetch failed');
        const data = await res.json();
        renderMasterAnalysis(data);
    } catch (err) {
        console.error('Failed to load Master Analysis:', err);
    }
}

function renderMasterAnalysis(data) {
    const currency = data.meta.currency || '₹';
    const base = data.meta.basePrice || data.currentPrice;

    // Header Meta
    const headerSym = document.getElementById('mHeaderSymbol');
    if (headerSym) headerSym.textContent = `${data.meta.name || data.symbol} (${currency}${formatNumber(data.currentPrice, base)})`;

    // 1. Overview Panel
    setElText('mOverviewName', `${data.meta.name || data.symbol} (${data.meta.sector || 'Equities'})`);
    setElText('mOverviewPrice', `${currency}${formatNumber(data.currentPrice, base)}`);
    setElText('mOverviewMarket', `${data.meta.market || 'IN'} Exchange Session`);
    
    const verEl = document.getElementById('mOverviewVerified');
    if (verEl) {
        verEl.textContent = data.isLive ? 'LIVE EXCHANGE FEED' : 'OFFICIAL CLOSE (LTP)';
        verEl.className = `m-stat-val badge-tag ${data.isLive ? 'badge-bull' : 'badge-bear'}`;
    }

    setElText('mOverviewTrend', data.structure.trend);
    setElText('mOverviewZone', data.structure.currentZone);
    setElText('mOverviewAdx', data.volumeProfile.adxStrength);
    setElText('mOverviewVerdict', data.masterHindi.section1_Overview.points[1] || 'ANALYZED');
    setElText('mOverviewAtr', `${currency}${formatNumber(data.currentPrice * 0.012, base)}`);
    setElText('mOverviewRvol', `${data.volumeProfile.rvol}x`);
    setElText('mOverviewRvolStatus', data.volumeProfile.rvolStatus);
    setElText('mOverviewFeed', data.source);
    setElText('mOverviewIntegrityNote', data.masterHindi.section1_Overview.points[4] || 'Verified Institutional Feed.');

    // 2. Price Action & Structure Panel
    setElText('mCandlePattern', data.candlestickPattern.name);
    setElText('mCandleBias', data.candlestickPattern.bias);
    setElText('mCandleRel', data.candlestickPattern.reliability);
    setElText('mCandleDesc', data.candlestickPattern.description);
    setElText('mCandleTrap', `⚠️ Traps & False Signals: ${data.candlestickPattern.trap}`);

    setElText('mSwingHigh', `${currency}${formatNumber(data.structure.lastHigh, base)}`);
    setElText('mSwingLow', `${currency}${formatNumber(data.structure.lastLow, base)}`);
    setElText('mBosStatus', data.structure.bos ? data.structure.bos.message : 'No Recent Structural Break (Consolidating)');
    setElText('mChochStatus', data.structure.choch ? data.structure.choch.message : 'No Structural Inversion (CHoCH Intact)');
    setElText('mStructureExplanation', data.masterHindi.section3_MarketStructure.educationalRule);

    setElText('mRangeHigh', `${currency}${formatNumber(data.structure.rangeHigh, base)}`);
    setElText('mEquilibrium', `${currency}${formatNumber(data.structure.equilibrium, base)}`);
    setElText('mRangeLow', `${currency}${formatNumber(data.structure.rangeLow, base)}`);
    setElText('mOteRange', `🎯 Optimal Trade Entry (OTE: 61.8% – 78.6% Golden Pocket): ${currency}${formatNumber(data.structure.ote.min, base)} – ${currency}${formatNumber(data.structure.ote.max, base)}`);

    // 3. Smart Money Concepts (SMC) Panel
    setElText('mBslLevel', `${currency}${formatNumber(data.smc.liquidity.bsl, base)} (Retail Buy-Stops Clustered Here)`);
    setElText('mSslLevel', `${currency}${formatNumber(data.smc.liquidity.ssl, base)} (Retail Sell-Stops Trapped Here)`);
    setElText('mEqualLevels', data.smc.liquidity.equalHighs.detected ? 'Equal Highs (EQH) Detected' : (data.smc.liquidity.equalLows.detected ? 'Equal Lows (EQL) Detected' : 'No Equal Liquidity Clusters'));
    setElText('mSweepEvent', data.smc.liquidity.sweepEvent ? `${data.smc.liquidity.sweepEvent.type}: ${data.smc.liquidity.sweepEvent.action}` : 'No Recent Institutional Stop Hunt / Sweep Detected');

    // Order Blocks
    const obContainer = document.getElementById('mOrderBlocksList');
    if (obContainer) {
        if (data.smc.orderBlocks && data.smc.orderBlocks.length > 0) {
            obContainer.innerHTML = data.smc.orderBlocks.map(ob => `
                <div class="m-stat-row">
                    <span class="m-stat-label">${ob.type}</span>
                    <span class="m-stat-val ${ob.type.includes('BULLISH') ? 'text-green' : 'text-red'}">
                        ${currency}${formatNumber(ob.bottom, base)} – ${currency}${formatNumber(ob.top, base)}
                        <span class="badge-tag ${ob.status.includes('ACTIVE') ? 'badge-bull' : 'badge-purp'}" style="margin-left:6px;">${ob.status}</span>
                    </span>
                </div>
            `).join('');
        } else {
            obContainer.innerHTML = '<p style="color:#94a3b8; font-size:0.85rem;">No fresh unmitigated order blocks in current price corridor.</p>';
        }
    }

    // FVGs
    const fvgContainer = document.getElementById('mFvgList');
    if (fvgContainer) {
        if (data.smc.fvgs && data.smc.fvgs.length > 0) {
            fvgContainer.innerHTML = data.smc.fvgs.map(f => `
                <div class="m-stat-row">
                    <span class="m-stat-label">${f.type} (${f.candleDate})</span>
                    <span class="m-stat-val">
                        ${currency}${formatNumber(f.bottom, base)} – ${currency}${formatNumber(f.top, base)}
                        <span class="badge-tag ${f.status.includes('UNMITIGATED') ? 'badge-bull' : 'badge-neu'}" style="margin-left:6px;">${f.status}</span>
                    </span>
                </div>
            `).join('');
        } else {
            fvgContainer.innerHTML = '<p style="color:#94a3b8; font-size:0.85rem;">All recent price imbalances (FVGs) have been filled/mitigated.</p>';
        }
    }

    // 4. Volume Profile & POC Panel
    setElText('mPocVal', `${currency}${formatNumber(data.volumeProfile.poc, base)}`);
    setElText('mVahVal', `${currency}${formatNumber(data.volumeProfile.vah, base)}`);
    setElText('mValVal', `${currency}${formatNumber(data.volumeProfile.val, base)}`);
    setElText('mVwapVal', `${currency}${formatNumber(data.volumeProfile.vwap, base)}`);
    setElText('mVolumeProfileNote', data.volumeProfile.volumeProfileInterpretation);

    setElText('mPcrVal', data.derivatives.pcr);
    setElText('mPcrVerdict', data.derivatives.pcrVerdict);
    setElText('mMaxCallOi', `${currency}${formatNumber(data.derivatives.maxCallOI, base)}`);
    setElText('mMaxPutOi', `${currency}${formatNumber(data.derivatives.maxPutOI, base)}`);
    setElText('mMaxPain', `${currency}${formatNumber(data.derivatives.maxPain, base)}`);

    // 5. Roadmaps & Risk Rules Panel
    const bull = data.scenarios.bullishPlan;
    const bear = data.scenarios.bearishPlan;

    setElText('mBullTrigger', bull.triggerCondition);
    setElText('mBullEntry', `${currency}${bull.entryZone}`);
    setElText('mBullSl', `${currency}${formatNumber(bull.stopLoss, base)}`);
    setElText('mBullT1', `${currency}${formatNumber(bull.target1, base)}`);
    setElText('mBullT2', `${currency}${formatNumber(bull.target2, base)}`);
    setElText('mBullRr', bull.riskReward);
    setElText('mBullInvalidation', `🚫 Invalidation Rule: ${bull.invalidation}`);

    setElText('mBearTrigger', bear.triggerCondition);
    setElText('mBearEntry', `${currency}${bear.entryZone}`);
    setElText('mBearSl', `${currency}${formatNumber(bear.stopLoss, base)}`);
    setElText('mBearT1', `${currency}${formatNumber(bear.target1, base)}`);
    setElText('mBearT2', `${currency}${formatNumber(bear.target2, base)}`);
    setElText('mBearRr', bear.riskReward);
    setElText('mBearInvalidation', `🚫 Invalidation Rule: ${bear.invalidation}`);

    const riskList = document.getElementById('mRiskRulesList');
    if (riskList) {
        riskList.innerHTML = data.scenarios.riskManagementRules.map(r => `<li>${r}</li>`).join('');
    }

    // 6. Hindi Classroom Panel
    const classroom = document.getElementById('mHindiClassroomContent');
    if (classroom && data.masterHindi) {
        const h = data.masterHindi;
        classroom.innerHTML = `
            <div class="quote-highlight" style="margin-top:0; margin-bottom:18px;">
                "${h.roleStatement}"
            </div>

            <h4>${h.section1_Overview.title}</h4>
            <ul>
                ${h.section1_Overview.points.map(p => `<li>${p}</li>`).join('')}
            </ul>

            <h4>${h.section2_PriceAction.title}</h4>
            <p><b>पैटर्न:</b> ${h.section2_PriceAction.patternName} (${h.section2_PriceAction.bias} Bias)</p>
            <p>${h.section2_PriceAction.explanation}</p>
            <div class="formula-card">⚠️ ट्रैप चेतावनी: ${h.section2_PriceAction.falseSignalTrap}</div>
            <p>${h.section2_PriceAction.technicalTakeaway}</p>

            <h4>${h.section3_MarketStructure.title}</h4>
            <p><b>ट्रेंड:</b> ${h.section3_MarketStructure.trend}</p>
            <p><b>BOS (Break of Structure):</b> ${h.section3_MarketStructure.bosStatus}</p>
            <p><b>CHoCH (Change of Character):</b> ${h.section3_MarketStructure.chochStatus}</p>
            <div class="formula-card">💡 सिद्धांत: ${h.section3_MarketStructure.educationalRule}</div>

            <h4>${h.section4_SMC.title}</h4>
            <p><b>Buy-Side Liquidity (BSL):</b> ${h.section4_SMC.bslLevel}</p>
            <p><b>Sell-Side Liquidity (SSL):</b> ${h.section4_SMC.sslLevel}</p>
            <p><b>Order Blocks:</b> ${h.section4_SMC.orderBlockSummary}</p>
            <p><b>FVG (Imbalances):</b> ${h.section4_SMC.fvgSummary}</p>
            <div class="formula-card">${h.section4_SMC.premiumDiscountGuidance}</div>

            <h4>${h.section5_VolumeAndDerivatives.title}</h4>
            <p><b>Point of Control (POC):</b> ${h.section5_VolumeAndDerivatives.poc}</p>
            <p><b>Anchored VWAP:</b> ${h.section5_VolumeAndDerivatives.vwap}</p>
            <p><b>ADX Trend Strength:</b> ${h.section5_VolumeAndDerivatives.adx}</p>
            <p><b>Derivatives / PCR:</b> ${h.section5_VolumeAndDerivatives.pcr} | ${h.section5_VolumeAndDerivatives.optionsOI}</p>
            <div class="formula-card">🧠 वॉल्यूम सबक: ${h.section5_VolumeAndDerivatives.volumeLesson}</div>

            <h4>${h.section7_RiskMastery.title}</h4>
            <ul>
                ${h.section7_RiskMastery.rules.map(r => `<li>${r}</li>`).join('')}
            </ul>
            <div class="quote-highlight">
                "${h.section7_RiskMastery.goldenQuote}"
            </div>
        `;
    }
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
