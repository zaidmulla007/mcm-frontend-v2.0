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

export const useCoinsLivePrice = (coinSymbols = []) => {
  console.log(`🎬 [Coins] useCoinsLivePrice hook called with ${coinSymbols.length} symbols:`, coinSymbols.slice(0, 5));

  const [prices, setPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [volumes, setVolumes] = useState({});
  const [volumeData, setVolumeData] = useState({});
  const [bidAskData, setBidAskData] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [validUSDTPairs, setValidUSDTPairs] = useState(new Set());
  const wsRefsArray = useRef([]);
  const exchangeInfoFetched = useRef(false);

  // Fetch Binance exchangeInfo to get all valid USDT pairs (SOLUTION from AppOld.js)
  useEffect(() => {
    const fetchExchangeInfo = async () => {
      if (exchangeInfoFetched.current) return;

      try {
        const resInfo = await fetch("https://api.binance.com/api/v3/exchangeInfo");
        const exchangeInfo = await resInfo.json();

        // Extract all valid USDT trading pairs (exactly like AppOld.js line 56-60)
        const usdtPairs = new Set();
        exchangeInfo.symbols.forEach(s => {
          if (s.quoteAsset === "USDT" && s.status === "TRADING") {
            usdtPairs.add(s.symbol);
          }
        });

        setValidUSDTPairs(usdtPairs);
        exchangeInfoFetched.current = true;
        console.log(`✅ Binance: Loaded ${usdtPairs.size} valid USDT trading pairs`);
      } catch (error) {
        console.error("❌ Failed to fetch Binance exchange info:", error);
      }
    };

    fetchExchangeInfo();
  }, []);

  // Connect WebSocket for live prices with batching support (based on AppOld.js implementation)
  useEffect(() => {
    console.log(`🔍 [Coins] Hook triggered. coinSymbols.length: ${coinSymbols.length}, validUSDTPairs.size: ${validUSDTPairs.size}`);

    // Wait until we have both coin symbols and valid USDT pairs
    if (coinSymbols.length === 0 || validUSDTPairs.size === 0) {
      console.log(`⏳ [Coins] Waiting... coinSymbols empty or validUSDTPairs not loaded yet`);
      return;
    }

    // Close all previous WebSocket connections
    wsRefsArray.current.forEach(ws => {
      if (ws) ws.close();
    });
    wsRefsArray.current = [];

    // Prepare symbols with USDT suffix and filter ONLY valid ones (AppOld.js line 64)
    const requestedSymbols = coinSymbols.map((symbol) => `${symbol.toUpperCase()}USDT`);
    const validSymbols = requestedSymbols.filter(symbol => validUSDTPairs.has(symbol));

    // Log invalid symbols for debugging
    const invalidSymbols = requestedSymbols.filter(symbol => !validUSDTPairs.has(symbol));
    if (invalidSymbols.length > 0) {
      console.warn(`⚠️ ${invalidSymbols.length} symbols don't have USDT pairs on Binance:`,
        invalidSymbols.slice(0, 10).join(", "),
        invalidSymbols.length > 10 ? `... +${invalidSymbols.length - 10} more` : ""
      );
    }

    if (validSymbols.length === 0) {
      console.warn("⚠️ No valid USDT pairs to subscribe to");
      return;
    }

    // SOLUTION: Fetch initial prices from REST API before WebSocket (AppOld.js line 63-72)
    const fetchInitialPrices = async () => {
      try {
        console.log(`🔄 [Coins] Fetching initial prices for symbols:`, validSymbols.slice(0, 10), `... (${validSymbols.length} total)`);
        const resPrice = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        const allTicker = await resPrice.json();

        console.log(`📊 [Coins] Received ${allTicker.length} tickers from Binance`);

        // Filter to only our valid symbols
        const initialPrices = {};
        const initialPriceChanges = {};
        const initialVolumes = {};
        const initialBidAsk = {};
        const initialVolumeData = {};

        allTicker.forEach(ticker => {
          if (validSymbols.includes(ticker.symbol)) {
            initialPrices[ticker.symbol] = parseFloat(ticker.lastPrice);
            initialPriceChanges[ticker.symbol] = parseFloat(ticker.priceChangePercent);
            initialVolumes[ticker.symbol] = parseFloat(ticker.volume);
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

        console.log(`💰 [Coins] Initial prices sample:`, Object.entries(initialPrices).slice(0, 5));

        // Set initial state before WebSocket connects
        setPrices(initialPrices);
        setPriceChanges(initialPriceChanges);
        setVolumes(initialVolumes);
        setBidAskData(initialBidAsk);
        setVolumeData(initialVolumeData);

        console.log(`✅ [Coins] Loaded initial prices for ${Object.keys(initialPrices).length} coins from REST API`);
      } catch (error) {
        console.error("❌ [Coins] Failed to fetch initial prices:", error);
      }
    };

    fetchInitialPrices();

    const symbolsLower = validSymbols.map(s => s.toLowerCase());

    // Batch symbols into groups of MAX_STREAMS (1024)
    const batches = batchArray(symbolsLower, MAX_STREAMS);

    console.log(`✅ Connecting WebSocket for ${validSymbols.length}/${requestedSymbols.length} valid USDT pairs in ${batches.length} batch(es)`);

    // Create a WebSocket connection for each batch
    batches.forEach((batch, batchIndex) => {
      const streams = batch.map(s => `${s}@ticker`).join("/");
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      wsRefsArray.current.push(ws);

      ws.onopen = () => {
        console.log(`📡 Binance WebSocket batch ${batchIndex + 1}/${batches.length} connected (${batch.length} streams)`);
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.log(`🔌 Binance WebSocket batch ${batchIndex + 1} disconnected`);
        // Only set disconnected if ALL connections are closed
        const allClosed = wsRefsArray.current.every(socket => socket.readyState === WebSocket.CLOSED);
        if (allClosed) {
          setIsConnected(false);
        }
      };

      ws.onerror = (error) => {
        console.error(`❌ Binance WebSocket batch ${batchIndex + 1} error:`, error);
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

            // Update volumes state
            setVolumes((prev) => ({
              ...prev,
              [symbol]: parseFloat(msg.data.v),
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
          console.error('❌ Error parsing WebSocket message:', err);
        }
      };
    });

    // Cleanup function - close all WebSocket connections on unmount
    return () => {
      wsRefsArray.current.forEach(ws => {
        if (ws) ws.close();
      });
    };
  }, [coinSymbols, validUSDTPairs]);

  // Compose live coins data (EXACT same pattern as useTop10LivePrice - NOT memoized)
  const coinsLiveData = coinSymbols.map((symbol) => {
    const symbolKey = `${symbol.toUpperCase()}USDT`;
    const price = prices[symbolKey];
    const priceChange = priceChanges[symbolKey];
    const volume = volumes[symbolKey];

    // Debug: Log when data is missing
    if (coinSymbols.length > 0 && Object.keys(prices).length > 0 && !price) {
      console.log(`⚠️ [Coins] Missing price for ${symbol} (key: ${symbolKey}). Available keys:`, Object.keys(prices).slice(0, 5));
    }

    return {
      symbol: symbol,
      price: price || "-",
      priceChange24h: priceChange || 0,
      volume: volume || "-",
    };
  });

  // Return both the mapped data (for backward compatibility) and raw data (same as useInfluencerLivePrice)
  return { coinsLiveData, prices, priceChanges, isConnected, bidAskData, volumeData };
};
