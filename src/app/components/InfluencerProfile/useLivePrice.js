// useLivePrice.js
import { useState, useEffect, useRef } from 'react';
import axios from '../../api/axios';

export const useLivePrice = (symbols = []) => {
  const [prices, setPrices] = useState({});
  const [binanceSymbols, setBinanceSymbols] = useState(new Set());
  const [apiPrices, setApiPrices] = useState({});
  const [apiTimestamps, setApiTimestamps] = useState({});
  const [fetchedApiSymbols, setFetchedApiSymbols] = useState(new Set());
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastLivePrices, setLastLivePrices] = useState({}); // Store last known live prices
  const [livePriceTimestamps, setLivePriceTimestamps] = useState({}); // Track when live prices were last updated
  const wsRef = useRef(null);

  // Safety check - ensure symbols is always an array
  const safeSymbols = Array.isArray(symbols) ? symbols : [];

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch Binance symbols
  useEffect(() => {
    if (!isHydrated) return; // Don't run until hydrated
    
    const fetchBinanceSymbols = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const data = await response.json();
        const symbolSet = new Set(
          data.symbols.filter(s => s.status === 'TRADING').map(s => s.symbol)
        );
        setBinanceSymbols(symbolSet);
      } catch (error) {
        // Silent error handling
      }
    };
    fetchBinanceSymbols();
  }, [isHydrated]);

  // Fetch API prices for ALL symbols first (not just non-Binance)
  useEffect(() => {
    if (!isHydrated || safeSymbols.length === 0) return;

    const fetchAllSymbolPrices = async () => {
      try {
        // Get all symbols that haven't been fetched yet (both Binance and non-Binance)
        const symbolsToFetch = safeSymbols.filter(symbol => {
          if (!symbol) return false;
          const alreadyFetched = fetchedApiSymbols.has(symbol.toUpperCase());
          return !alreadyFetched;
        });

        if (symbolsToFetch.length === 0) {
          return;
        }

        // Fetch API prices for ALL symbols (including Binance ones as fallback)
        const symbolsParam = symbolsToFetch.join(',');
        const apiUrl = `/api/admin/coinindex/mcmdb/filter?symbols=${symbolsParam}`;

        console.log('🔍 API Request URL (ALL symbols):', apiUrl);
        console.log('🔍 Requesting symbols:', symbolsToFetch);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔍 API Response:', data);

        if (data.success && data.results) {
          const newPricesMap = { ...apiPrices };
          const newTimestampsMap = { ...apiTimestamps };
          const newFetchedSymbols = new Set([...fetchedApiSymbols]);
          
          console.log('🔍 Processing results:', data.results.length, 'coins');
          
          data.results.forEach(coin => {
            console.log('🔍 Processing coin:', coin.symbol, coin.end_timestamp_price);
            if (coin.symbol && coin.end_timestamp_price) {
              const upperSymbol = coin.symbol.toUpperCase();
              const originalSymbol = coin.symbol;
              
              // Store with both uppercase and original case
              newPricesMap[upperSymbol] = coin.end_timestamp_price;
              newPricesMap[originalSymbol] = coin.end_timestamp_price;
              newTimestampsMap[upperSymbol] = coin.end_timestamp;
              newTimestampsMap[originalSymbol] = coin.end_timestamp;
              newFetchedSymbols.add(upperSymbol);
              newFetchedSymbols.add(originalSymbol);
              console.log('✅ Added API price for:', upperSymbol, 'and', originalSymbol, coin.end_timestamp_price);
            }
          });

          // Mark all requested symbols as "fetched"
          symbolsToFetch.forEach(symbol => {
            if (symbol) {
              newFetchedSymbols.add(symbol.toUpperCase());
            }
          });
          
          setApiPrices(newPricesMap);
          setApiTimestamps(newTimestampsMap);
          setFetchedApiSymbols(newFetchedSymbols);
          
          console.log('🔍 Updated API prices for ALL symbols:', newPricesMap);
        }
        
      } catch (error) {
        console.error('❌ API fetch error:', error);
        // Still mark symbols as attempted
        const newFetchedSymbols = new Set([...fetchedApiSymbols]);
        const symbolsToFetch = safeSymbols.filter(symbol => {
          if (!symbol) return false;
          return !fetchedApiSymbols.has(symbol.toUpperCase());
        });
        
        symbolsToFetch.forEach(symbol => {
          if (symbol) {
            newFetchedSymbols.add(symbol.toUpperCase());
          }
        });
        setFetchedApiSymbols(newFetchedSymbols);
      }
    };

    // Call immediately when new symbols are detected
    fetchAllSymbolPrices();
  }, [safeSymbols, fetchedApiSymbols, apiPrices, apiTimestamps, isHydrated]);

  // Setup WebSocket for Binance symbols (this will override API prices with live prices)
  useEffect(() => {
    if (!isHydrated || safeSymbols.length === 0 || binanceSymbols.size === 0) return;

    const connectWebSocket = () => {
      if (wsRef.current) {
        return;
      }

      const validSymbols = safeSymbols.filter(symbol =>
        symbol && (binanceSymbols.has(symbol) || binanceSymbols.has(symbol + 'USDT'))
      );

      if (validSymbols.length === 0) {
        return;
      }

      try {
        const streams = validSymbols
          .map(symbol => {
            const binanceSymbol = binanceSymbols.has(symbol) ? symbol : symbol + 'USDT';
            return `${binanceSymbol.toLowerCase()}@ticker`;
          })
          .join('/');

        console.log('🔄 Connecting WebSocket for live prices:', validSymbols);
        wsRef.current = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

        wsRef.current.onopen = () => {
          console.log('✅ WebSocket connected - live prices will override API prices');
        };

        wsRef.current.onmessage = (event) => {
          try {
            const { data } = JSON.parse(event.data);
            if (data && data.s && data.c) {
              const price = parseFloat(data.c);
              const symbol = data.s;
              const now = Date.now();
              
              console.log('📈 Live price update:', symbol, price);
              
              setPrices(prev => ({ ...prev, [symbol]: price }));
              setLastLivePrices(prev => ({ ...prev, [symbol]: price }));
              setLivePriceTimestamps(prev => ({ ...prev, [symbol]: now }));
            }
          } catch (error) {
            // Silent error handling
          }
        };

        wsRef.current.onerror = (error) => {
          console.warn('⚠️ WebSocket error - falling back to API prices');
        };

        wsRef.current.onclose = (event) => {
          console.log('🔌 WebSocket disconnected - using cached/API prices');
          wsRef.current = null;
        };

      } catch (error) {
        console.error('❌ WebSocket connection failed:', error);
      }
    };

    // Connect WebSocket after a small delay to let API prices load first
    const timeoutId = setTimeout(connectWebSocket, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [safeSymbols, binanceSymbols, isHydrated]);

  const getPriceData = (symbol) => {
    // Return null during SSR/before hydration to prevent mismatches
    if (!isHydrated || !symbol) {
      return { price: null, isLive: false, source: null };
    }

    const now = Date.now();
    const STALE_THRESHOLD = 30 * 1000; // 30 seconds

    // PRIORITY 1: Fresh live price from WebSocket (GREEN indicator)
    const livePrice = prices[symbol] || prices[symbol + 'USDT'];
    const livePriceTimestamp = livePriceTimestamps[symbol] || livePriceTimestamps[symbol + 'USDT'];
    
    if (livePrice && livePriceTimestamp && (now - livePriceTimestamp) < STALE_THRESHOLD) {
      return { price: livePrice, isLive: true, source: 'binance' };
    }

    // PRIORITY 2: Last known live price (ORANGE indicator - WebSocket was working but now stale)
    const lastLivePrice = lastLivePrices[symbol] || lastLivePrices[symbol + 'USDT'];
    if (lastLivePrice) {
      const shouldHaveLiveData = binanceSymbols.has(symbol) || binanceSymbols.has(symbol + 'USDT');
      if (shouldHaveLiveData) {
        return { 
          price: lastLivePrice, 
          isLive: false,
          source: 'binance_cached',
          isStale: true 
        };
      }
    }

    // PRIORITY 3: API price (YELLOW indicator - always show this instead of "-")
    const variations = [
      symbol.toUpperCase(),
      symbol.toLowerCase(),
      symbol
    ];
    
    for (const variation of variations) {
      const apiPrice = apiPrices[variation];
      if (apiPrice) {
        return { price: apiPrice, isLive: false, source: 'api' };
      }
    }

    // PRIORITY 4: Only show "-" if absolutely no price data exists
    return { price: null, isLive: false, source: null };
  };

  const formatPrice = (symbol) => {
    const priceData = getPriceData(symbol);
    if (!priceData.price) return '-';
    
    return `${priceData.price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    })}`;
  };

  const isSymbolLive = (symbol) => {
    const priceData = getPriceData(symbol);
    return priceData.isLive && !priceData.isStale;
  };

  const getPriceSource = (symbol) => {
    const priceData = getPriceData(symbol);
    return priceData.source;
  };

  const getPriceTimestamp = (symbol) => {
    if (!isHydrated || !symbol) return null;
    
    // Check multiple case variations for timestamp
    const variations = [
      symbol.toUpperCase(),
      symbol.toLowerCase(),
      symbol
    ];
    
    for (const variation of variations) {
      const timestamp = apiTimestamps[variation];
      if (timestamp) return timestamp;
    }
    
    return null;
  };

  return { 
    formatPrice, 
    getPriceData, 
    isSymbolLive, 
    getPriceSource,
    getPriceTimestamp,
    isHydrated // Export hydration status if needed
  };
};