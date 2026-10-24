# 📈 Vectivor — Quantitative Market Trajectory & Direction Terminal

Vectivor is an institutional-grade, real-time quantitative market analysis platform designed to forecast market direction (**BULLISH / UPWARD**, **BEARISH / DOWNWARD**, or **RANGEBOUND / CONSOLIDATION**) across **95+ assets** in Indian equities, US equities, cryptocurrencies, and global commodities.

![Vectivor Terminal](public/style.css)

---

## 🌟 Key Features

* **Multi-Market Confluence Engine:**
  * **Indian Equities & Indices (40+):** NIFTY 50, Bank Nifty, Sensex, Reliance, TCS, HDFC Bank, Tata Motors, L&T, Infosys, Adani, Zomato, etc.
  * **US Equities & Tech Giants (40+):** NASDAQ, S&P 500, Dow Jones, NVIDIA, Apple, Microsoft, Tesla, Google, Amazon, Meta, AMD, Palantir, etc.
  * **Crypto Assets (13+):** Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Binance Coin (BNB), Ripple (XRP), Dogecoin (DOGE), Cardano (ADA), etc.
  * **Commodities:** Gold Spot, Silver Spot, Brent Crude Oil.

* **Real-Time Data Integration:**
  * Real-time exchange WebSocket & REST feeds directly from **Binance** (Crypto).
  * Real-time market feed from **Yahoo Finance** (Global & Indian Equities).

* **Quantitative Indicator Suite:**
  * **14-Period Wilder's RSI** with dynamic overbought/oversold exhaustion detection.
  * **EMA Trend Hierarchy:** 20 EMA, 50 EMA, and 200 EMA golden cross and alignment.
  * **MACD (12, 26, 9)** with signal line divergence and histogram expansion.
  * **Bollinger Bands (20, 2)** with bandwidth squeeze/expansion tracking.
  * **ATR Dynamic Volatility:** Mathematical Primary Target (1.5x ATR), Extended Target (2.8x ATR), and Risk-to-Reward stop-loss protection (1.1x ATR).
  * **Support & Resistance:** Classic & Fibonacci Pivot Point levels (R2, R1, PP, S1, S2).

* **Interactive Candlestick Chart:**
  * Real-time canvas chart with 20 EMA (Cyan) and 50 EMA (Orange) overlays.
  * Hover tooltips with Open, High, Low, Close, and Volume details.

* **Macro Market Breadth:**
  * Real-time macro sentiment indicators for Indian Market, US Wall Street, and Crypto Market.

---

## 🚀 Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [npm](https://www.npmjs.com/)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/liShivam/vectivor.git
   cd vectivor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the terminal server:**
   ```bash
   npm start
   # or
   node server.js
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

---

## ⚖️ License & Disclaimer

This software is for educational, analytical, and research purposes. All market forecasts, trajectory probabilities, and target levels are generated via mathematical algorithms. Trading financial markets carries risk; always implement disciplined risk management and stop-loss safeguards.

Distributed under the MIT License.
