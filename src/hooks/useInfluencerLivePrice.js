"use client";
import { useState, useEffect, useRef } from "react";

// Maximum streams per WebSocket connection (Binance limit)
const MAX_STREAMS = 1024;

/**
 * Helper function to batch an array into chunks of specified size
 * @param {Array} arr - Array to batch
 * @param {number} size - Size of each batch
 * @returns {Array} Array of batches
 */
function batchArray(arr, size) {
  const batches = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
}

/**
 * Custom hook to get live prices from Binance WebSocket for given symbols
 * @param {Array} symbols - Array of coin symbols to track (e.g., ["BTC", "ETH", "SOL"])
 * @returns {object} Live price data, connection status, bid/ask data, and volume data
 */
export const useInfluencerLivePrice = (symbols = []) => {
  const [prices, setPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [bidAskData, setBidAskData] = useState({});
  const [volumeData, setVolumeData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [validUSDTPairs, setValidUSDTPairs] = useState(new Set());
  const wsRefsArray = useRef([]);
  const exchangeInfoFetched = useRef(false);

  // Fetch Binance exchangeInfo to get all valid USDT pairs
  useEffect(() => {
    const fetchExchangeInfo = async () => {
      if (exchangeInfoFetched.current) return;

      try {
        const resInfo = await fetch("https://api.binance.com/api/v3/exchangeInfo");
        const exchangeInfo = await resInfo.json();

        // Extract all valid USDT trading pairs
        const usdtPairs = new Set();
        exchangeInfo.symbols.forEach(s => {
          if (s.quoteAsset === "USDT" && s.status === "TRADING") {
            usdtPairs.add(s.symbol);
          }
        });

        setValidUSDTPairs(usdtPairs);
        exchangeInfoFetched.current = true;
      } catch (error) {
        console.error("Failed to fetch Binance exchange info:", error);
      }
    };

    fetchExchangeInfo();
  }, []);

  // Connect WebSocket for live prices with batching support
  useEffect(() => {
    // Wait until we have both coin symbols and valid USDT pairs
    if (symbols.length === 0 || validUSDTPairs.size === 0) {
      return;
    }

    // Close all previous WebSocket connections
    wsRefsArray.current.forEach(ws => {
      if (ws) ws.close();
    });
    wsRefsArray.current = [];

    // Prepare symbols with USDT suffix and filter ONLY valid ones
    const requestedSymbols = symbols.map((symbol) => `${symbol.toUpperCase()}USDT`);
    const validSymbols = requestedSymbols.filter(symbol => validUSDTPairs.has(symbol));

    if (validSymbols.length === 0) {
      return;
    }

    // Fetch initial prices from REST API before WebSocket
    const fetchInitialPrices = async () => {
      try {
        const resPrice = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        const allTicker = await resPrice.json();

        // Filter to only our valid symbols
        const initialPrices = {};
        const initialPriceChanges = {};
        const initialBidAsk = {};
        const initialVolumeData = {};

        allTicker.forEach(ticker => {
          if (validSymbols.includes(ticker.symbol)) {
            initialPrices[ticker.symbol] = parseFloat(ticker.lastPrice);
            initialPriceChanges[ticker.symbol] = parseFloat(ticker.priceChangePercent);
            initialBidAsk[ticker.symbol] = {
              bidPrice: parseFloat(ticker.bidPrice),
              bidQty: parseFloat(ticker.bidQty),
              askPrice: parseFloat(ticker.askPrice),
              askQty: parseFloat(ticker.askQty),
            };
            initialVolumeData[ticker.symbol] = {
              volume: parseFloat(ticker.volume),
              quoteVolume: parseFloat(ticker.quoteVolume),
              priceChange: parseFloat(ticker.priceChange),
              priceChangePercent: parseFloat(ticker.priceChangePercent),
            };
          }
        });

        // Set initial state before WebSocket connects
        setPrices(initialPrices);
        setPriceChanges(initialPriceChanges);
        setBidAskData(initialBidAsk);
        setVolumeData(initialVolumeData);
      } catch (error) {
        console.error("Failed to fetch initial prices:", error);
      }
    };

    fetchInitialPrices();

    const symbolsLower = validSymbols.map(s => s.toLowerCase());

    // Batch symbols into groups of MAX_STREAMS (1024)
    const batches = batchArray(symbolsLower, MAX_STREAMS);

    // Create a WebSocket connection for each batch
    batches.forEach((batch, batchIndex) => {
      const streams = batch.map(s => `${s}@ticker`).join("/");
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      wsRefsArray.current.push(ws);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onclose = () => {
        // Only set disconnected if ALL connections are closed
        const allClosed = wsRefsArray.current.every(socket => socket.readyState === WebSocket.CLOSED);
        if (allClosed) {
          setIsConnected(false);
        }
      };

      ws.onerror = (error) => {
        console.error("Binance WebSocket error:", error);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.data?.s && msg?.data?.c) {
            const symbol = msg.data.s;

            // Only process USDT pairs (extra safety check)
            if (!symbol.endsWith('USDT')) {
              return;
            }

            // Update prices state
            setPrices((prev) => ({
              ...prev,
              [symbol]: parseFloat(msg.data.c),
            }));

            // Update price changes state
            setPriceChanges((prev) => ({
              ...prev,
              [symbol]: parseFloat(msg.data.P),
            }));

            // Capture bid/ask prices and quantities
            setBidAskData((prev) => ({
              ...prev,
              [symbol]: {
                bidPrice: msg.data.b ? parseFloat(msg.data.b) : null,
                bidQty: msg.data.B ? parseFloat(msg.data.B) : null,
                askPrice: msg.data.a ? parseFloat(msg.data.a) : null,
                askQty: msg.data.A ? parseFloat(msg.data.A) : null,
              }
            }));

            // Capture volume and price change data
            setVolumeData((prev) => ({
              ...prev,
              [symbol]: {
                volume: msg.data.v ? parseFloat(msg.data.v) : null, // 24h volume
                quoteVolume: msg.data.q ? parseFloat(msg.data.q) : null, // 24h quote volume
                priceChange: msg.data.p ? parseFloat(msg.data.p) : null, // 24h price change
                priceChangePercent: msg.data.P ? parseFloat(msg.data.P) : null, // 24h price change %
              }
            }));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
    });

    // Cleanup function - close all WebSocket connections on unmount
    return () => {
      wsRefsArray.current.forEach(ws => {
        if (ws) ws.close();
      });
    };
  }, [symbols, validUSDTPairs]);

  // Return the actual data including bid/ask data and volume data
  return { prices, priceChanges, isConnected, bidAskData, volumeData };
};
