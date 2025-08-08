// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample portfolio data (hardcoded as per assignment requirements)
const portfolioHoldings = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    quantity: 50,
    avgPrice: 2450.0,
    currentPrice: 2680.5,
    sector: "Energy",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "INFY",
    name: "Infosys Limited",
    quantity: 100,
    avgPrice: 1800.0,
    currentPrice: 2010.75,
    sector: "Technology",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    quantity: 75,
    avgPrice: 3200.0,
    currentPrice: 3450.25,
    sector: "Technology",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Limited",
    quantity: 80,
    avgPrice: 1650.0,
    currentPrice: 1580.3,
    sector: "Banking",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Limited",
    quantity: 60,
    avgPrice: 1100.0,
    currentPrice: 1235.8,
    sector: "Banking",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel Limited",
    quantity: 120,
    avgPrice: 850.0,
    currentPrice: 920.45,
    sector: "Telecommunications",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "ITC",
    name: "ITC Limited",
    quantity: 200,
    avgPrice: 420.0,
    currentPrice: 465.2,
    sector: "Consumer Goods",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "BAJFINANCE",
    name: "Bajaj Finance Limited",
    quantity: 25,
    avgPrice: 6800.0,
    currentPrice: 7150.6,
    sector: "Financial Services",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "ASIANPAINT",
    name: "Asian Paints Limited",
    quantity: 40,
    avgPrice: 3100.0,
    currentPrice: 2890.75,
    sector: "Consumer Discretionary",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "MARUTI",
    name: "Maruti Suzuki India Limited",
    quantity: 30,
    avgPrice: 9500.0,
    currentPrice: 10250.3,
    sector: "Automotive",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "WIPRO",
    name: "Wipro Limited",
    quantity: 150,
    avgPrice: 450.0,
    currentPrice: 485.6,
    sector: "Technology",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "TATAMOTORS",
    name: "Tata Motors Limited",
    quantity: 100,
    avgPrice: 650.0,
    currentPrice: 720.85,
    sector: "Automotive",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "TECHM",
    name: "Tech Mahindra Limited",
    quantity: 80,
    avgPrice: 1200.0,
    currentPrice: 1145.25,
    sector: "Technology",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "AXISBANK",
    name: "Axis Bank Limited",
    quantity: 90,
    avgPrice: 980.0,
    currentPrice: 1055.4,
    sector: "Banking",
    marketCap: "Large",
    exchange: "NSE",
  },
  {
    symbol: "SUNPHARMA",
    name: "Sun Pharmaceutical Industries Ltd",
    quantity: 60,
    avgPrice: 1150.0,
    currentPrice: 1245.3,
    sector: "Healthcare",
    marketCap: "Large",
    exchange: "NSE",
  },
];

// Helper functions for calculations
const calculateHoldingMetrics = (holding) => {
  const value = holding.quantity * holding.currentPrice;
  const investedValue = holding.quantity * holding.avgPrice;
  const gainLoss = value - investedValue;
  const gainLossPercent = (gainLoss / investedValue) * 100;

  return {
    ...holding,
    value: parseFloat(value.toFixed(2)),
    gainLoss: parseFloat(gainLoss.toFixed(2)),
    gainLossPercent: parseFloat(gainLossPercent.toFixed(2)),
  };
};

const calculateAllocation = (holdings) => {
  const holdingsWithMetrics = holdings.map(calculateHoldingMetrics);
  const totalValue = holdingsWithMetrics.reduce(
    (sum, holding) => sum + holding.value,
    0
  );

  // Calculate by sector
  const sectorAllocation = {};
  holdingsWithMetrics.forEach((holding) => {
    if (!sectorAllocation[holding.sector]) {
      sectorAllocation[holding.sector] = { value: 0 };
    }
    sectorAllocation[holding.sector].value += holding.value;
  });

  // Add percentages
  Object.keys(sectorAllocation).forEach((sector) => {
    sectorAllocation[sector].percentage = parseFloat(
      ((sectorAllocation[sector].value / totalValue) * 100).toFixed(1)
    );
  });

  // Calculate by market cap
  const marketCapAllocation = {};
  holdingsWithMetrics.forEach((holding) => {
    if (!marketCapAllocation[holding.marketCap]) {
      marketCapAllocation[holding.marketCap] = { value: 0 };
    }
    marketCapAllocation[holding.marketCap].value += holding.value;
  });

  // Add percentages
  Object.keys(marketCapAllocation).forEach((cap) => {
    marketCapAllocation[cap].percentage = parseFloat(
      ((marketCapAllocation[cap].value / totalValue) * 100).toFixed(1)
    );
  });

  return {
    bySector: sectorAllocation,
    byMarketCap: marketCapAllocation,
  };
};

const calculateSummary = (holdings) => {
  const holdingsWithMetrics = holdings.map(calculateHoldingMetrics);
  const totalValue = holdingsWithMetrics.reduce(
    (sum, holding) => sum + holding.value,
    0
  );
  const totalInvested = holdingsWithMetrics.reduce(
    (sum, holding) => sum + holding.quantity * holding.avgPrice,
    0
  );
  const totalGainLoss = totalValue - totalInvested;
  const totalGainLossPercent = (totalGainLoss / totalInvested) * 100;

  // Find best and worst performers
  const sortedByPerformance = holdingsWithMetrics.sort(
    (a, b) => b.gainLossPercent - a.gainLossPercent
  );
  const topPerformer = sortedByPerformance[0];
  const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1];

  // Calculate diversification score (simplified - based on number of sectors)
  const sectors = [...new Set(holdings.map((h) => h.sector))];
  const diversificationScore = Math.min(10, sectors.length * 1.2).toFixed(1);

  // Determine risk level based on portfolio volatility (simplified)
  const avgGainLossPercent =
    holdingsWithMetrics.reduce(
      (sum, h) => sum + Math.abs(h.gainLossPercent),
      0
    ) / holdingsWithMetrics.length;
  let riskLevel = "Low";
  if (avgGainLossPercent > 15) riskLevel = "High";
  else if (avgGainLossPercent > 8) riskLevel = "Moderate";

  return {
    totalValue: parseFloat(totalValue.toFixed(2)),
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    totalGainLoss: parseFloat(totalGainLoss.toFixed(2)),
    totalGainLossPercent: parseFloat(totalGainLossPercent.toFixed(2)),
    topPerformer: {
      symbol: topPerformer.symbol,
      name: topPerformer.name,
      gainPercent: topPerformer.gainLossPercent,
    },
    worstPerformer: {
      symbol: worstPerformer.symbol,
      name: worstPerformer.name,
      gainPercent: worstPerformer.gainLossPercent,
    },
    diversificationScore: parseFloat(diversificationScore),
    riskLevel,
  };
};

// API Routes

// 1. Portfolio Holdings Endpoint
app.get("/api/portfolio/holdings", (req, res) => {
  try {
    const holdingsWithMetrics = portfolioHoldings.map(calculateHoldingMetrics);
    res.json(holdingsWithMetrics);
  } catch (error) {
    console.error("Error fetching holdings:", error);
    res.status(500).json({ error: "Failed to fetch portfolio holdings" });
  }
});

// 2. Portfolio Allocation Endpoint
app.get("/api/portfolio/allocation", (req, res) => {
  try {
    const allocation = calculateAllocation(portfolioHoldings);
    res.json(allocation);
  } catch (error) {
    console.error("Error calculating allocation:", error);
    res.status(500).json({ error: "Failed to calculate portfolio allocation" });
  }
});

// 3. Performance Comparison Endpoint
app.get("/api/portfolio/performance", (req, res) => {
  try {
    // Generate more comprehensive sample performance data
    const currentValue = portfolioHoldings.reduce(
      (sum, holding) => sum + holding.quantity * holding.currentPrice,
      0
    );

    const generateDataPoint = (
      monthsAgo,
      valueMultiplier,
      niftyBase,
      goldBase
    ) => {
      const date = new Date();
      date.setMonth(date.getMonth() - monthsAgo);
      return {
        date: date.toISOString().split("T")[0],
        portfolio: Math.round(currentValue * valueMultiplier),
        nifty50: Math.round(niftyBase * (0.95 + Math.random() * 0.1)),
        gold: Math.round(goldBase * (0.95 + Math.random() * 0.1)),
      };
    };

    const timeline = [
      generateDataPoint(12, 0.75, 18000, 58000), // 1 year ago
      generateDataPoint(6, 0.85, 19000, 60000), // 6 months ago
      generateDataPoint(3, 0.9, 20000, 61000), // 3 months ago
      generateDataPoint(1, 0.95, 21000, 62000), // 1 month ago
      {
        date: new Date().toISOString().split("T")[0],
        portfolio: Math.round(currentValue),
        nifty50: 23500,
        gold: 68000,
      },
    ];

    const returns = {
      portfolio: {
        "1month": 5.3,
        "3months": 11.1,
        "1year": 25.7,
      },
      nifty50: {
        "1month": 4.8,
        "3months": 9.2,
        "1year": 18.4,
      },
      gold: {
        "1month": 1.5,
        "3months": 6.1,
        "1year": 12.9,
      },
    };

    res.json({ timeline, returns });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    res.status(500).json({ error: "Failed to fetch performance data" });
  }
});

// 4. Portfolio Summary Endpoint
app.get("/api/portfolio/summary", (req, res) => {
  try {
    const summary = calculateSummary(portfolioHoldings);
    res.json(summary);
  } catch (error) {
    console.error("Error calculating summary:", error);
    res.status(500).json({ error: "Failed to calculate portfolio summary" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Portfolio Analytics API server running on port ${PORT}`);
});

module.exports = app;
