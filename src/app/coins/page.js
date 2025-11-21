"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { useCoinsLivePrice } from "@/hooks/useCoinsLivePrice";
import { useTimezone } from "../contexts/TimezoneContext";

export default function CoinsPage() {
  const router = useRouter();
  const [coinsData, setCoinsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("6hrs");
  const [coinSymbols, setCoinSymbols] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedCells, setExpandedCells] = useState({});
  const [expandedSummaries, setExpandedSummaries] = useState({});

  // Use timezone context for local/UTC time switching
  const { formatDate, useLocalTime, toggleTimezone, userTimezone } = useTimezone();

  // Get city name from timezone
  const userCity = userTimezone ? userTimezone.split('/').pop().replace(/_/g, ' ') : 'Local Time';

  // Use live price hook (EXACT same pattern as influencer-search)
  const { prices, priceChanges, isConnected, bidAskData, volumeData } = useCoinsLivePrice(coinSymbols);

  console.log('📱 [Coins] Component received prices:', Object.keys(prices).length);
  console.log('📱 [Coins] isConnected:', isConnected);

  // Create a live prices map that updates when prices change (EXACT same pattern as influencer-search)
  const livePricesMap = useMemo(() => {
    const pricesMap = {};
    console.log('📱 [Coins] Raw prices from hook:', prices);
    console.log('📱 [Coins] Number of prices:', Object.keys(prices).length);
    Object.entries(prices).forEach(([symbolKey, price]) => {
      // Remove 'USDT' suffix to get base symbol (e.g., BTCUSDT -> BTC)
      const baseSymbol = symbolKey.replace('USDT', '');
      pricesMap[baseSymbol] = price;
    });
    console.log('📱 [Coins] livePricesMap created with', Object.keys(pricesMap).length, 'entries:', Object.keys(pricesMap).slice(0, 10));
    return pricesMap;
  }, [prices]);

  // Create a live price changes map (EXACT same pattern as influencer-search)
  const livePriceChangesMap = useMemo(() => {
    const changesMap = {};
    Object.entries(priceChanges).forEach(([symbolKey, change]) => {
      // Remove 'USDT' suffix to get base symbol (e.g., BTCUSDT -> BTC)
      const baseSymbol = symbolKey.replace('USDT', '');
      changesMap[baseSymbol] = change;
    });
    return changesMap;
  }, [priceChanges]);

  // Fetch coins data from API
  useEffect(() => {
    const fetchCoinsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/strategyyoutubedata/ytandtg');
        const data = await response.json();

        // Handle both old and new response formats
        const resultsByTimeframe = data.resultsByTimeframe || data;
        setCoinsData(resultsByTimeframe);

        // Extract lastUpdated from the 6hrs timeframe (same as YouTubeTelegramDataTable)
        if (resultsByTimeframe && resultsByTimeframe["6hrs"] && resultsByTimeframe["6hrs"].dateRange) {
          const toTimeStr = resultsByTimeframe["6hrs"].dateRange.to;
          const [datePart, timePart] = toTimeStr.split(' ');
          const [year, month, day] = datePart.split('-').map(Number);
          const [hours, minutes, seconds] = timePart.split(':').map(Number);

          const lastUpdatedTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
          setLastUpdated(lastUpdatedTime);
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

  // Helper function to get live price (EXACT same pattern as influencer-search)
  const getLivePrice = useCallback((symbol) => {
    if (!symbol) return "N/A";
    const upperSymbol = symbol.toUpperCase();
    const livePrice = livePricesMap[upperSymbol];
    if (livePrice && livePrice !== "-") {
      return typeof livePrice === 'number' ? livePrice : parseFloat(livePrice);
    }
    return "N/A";
  }, [livePricesMap]);

  const getLivePriceChange = useCallback((symbol) => {
    if (!symbol) return null;
    const upperSymbol = symbol.toUpperCase();
    const priceChange = livePriceChangesMap[upperSymbol];
    return priceChange || null;
  }, [livePriceChangesMap]);

  // Helper function to get live bid/ask data from WebSocket (EXACT same pattern as influencer-search)
  const getLiveBidAsk = useCallback((symbol) => {
    if (!symbol) return null;
    const upperSymbol = symbol.toUpperCase();
    const symbolWithUSDT = `${upperSymbol}USDT`;
    return bidAskData[symbolWithUSDT] || null;
  }, [bidAskData]);

  // Helper function to get live volume data from Binance WebSocket (EXACT same pattern as influencer-search)
  const getLiveVolume = useCallback((symbol) => {
    if (!symbol) return null;
    const upperSymbol = symbol.toUpperCase();
    const symbolWithUSDT = `${upperSymbol}USDT`;
    return volumeData[symbolWithUSDT] || null;
  }, [volumeData]);

  // Helper function to truncate text to 30 words
  const truncateText = (text, wordLimit = 30) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ');
  };

  // Toggle expand/collapse for a specific cell
  const toggleExpand = (coinSymbol, columnName) => {
    const key = `${coinSymbol}-${columnName}`;
    setExpandedCells(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle expand/collapse for summary columns
  const toggleSummaryExpand = (coinSymbol) => {
    setExpandedSummaries(prev => ({
      ...prev,
      [coinSymbol]: !prev[coinSymbol]
    }));
  };

  // Check if summary is expanded
  const isSummaryExpanded = (coinSymbol) => {
    return expandedSummaries[coinSymbol] || false;
  };

  // Check if any summary is expanded
  const isAnySummaryExpanded = () => {
    return Object.values(expandedSummaries).some(val => val === true);
  };

  // Check if a cell is expanded
  const isExpanded = (coinSymbol, columnName) => {
    const key = `${coinSymbol}-${columnName}`;
    return expandedCells[key] || false;
  };

  // Get top 10 coins from selected timeframe with memoization
  // Only depends on coinsData and selectedTimeframe (not prices) to avoid unnecessary recalculations
  // The live prices are fetched via getLivePrice callbacks during render
  const top10Coins = useMemo(() => {
    if (!coinsData || !coinsData[selectedTimeframe]) return [];

    const allCoins = coinsData[selectedTimeframe].all_coins || [];
    const memCoins = coinsData[selectedTimeframe].mem_coins || [];
    const combined = [...allCoins, ...memCoins];
    return combined.slice(0, 10);
  }, [coinsData, selectedTimeframe]);

  // Update coinSymbols when top10Coins changes (only subscribe to visible coins)
  useEffect(() => {
    const symbols = top10Coins.map(coin => coin.symbol).filter(Boolean);
    setCoinSymbols(symbols);
  }, [top10Coins]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans mt-5">
      <main className="mx-auto px-4 pb-8">
        <div className="min-w-0">
          {/* Leaderboard Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* View Mode Toggle Buttons */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              {/* View Mode Buttons in Center */}
              <div className="flex justify-center items-center gap-3">
                <button
                  onClick={() => router.push("/influencer-search")}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Influencers
                </button>
                <button
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                >
                  Coins
                </button>
                <button
                  onClick={() => router.push("/posts")}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Publish Posts
                </button>
              </div>
              {/* Last Updated */}
              <div className="flex justify-center mt-2">
                <p className="text-lg font-semibold text-black-600">
                  Trending Coins (Updated every 6 Hrs)
                </p>
              </div>
              {/* Timezone Toggle */}
              <div className="flex items-start gap-6 mt-2">

                {/* LEFT COLUMN — Timezone + Toggle */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-black-600">
                    Timezone
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleTimezone()}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${!useLocalTime
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      UTC
                    </button>

                    <button
                      onClick={() => toggleTimezone()}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${useLocalTime
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {useLocalTime && userCity ? userCity : 'Local Time'}
                    </button>
                  </div>
                </div>

                {/* RIGHT COLUMN — Last Updated */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-black-600">
                    Last Updated
                  </span>

                  <p className="text-xs text-black-600 py-1.5">
                    {lastUpdated ? formatDate(lastUpdated) : "N/A"}
                  </p>
                </div>

              </div>

            </div>

            {/* Timeframe Selector */}
            {/* <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
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
            </div> */}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th rowSpan="2" className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider w-[8%] align-middle">
                      Coins
                    </th>
                    <th rowSpan="2" className="pl-2 pr-0.5 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-[8%] align-middle">
                      <div className="flex flex-col items-start gap-0.5">
                        <span>Sentiment</span>
                        <div className="flex items-center justify-start gap-1">
                          <span>ST/LT</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              ST : Short Term<br />LT : Long Term
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                    <th rowSpan="2" className="pl-0.5 pr-2 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-[8%] align-middle">
                      <div className="flex flex-col items-start">
                        <span>Base Price</span>
                        {/* <span>And % Change</span> */}
                      </div>
                    </th>
                    <th rowSpan="2" className="pl-0.5 pr-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider w-[8%] align-middle">
                      <div className="flex flex-col items-center">
                        {/* 24 Hours */}
                        <span>Current</span>
                        {/* Price + Info icon in same row */}
                        <div className="flex items-center gap-1">
                          <span>Price</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              Source: Binance <br />
                              N/A : Not Available
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                    {/* <th rowSpan="2" className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider w-[8%] align-middle">
                      <div className="flex flex-col items-center">
                        <span>Price Change</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-normal">(24hrs Binance)</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              N/A : Not Available
                            </span>
                          </span>
                        </div>
                      </div>
                    </th> */}
                    <th rowSpan="2" className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider w-[10%] align-middle">
                      <div className="flex flex-col items-center">
                        {/* 24 Hours */}
                        <span>Price</span>
                        {/* Price + Info icon in same row */}
                        <div className="flex items-center gap-1">
                          <span>Change</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              Source: Binance <br />
                              N/A : Not Available
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                    <th colSpan={isAnySummaryExpanded() ? "6" : "3"} className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider">
                      Summary Analysis
                    </th>
                    <th rowSpan="2" className="py-3 text-center text-xs font-bold text-black-900 tracking-wider align-middle" style={{ width: '30px', padding: '0.75rem 0.25rem' }}>

                    </th>
                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-1 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-auto">
                      Price targets
                    </th>
                    <th className="px-1 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-auto">
                      Overall sentiments
                    </th>
                    <th className="px-1 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-auto">
                      outlook (ST/LT)
                    </th>
                    {isAnySummaryExpanded() && (
                      <>
                        <th className="px-1 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-auto">
                          key Reasons
                        </th>
                        <th className="px-1 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-auto">
                          Disagreements
                        </th>
                        <th className="px-1 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-auto">
                          Risk Factors
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : top10Coins.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                        No coins data available for this timeframe
                      </td>
                    </tr>
                  ) : (
                    top10Coins.map((coin, index) => {
                      // Use callback functions for live data (similar to influencer-search)
                      const currentPrice = getLivePrice(coin.symbol);
                      const priceChangePercent = getLivePriceChange(coin.symbol);

                      // Calculate absolute price change from percentage
                      const priceChange = (priceChangePercent !== null && currentPrice !== 'N/A')
                        ? (currentPrice * priceChangePercent / 100)
                        : null;

                      return (
                        <tr key={`${coin.symbol}-${index}`} className="hover:bg-gray-50">
                          {/* Coin - Image and Name Vertically Stacked with Total Posts */}
                          <td className="px-2 py-3">
                            <div className="flex flex-col items-center gap-2">
                              {coin.image_small && (
                                <img
                                  src={coin.image_small}
                                  alt={coin.symbol}
                                  className="w-10 h-10 rounded-full"
                                />
                              )}
                              <div className="text-center">
                                <div className="text-xs font-bold text-balck-900">{coin.symbol}</div>
                                <div className="text-[10px] text-black-500">
                                  {coin.coin_name.charAt(0).toUpperCase() + coin.coin_name.slice(1)}
                                </div>
                                <div className="text-[10px] font-semibold text-black-900 mt-1">
                                  {coin.total_mentions} posts
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Sentiment - All 4 sentiments stacked vertically */}
                          <td className="pl-2 pr-0.5 py-3">
                            <div className="flex flex-col items-start gap-1">
                              {/* ST Bullish */}
                              {coin.yt_tg_bullish_short_term > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-700">
                                    <div className="flex items-center gap-0.5">
                                      <FaArrowUp className="text-[6px]" />
                                      <span className="text-[6px] font-semibold">ST</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-black-600 min-w-[45px]">
                                    {coin.yt_tg_bullish_short_term} {coin.yt_tg_bullish_short_term === 1 ? "post" : "posts"}
                                  </span>
                                </div>
                              )}
                              {/* ST Bearish */}
                              {coin.yt_tg_bearish_short_term > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100 text-red-700">
                                    <div className="flex items-center gap-0.5">
                                      <FaArrowDown className="text-[6px]" />
                                      <span className="text-[6px] font-semibold">ST</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-black-600 min-w-[45px]">
                                    {coin.yt_tg_bearish_short_term} {coin.yt_tg_bearish_short_term === 1 ? "post" : "posts"}
                                  </span>
                                </div>
                              )}
                              {/* LT Bullish */}
                              {coin.yt_tg_bullish_long_term > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-100 text-green-700">
                                    <div className="flex items-center gap-0.5">
                                      <FaArrowUp className="text-[6px]" />
                                      <span className="text-[6px] font-semibold">LT</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-black-600 min-w-[45px]">
                                    {coin.yt_tg_bullish_long_term} {coin.yt_tg_bullish_long_term === 1 ? "post" : "posts"}
                                  </span>
                                </div>
                              )}
                              {/* LT Bearish */}
                              {coin.yt_tg_bearish_long_term > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100 text-red-700">
                                    <div className="flex items-center gap-0.5">
                                      <FaArrowDown className="text-[6px]" />
                                      <span className="text-[6px] font-semibold">LT</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-black-600 min-w-[45px]">
                                    {coin.yt_tg_bearish_long_term} {coin.yt_tg_bearish_long_term === 1 ? "post" : "posts"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Publish Price + Price Change % */}
                          <td className="pl-0.5 pr-2 py-3">
                            <div className="flex flex-col justify-start">
                              {/* Publish Price (Average Base Price or Last Available Price) */}
                              {coin.avg_base_price && coin.binance_prices && coin.binance_prices.length > 0 ? (
                                <span className="text-[10px] font-semibold text-gray-900">
                                  ${parseFloat(coin.avg_base_price).toFixed(2)}
                                </span>
                              ) : coin.binance?.last_available_price ? (
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-semibold text-gray-900">
                                      ${parseFloat(coin.binance.last_available_price).toFixed(2)}
                                    </span>
                                    <span className="relative group cursor-pointer z-[9999]">
                                      <span className="text-blue-600 text-xs">ⓘ</span>
                                      <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                        MCMDB Last Price<br />
                                        {coin.binance.last_available_timestamp ? (
                                          <>
                                            {new Date(coin.binance.last_available_timestamp).toLocaleDateString('en-GB', {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                              timeZone: 'UTC'
                                            })}<br />
                                            {new Date(coin.binance.last_available_timestamp).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              hour12: true,
                                              timeZone: 'UTC'
                                            })} UTC
                                          </>
                                        ) : 'N/A'}
                                      </span>
                                    </span>
                                  </div>
                                  {coin.binance.last_available_timestamp && (
                                    <div className="flex flex-col text-[9px] text-gray-500">
                                      <span>{new Date(coin.binance.last_available_timestamp).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        timeZone: 'UTC'
                                      })}</span>
                                      <span>{new Date(coin.binance.last_available_timestamp).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                        timeZone: 'UTC'
                                      })} UTC</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] font-semibold text-gray-900">
                                  No base price available
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Price Change - Current Price + Price Change + Percentage */}
                          <td className="px-2 py-3 text-center">
                            {currentPrice !== 'N/A' ? (
                              <div className="flex flex-col items-center gap-0.5">

                                {/* Current Price */}
                                <span className="text-xs font-semibold text-blue-500">
                                  ${typeof currentPrice === 'number' ? currentPrice.toFixed(2) : currentPrice}
                                </span>

                                {/* Price Change Value */}
                                {/* {priceChange !== null && priceChangePercent !== null ? (
                                  <>
                                    <span
                                      className={`text-xs font-semibold ${parseFloat(priceChange) > 0
                                        ? 'text-green-600'
                                        : parseFloat(priceChange) < 0
                                          ? 'text-red-600'
                                          : 'text-gray-900'
                                        }`}
                                    >
                                      {parseFloat(priceChange) > 0 ? '+' : ''}
                                      {parseFloat(priceChange).toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}
                                    </span>
                                    <span
                                      className={`text-[10px] font-semibold ${parseFloat(priceChangePercent) > 0
                                        ? 'text-green-600'
                                        : parseFloat(priceChangePercent) < 0
                                          ? 'text-red-600'
                                          : 'text-gray-900'
                                        }`}
                                    >
                                      ({parseFloat(priceChangePercent) > 0 ? '+' : ''}
                                      {parseFloat(priceChangePercent).toFixed(2)}%)
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-500">N/A</span>
                                )} */}

                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">N/A</span>
                            )}
                          </td>

                          {/* Price Change - Current Price + Price Change + Percentage */}
                          {/* <td className="px-2 py-3 text-center">
                            {currentPrice !== 'N/A' ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-xs font-semibold text-blue-500">
                                  ${typeof currentPrice === 'number' ? currentPrice.toFixed(2) : currentPrice}
                                </span>
                                {priceChange !== null && priceChangePercent !== null ? (
                                  <>
                                    <span
                                      className={`text-xs font-semibold ${parseFloat(priceChange) > 0
                                        ? 'text-green-600'
                                        : parseFloat(priceChange) < 0
                                          ? 'text-red-600'
                                          : 'text-gray-900'
                                        }`}
                                    >
                                      {parseFloat(priceChange) > 0 ? '+' : ''}
                                      {parseFloat(priceChange).toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                      })}
                                    </span>
                                    <span
                                      className={`text-[10px] font-semibold ${parseFloat(priceChangePercent) > 0
                                        ? 'text-green-600'
                                        : parseFloat(priceChangePercent) < 0
                                          ? 'text-red-600'
                                          : 'text-gray-900'
                                        }`}
                                    >
                                      ({parseFloat(priceChangePercent) > 0 ? '+' : ''}
                                      {parseFloat(priceChangePercent).toFixed(2)}%)
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-500">N/A</span>
                                )}

                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">N/A</span>
                            )}
                          </td> */}
                          <td className="px-2 py-3 text-center">
                            {/* {(() => {
                              const liveVolume = getLiveVolume(coin.symbol);

                              if (liveVolume?.volume) {
                                const volume = parseFloat(liveVolume.volume);

                                return (
                                  <span className="text-xs font-semibold text-gray-900">
                                    {volume.toLocaleString("en-US", {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0
                                    })}
                                  </span>
                                );
                              }

                              return <span className="text-xs text-gray-500">N/A</span>;
                            })()} */}
                            <span className={`text-[10px] font-semibold ${coin.avg_base_price && coin.binance_prices && coin.binance_prices.length > 0 && currentPrice !== 'N/A'
                              ? ((currentPrice - coin.avg_base_price) / coin.avg_base_price * 100) > 0
                                ? 'text-green-600'
                                : ((currentPrice - coin.avg_base_price) / coin.avg_base_price * 100) < 0
                                  ? 'text-red-600'
                                  : 'text-gray-900'
                              : 'text-gray-500'
                              }`}>
                              {coin.avg_base_price && coin.binance_prices && coin.binance_prices.length > 0 && currentPrice !== 'N/A'
                                ? (() => {
                                  const changePercent = ((currentPrice - coin.avg_base_price) / coin.avg_base_price * 100);
                                  return `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
                                })()
                                : 'N/A'}
                            </span>
                          </td>


                          {/* Summary Analysis Columns - Using API Response Data */}
                          {/* First 3 columns - ALWAYS VISIBLE */}
                          {/* Price Targets */}
                          <td className="px-1 py-3 text-left align-top">
                            <div className="text-[11px] text-gray-700 break-words">
                              {coin.Price_Targets ? (
                                <>
                                  <p>
                                    {isExpanded(coin.symbol, 'Price_Targets')
                                      ? coin.Price_Targets
                                      : truncateText(coin.Price_Targets, 30)}
                                    {coin.Price_Targets.split(' ').length > 30 && (
                                      <>
                                        {!isExpanded(coin.symbol, 'Price_Targets') && '...'}
                                      </>
                                    )}
                                  </p>
                                  {coin.Price_Targets.split(' ').length > 30 && (
                                    <button
                                      onClick={() => toggleExpand(coin.symbol, 'Price_Targets')}
                                      className="text-blue-600 hover:text-blue-800 font-semibold mt-1"
                                    >
                                      {isExpanded(coin.symbol, 'Price_Targets') ? 'Read less' : 'Read more'}
                                    </button>
                                  )}
                                </>
                              ) : (
                                'N/A'
                              )}
                            </div>
                          </td>
                          {/* Overall Sentiments */}
                          <td className="px-1 py-3 text-left align-top">
                            <div className="text-[11px] text-gray-700 break-words">
                              {coin.Overall_Sentiment ? (
                                <>
                                  <p>
                                    {isExpanded(coin.symbol, 'Overall_Sentiment')
                                      ? coin.Overall_Sentiment
                                      : truncateText(coin.Overall_Sentiment, 30)}
                                    {coin.Overall_Sentiment.split(' ').length > 30 && (
                                      <>
                                        {!isExpanded(coin.symbol, 'Overall_Sentiment') && '...'}
                                      </>
                                    )}
                                  </p>
                                  {coin.Overall_Sentiment.split(' ').length > 30 && (
                                    <button
                                      onClick={() => toggleExpand(coin.symbol, 'Overall_Sentiment')}
                                      className="text-blue-600 hover:text-blue-800 font-semibold mt-1"
                                    >
                                      {isExpanded(coin.symbol, 'Overall_Sentiment') ? 'Read less' : 'Read more'}
                                    </button>
                                  )}
                                </>
                              ) : (
                                'N/A'
                              )}
                            </div>
                          </td>
                          {/* Outlook (ST/LT) */}
                          <td className="px-1 py-3 text-left align-top">
                            <div className="text-[11px] text-gray-700 break-words">
                              {coin.Outlook_ST_LT ? (
                                <>
                                  <p>
                                    {isExpanded(coin.symbol, 'Outlook_ST_LT')
                                      ? coin.Outlook_ST_LT
                                      : truncateText(coin.Outlook_ST_LT, 30)}
                                    {coin.Outlook_ST_LT.split(' ').length > 30 && (
                                      <>
                                        {!isExpanded(coin.symbol, 'Outlook_ST_LT') && '...'}
                                      </>
                                    )}
                                  </p>
                                  {coin.Outlook_ST_LT.split(' ').length > 30 && (
                                    <button
                                      onClick={() => toggleExpand(coin.symbol, 'Outlook_ST_LT')}
                                      className="text-blue-600 hover:text-blue-800 font-semibold mt-1"
                                    >
                                      {isExpanded(coin.symbol, 'Outlook_ST_LT') ? 'Read less' : 'Read more'}
                                    </button>
                                  )}
                                </>
                              ) : (
                                'N/A'
                              )}
                            </div>
                          </td>

                          {/* Last 3 columns - Only show when THIS row is expanded */}
                          {isSummaryExpanded(coin.symbol) && (
                            <>
                              {/* Key Reasons */}
                              <td className="px-1 py-3 text-left align-top">
                                <div className="text-[11px] text-gray-700 break-words">
                                  {coin.Key_Reasons ? (
                                    <>
                                      <p>
                                        {isExpanded(coin.symbol, 'Key_Reasons')
                                          ? coin.Key_Reasons
                                          : truncateText(coin.Key_Reasons, 30)}
                                        {coin.Key_Reasons.split(' ').length > 30 && (
                                          <>
                                            {!isExpanded(coin.symbol, 'Key_Reasons') && '...'}
                                          </>
                                        )}
                                      </p>
                                      {coin.Key_Reasons.split(' ').length > 30 && (
                                        <button
                                          onClick={() => toggleExpand(coin.symbol, 'Key_Reasons')}
                                          className="text-blue-600 hover:text-blue-800 font-semibold mt-1"
                                        >
                                          {isExpanded(coin.symbol, 'Key_Reasons') ? 'Read less' : 'Read more'}
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    'N/A'
                                  )}
                                </div>
                              </td>
                              {/* Disagreements */}
                              <td className="px-1 py-3 text-left align-top">
                                <div className="text-[11px] text-gray-700 break-words">
                                  {coin.Disagreements ? (
                                    <>
                                      <p>
                                        {isExpanded(coin.symbol, 'Disagreements')
                                          ? coin.Disagreements
                                          : truncateText(coin.Disagreements, 30)}
                                        {coin.Disagreements.split(' ').length > 30 && (
                                          <>
                                            {!isExpanded(coin.symbol, 'Disagreements') && '...'}
                                          </>
                                        )}
                                      </p>
                                      {coin.Disagreements.split(' ').length > 30 && (
                                        <button
                                          onClick={() => toggleExpand(coin.symbol, 'Disagreements')}
                                          className="text-blue-600 hover:text-blue-800 font-semibold mt-1"
                                        >
                                          {isExpanded(coin.symbol, 'Disagreements') ? 'Read less' : 'Read more'}
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    'N/A'
                                  )}
                                </div>
                              </td>
                              {/* Risk Factors */}
                              <td className="px-1 py-3 text-left align-top">
                                <div className="text-[11px] text-gray-700 break-words">
                                  {coin.Risk_Factors ? (
                                    <>
                                      <p>
                                        {isExpanded(coin.symbol, 'Risk_Factors')
                                          ? coin.Risk_Factors
                                          : truncateText(coin.Risk_Factors, 30)}
                                        {coin.Risk_Factors.split(' ').length > 30 && (
                                          <>
                                            {!isExpanded(coin.symbol, 'Risk_Factors') && '...'}
                                          </>
                                        )}
                                      </p>
                                      {coin.Risk_Factors.split(' ').length > 30 && (
                                        <button
                                          onClick={() => toggleExpand(coin.symbol, 'Risk_Factors')}
                                          className="text-blue-600 hover:text-blue-800 font-semibold mt-1"
                                        >
                                          {isExpanded(coin.symbol, 'Risk_Factors') ? 'Read less' : 'Read more'}
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    'N/A'
                                  )}
                                </div>
                              </td>
                            </>
                          )}

                          {/* Expand/Collapse Button */}
                          <td className="py-3 text-center align-top" style={{ width: '30px', padding: '0.75rem 0.25rem' }}>
                            <button
                              onClick={() => toggleSummaryExpand(coin.symbol)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-lg"
                            >
                              {isSummaryExpanded(coin.symbol) ? '−' : '+'}
                            </button>
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
