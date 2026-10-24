// ==============================================================================
// VECTIVOR PAPER TRADING & VIRTUAL PORTFOLIO ENGINE
// Simulated execution environment with real-time mark-to-market P&L
// ==============================================================================

class PaperTradingAccount {
    constructor(initialCash = 100000) {
        this.initialCash = initialCash;
        this.cashBalance = initialCash;
        this.positions = new Map(); // symbol -> { symbol, quantity, avgPrice, totalCost, market }
        this.orders = []; // historical orders
        this.realizedPnL = 0;
    }

    reset(newBalance = 100000) {
        this.initialCash = newBalance;
        this.cashBalance = newBalance;
        this.positions.clear();
        this.orders = [];
        this.realizedPnL = 0;
        return this.getAccountSummary();
    }

    placeOrder(symbol, side, quantity, currentPrice, orderType = 'MARKET') {
        const qty = parseInt(quantity, 10);
        const price = parseFloat(currentPrice);

        if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
            throw new Error('Invalid order quantity or execution price.');
        }

        const totalCost = qty * price;

        if (side.toUpperCase() === 'BUY') {
            if (totalCost > this.cashBalance) {
                throw new Error(`Insufficient simulated cash ($${Math.round(this.cashBalance).toLocaleString()}). Required: $${Math.round(totalCost).toLocaleString()}`);
            }

            this.cashBalance -= totalCost;
            const existing = this.positions.get(symbol);
            if (existing) {
                const combinedQty = existing.quantity + qty;
                const combinedCost = existing.totalCost + totalCost;
                existing.quantity = combinedQty;
                existing.totalCost = combinedCost;
                existing.avgPrice = Math.round((combinedCost / combinedQty) * 100) / 100;
            } else {
                this.positions.set(symbol, {
                    symbol,
                    quantity: qty,
                    avgPrice: price,
                    totalCost: Math.round(totalCost * 100) / 100
                });
            }
        } else if (side.toUpperCase() === 'SELL') {
            const existing = this.positions.get(symbol);
            if (!existing || existing.quantity < qty) {
                throw new Error(`Insufficient shares to sell. Available: ${existing ? existing.quantity : 0}, Requested: ${qty}`);
            }

            const costBasisForShares = (existing.totalCost / existing.quantity) * qty;
            const proceeds = totalCost;
            const tradePnL = proceeds - costBasisForShares;
            this.realizedPnL += tradePnL;
            this.cashBalance += proceeds;

            existing.quantity -= qty;
            existing.totalCost -= costBasisForShares;

            if (existing.quantity <= 0) {
                this.positions.delete(symbol);
            }
        } else {
            throw new Error('Invalid side (must be BUY or SELL).');
        }

        const orderRecord = {
            id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            symbol,
            side: side.toUpperCase(),
            quantity: qty,
            price: Math.round(price * 100) / 100,
            orderType,
            status: 'EXECUTED_SIMULATED',
            totalValue: Math.round(totalCost * 100) / 100
        };

        this.orders.unshift(orderRecord);
        return orderRecord;
    }

    getAccountSummary(livePriceMap = {}) {
        let openPositionsValue = 0;
        let totalUnrealizedPnL = 0;

        const positionsList = [];
        this.positions.forEach(pos => {
            const currentPrice = livePriceMap[pos.symbol] || pos.avgPrice;
            const marketValue = pos.quantity * currentPrice;
            const unrealizedPnL = marketValue - pos.totalCost;
            const pnlPercent = pos.totalCost > 0 ? (unrealizedPnL / pos.totalCost) * 100 : 0;

            openPositionsValue += marketValue;
            totalUnrealizedPnL += unrealizedPnL;

            positionsList.push({
                symbol: pos.symbol,
                quantity: pos.quantity,
                avgPrice: pos.avgPrice,
                currentPrice: Math.round(currentPrice * 100) / 100,
                marketValue: Math.round(marketValue * 100) / 100,
                unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
                pnlPercent: Math.round(pnlPercent * 10) / 10
            });
        });

        const totalPortfolioValue = this.cashBalance + openPositionsValue;
        const totalReturnPercent = this.initialCash > 0 ? ((totalPortfolioValue - this.initialCash) / this.initialCash) * 100 : 0;

        return {
            isSimulated: true,
            initialCash: this.initialCash,
            cashBalance: Math.round(this.cashBalance * 100) / 100,
            positionsValue: Math.round(openPositionsValue * 100) / 100,
            totalPortfolioValue: Math.round(totalPortfolioValue * 100) / 100,
            realizedPnL: Math.round(this.realizedPnL * 100) / 100,
            unrealizedPnL: Math.round(totalUnrealizedPnL * 100) / 100,
            totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
            openPositions: positionsList,
            recentOrders: this.orders.slice(0, 20)
        };
    }
}

// Global in-memory instance for session
const defaultAccount = new PaperTradingAccount(100000);

module.exports = {
    PaperTradingAccount,
    defaultAccount
};
