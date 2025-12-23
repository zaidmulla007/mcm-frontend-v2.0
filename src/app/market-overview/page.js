"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";

function CoinFilter({ selectedCoins, onCoinToggle, onSelectAll, onClearAll, availableCoins, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  const filteredCoins = availableCoins.filter(coin =>
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maxCoins = 5;
  const canSelectMore = selectedCoins.length < maxCoins;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: "relative", marginBottom: 20 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          background: "#fff",
          border: "2px solid #e5e7eb",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          color: "#374151",
          transition: "all 0.2s"
        }}
      >
        <span>Select Coins ({selectedCoins.length}/{maxCoins} max)</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <path d="M2 4l4 4 4-4H2z" />
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          marginTop: 8,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          zIndex: 1000,
          minWidth: 380,
          maxHeight: 500,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Header with quick actions */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Select Coins (Max {maxCoins})</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={onClearAll}
                  style={{
                    padding: "4px 10px",
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search coins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                fontSize: 13,
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
              Loading coins from Binance...
            </div>
          )}

          {/* Scrollable coin list */}
          {!isLoading && (
            <div style={{ overflowY: "auto", maxHeight: 380 }}>
              {filteredCoins.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#6b7280" }}>
                  No coins found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredCoins.map((coin) => {
                  const isSelected = selectedCoins.includes(coin.symbol);
                  const isDisabled = !isSelected && !canSelectMore;

                  return (
                    <label
                      key={coin.symbol}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 16px",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        transition: "background 0.2s",
                        background: isSelected ? "#eff6ff" : "transparent",
                        opacity: isDisabled ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isDisabled) {
                          e.currentTarget.style.background = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isDisabled && onCoinToggle(coin.symbol)}
                        disabled={isDisabled}
                        style={{
                          width: 18,
                          height: 18,
                          marginRight: 12,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          accentColor: "#3b82f6"
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
                          {coin.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          {coin.symbol}/USDT
                        </div>
                      </div>
                      {coin.price && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                          ${parseFloat(coin.price).toLocaleString()}
                        </div>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TradingViewMarketOverview({ selectedCoins }) {
  const ref = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ref.current || selectedCoins.length === 0) return;

    setIsLoading(true);
    const container = ref.current;
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const symbols = selectedCoins.map(coin => ({
      s: `BINANCE:${coin.symbol}USDT`,
      d: coin.name
    }));

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "light",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "100%",
      showSymbolLogo: true,
      tabs: [{ title: "Selected Coins", symbols }]
    });

    script.onload = () => setIsLoading(false);
    script.onerror = () => setIsLoading(false);

    container.appendChild(script);
    return () => {
      if (container) container.innerHTML = '';
      setIsLoading(false);
    };
  }, [selectedCoins]);

  if (selectedCoins.length === 0) {
    return (
      <div style={{ background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.7), rgba(250, 245, 255, 0.7))", backdropFilter: "blur(12px)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)", border: "1px solid rgba(255, 255, 255, 0.6)", marginBottom: 16, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 14, color: "#6b7280" }}>Please select at least one coin to view the market overview</p>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.7), rgba(250, 245, 255, 0.7))", backdropFilter: "blur(12px)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)", border: "1px solid rgba(255, 255, 255, 0.6)", marginBottom: 16, minHeight: 550, overflow: "hidden" }}>
      <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>Crypto Market Overview</div>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>Quick overview of selected coins with mini charts, showing price movements and percentage changes at a glance</p>
      <div ref={ref} style={{ height: 490, overflow: "hidden" }} />
    </div>
  );
}

function TradingViewHeatmap() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      dataSource: "Crypto",
      blockSize: "market_cap_calc",
      blockColor: "change",
      locale: "en",
      symbolUrl: "",
      colorTheme: "light",
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      width: "100%",
      height: "100%"
    });

    container.appendChild(script);
    return () => { if (container) container.innerHTML = ''; };
  }, []);

  return (
    <div style={{ background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.7), rgba(250, 245, 255, 0.7))", backdropFilter: "blur(12px)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)", border: "1px solid rgba(255, 255, 255, 0.6)", marginBottom: 16, minHeight: 550, overflow: "hidden" }}>
      <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 15 }}>Crypto Coins Heatmap</div>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>Visual representation of crypto market performance</p>
      <div ref={ref} style={{ height: 470, overflow: "hidden" }} />
    </div>
  );
}

function TradingViewScreener({ selectedCoins }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || selectedCoins.length === 0) return;

    const container = ref.current;
    container.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetContainer);

    const tickers = selectedCoins.map(coin => `BINANCE:${coin.symbol}USDT`);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      defaultColumn: "overview",
      defaultScreen: "general",
      market: "crypto",
      showToolbar: true,
      colorTheme: "light",
      width: "100%",
      height: "100%",
      locale: "en",
      isTransparent: false,
      tickers: tickers
    });

    // Add a small delay to ensure the container is fully rendered
    setTimeout(() => {
      container.appendChild(script);
    }, 100);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [selectedCoins]);

  if (selectedCoins.length === 0) {
    return (
      <div style={{ background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.7), rgba(250, 245, 255, 0.7))", backdropFilter: "blur(12px)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)", border: "1px solid rgba(255, 255, 255, 0.6)", marginBottom: 16, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 14, color: "#6b7280" }}>Please select at least one coin to view the screener</p>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.7), rgba(250, 245, 255, 0.7))", backdropFilter: "blur(12px)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)", border: "1px solid rgba(255, 255, 255, 0.6)", marginBottom: 16, minHeight: 600, overflow: "hidden" }}>
      <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>Crypto Market Screener (USDT Pairs)</div>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>Advanced screener showing selected USDT pairs with metrics like volume, market cap, and performance</p>
      <div ref={ref} style={{ height: 540, width: "100%", overflow: "hidden" }} />
    </div>
  );
}

function TradingViewFullMarket() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      defaultColumn: "overview",
      screener_type: "crypto_mkt",
      displayCurrency: "USD",
      colorTheme: "light",
      locale: "en"
    });

    container.appendChild(script);
    return () => { if (container) container.innerHTML = ''; };
  }, []);

  return (
    <div style={{ background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.7), rgba(250, 245, 255, 0.7))", backdropFilter: "blur(12px)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)", border: "1px solid rgba(255, 255, 255, 0.6)", marginBottom: 16, minHeight: 600, overflow: "hidden" }}>
      <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>Full Crypto Market Data</div>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>Comprehensive list of all cryptocurrencies with detailed market data, perfect for in-depth market analysis</p>
      <div ref={ref} style={{ height: 540, overflow: "hidden" }} />
    </div>
  );
}

function TradingViewCrossRates({ selectedCoins }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || selectedCoins.length === 0) return;
    const container = ref.current;
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const currencies = selectedCoins.map(coin => coin.symbol);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      currencies: currencies,
      isTransparent: false,
      colorTheme: "light",
      locale: "en"
    });

    container.appendChild(script);
    return () => { if (container) container.innerHTML = ''; };
  }, [selectedCoins]);

  if (selectedCoins.length === 0) {
    return (
      <div style={{ background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.7), rgba(250, 245, 255, 0.7))", backdropFilter: "blur(12px)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)", border: "1px solid rgba(255, 255, 255, 0.6)", marginBottom: 16, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 14, color: "#6b7280" }}>Please select at least one coin to view cross rates</p>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.7), rgba(250, 245, 255, 0.7))", backdropFilter: "blur(12px)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)", border: "1px solid rgba(255, 255, 255, 0.6)", marginBottom: 16, minHeight: 500, overflow: "hidden" }}>
      <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>Crypto Cross Rates</div>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>Currency pair rates showing how selected cryptocurrencies perform against each other in a convenient matrix view</p>
      <div ref={ref} style={{ height: 440, overflow: "hidden" }} />
    </div>
  );
}

function TradingViewTopCryptos({ selectedCoins }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || selectedCoins.length === 0) return;
    const container = ref.current;
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    const symbols = selectedCoins.map(coin => [
      coin.name,
      `BINANCE:${coin.symbol}USDT|1D`
    ]);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols,
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "en",
      colorTheme: "light",
      autosize: false,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent"
    });

    container.appendChild(script);
    return () => { if (container) container.innerHTML = ''; };
  }, [selectedCoins]);

  if (selectedCoins.length === 0) {
    return (
      <div style={{ background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.7), rgba(250, 245, 255, 0.7))", backdropFilter: "blur(12px)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)", border: "1px solid rgba(255, 255, 255, 0.6)", marginBottom: 16, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 14, color: "#6b7280" }}>Please select at least one coin to view detailed charts</p>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.7), rgba(250, 245, 255, 0.7))", backdropFilter: "blur(12px)", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)", border: "1px solid rgba(255, 255, 255, 0.6)", marginBottom: 16, minHeight: 500, overflow: "hidden" }}>
      <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>Selected Cryptos Overview</div>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>Detailed charts for selected cryptocurrencies showing 1-day price movements and trading patterns</p>
      <div ref={ref} style={{ height: 440, overflow: "hidden" }} />
    </div>
  );
}

export default function MarketOverview() {
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'screener', 'heatmap'
  const [selectedCoins, setSelectedCoins] = useState([]);
  const [availableCoins, setAvailableCoins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch coins from Binance API
  useEffect(() => {
    const fetchBinanceCoins = async () => {
      try {
        setIsLoading(true);

        // Fetch ticker prices from Binance REST API
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();

        // Filter only USDT pairs and sort by volume
        const usdtPairs = data
          .filter(ticker => ticker.symbol.endsWith('USDT') && !ticker.symbol.includes('UP') && !ticker.symbol.includes('DOWN'))
          .map(ticker => ({
            symbol: ticker.symbol.replace('USDT', ''),
            name: ticker.symbol.replace('USDT', ''),
            pair: `BINANCE:${ticker.symbol}`,
            price: ticker.lastPrice,
            volume: parseFloat(ticker.quoteVolume),
            priceChange: parseFloat(ticker.priceChangePercent)
          }))
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 200); // Get top 200 by volume

        setAvailableCoins(usdtPairs);

        // Auto-select BTC, ETH, SOL, XRP (or BNB if XRP not available) by default
        const defaultSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB'];
        const defaultCoins = [];

        for (const symbol of defaultSymbols) {
          const coin = usdtPairs.find(c => c.symbol === symbol);
          if (coin && defaultCoins.length < 4) {
            defaultCoins.push(coin);
          }
        }

        // If we still don't have 4 coins, fill with top coins by volume
        if (defaultCoins.length < 4) {
          const remainingCount = 4 - defaultCoins.length;
          const topCoins = usdtPairs
            .filter(c => !defaultCoins.some(dc => dc.symbol === c.symbol))
            .slice(0, remainingCount);
          defaultCoins.push(...topCoins);
        }

        setSelectedCoins(defaultCoins);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Binance coins:', error);
        setIsLoading(false);
      }
    };

    fetchBinanceCoins();
  }, []);

  const handleCoinToggle = (symbol) => {
    setSelectedCoins(prev => {
      const coin = availableCoins.find(c => c.symbol === symbol);
      const isSelected = prev.some(c => c.symbol === symbol);

      if (isSelected) {
        return prev.filter(c => c.symbol !== symbol);
      } else {
        if (prev.length >= 5) {
          return prev; // Max 5 coins
        }
        return [...prev, coin];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedCoins(availableCoins.slice(0, 5)); // Only select first 5
  };

  const handleClearAll = () => {
    setSelectedCoins([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 text-gray-900 font-sans overflow-x-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="mx-auto px-4 pb-8 pt-5 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-bold drop-shadow-sm mb-4">
              <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                Market Overview & Analysis
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full shadow-lg shadow-indigo-500/50"></div>
          </div>

          {/* Toggle Buttons */}
          <div className="bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-2xl p-2 shadow-xl shadow-indigo-500/10 border border-white/50 mb-8 inline-flex gap-2">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${activeView === 'overview'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-transparent text-gray-700 hover:bg-white/60'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('screener')}
              className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${activeView === 'screener'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-transparent text-gray-700 hover:bg-white/60'
                }`}
            >
              Screener
            </button>
            <button
              onClick={() => setActiveView('heatmap')}
              className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${activeView === 'heatmap'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-transparent text-gray-700 hover:bg-white/60'
                }`}
            >
              Heatmap
            </button>
          </div>

          {/* Coin Filter - Show in Overview and Screener views */}
          {(activeView === 'overview' || activeView === 'screener') && (
            <CoinFilter
              selectedCoins={selectedCoins.map(c => c.symbol)}
              onCoinToggle={handleCoinToggle}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
              availableCoins={availableCoins}
              isLoading={isLoading}
            />
          )}

          {/* Overview View */}
          {activeView === 'overview' && (
            <>
              <TradingViewMarketOverview selectedCoins={selectedCoins} />
              <TradingViewTopCryptos selectedCoins={selectedCoins} />
              <TradingViewFullMarket />
            </>
          )}

          {/* Screener View */}
          {activeView === 'screener' && (
            <TradingViewScreener selectedCoins={selectedCoins} />
          )}

          {/* Heatmap View */}
          {activeView === 'heatmap' && (
            <TradingViewHeatmap />
          )}
        </div>
      </main>
    </div>
  );
}
