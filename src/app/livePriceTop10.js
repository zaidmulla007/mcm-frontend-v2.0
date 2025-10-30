"use client";
import { useState, useEffect, useRef } from "react";

export const useTop10LivePrice = () => {
  const [coinData, setCoinData] = useState([]);
  const [prices, setPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // Fetch top 10 coins from Binance
  useEffect(() => {
    const fetchCoinData = async () => {
      try {
        // Fetch top 10 USDT pairs by volume from Binance
        const binanceRes = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        const binanceData = await binanceRes.json();

        // Filter only USDT pairs and sort by quote volume
        const top10Coins = binanceData
          .filter((coin) => coin.symbol.endsWith("USDT") && coin.symbol !== "USDT")
          .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
          .slice(0, 10)
          .map((coin) => coin.symbol.replace("USDT", "").toLowerCase());

        // Fetch additional data from your backend
        const symbols = top10Coins.join(",");
        const res = await fetch(`/api/top10-coins?symbols=${symbols}`);
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
          { symbol: "BTC", name: "Bitcoin", price: 0, image: "", priceChange24h: 0 },
          { symbol: "ETH", name: "Ethereum", price: 0, image: "", priceChange24h: 0 },
          { symbol: "BNB", name: "BNB", price: 0, image: "", priceChange24h: 0 },
          { symbol: "XRP", name: "XRP", price: 0, image: "", priceChange24h: 0 },
          { symbol: "ADA", name: "Cardano", price: 0, image: "", priceChange24h: 0 },
          { symbol: "DOGE", name: "Dogecoin", price: 0, image: "", priceChange24h: 0 },
          { symbol: "SOL", name: "Solana", price: 0, image: "", priceChange24h: 0 },
          { symbol: "DOT", name: "Polkadot", price: 0, image: "", priceChange24h: 0 },
          { symbol: "MATIC", name: "Polygon", price: 0, image: "", priceChange24h: 0 },
          { symbol: "LTC", name: "Litecoin", price: 0, image: "", priceChange24h: 0 },
        ]);
      }
    };

    fetchCoinData();
  }, []);

  // Connect WebSocket for live prices and 24h change
  useEffect(() => {
    if (coinData.length === 0) return;

    // Close previous socket if any
    if (wsRef.current) wsRef.current.close();

    const symbols = coinData.map((c) => `${c.symbol}USDT`);
    const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.data?.s && msg?.data?.c) {
          const symbol = msg.data.s;
          setPrices((prev) => ({
            ...prev,
            [symbol]: parseFloat(msg.data.c),
          }));
          setPriceChanges((prev) => ({
            ...prev,
            [symbol]: parseFloat(msg.data.P),
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
    priceChange24h: priceChanges[`${coin.symbol}USDT`] || coin.priceChange24h || 0,
  }));

  // Return the actual data
  return { top10Data, isConnected };
};
