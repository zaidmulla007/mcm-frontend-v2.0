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

  // Use timezone context for local/UTC time switching
  const { formatDate, useLocalTime, toggleTimezone, userTimezone } = useTimezone();

  // Get city name from timezone
  const userCity = userTimezone ? userTimezone.split('/').pop().replace(/_/g, ' ') : 'Local Time';

  // Use live price hook (EXACT same pattern as influencer-search)
  const { coinsLiveData, isConnected } = useCoinsLivePrice(coinSymbols);

  // Create a live prices map that updates when coinsLiveData changes (EXACT same pattern as influencer-search)
  const livePricesMap = useMemo(() => {
    const pricesMap = {};
    coinsLiveData.forEach(coin => {
      pricesMap[coin.symbol.toUpperCase()] = coin.price;
    });
    return pricesMap;
  }, [coinsLiveData]);

  const livePriceChangesMap = useMemo(() => {
    const changesMap = {};
    coinsLiveData.forEach(coin => {
      changesMap[coin.symbol.toUpperCase()] = coin.priceChange24h;
    });
    return changesMap;
  }, [coinsLiveData]);

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
                  Posts
                </button>
              </div>
              {/* Last Updated */}
              <div className="flex justify-center mt-2">
                <p className="text-sm text-black-600">
                  {lastUpdated ? formatDate(lastUpdated) : "N/A"}
                </p>
              </div>
              {/* Timezone Toggle */}
              <div className="flex justify-start mt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-center text-black-600">Timezone</span>
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
            <div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider w-[5%]">
                      Coins
                    </th>
                    <th className="pl-2 pr-0.5 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-[5%]">
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
                    <th className="pl-0.5 pr-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider w-[7%]">
                      <div className="flex flex-col items-center">
                        <span>Current Price</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-normal">(Binance)</span>
                          {/* Info Icon + Tooltip */}
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              N/A : Not Available
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider w-[8%]">
                      <div className="flex flex-col items-center">
                        <span>Price Change</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-normal">(24hrs Binance)</span>
                          {/* Info Icon + Tooltip */}
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              N/A : Not Available
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-[66%]">
                      AI Summary
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : top10Coins.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
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

                      // Generate detailed AI summary based on coin data
                      const totalBullish = coin.yt_tg_bullish_short_term + coin.yt_tg_bullish_long_term;
                      const totalBearish = coin.yt_tg_bearish_short_term + coin.yt_tg_bearish_long_term;
                      const isBullish = totalBullish > totalBearish;
                      const sentimentStrength = totalBullish === totalBearish ? 'Neutral' :
                        Math.abs(totalBullish - totalBearish) > 5 ? 'Strong' : 'Mild';
                      const sentimentDirection = isBullish ? 'Bullish' : 'Bearish';

                      const aiSummary = `Based on the provided data, here is a summary of ${coin.coin_name} trading insights over a 6-hour timeframe:

*1. Overall Sentiment Consensus:*
The overall sentiment leans *${sentimentStrength} ${sentimentDirection}* ${coin.yt_tg_bullish_short_term > coin.yt_tg_bearish_short_term ? 'in the short term' : 'with short-term caution'}, ${coin.yt_tg_bullish_long_term > coin.yt_tg_bearish_long_term ? 'with a positive long-term outlook' : 'with mixed long-term views'}.

*2. Key Reasons for Views:*
Influencers are ${isBullish ? 'optimistic about price appreciation and emphasize accumulation opportunities' : 'cautious, citing potential corrections and advising careful position management'}. ${coin.total_mentions > 20 ? 'High community engagement suggests strong interest' : coin.total_mentions > 10 ? 'Moderate community engagement indicates steady interest' : 'Limited community engagement reflects lower current attention'}.

*3. Common Price Targets & Holding Periods:*
${priceChangePercent && priceChangePercent !== 0 ? `Current price movement shows a ${priceChangePercent > 0 ? 'positive' : 'negative'} change of ${Math.abs(priceChangePercent).toFixed(2)}% over 24 hours.` : 'Price movement data is currently unavailable.'} ${coin.yt_tg_bullish_long_term > 0 ? 'Long-term holding strategies are recommended by several influencers.' : ''}

*4. Short-term vs. Long-term Outlook:*
Short-term: ${coin.yt_tg_bullish_short_term > coin.yt_tg_bearish_short_term ? `${coin.yt_tg_bullish_short_term} bullish calls suggest near-term upside potential` : `${coin.yt_tg_bearish_short_term} bearish calls indicate caution for near-term trading`}. Long-term: ${coin.yt_tg_bullish_long_term > coin.yt_tg_bearish_long_term ? `${coin.yt_tg_bullish_long_term} bullish recommendations favor accumulation strategies` : 'Mixed outlook with divided opinions on long-term holding'}.

*5. Notable Disagreements:*
${totalBullish > 0 && totalBearish > 0 ? `Significant divergence exists with ${totalBullish} bullish calls versus ${totalBearish} bearish calls, reflecting differing time horizons and risk appetites among influencers.` : 'Relatively unified sentiment among tracked influencers.'}

*6. Risk Factors:*
Key risks include ${priceChangePercent && priceChangePercent < -5 ? 'recent sharp decline indicating potential further downside' : priceChangePercent && priceChangePercent > 5 ? 'rapid appreciation raising concerns about potential corrections' : 'market volatility and changing sentiment dynamics'}. Monitoring key support and resistance levels remains critical for both short and long-term positions.`;

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

                          {/* Current Price */}
                          <td className="pl-0.5 pr-2 py-3 text-center">
                            <span className="text-xs font-semibold text-blue-600">
                              {(() => {
                                if (currentPrice === 'N/A') return 'N/A';
                                const value = typeof currentPrice === 'number' ? currentPrice : parseFloat(currentPrice);
                                if (isNaN(value)) return 'N/A';

                                if (Math.abs(value) >= 1000) {
                                  return `$${Math.round(value).toLocaleString('en-US')}`;
                                }

                                return `$${value.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 8
                                })}`;
                              })()}
                            </span>
                          </td>

                          {/* Price Change */}
                          <td className="px-2 py-3 text-center">
                            {priceChange !== null && priceChangePercent !== null ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`text-xs font-semibold ${parseFloat(priceChange) > 0
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
                                <span className={`text-[10px] font-semibold ${parseFloat(priceChange) > 0
                                  ? 'text-green-600'
                                  : parseFloat(priceChange) < 0
                                    ? 'text-red-600'
                                    : 'text-gray-900'
                                  }`}>
                                  ({parseFloat(priceChange) > 0 ? '+' : ''}{priceChangePercent}%)
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">N/A</span>
                            )}
                          </td>

                          {/* AI Summary */}
                          <td className="px-4 py-3 text-left">
                            <p className="text-xs text-gray-700 leading-relaxed">
                              {aiSummary}
                            </p>
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
