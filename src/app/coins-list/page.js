"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaSyncAlt } from "react-icons/fa";

const API_URL = "/api/admin/coinindex/mcmdb/filter?coinindex=true";
const BINANCE_REST = "https://api.binance.com/api/v3/ticker/24hr";

function openCombinedWsForSymbols(symbols, onData) {
  if (!symbols || symbols.length === 0) return () => { };
  const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join("/");
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
  let ws;
  try {
    ws = new WebSocket(url);
  } catch (e) {
    return () => { };
  }

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      const data = msg.data ?? msg;
      const sym = data.s; // BTCUSDT
      if (!sym) return;
      const base = sym.replace(/USDT$/i, "");
      const payload = {
        price: data.c !== undefined ? Number(data.c) : null,
        change24h: data.P !== undefined ? Number(data.P) : null,
        volume: data.v !== undefined ? Number(data.v) : null,
        high: data.h !== undefined ? Number(data.h) : null,
        low: data.l !== undefined ? Number(data.l) : null,
        lastUpdate: Date.now(),
      };
      onData(base.toUpperCase(), payload);
    } catch (err) {
      console.error("combined ws parse err", err);
    }
  };

  ws.onerror = (err) => console.error("Binance combined WS error", err);
  return () => {
    try {
      ws && ws.close();
    } catch (e) { }
  };
}

export default function CoinsList() {
  const router = useRouter();
  const [coins, setCoins] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 16;
  const wsRef = useRef(null);
  const symbolToSourceIdMap = useRef({}); // Map symbol to the source_id of the coin with highest market cap

  // Handler for coin click
  const handleCoinClick = (sourceId) => {
    router.push(`/coins-list/${sourceId}`);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        const json = await res.json();
        const items = json.results || [];
        const normalized = items.map((c) => ({
          source_id: c.source_id,
          symbol: (c.symbol || "").toUpperCase(),
          name: c.name,
          image_thumb: c.image_thumb,
          image_small: c.image_small,
          image_large: c.image_large,
          market_cap_rank: c.market_cap_rank,
          market_cap_usd: c.market_cap_usd,
          _search: ((c.name || "") + (c.symbol || "") + (c.source_id || "")).toLowerCase(),
        }));

        setCoins(normalized);
      } catch (err) {
        console.error("loadCoins error", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.toLowerCase());
      setPage(1);
    }, 150);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return coins;
    return coins.filter((c) => c._search.includes(debouncedSearch));
  }, [debouncedSearch, coins]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [page, filtered]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // build binance pairs for current page - only use highest market cap coin for duplicate symbols
  function buildPairs(pageItems) {
    // First, deduplicate by symbol, keeping only the highest market_cap_usd
    const symbolMap = new Map();
    const newSymbolToSourceIdMap = {};

    pageItems.forEach((coin) => {
      if (!coin.symbol) return;
      const existing = symbolMap.get(coin.symbol);
      if (!existing) {
        symbolMap.set(coin.symbol, coin);
        newSymbolToSourceIdMap[coin.symbol] = coin.source_id;
      } else {
        const existingCap = Number(existing.market_cap_usd) || 0;
        const currentCap = Number(coin.market_cap_usd) || 0;
        if (currentCap > existingCap) {
          symbolMap.set(coin.symbol, coin);
          newSymbolToSourceIdMap[coin.symbol] = coin.source_id;
        }
      }
    });

    // Update the ref with the new mapping
    symbolToSourceIdMap.current = newSymbolToSourceIdMap;

    // Build pairs from deduplicated coins
    return Array.from(symbolMap.values())
      .map((c) => `${c.symbol.toUpperCase()}USDT`)
      .filter(Boolean);
  }

  async function fetchSnapshot(symbols) {
    if (!symbols || symbols.length === 0) return [];
    const q = `?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
    try {
      const res = await fetch(BINANCE_REST + q);
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("snapshot err", err);
      return [];
    }
  }

  // when visible page changes, fetch snapshot + open combined ws
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLivePrices({});
      const pairs = buildPairs(paginated);
      if (pairs.length === 0) return;
      const snapshot = await fetchSnapshot(pairs);
      if (cancelled) return;

      const snapMap = {};
      snapshot.forEach((it) => {
        const base = String(it.symbol).replace(/USDT$/i, "").toUpperCase();
        snapMap[base] = {
          price: it.lastPrice !== undefined ? Number(it.lastPrice) : null,
          change24h: it.priceChangePercent !== undefined ? Number(it.priceChangePercent) : null,
          volume: it.volume !== undefined ? Number(it.volume) : null,
          high: it.highPrice !== undefined ? Number(it.highPrice) : null,
          low: it.lowPrice !== undefined ? Number(it.lowPrice) : null,
          lastUpdate: Date.now(),
        };
      });
      setLivePrices((prev) => ({ ...prev, ...snapMap }));

      // cleanup previous ws
      if (wsRef.current) {
        try {
          wsRef.current();
        } catch (e) { }
        wsRef.current = null;
      }

      wsRef.current = openCombinedWsForSymbols(pairs, (base, payload) => {
        setLivePrices((prev) => ({ ...prev, [base]: payload }));
      });
    })();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        try {
          wsRef.current();
        } catch (e) { }
        wsRef.current = null;
      }
    };
  }, [paginated]);

  // FIXED pagination helpers - NO MORE DUPLICATES
  function getPageNumbers(totalPages, currentPage) {
    if (totalPages <= 1) return [1];

    const result = [];
    const showMax = 7; // Maximum page numbers to show (excluding first, last, and ellipsis)

    // Always show first page
    result.push(1);

    if (totalPages <= showMax + 2) {
      // Show all pages if total is small enough
      for (let i = 2; i < totalPages; i++) {
        result.push(i);
      }
    } else {
      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust range to show more pages when near edges
      const pagesBeforeCurrent = currentPage - startPage;
      const pagesAfterCurrent = endPage - currentPage;

      if (pagesBeforeCurrent < 1) {
        endPage = Math.min(totalPages - 1, endPage + (1 - pagesBeforeCurrent));
      }

      if (pagesAfterCurrent < 1) {
        startPage = Math.max(2, startPage - (1 - pagesAfterCurrent));
      }

      // Add left ellipsis if needed
      if (startPage > 2) {
        result.push("...");
      }

      // Add page numbers
      for (let i = startPage; i <= endPage; i++) {
        result.push(i);
      }

      // Add right ellipsis if needed
      if (endPage < totalPages - 1) {
        result.push("...");
      }
    }

    // Always show last page
    if (totalPages > 1) {
      result.push(totalPages);
    }

    // Remove duplicates (safety check)
    const seen = new Set();
    const filtered = [];
    for (const item of result) {
      if (item === "...") {
        // Only add ellipsis if last item wasn't ellipsis
        if (filtered[filtered.length - 1] !== "...") {
          filtered.push(item);
        }
      } else if (!seen.has(item)) {
        seen.add(item);
        filtered.push(item);
      }
    }

    return filtered;
  }

  const pageButtons = useMemo(() => getPageNumbers(totalPages, page), [totalPages, page]);

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 text-gray-900 font-sans overflow-x-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="app-container relative z-10" style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-bold drop-shadow-sm mb-4">
            <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
              All Coins
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full shadow-lg shadow-indigo-500/50"></div>
        </div>

        {/* Search and Controls */}
        <div className="controls bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-2xl p-4 shadow-xl shadow-indigo-500/10 border border-white/50 mb-8" style={{ display: "flex", gap: 12 }}>
          <input
            className="search-input"
            placeholder="Search name or symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 12,
              border: "2px solid rgba(129, 140, 248, 0.2)",
              fontSize: 14,
              outline: "none",
              background: "rgba(255, 255, 255, 0.9)",
              transition: "all 0.3s ease"
            }}
            onFocus={(e) => e.target.style.borderColor = "rgba(99, 102, 241, 0.5)"}
            onBlur={(e) => e.target.style.borderColor = "rgba(129, 140, 248, 0.2)"}
          />
          <button
            className="reload-btn"
            onClick={() => {
              setPage(1);
              setLivePrices({});
              setCoins([]);
              fetch(API_URL)
                .then((r) => r.json())
                .then((j) =>
                  setCoins(
                    (j.results || []).map((c) => ({
                      source_id: c.source_id,
                      symbol: (c.symbol || "").toUpperCase(),
                      name: c.name,
                      image_thumb: c.image_thumb,
                      image_small: c.image_small,
                      image_large: c.image_large,
                      market_cap_rank: c.market_cap_rank,
                      market_cap_usd: c.market_cap_usd,
                      _search: ((c.name || "") + (c.symbol || "") + (c.source_id || "")).toLowerCase(),
                    }))
                  )
                )
                .catch(() => { });
            }}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(to right, rgb(6, 182, 212), rgb(99, 102, 241), rgb(217, 70, 239))",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              transition: "transform 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            title="Reload coins"
          >
            <FaSyncAlt />
          </button>
        </div>

        {/* ---- COLUMN-MAJOR RENDER: 4 columns x N rows (fill down each column) ---- */}
        <div className="coins-columns" style={{ display: "flex", gap: 16 }}>
          {(() => {
            const columnsCount = 4;
            const rowsCount = Math.ceil(paginated.length / columnsCount) || 0;
            // build columns array: each column is a slice of length rowsCount
            const columns = Array.from({ length: columnsCount }, (_, c) =>
              paginated.slice(c * rowsCount, c * rowsCount + rowsCount)
            );

            return columns.map((col, cIdx) => (
              <div
                key={`col-${cIdx}`}
                className="coins-column"
                style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minWidth: 0 }}
              >
                {col.map((coin) => {
                  // Only show live prices for coins with the highest market cap for their symbol
                  const isHighestMarketCap = symbolToSourceIdMap.current[coin.symbol] === coin.source_id;
                  const lp = isHighestMarketCap ? (livePrices[coin.symbol] || null) : null;
                  const changeClass = lp && lp.change24h >= 0 ? "coin-change up" : "coin-change down";
                  return (
                    <div
                      key={coin.source_id}
                      onClick={() => handleCoinClick(coin.source_id)}
                      className="coin-card group"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 16px",
                        borderRadius: 16,
                        background: "linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(238, 242, 255, 0.6), rgba(250, 245, 255, 0.6))",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 255, 255, 0.6)",
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "all 0.3s ease",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.1)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                        <div className="coin-avatar-wrap" style={{ position: "relative", flexShrink: 0 }}>
                          {coin.image_small || coin.image_small || coin.image_thumb ? (
                            <img
                              src={coin.image_small || coin.image_small || coin.image_thumb}
                              alt={coin.symbol}
                              loading="lazy"
                              decoding="async"
                              className="coin-avatar-img"
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                objectFit: "cover",
                                display: "block",
                                imageRendering: "auto",
                                backgroundColor: "#f3f4f6",
                                border: "2px solid rgba(255, 255, 255, 0.8)",
                                transition: "all 0.3s ease"
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                              }}
                            />
                          ) : null}
                          <div
                            className="coin-avatar-fallback"
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: "50%",
                              display: (coin.image_large || coin.image_small || coin.image_thumb) ? "none" : "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              fontWeight: 700,
                              color: "#fff",
                              fontSize: 16,
                              border: "2px solid rgba(255, 255, 255, 0.8)"
                            }}
                          >
                            {(coin.symbol || "?")[0]}
                          </div>
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            className="coin-name"
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: "#111",
                              lineHeight: 1.3
                            }}
                          >
                            {coin.name}
                          </div>
                          <div
                            className="coin-symbol"
                            style={{
                              background: "linear-gradient(to right, rgb(6, 182, 212), rgb(99, 102, 241))",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                              fontSize: 13,
                              marginTop: 3,
                              fontWeight: 600
                            }}
                          >
                            {coin.symbol}
                          </div>
                        </div>
                      </div>

                      <div className="coin-right" style={{ textAlign: "right", minWidth: 100, flexShrink: 0 }}>
                        <div
                          className="coin-price"
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#111",
                            lineHeight: 1.3
                          }}
                        >
                          {lp && lp.price ? `$${Number(lp.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                        </div>
                        <div
                          className={changeClass}
                          style={{
                            marginTop: 4,
                            color: lp && lp.change24h >= 0 ? "#16a34a" : "#ef4444",
                            fontSize: 13,
                            fontWeight: 600
                          }}
                        >
                          {lp && lp.change24h !== undefined && lp.change24h !== null
                            ? `${lp.change24h >= 0 ? "+" : ""}${Number(lp.change24h).toFixed(2)}%`
                            : "—"}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* pad the column so all columns have equal height (keeps layout even) */}
                {col.length < rowsCount &&
                  Array.from({ length: rowsCount - col.length }).map((_, ix) => (
                    <div key={`pad-${cIdx}-${ix}`} style={{ height: 0, minHeight: 0 }} />
                  ))}
              </div>
            ));
          })()}
        </div>

        {/* pagination centered */}
        <div className="pagination bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-2xl p-4 shadow-xl shadow-indigo-500/10 border border-white/50 mt-8 mb-8" style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "2px solid rgba(129, 140, 248, 0.3)",
              background: page === 1 ? "rgba(243, 244, 246, 0.8)" : "rgba(255, 255, 255, 0.9)",
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s ease",
              opacity: page === 1 ? 0.5 : 1
            }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Prev
          </button>
          {pageButtons.map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}-${pageButtons[i - 1] || 'start'}`}
                className="page-btn"
                style={{ padding: "10px 18px", background: "transparent", border: "none", fontWeight: 600, color: "#6b7280" }}
              >
                …
              </span>
            ) : (
              <button
                key={`page-${p}`}
                onClick={() => setPage(p)}
                className={`page-btn ${p === page ? "active" : ""}`}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: p === page ? "none" : "2px solid rgba(129, 140, 248, 0.3)",
                  background: p === page ? "linear-gradient(to right, rgb(6, 182, 212), rgb(99, 102, 241), rgb(217, 70, 239))" : "rgba(255, 255, 255, 0.9)",
                  color: p === page ? "#fff" : "#111",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: p === page ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {p}
              </button>
            )
          )}
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "2px solid rgba(129, 140, 248, 0.3)",
              background: page === totalPages ? "rgba(243, 244, 246, 0.8)" : "rgba(255, 255, 255, 0.9)",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s ease",
              opacity: page === totalPages ? 0.5 : 1
            }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Next
          </button>
        </div>

        <div className="footer-note" style={{ marginTop: 0, color: "#6b7280", textAlign: "center", fontSize: 13, fontWeight: 500 }}>
          Showing page {page} of {totalPages}
        </div>
      </div>
    </div>
  );
}
