"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

/* Your internal API (returns coin data) */
const API_BASE = "/api/admin/coinindex/mcmdb/filter";

/* TradingView Widget Component */
function TradingViewWidget({ widgetType, symbol, config = {} }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !symbol) return;

    // Clear previous content
    const widgetContainer = containerRef.current;
    widgetContainer.innerHTML = '<div class="tradingview-widget-container__widget"></div>';

    // Create and append script
    const script = document.createElement('script');
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widgetType}.js`;
    script.async = true;
    script.type = 'text/javascript';

    const widgetConfig = {
      symbol: `BINANCE:${symbol.toUpperCase()}USDT`,
      ...config
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    widgetContainer.appendChild(script);

    return () => {
      // Cleanup
      if (widgetContainer) {
        widgetContainer.innerHTML = '';
      }
    };
  }, [widgetType, symbol, JSON.stringify(config)]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: '100%', width: '100%' }}
    />
  );
}

/* Binance REST/ws base */
const BINANCE_REST = "https://api.binance.com/api/v3/ticker/24hr";

/* Inline version of connectBinanceTicker for this component */
function connectBinanceTicker(binanceSymbol, onMessage, onError) {
  if (!binanceSymbol) throw new Error("binanceSymbol required");

  const symbol = String(binanceSymbol).toLowerCase().trim();
  const url = `wss://stream.binance.com:9443/ws/${symbol}@ticker`;

  let ws;
  try {
    ws = new WebSocket(url);
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }

  ws.onopen = () => {
    // console.log("WS open:", symbol);
  };

  ws.onmessage = (evt) => {
    try {
      const raw = JSON.parse(evt.data);
      const mapped = {
        eventType: raw.e,
        eventTime: raw.E,
        symbol: raw.s,
        priceChange: raw.p !== undefined ? Number(raw.p) : null,
        priceChangePercent: raw.P !== undefined ? Number(raw.P) : null,
        weightedAvgPrice: raw.w !== undefined ? Number(raw.w) : null,
        prevClosePrice: raw.x !== undefined ? Number(raw.x) : null,
        lastPrice: raw.c !== undefined ? Number(raw.c) : null,
        lastQty: raw.Q !== undefined ? Number(raw.Q) : null,
        bidPrice: raw.b !== undefined ? Number(raw.b) : null,
        bidQty: raw.B !== undefined ? Number(raw.B) : null,
        askPrice: raw.a !== undefined ? Number(raw.a) : null,
        askQty: raw.A !== undefined ? Number(raw.A) : null,
        openPrice: raw.o !== undefined ? Number(raw.o) : null,
        highPrice: raw.h !== undefined ? Number(raw.h) : null,
        lowPrice: raw.l !== undefined ? Number(raw.l) : null,
        volume: raw.v !== undefined ? Number(raw.v) : null,
        quoteVolume: raw.q !== undefined ? Number(raw.q) : null,
        openTime: raw.O !== undefined ? raw.O : null,
        closeTime: raw.C !== undefined ? raw.C : null,
        firstTradeId: raw.F !== undefined ? raw.F : null,
        lastTradeId: raw.L !== undefined ? raw.L : null,
        tradeCount: raw.n !== undefined ? raw.n : null,
        raw,
        lastUpdate: Date.now(),
      };

      onMessage(mapped);
    } catch (err) {
      console.error("Error parsing Binance WS message:", err, evt.data);
    }
  };

  ws.onerror = (err) => {
    console.error("Binance WS error for", symbol, err);
    if (onError) onError(err);
  };

  ws.onclose = () => {
    // console.log("Binance WS closed:", symbol);
  };

  return () => {
    try {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    } catch (e) {}
  };
}

/* small presentational helper */
function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      fontSize: "13px"
    }}>
      <div style={{ color: "#6b7280" }}>{label}</div>
      <div style={{
        fontWeight: 600,
        textAlign: "right",
        color: valueColor || "#111"
      }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

/* AI Summary Display Component */
function AISummaryCard({ title, data }) {
  if (!data || typeof data !== 'object') {
    return (
      <div style={{
        background: "#fff",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 15 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>No summary available</div>
      </div>
    );
  }

  const renderField = (key, value) => {
    if (value === null || value === undefined || value === "") return null;

    // Format the key to be human-readable
    const label = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Check if this is the why_it_matters field (make it bold)
    const isBold = key.toLowerCase().includes('why') && key.toLowerCase().includes('matters');

    return (
      <div key={key} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f3f4f6" }}>
        <div style={{
          fontWeight: isBold ? 900 : 700,
          fontSize: isBold ? 14 : 13,
          color: isBold ? "#0066cc" : "#111",
          marginBottom: 8,
          letterSpacing: isBold ? "0.3px" : "normal"
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 13,
          color: "#374151",
          lineHeight: 1.7,
          paddingLeft: 12,
          borderLeft: isBold ? "3px solid #0066cc" : "2px solid #e5e7eb",
          whiteSpace: "pre-wrap"
        }}>
          {value}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      padding: 20,
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      height: "100%"
    }}>
      <div style={{
        fontWeight: 800,
        marginBottom: 16,
        fontSize: 15,
        paddingBottom: 12,
        borderBottom: "2px solid #e5e7eb"
      }}>
        {title}
      </div>
      <div style={{
        maxHeight: 550,
        overflowY: "auto",
        paddingRight: 8,
        scrollbarWidth: "thin"
      }}>
        {Object.entries(data).map(([key, value]) => renderField(key, value))}
      </div>
    </div>
  );
}

export default function CoinDetail() {
  const params = useParams();
  const router = useRouter();
  const coinId = params.coinId;

  console.log("CoinDetail component mounted/rendered with coinId:", coinId);

  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Binance live data using the enhanced socket */
  const [binanceLive, setBinanceLive] = useState(null);
  const [wsError, setWsError] = useState(null);

  /* coingecko data (if available) */
  const [coingeckoData, setCoingeckoData] = useState(null);
  const [cgLoading, setCgLoading] = useState(false);

  /* comparison coin selector - fetch all coins and allow selection (max 5) */
  const [allCoins, setAllCoins] = useState([]);
  const [selectedComparisonCoins, setSelectedComparisonCoins] = useState([
    { name: "Ethereum", symbol: "ETH", source_id: "ethereum" }
  ]);
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const [coinSearch, setCoinSearch] = useState("");

  /* Check if coin has USDT pair on Binance */
  const [hasUsdtPair, setHasUsdtPair] = useState(true);

  // Fetch all coins for comparison selector and filter only USDT pairs from Binance
  useEffect(() => {
    async function fetchAllCoins() {
      try {
        const res = await fetch(`${API_BASE}?coinindex=true`);
        const json = await res.json();
        const items = json.results || [];

        // Get list of available USDT pairs from Binance
        const binanceRes = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const binanceData = await binanceRes.json();
        const usdtPairs = new Set(
          binanceData.symbols
            .filter(s => s.symbol.endsWith('USDT') && s.status === 'TRADING')
            .map(s => s.baseAsset.toLowerCase())
        );

        // Filter coins that have USDT pairs and deduplicate by symbol (keep highest market cap)
        const symbolMap = new Map();
        items.forEach((c) => {
          if (!c.symbol || !usdtPairs.has(c.symbol.toLowerCase())) return;

          const existing = symbolMap.get(c.symbol.toLowerCase());
          if (!existing) {
            symbolMap.set(c.symbol.toLowerCase(), c);
          } else {
            const existingCap = Number(existing.market_cap_usd) || 0;
            const currentCap = Number(c.market_cap_usd) || 0;
            if (currentCap > existingCap) {
              symbolMap.set(c.symbol.toLowerCase(), c);
            }
          }
        });

        // Convert to normalized array
        const normalized = Array.from(symbolMap.values()).map((c) => ({
          name: c.name || "Unknown",
          symbol: c.symbol || "?",
          source_id: c.source_id || "",
          image_thumb: c.image_thumb || c.image_small || c.image_large || "",
          market_cap_usd: c.market_cap_usd || 0
        }));

        setAllCoins(normalized);
      } catch (error) {
        console.error("Error fetching coins for comparison:", error);
      }
    }
    fetchAllCoins();
  }, []);

  useEffect(() => {
    if (!coinId) return;

    setLoading(true);
    console.log("Fetching coin data for:", coinId);

    async function loadCoinData() {
      try {
        // Fetch coin data
        const coinRes = await fetch(`${API_BASE}?source_id=${encodeURIComponent(coinId)}`);
        const coinJson = await coinRes.json();
        console.log("Received coin data:", coinJson);
        const found = coinJson.results?.[0] ?? null;
        console.log("Found coin:", found);
        setCoin(found);

        // Check if coin has USDT pair on Binance
        if (found?.symbol) {
          try {
            const binanceRes = await fetch('https://api.binance.com/api/v3/exchangeInfo');
            const binanceData = await binanceRes.json();
            const usdtPairs = new Set(
              binanceData.symbols
                .filter(s => s.symbol.endsWith('USDT') && s.status === 'TRADING')
                .map(s => s.baseAsset.toLowerCase())
            );
            const hasPair = usdtPairs.has(found.symbol.toLowerCase());
            setHasUsdtPair(hasPair);
            console.log(`Coin ${found.symbol} has USDT pair:`, hasPair);
          } catch (error) {
            console.error("Error checking Binance USDT pairs:", error);
            setHasUsdtPair(false);
          }
        } else {
          setHasUsdtPair(false);
        }
      } catch (e) {
        console.error("coin fetch error", e);
        setCoin(null);
        setHasUsdtPair(false);
      } finally {
        console.log("Loading finished");
        setLoading(false);
      }
    }

    loadCoinData();
  }, [coinId]);

  // Connect to Binance WebSocket using enhanced helper
  useEffect(() => {
    if (!coin?.symbol || !hasUsdtPair) {
      setBinanceLive(null);
      return;
    }

    const sym = `${coin.symbol.toLowerCase()}usdt`;

    const cleanup = connectBinanceTicker(
      sym,
      (data) => {
        setBinanceLive(data);
        setWsError(null);
      },
      (err) => {
        setWsError(String(err));
      }
    );

    return cleanup;
  }, [coin?.symbol, hasUsdtPair]);

  // fetch coingecko coin details if coin.source_id exists
  useEffect(() => {
    async function loadCG() {
      if (!coin?.source_id) {
        setCoingeckoData(null);
        return;
      }
      setCgLoading(true);
      try {
        const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coin.source_id)}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`;
        const res = await fetch(url);
        if (!res.ok) {
          setCoingeckoData(null);
        } else {
          const j = await res.json();
          setCoingeckoData(j);
        }
      } catch (e) {
        console.error("coingecko fetch error", e);
        setCoingeckoData(null);
      } finally {
        setCgLoading(false);
      }
    }
    loadCG();
  }, [coin?.source_id]);

  if (loading) {
    return (
      <div style={{
        padding: 20,
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "50vh"
      }}>
        <div style={{ fontSize: 18, color: "#6b7280" }}>Loading coin data...</div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div style={{
        padding: 20,
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        <h2>Coin not found</h2>
        <p>Could not find data for coin ID: {coinId}</p>
        <button
          onClick={() => router.push('/coins-list')}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14,
            marginTop: 16
          }}
        >
          Back to Coins List
        </button>
      </div>
    );
  }

  const aiSummary = coin?.ai_summary ?? null;
  const ai7 = aiSummary?.["7_days"] ?? aiSummary?.["7days"] ?? null;
  const ai24 = aiSummary?.["24_hours"] ?? aiSummary?.["24hours"] ?? null;
  const ai6 = aiSummary?.["6_hours"] ?? aiSummary?.["6hours"] ?? null;

  const priceChangeColor = binanceLive?.priceChangePercent >= 0 ? "#16a34a" : "#ef4444";

  return (
    <div style={{
      padding: "20px",
      maxWidth: "1400px",
      margin: "0 auto"
    }}>
      {/* Back Button */}
      {/* <button
        onClick={() => router.push('/coins-list')}
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: 14,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}
      >
        ← Back to Coins List
      </button> */}

      {/* TOP SECTION: Left Column (Coin + Sentiment) + Right Card (Live Binance Table) */}
      <div style={{
        display: hasUsdtPair ? "grid" : "block",
        gridTemplateColumns: hasUsdtPair ? "400px 1fr" : undefined,
        gap: hasUsdtPair ? 16 : 0,
        marginBottom: 16
      }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Coin Identity Card with Price in One Row */}
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {/* Logo */}
              {coin.image_large || coin.image_small || coin.image_thumb ? (
                <img
                  src={coin.image_large || coin.image_small || coin.image_thumb}
                  alt={coin.name}
                  loading="eager"
                  decoding="async"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    display: "block",
                    backgroundColor: "#f3f4f6"
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                  }}
                />
              ) : null}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: (coin.image_large || coin.image_small || coin.image_thumb) ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f3f4f6",
                  fontWeight: 700,
                  color: "#6b7280",
                  fontSize: 18,
                  flexShrink: 0
                }}
              >
                {(coin.symbol || "?")[0]}
              </div>

              {/* Name and Symbol */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 900,
                  lineHeight: 1.2,
                  color: "#111"
                }}>
                  {coin.name}
                </div>
                <div style={{
                  color: "#6b7280",
                  fontSize: 12,
                  fontWeight: 500,
                  marginTop: 2
                }}>
                  ({coin.symbol?.toUpperCase()}) #{coin.market_cap_rank ?? "—"}
                </div>
              </div>

              {/* Price and Change in Same Row */}
              {binanceLive && hasUsdtPair && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#111",
                    lineHeight: 1.2,
                    letterSpacing: "-0.3px"
                  }}>
                    {binanceLive.lastPrice
                      ? `$${binanceLive.lastPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                      : "—"
                    }
                  </div>
                  <div style={{
                    marginTop: 2,
                    fontSize: 11,
                    fontWeight: 700,
                    color: priceChangeColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 3
                  }}>
                    <span>
                      {binanceLive.priceChangePercent !== null && binanceLive.priceChangePercent > 0 ? "▲" : "▼"}
                    </span>
                    <span>
                      {binanceLive.priceChangePercent !== null
                        ? `${Math.abs(binanceLive.priceChangePercent).toFixed(2)}%`
                        : "—"
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Price Ticker */}
          {hasUsdtPair && (
            <div style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 15 }}>
                {coin.name} Live Price Ticker
              </div>
              <div style={{ height: 180, overflow: "hidden" }}>
                <TradingViewWidget
                  widgetType="single-quote"
                  symbol={coin.symbol}
                  config={{
                    width: "100%",
                    height: "180",
                    colorTheme: "light",
                    isTransparent: false,
                    locale: "en"
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT CARD: Live Binance Data Table */}
        {hasUsdtPair && (
          <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            Live Market Data (Binance)
            {binanceLive && (
              <span style={{
                fontSize: 11,
                color: "#16a34a",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                • LIVE
              </span>
            )}
          </div>

          {wsError && (
            <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>
              WebSocket Error: {wsError}
            </div>
          )}

          {binanceLive ? (
            <div style={{ overflow: "hidden" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px"
              }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: "13px" }}>Metric</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: "#6b7280", fontWeight: 600, fontSize: "13px" }}>Value</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: "13px" }}>Metric</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", color: "#6b7280", fontWeight: 600, fontSize: "13px" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>24h High</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.highPrice ? `$${binanceLive.highPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>24h Low</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.lowPrice ? `$${binanceLive.lowPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "—"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Open Price</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.openPrice ? `$${binanceLive.openPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Prev Close</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.prevClosePrice ? `$${binanceLive.prevClosePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "—"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Weighted Avg</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.weightedAvgPrice ? `$${binanceLive.weightedAvgPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Price Change</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: priceChangeColor, fontSize: "13px" }}>
                      {binanceLive.priceChange ? `$${binanceLive.priceChange.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "—"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Bid Price</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.bidPrice ? `$${binanceLive.bidPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Bid Qty</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.bidQty ? binanceLive.bidQty.toLocaleString(undefined, {maximumFractionDigits: 4}) : "—"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Ask Price</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.askPrice ? `$${binanceLive.askPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Ask Qty</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.askQty ? binanceLive.askQty.toLocaleString(undefined, {maximumFractionDigits: 4}) : "—"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Volume (24h)</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.volume ? binanceLive.volume.toLocaleString(undefined, {maximumFractionDigits: 2}) : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Quote Volume</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.quoteVolume ? `$${binanceLive.quoteVolume.toLocaleString(undefined, {maximumFractionDigits: 0})}` : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}>Trade Count</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}>
                      {binanceLive.tradeCount ? binanceLive.tradeCount.toLocaleString() : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#6b7280", fontSize: "13px" }}></td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontSize: "13px" }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              Connecting to Binance WebSocket...
            </div>
          )}
        </div>
        )}
      </div>

      {/* TradingView Widgets Section - Coin Specific Only (Only if USDT pair exists) */}
      {coin?.symbol && hasUsdtPair && (
        <>
          {/* 1. Advanced Chart */}
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: 16,
            overflow: "hidden"
          }}>
            <div style={{ fontWeight: 800, marginBottom: 16, fontSize: 15 }}>
              {coin.name} Advanced Chart
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
              Professional trading chart with technical indicators, drawing tools, and multiple timeframes for detailed price analysis
            </p>
            <div style={{ height: 600, overflow: "hidden" }}>
              <TradingViewWidget
                widgetType="advanced-chart"
                symbol={coin.symbol}
                config={{
                  autosize: true,
                  interval: "60",
                  timezone: "Etc/UTC",
                  theme: "light",
                  style: "1",
                  locale: "en",
                  enable_publishing: false,
                  hide_top_toolbar: false,
                  allow_symbol_change: true,
                  support_host: "https://www.tradingview.com"
                }}
              />
            </div>
          </div>

          {/* 2. Symbol Overview - Coin vs Selected Comparison Coins */}
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: 16,
            overflow: "hidden"
          }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  {coin.name} & Comparison Coins
                </div>
                <button
                  onClick={() => setShowCoinSelector(!showCoinSelector)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 12,
                    color: "#374151",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    fontWeight: 500
                  }}
                >
                  {showCoinSelector ? "Hide Selector" : "Select Coins"}
                </button>
              </div>

              {/* Selected Coins Display */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {selectedComparisonCoins.map((c) => (
                  <div
                    key={c.source_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 8px",
                      background: "#f3f4f6",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 500
                    }}
                  >
                    {c.image_thumb && (
                      <img src={c.image_thumb} alt={c.symbol} style={{ width: 16, height: 16, borderRadius: "50%" }} />
                    )}
                    <span>{c.name} ({c.symbol})</span>
                    <button
                      onClick={() => {
                        setSelectedComparisonCoins(selectedComparisonCoins.filter(sc => sc.source_id !== c.source_id));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        fontWeight: 700,
                        fontSize: 12,
                        padding: 0,
                        marginLeft: 2
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {selectedComparisonCoins.length === 0 && (
                  <div style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>
                    No comparison coins selected
                  </div>
                )}
              </div>

              {/* Coin Selector Dropdown */}
              {showCoinSelector && (
                <div style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  background: "#f9fafb",
                  marginTop: 8
                }}>
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Search coins..."
                      value={coinSearch}
                      onChange={(e) => setCoinSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        fontSize: 12,
                        outline: "none"
                      }}
                    />
                    <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                      {allCoins.filter((c) => {
                        const searchLower = coinSearch.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(searchLower) ||
                          c.symbol.toLowerCase().includes(searchLower)
                        );
                      }).length} USDT pairs available
                    </div>
                  </div>
                  <div style={{
                    maxHeight: 300,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4
                  }}>
                    {allCoins
                      .filter((c) => {
                        const searchLower = coinSearch.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(searchLower) ||
                          c.symbol.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((c) => {
                        const isSelected = selectedComparisonCoins.some(sc => sc.source_id === c.source_id);
                        const isCurrent = c.source_id === coin.source_id;
                        return (
                          <button
                            key={c.source_id}
                            onClick={() => {
                              if (isCurrent) return;
                              if (isSelected) {
                                setSelectedComparisonCoins(selectedComparisonCoins.filter(sc => sc.source_id !== c.source_id));
                              } else {
                                if (selectedComparisonCoins.length >= 5) {
                                  alert("Maximum 5 comparison coins allowed");
                                  return;
                                }
                                setSelectedComparisonCoins([...selectedComparisonCoins, c]);
                              }
                            }}
                            disabled={isCurrent}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 8px",
                              background: isSelected ? "#dbeafe" : "#fff",
                              border: isSelected ? "1px solid #3b82f6" : "1px solid #e5e7eb",
                              borderRadius: 6,
                              cursor: isCurrent ? "not-allowed" : "pointer",
                              fontSize: 11,
                              textAlign: "left",
                              opacity: isCurrent ? 0.5 : 1
                            }}
                          >
                            {c.image_thumb && (
                              <img src={c.image_thumb} alt={c.symbol} style={{ width: 20, height: 20, borderRadius: "50%" }} />
                            )}
                            <span style={{ fontWeight: 500 }}>{c.name}</span>
                            <span style={{ color: "#6b7280" }}>({c.symbol})</span>
                            {isSelected && <span style={{ marginLeft: "auto", color: "#3b82f6", fontWeight: 700 }}>✓</span>}
                            {isCurrent && <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: 10 }}>(Current)</span>}
                          </button>
                        );
                      })}
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 8 }}>
                    Select up to 5 coins to compare with {coin.name}
                  </div>
                </div>
              )}
            </div>

            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
              Side-by-side comparison of {coin.name} with selected coins showing relative performance and price movements
            </p>
            <div style={{ height: 400, overflow: "hidden" }}>
              <TradingViewWidget
                widgetType="symbol-overview"
                symbol={coin.symbol}
                config={{
                  symbols: [
                    [`${coin.name}`, `BINANCE:${coin.symbol.toUpperCase()}USDT|1D`],
                    ...selectedComparisonCoins.map(c => [c.name, `BINANCE:${c.symbol.toUpperCase()}USDT|1D`])
                  ],
                  chartOnly: false,
                  width: "100%",
                  height: "100%",
                  colorTheme: "light",
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
                  changeMode: "price-and-percent",
                  locale: "en"
                }}
              />
            </div>
          </div>

          {/* 3. Symbol Info */}
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: 16,
            overflow: "hidden"
          }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 15 }}>
              {coin.name} Symbol Info
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12, lineHeight: 1.5 }}>
              Quick snapshot of key trading metrics including current price, volume, market cap, and price changes
            </p>
            <div style={{ height: 250, overflow: "hidden" }}>
              <TradingViewWidget
                widgetType="symbol-info"
                symbol={coin.symbol}
                config={{
                  width: "100%",
                  colorTheme: "light",
                  isTransparent: false,
                  locale: "en"
                }}
              />
            </div>
          </div>

          {/* 4. Technical Analysis */}
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: 16,
            overflow: "hidden"
          }}>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 15 }}>
              {coin.name} Technical Analysis
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
              Real-time buy/sell signals based on moving averages, oscillators, and technical indicators across multiple timeframes
            </p>
            <div style={{ height: 400, overflow: "hidden" }}>
              <TradingViewWidget
                widgetType="technical-analysis"
                symbol={coin.symbol}
                config={{
                  interval: "1h",
                  width: "100%",
                  height: "100%",
                  isTransparent: false,
                  showIntervalTabs: true,
                  displayMode: "single",
                  locale: "en",
                  colorTheme: "light"
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* CoinGecko Data Section */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        marginTop: 16
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "2px solid #e5e7eb"
        }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>CoinGecko Data</div>
            {coin?.last_updated && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                Last Updated: {new Date(coin.last_updated).toLocaleString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })} UTC
              </div>
            )}
          </div>
        </div>

        {/* Sentiment Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 15, color: "#111" }}>Sentiment</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <InfoRow
              label="Votes Up %"
              value={coin.sentiment_votes_up_percentage ?? "—"}
            />
            <InfoRow
              label="Votes Down %"
              value={coin.sentiment_votes_down_percentage ?? "—"}
            />
          </div>
        </div>

        {/* Data Grid - 2 columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Basic Info */}
          <div>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 15, color: "#111", paddingBottom: 8, borderBottom: "1px solid #e5e7eb" }}>
              Basic Info
            </div>
            <div style={{ marginTop: 12 }}>
              <InfoRow label="source_id" value={coin.source_id} />
              <InfoRow label="symbol" value={coin.symbol} />
              <InfoRow label="name" value={coin.name} />
              <InfoRow label="source" value={coin.source ?? "—"} />
              <InfoRow label="market_cap_rank" value={coin.market_cap_rank ?? "—"} />
              <InfoRow label="asset_platform_id" value={coin.asset_platform_id ?? "—"} />
              <InfoRow
                label="Circulating Supply"
                value={coingeckoData?.market_data?.circulating_supply
                  ? Number(coingeckoData.market_data.circulating_supply).toLocaleString()
                  : "—"
                }
              />
              <InfoRow
                label="Total Supply"
                value={coingeckoData?.market_data?.total_supply
                  ? Number(coingeckoData.market_data.total_supply).toLocaleString()
                  : "—"
                }
              />
              <InfoRow label="Genesis Date" value={coingeckoData?.genesis_date ?? coin.genesis_date ?? "—"} />
            </div>
          </div>

          {/* GitHub Metrics */}
          <div>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 15, color: "#111", paddingBottom: 8, borderBottom: "1px solid #e5e7eb" }}>
              GitHub Metrics
            </div>
            <div style={{ marginTop: 12 }}>
              <InfoRow
                label="github_stars"
                value={coin.github_stars ?? coingeckoData?.developer_data?.stars ?? "—"}
              />
              <InfoRow
                label="github_forks"
                value={coin.github_forks ?? coingeckoData?.developer_data?.forks ?? "—"}
              />
              <InfoRow
                label="github_subscribers"
                value={coin.github_subscribers ?? coingeckoData?.community_data?.twitter_followers ?? "—"}
              />
              <InfoRow
                label="github_commit_count_4_weeks"
                value={coin.github_commit_count_4_weeks ?? coingeckoData?.developer_data?.commit_count_4_weeks ?? "—"}
              />
              <InfoRow label="github_closed_issues" value={coin.github_closed_issues ?? "—"} />
              <InfoRow label="github_total_issues" value={coin.github_total_issues ?? "—"} />
              <InfoRow label="github_pull_requests_merged" value={coin.github_pull_requests_merged ?? "—"} />
            </div>
          </div>

          {/* Market Overview */}
          <div>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 15, color: "#111", paddingBottom: 8, borderBottom: "1px solid #e5e7eb" }}>
              Market Overview
            </div>
            <div style={{ marginTop: 12 }}>
              <InfoRow
                label="Market Cap (USD)"
                value={coin.market_cap_usd
                  ? `$${Number(coin.market_cap_usd).toLocaleString()}`
                  : "—"
                }
              />
              <InfoRow label="Market Cap / FDV" value={coin.market_cap_fdv_ratio ?? "—"} />
              <InfoRow
                label="Volume (24h USD)"
                value={coin.volume_24h_usd
                  ? Number(coin.volume_24h_usd).toLocaleString()
                  : "—"
                }
              />
              <InfoRow
                label="Market Cap Change 24h"
                value={coin.market_cap_change_percentage_24h ?? "—"}
              />
            </div>
          </div>

          {/* Links & Social */}
          <div>
            <div style={{ fontWeight: 800, marginBottom: 12, fontSize: 15, color: "#111", paddingBottom: 8, borderBottom: "1px solid #e5e7eb" }}>
              Links & Social
            </div>
            <div style={{ marginTop: 12 }}>
              <InfoRow
                label="homepage_url"
                value={coin.homepage_url ?? (coingeckoData?.links?.homepage?.[0] ?? "—")}
              />
              <InfoRow
                label="facebook_username"
                value={coin.facebook_username ?? coingeckoData?.links?.facebook_username ?? "—"}
              />
              <InfoRow
                label="twitter_screen_name"
                value={coin.twitter_screen_name ?? coingeckoData?.links?.twitter_screen_name ?? "—"}
              />
              <InfoRow
                label="reddit_subscribers"
                value={coin.reddit_subscribers ?? coingeckoData?.community_data?.reddit_subscribers ?? "—"}
              />
              <InfoRow label="genesis_date" value={coin.genesis_date ?? coingeckoData?.genesis_date ?? "—"} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Summaries - Three Timeframes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
        <AISummaryCard title="AI Summary — 6 Hours" data={ai6} />
        <AISummaryCard title="AI Summary — 24 Hours" data={ai24} />
        <AISummaryCard title="AI Summary — 7 Days" data={ai7} />
      </div>
    </div>
  );
}
