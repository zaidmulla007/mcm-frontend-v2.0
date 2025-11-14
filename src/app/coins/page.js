"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export default function CoinsPage() {
  const router = useRouter();
  const [coinsData, setCoinsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("6hrs");
  const [prices, setPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [volumes, setVolumes] = useState({});
  const [coinSymbols, setCoinSymbols] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // Fetch initial Binance data via REST API
  useEffect(() => {
    if (coinSymbols.length === 0) return;

    const fetchInitialBinanceData = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();

        const initialPrices = {};
        const initialPriceChanges = {};
        const initialVolumes = {};

        data.forEach(ticker => {
          if (ticker.symbol.endsWith('USDT')) {
            const symbol = ticker.symbol.replace('USDT', '');
            if (coinSymbols.includes(symbol)) {
              const symbolWithUSDT = ticker.symbol;
              initialPrices[symbolWithUSDT] = parseFloat(ticker.lastPrice);
              initialPriceChanges[symbolWithUSDT] = parseFloat(ticker.priceChangePercent);
              initialVolumes[symbolWithUSDT] = parseFloat(ticker.volume);
            }
          }
        });

        console.log('Initial Binance data loaded');
        setPrices(initialPrices);
        setPriceChanges(initialPriceChanges);
        setVolumes(initialVolumes);
      } catch (error) {
        console.error('Error fetching initial Binance data:', error);
      }
    };

    fetchInitialBinanceData();
  }, [coinSymbols]);

  // WebSocket for Binance live data
  useEffect(() => {
    if (coinSymbols.length === 0) return;

    // Close previous WebSocket if exists
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Create streams array for USDT pairs only
    const streams = coinSymbols
      .map(symbol => `${symbol.toLowerCase()}usdt@ticker`)
      .join('/');

    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Binance WebSocket connected for live price updates');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.data && message.data.s && message.data.c) {
          const ticker = message.data;
          const symbol = ticker.s; // Keep full symbol with USDT

          // Update prices separately like in useTop10LivePrice hook
          setPrices(prev => {
            const newPrices = {
              ...prev,
              [symbol]: parseFloat(ticker.c)
            };
            return newPrices;
          });

          setPriceChanges(prev => {
            const newChanges = {
              ...prev,
              [symbol]: parseFloat(ticker.P)
            };
            return newChanges;
          });

          setVolumes(prev => {
            const newVolumes = {
              ...prev,
              [symbol]: parseFloat(ticker.v)
            };
            return newVolumes;
          });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('Binance WebSocket disconnected');
      setWsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [coinSymbols]);

  // Fetch coins data from API
  useEffect(() => {
    const fetchCoinsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/strategyyoutubedata/ytandtg');
        const data = await response.json();

        if (data.success) {
          setCoinsData(data.resultsByTimeframe);

          // Extract all unique coin symbols from all timeframes to subscribe to WebSocket
          const allSymbols = new Set();
          Object.keys(data.resultsByTimeframe).forEach(timeframe => {
            const coins = data.resultsByTimeframe[timeframe].all_coins || [];
            coins.forEach(coin => {
              if (coin.symbol) {
                allSymbols.add(coin.symbol);
              }
            });
          });

          setCoinSymbols(Array.from(allSymbols));
        } else {
          setError("Failed to fetch coins data");
        }
      } catch (err) {
        setError("Failed to fetch coins data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoinsData();
  }, []);

  const timeframeOptions = [
    { value: "6hrs", label: "6 Hours" },
    { value: "24hrs", label: "24 Hours" },
    { value: "7days", label: "7 Days" },
    { value: "30days", label: "30 Days" }
  ];

  // Get top 10 coins from selected timeframe
  const getTop10Coins = () => {
    if (!coinsData || !coinsData[selectedTimeframe]) return [];

    const allCoins = coinsData[selectedTimeframe].all_coins || [];
    return allCoins.slice(0, 10);
  };

  const top10Coins = getTop10Coins();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans mt-5">
      <main className="mx-auto px-4 pb-8">
        <div className="min-w-0">
          {/* Leaderboard Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* View Mode Toggle Buttons */}
            <div className="flex justify-center items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
              {/* View Mode Buttons in Center */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/influencer-search")}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  MCM Ranking
                </button>
                <button
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                >
                  Coins
                </button>
                <button
                  onClick={() => router.push("/influencer-search")}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Posts
                </button>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-700">Timeframe:</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="border border-gray-300 bg-white rounded-lg px-4 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {timeframeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Coin
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Total Posts
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Short Term<br />Bullish
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Long Term<br />Bullish
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Current Price<br /><span className="text-[10px] font-normal">(Binance)</span>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Volume<br /><span className="text-[10px] font-normal">(24hrs Binance)</span>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Price Change<br /><span className="text-[10px] font-normal">(24hrs Binance)</span>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Short Term<br />Bearish
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Long Term<br />Bearish
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : top10Coins.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                        No coins data available for this timeframe
                      </td>
                    </tr>
                  ) : (
                    top10Coins.map((coin, index) => {
                      const symbolWithUSDT = `${coin.symbol}USDT`;
                      const currentPrice = prices[symbolWithUSDT] || 'N/A';
                      const volume = volumes[symbolWithUSDT] || 'N/A';
                      const priceChangePercent = priceChanges[symbolWithUSDT] || null;

                      // Calculate absolute price change from percentage
                      const priceChange = (priceChangePercent && currentPrice !== 'N/A')
                        ? (currentPrice * priceChangePercent / 100)
                        : null;

                      return (
                        <tr key={`${coin.symbol}-${currentPrice}`} className="hover:bg-gray-50">
                          {/* Coin */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {coin.image_small && (
                                <img
                                  src={coin.image_small}
                                  alt={coin.symbol}
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              <div>
                                <div className="text-sm font-bold text-gray-900">{coin.symbol}</div>
                                <div className="text-xs text-gray-500">{coin.coin_name}</div>
                              </div>
                            </div>
                          </td>

                          {/* Total Posts */}
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-gray-900">
                              {coin.total_mentions}
                            </span>
                          </td>

                          {/* Short Term Bullish */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <FaArrowUp className="text-green-600 text-xs" />
                              <span className="text-sm font-semibold text-green-600">
                                {coin.yt_tg_bullish_short_term}
                              </span>
                            </div>
                          </td>

                          {/* Long Term Bullish */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <FaArrowUp className="text-green-600 text-xs" />
                              <span className="text-sm font-semibold text-green-600">
                                {coin.yt_tg_bullish_long_term}
                              </span>
                            </div>
                          </td>

                          {/* Current Price */}
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-blue-600">
                              {currentPrice !== 'N/A'
                                ? `$${parseFloat(currentPrice).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 8
                                })}`
                                : 'N/A'}
                            </span>
                          </td>

                          {/* Volume */}
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-blue-600">
                              {volume !== 'N/A'
                                ? parseFloat(volume).toLocaleString('en-US', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                })
                                : 'N/A'}
                            </span>
                          </td>

                          {/* Price Change */}
                          <td className="px-4 py-3 text-center">
                            {priceChange !== null && priceChangePercent !== null ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-sm font-semibold ${parseFloat(priceChange) > 0
                                    ? 'text-green-600'
                                    : parseFloat(priceChange) < 0
                                      ? 'text-red-600'
                                      : 'text-gray-900'
                                  }`}>
                                  {parseFloat(priceChange) > 0 ? '+' : ''}
                                  {parseFloat(priceChange).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </span>
                                <span className={`text-xs font-semibold ${parseFloat(priceChange) > 0
                                    ? 'text-green-600'
                                    : parseFloat(priceChange) < 0
                                      ? 'text-red-600'
                                      : 'text-gray-900'
                                  }`}>
                                  ({parseFloat(priceChange) > 0 ? '+' : ''}{priceChangePercent}%)
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">N/A</span>
                            )}
                          </td>

                          {/* Short Term Bearish */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <FaArrowDown className="text-red-600 text-xs" />
                              <span className="text-sm font-semibold text-red-600">
                                {coin.yt_tg_bearish_short_term}
                              </span>
                            </div>
                          </td>

                          {/* Long Term Bearish */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <FaArrowDown className="text-red-600 text-xs" />
                              <span className="text-sm font-semibold text-red-600">
                                {coin.yt_tg_bearish_long_term}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
