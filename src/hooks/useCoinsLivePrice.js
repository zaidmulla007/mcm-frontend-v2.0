"use client";
import { useState, useEffect, useRef } from "react";

export const useCoinsLivePrice = (coinSymbols = []) => {
  const [prices, setPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [volumes, setVolumes] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // Connect WebSocket for live prices (EXACT same pattern as useTop10LivePrice)
  useEffect(() => {
    if (coinSymbols.length === 0) return;

    // Close previous socket if any
    if (wsRef.current) wsRef.current.close();

    const symbols = coinSymbols.map((symbol) => `${symbol}USDT`);
    const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Binance WebSocket connected for coins');
      setIsConnected(true);
    };
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
          setVolumes((prev) => ({
            ...prev,
            [symbol]: parseFloat(msg.data.v),
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => ws.close();
  }, [coinSymbols]);

  // Compose live coins data (EXACT same pattern as useTop10LivePrice - NOT memoized)
  const coinsLiveData = coinSymbols.map((symbol) => ({
    symbol: symbol,
    price: prices[`${symbol}USDT`] || "-",
    priceChange24h: priceChanges[`${symbol}USDT`] || 0,
    volume: volumes[`${symbol}USDT`] || "-",
  }));

  // Return the actual data (EXACT same pattern as useTop10LivePrice)
  return { coinsLiveData, isConnected };
};
