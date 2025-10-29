"use client";
import { useState, useEffect, useRef } from "react";

export const useTop10LivePrice = () => {
  const [coinData, setCoinData] = useState([]);
  const [prices, setPrices] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // Fetch coin data from custom API
  useEffect(() => {
    const fetchCoinData = async () => {
      try {
        const res = await fetch("/api/top10-coins");
        const data = await res.json();

        if (data.success) {
          setCoinData(data.coins);
        } else {
          throw new Error("Failed to fetch coins");
        }
      } catch (err) {
        console.error("Failed to fetch coin data:", err);
        // Fallback data
        setCoinData([
          { symbol: "BTC", name: "Bitcoin", price: 0, image: "" },
          { symbol: "ETH", name: "Ethereum", price: 0, image: "" },
          { symbol: "BNB", name: "BNB", price: 0, image: "" },
          { symbol: "XRP", name: "XRP", price: 0, image: "" },
          { symbol: "ADA", name: "Cardano", price: 0, image: "" },
          { symbol: "DOGE", name: "Dogecoin", price: 0, image: "" },
          { symbol: "SOL", name: "Solana", price: 0, image: "" },
          { symbol: "DOT", name: "Polkadot", price: 0, image: "" },
          { symbol: "MATIC", name: "Polygon", price: 0, image: "" },
          { symbol: "LTC", name: "Litecoin", price: 0, image: "" },
        ]);
      }
    };

    fetchCoinData();
  }, []);

  // Connect WebSocket for live prices
  useEffect(() => {
    if (coinData.length === 0) return;

    // Close previous socket if any
    if (wsRef.current) wsRef.current.close();

    const symbols = coinData.map((c) => `${c.symbol}USDT`);
    const streams = symbols.map((s) => `${s.toLowerCase()}@trade`).join("/");
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
  }, [coinData]);

  // Compose live top 10 data with images and names
  const top10Data = coinData.map((coin) => ({
    symbol: coin.symbol,
    name: coin.name,
    image: coin.image,
    price: prices[`${coin.symbol}USDT`] || coin.price || "-",
  }));

  // Return the actual data
  return { top10Data, isConnected };
};
