"use client";
import { useState, useEffect, useRef } from "react";

export const useTop10LivePrice = () => {
  const [top10Symbols, setTop10Symbols] = useState([]);
  const [prices, setPrices] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // Fetch top 10 symbols from Binance dynamically
  useEffect(() => {
    const fetchTopSymbols = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        const data = await res.json();

        // Filter USDT pairs and sort by 24h volume (or any metric)
        const usdtPairs = data
          .filter((c) => c.symbol.endsWith("USDT"))
          .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
          .slice(0, 10)
          .map((c) => c.symbol);

        setTop10Symbols(usdtPairs);
      } catch (err) {
        console.error("Failed to fetch top symbols:", err);
        // fallback
        setTop10Symbols([
          "BTCUSDT",
          "ETHUSDT",
          "BNBUSDT",
          "XRPUSDT",
          "ADAUSDT",
          "DOGEUSDT",
          "SOLUSDT",
          "DOTUSDT",
          "MATICUSDT",
          "LTCUSDT",
        ]);
      }
    };

    fetchTopSymbols();
  }, []);

  // Connect WebSocket for live prices
  useEffect(() => {
    if (top10Symbols.length === 0) return;

    // Close previous socket if any
    if (wsRef.current) wsRef.current.close();

    const streams = top10Symbols.map((s) => `${s.toLowerCase()}@trade`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.data?.s && msg?.data?.p) {
          setPrices((prev) => ({
            ...prev,
            [msg.data.s]: parseFloat(msg.data.p),
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => ws.close();
  }, [top10Symbols]);

  // Compose live top 10 data as a value
  const top10Data = top10Symbols.map((s) => ({
    symbol: s.replace("USDT", ""),
    price: prices[s] || "-",
  }));

  // Return the actual data
  return { top10Data, isConnected };
};
