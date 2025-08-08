// All imports remain the same
import React, { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import "./App.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function App() {
  const [holdings, setHoldings] = useState([]);
  const [filteredHoldings, setFilteredHoldings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [allocation, setAllocation] = useState({
    bySector: {},
    byMarketCap: {},
  });
  const [performance, setPerformance] = useState({ timeline: [], returns: {} });
  const [filteredPerformance, setFilteredPerformance] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [holdingsRes, allocationRes, performanceRes, summaryRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/portfolio/holdings"),
            fetch("http://localhost:5000/api/portfolio/allocation"),
            fetch("http://localhost:5000/api/portfolio/performance"),
            fetch("http://localhost:5000/api/portfolio/summary"),
          ]);

        if (
          !holdingsRes.ok ||
          !allocationRes.ok ||
          !performanceRes.ok ||
          !summaryRes.ok
        ) {
          throw new Error("Network response was not ok");
        }

        const holdingsData = await holdingsRes.json();
        const allocationData = await allocationRes.json();
        const performanceData = await performanceRes.json();
        const summaryData = await summaryRes.json();

        setHoldings(holdingsData);
        setFilteredHoldings(holdingsData);
        setAllocation(allocationData);
        setPerformance(performanceData);
        setFilteredPerformance(performanceData.timeline);
        setSummary(summaryData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = holdings.filter(
      (h) =>
        h.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const direction = sortConfig.direction === "asc" ? 1 : -1;
        if (a[sortConfig.key] < b[sortConfig.key]) return -1 * direction;
        if (a[sortConfig.key] > b[sortConfig.key]) return 1 * direction;
        return 0;
      });
    }

    setFilteredHoldings(filtered);
  }, [searchTerm, sortConfig, holdings]);

  useEffect(() => {
    if (!performance.timeline || performance.timeline.length === 0) return;

    const now = new Date();
    let filtered = [...performance.timeline];

    if (range !== "ALL") {
      const days = {
        "1M": 30,
        "3M": 90,
        "1Y": 365,
      }[range];

      filtered = performance.timeline.filter((item) => {
        const itemDate = new Date(item.date);
        const diffTime = now - itemDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= days;
      });
    }

    // Sort by date ascending
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    setFilteredPerformance(filtered);
  }, [range, performance.timeline]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const createTooltipOptions = () => ({
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total =
              context.chart._metasets[context.datasetIndex].total || 1;
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  });

  const sectorData = {
    labels: Object.keys(allocation.bySector),
    datasets: [
      {
        data: Object.values(allocation.bySector).map((s) => s.value),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
        hoverBackgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
      },
    ],
  };

  const marketCapData = {
    labels: Object.keys(allocation.byMarketCap),
    datasets: [
      {
        data: Object.values(allocation.byMarketCap).map((m) => m.value),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const performanceChartData = {
    labels: filteredPerformance.map((p) =>
      new Date(p.date).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Portfolio",
        data: filteredPerformance.map((p) => p.portfolio),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "Nifty 50",
        data: filteredPerformance.map((p) => p.nifty50),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
      {
        label: "Gold",
        data: filteredPerformance.map((p) => p.gold),
        backgroundColor: "rgba(255, 206, 86, 0.6)",
      },
    ],
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  return (
    <div
      className="App"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        color: "#374151",
      }}
    >
      {/* Header Bar */}
      <header
        style={{
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          padding: "1.5rem 2rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            textAlign: "center",
            color: "#4f46e5",
            margin: 0,
          }}
        >
          Portfolio Analytics Dashboard
        </h1>
      </header>
      <main style={{ padding: "0 1rem", maxWidth: "1280px", margin: "0 auto" }}>
        {/* Portfolio Summary Section */}
        <div style={{ marginBottom: "2rem" }}>
          {/* Section Header */}
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#374151",
              marginBottom: "1rem",
              marginTop: 0,
            }}
          >
            Portfolio Summary
          </h2>

          {/* Summary Cards */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {/* Total Portfolio Value Card */}
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6B7280",
                  marginBottom: "0.5rem",
                }}
              >
                Total Portfolio Value
              </h3>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                ${summary.totalValue?.toLocaleString()}
              </p>
            </div>

            {/* Total Gain/Loss Card */}
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6B7280",
                  marginBottom: "0.5rem",
                }}
              >
                Total Gain/Loss
              </h3>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: summary.totalGainLoss >= 0 ? "#059669" : "#DC2626",
                }}
              >
                ${summary.totalGainLoss?.toLocaleString()}
              </p>
            </div>

            {/* Performance % Card */}
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6B7280",
                  marginBottom: "0.5rem",
                }}
              >
                Performance %
              </h3>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color:
                    summary.totalGainLossPercent >= 0 ? "#059669" : "#DC2626",
                }}
              >
                {summary.totalGainLossPercent?.toFixed(2)}%
              </p>
            </div>

            {/* Number of Holdings Card */}
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6B7280",
                  marginBottom: "0.5rem",
                }}
              >
                Number of Holdings
              </h3>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {holdings.length}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div
          style={{
            display: "flex",
            gap: "2rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          {/* Sector Distribution Chart */}
          <div
            style={{
              flex: 1,
              minWidth: "400px",
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#374151",
                marginBottom: "1rem",
                textAlign: "center",
                margin: "0 0 1rem 0",
              }}
            >
              Sector Distribution
            </h2>
            <div
              style={{
                height: "350px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Pie
                data={sectorData}
                options={{
                  ...createTooltipOptions(),
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        padding: 15,
                        font: {
                          size: 11,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Market Cap Distribution Chart */}
          <div
            style={{
              flex: 1,
              minWidth: "400px",
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#374151",
                marginBottom: "1rem",
                textAlign: "center",
                margin: "0 0 1rem 0",
              }}
            >
              Market Cap Distribution
            </h2>
            <div
              style={{
                height: "350px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Pie
                data={marketCapData}
                options={{
                  ...createTooltipOptions(),
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        padding: 15,
                        font: {
                          size: 12,
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="holdings-table">
          <h2>Holdings</h2>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Search by symbol or name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "0.5rem",
                width: "100%",
                maxWidth: "300px",
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            />
          </div>
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort("symbol")}>Symbol</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Avg. Price</th>
                <th>Current Price</th>
                <th onClick={() => requestSort("value")}>Value</th>
                <th onClick={() => requestSort("gainLoss")}>Gain/Loss</th>
                <th onClick={() => requestSort("gainLossPercent")}>
                  Gain/Loss %
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.map((holding) => (
                <tr key={holding.symbol}>
                  <td>{holding.symbol}</td>
                  <td>{holding.name}</td>
                  <td>{holding.quantity}</td>
                  <td>${holding.avgPrice.toFixed(2)}</td>
                  <td>${holding.currentPrice.toFixed(2)}</td>
                  <td>${holding.value.toLocaleString()}</td>
                  <td
                    className={
                      holding.gainLoss >= 0 ? "text-green" : "text-red"
                    }
                  >
                    ${holding.gainLoss.toLocaleString()}
                  </td>
                  <td
                    className={
                      holding.gainLossPercent >= 0 ? "text-green" : "text-red"
                    }
                  >
                    {holding.gainLossPercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="performance-chart"
          style={{
            backgroundColor: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "#374151",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            Performance Comparison
          </h2>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.5rem",
              gap: "0.5rem",
            }}
          >
            {["1M", "3M", "1Y", "ALL"].map((label) => (
              <button
                key={label}
                onClick={() => setRange(label)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: range === label ? "#4f46e5" : "#e5e7eb",
                  color: range === label ? "white" : "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: range === label ? "600" : "400",
                  transition: "all 0.2s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ height: "400px" }}>
            {filteredPerformance.length > 0 ? (
              <Bar
                data={{
                  labels: filteredPerformance.map((p) =>
                    new Date(p.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      ...(range === "1Y" || range === "ALL"
                        ? { year: "numeric" }
                        : {}),
                    })
                  ),
                  datasets: [
                    {
                      label: "Portfolio",
                      data: filteredPerformance.map((p) => p.portfolio),
                      backgroundColor: "rgba(54, 162, 235, 0.6)",
                      borderColor: "rgba(54, 162, 235, 1)",
                      borderWidth: 1,
                    },
                    {
                      label: "Nifty 50",
                      data: filteredPerformance.map((p) => p.nifty50),
                      backgroundColor: "rgba(255, 99, 132, 0.6)",
                      borderColor: "rgba(255, 99, 132, 1)",
                      borderWidth: 1,
                    },
                    {
                      label: "Gold",
                      data: filteredPerformance.map((p) => p.gold),
                      backgroundColor: "rgba(255, 206, 86, 0.6)",
                      borderColor: "rgba(255, 206, 86, 1)",
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: false,
                      ticks: {
                        callback: function (value) {
                          return "$" + value.toLocaleString();
                        },
                      },
                    },
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          let label = context.dataset.label || "";
                          if (label) {
                            label += ": ";
                          }
                          label += "$" + context.parsed.y.toLocaleString();
                          return label;
                        },
                      },
                    },
                  },
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "#6b7280",
                }}
              >
                No data available for the selected time range
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          {/* Section Header */}
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#374151",
              marginBottom: "1rem",
              marginTop: 0,
            }}
          >
            Performance Summary
          </h2>

          {/* Performance Cards */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {/* Best Performer Card */}
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6B7280",
                  marginBottom: "0.5rem",
                }}
              >
                Best Performer
              </h3>
              <p
                style={{
                  fontSize: "1rem",
                  color: "#111827",
                  marginBottom: "0.25rem",
                }}
              >
                {summary.topPerformer?.name} ({summary.topPerformer?.symbol})
              </p>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#059669",
                }}
              >
                {summary.topPerformer?.gainPercent?.toFixed(2)}%
              </p>
            </div>

            {/* Worst Performer Card */}
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6B7280",
                  marginBottom: "0.5rem",
                }}
              >
                Worst Performer
              </h3>
              <p
                style={{
                  fontSize: "1rem",
                  color: "#111827",
                  marginBottom: "0.25rem",
                }}
              >
                {summary.worstPerformer?.name} ({summary.worstPerformer?.symbol}
                )
              </p>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#DC2626",
                }}
              >
                {summary.worstPerformer?.gainPercent?.toFixed(2)}%
              </p>
            </div>

            {/* Diversification Card */}
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6B7280",
                  marginBottom: "0.5rem",
                }}
              >
                Diversification
              </h3>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#111827",
                  marginBottom: "0.25rem",
                }}
              >
                {summary.diversificationScore}/10
              </p>
              <div
                style={{
                  height: "6px",
                  backgroundColor: "#E5E7EB",
                  borderRadius: "3px",
                  overflow: "hidden",
                  marginTop: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: `${summary.diversificationScore * 10}%`,
                    height: "100%",
                    backgroundColor: "#4F46E5",
                  }}
                ></div>
              </div>
            </div>

            {/* Risk Level Card */}
            <div
              style={{
                flex: 1,
                minWidth: "200px",
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#6B7280",
                  marginBottom: "0.5rem",
                }}
              >
                Risk Level
              </h3>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color:
                    summary.riskLevel === "High"
                      ? "#DC2626"
                      : summary.riskLevel === "Moderate"
                      ? "#D97706"
                      : "#059669",
                }}
              >
                {summary.riskLevel}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                {["Low", "Moderate", "High"].map((level) => (
                  <div
                    key={level}
                    style={{
                      flex: 1,
                      height: "6px",
                      backgroundColor:
                        level === "High"
                          ? "#DC2626"
                          : level === "Moderate"
                          ? "#D97706"
                          : "#059669",
                      opacity: summary.riskLevel === level ? 1 : 0.2,
                      borderRadius: "3px",
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
