"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const MarketHeatmap = () => {
  const [selectedCoinType, setSelectedCoinType] = useState("topcoins"); // "topcoins" or "memecoins"
  const [timeFilter, setTimeFilter] = useState("24hrs");
  const [youtubeData, setYoutubeData] = useState(null);
  const [youtubeLoading, setYoutubeLoading] = useState(true);
  const [telegramCoinType, setTelegramCoinType] = useState("topcoins");
  const [telegramTimeFilter, setTelegramTimeFilter] = useState("24hrs");
  const [telegramData, setTelegramData] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(true);

  // Dummy telegram data for development
  const dummyTelegramData = {
    resultsByTimeframe: {
      "24hrs": {
        topCoins: [
          { symbol: "BTC", coin_name: "bitcoin", total_mentions: 45, bullish_count: 28, bearish_count: 17 },
          { symbol: "ETH", coin_name: "ethereum", total_mentions: 38, bullish_count: 25, bearish_count: 13 },
          { symbol: "SOL", coin_name: "solana", total_mentions: 32, bullish_count: 20, bearish_count: 12 },
          { symbol: "ADA", coin_name: "cardano", total_mentions: 28, bullish_count: 15, bearish_count: 13 },
          { symbol: "AVAX", coin_name: "avalanche", total_mentions: 25, bullish_count: 18, bearish_count: 7 },
          { symbol: "DOT", coin_name: "polkadot", total_mentions: 22, bullish_count: 14, bearish_count: 8 },
          { symbol: "LINK", coin_name: "chainlink", total_mentions: 20, bullish_count: 12, bearish_count: 8 },
          { symbol: "MATIC", coin_name: "polygon", total_mentions: 18, bullish_count: 11, bearish_count: 7 }
        ],
        mem_coins: [
          { symbol: "DOGE", coin_name: "dogecoin", total_mentions: 35, bullish_count: 22, bearish_count: 13 },
          { symbol: "SHIB", coin_name: "shiba inu", total_mentions: 30, bullish_count: 18, bearish_count: 12 },
          { symbol: "PEPE", coin_name: "pepe", total_mentions: 28, bullish_count: 20, bearish_count: 8 },
          { symbol: "FLOKI", coin_name: "floki", total_mentions: 25, bullish_count: 15, bearish_count: 10 },
          { symbol: "BONK", coin_name: "bonk", total_mentions: 22, bullish_count: 14, bearish_count: 8 },
          { symbol: "WIF", coin_name: "dogwifhat", total_mentions: 20, bullish_count: 13, bearish_count: 7 }
        ],
        dateRange: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        },
        next_update_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      },
      "7days": {
        topCoins: [
          { symbol: "BTC", coin_name: "bitcoin", total_mentions: 280, bullish_count: 170, bearish_count: 110 },
          { symbol: "ETH", coin_name: "ethereum", total_mentions: 245, bullish_count: 155, bearish_count: 90 },
          { symbol: "SOL", coin_name: "solana", total_mentions: 210, bullish_count: 140, bearish_count: 70 },
          { symbol: "ADA", coin_name: "cardano", total_mentions: 185, bullish_count: 110, bearish_count: 75 }
        ],
        mem_coins: [
          { symbol: "DOGE", coin_name: "dogecoin", total_mentions: 220, bullish_count: 145, bearish_count: 75 },
          { symbol: "SHIB", coin_name: "shiba inu", total_mentions: 195, bullish_count: 125, bearish_count: 70 },
          { symbol: "PEPE", coin_name: "pepe", total_mentions: 180, bullish_count: 120, bearish_count: 60 }
        ],
        dateRange: {
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        }
      },
      "30days": {
        topCoins: [
          { symbol: "BTC", coin_name: "bitcoin", total_mentions: 1200, bullish_count: 750, bearish_count: 450 },
          { symbol: "ETH", coin_name: "ethereum", total_mentions: 1050, bullish_count: 680, bearish_count: 370 },
          { symbol: "SOL", coin_name: "solana", total_mentions: 900, bullish_count: 580, bearish_count: 320 }
        ],
        mem_coins: [
          { symbol: "DOGE", coin_name: "dogecoin", total_mentions: 950, bullish_count: 620, bearish_count: 330 },
          { symbol: "SHIB", coin_name: "shiba inu", total_mentions: 820, bullish_count: 540, bearish_count: 280 }
        ],
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        }
      }
    }
  };

  // Fetch YouTube data from API
  const fetchYoutubeData = async () => {
    try {
      setYoutubeLoading(true);
      const response = await fetch('https://mcmapi.showmyui.com:3035/api/admin/youtubedata/topcoins');
      const data = await response.json();
      setYoutubeData(data);
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
    } finally {
      setYoutubeLoading(false);
    }
  };

  // Fetch Telegram data from API
  const fetchTelegramData = async () => {
    try {
      setTelegramLoading(true);
      const response = await fetch('https://mcmapi.showmyui.com:3035/api/admin/telegramdata/topcoins');
      const data = await response.json();
      setTelegramData(data);
    } catch (error) {
      console.error('Error fetching Telegram data:', error);
    } finally {
      setTelegramLoading(false);
    }
  };

  useEffect(() => {
    fetchYoutubeData();
    fetchTelegramData();
  }, []);

  // Get color based on bullish vs bearish count (matching heatmap screenshot)
  const getColorIntensity = (bullishCount, bearishCount) => {
    if (bullishCount > bearishCount) {
      return "bg-green-600"; // Green for bullish majority
    } else if (bearishCount > bullishCount) {
      return "bg-red-600"; // Red for bearish majority  
    } else {
      return "bg-blue-600"; // Blue for equal/neutral counts
    }
  };

  // Get size based on total mentions
  const getSizeClass = (totalMentions, maxMentions) => {
    const ratio = totalMentions / maxMentions;
    if (ratio >= 0.8) return "col-span-2 row-span-2";
    if (ratio >= 0.6) return "col-span-2 row-span-1";
    if (ratio >= 0.4) return "col-span-1 row-span-2";
    return "col-span-1 row-span-1";
  };

  const renderHeatmapTiles = (data, coinType, timeFilter) => {
    if (!data || !data.resultsByTimeframe) return null;

    const timeframeData = data.resultsByTimeframe[timeFilter];
    if (!timeframeData) return null;

    const coins = coinType === "topcoins" ? timeframeData.topCoins : timeframeData.mem_coins;
    if (!coins || coins.length === 0) return null;

    // Sort coins by total mentions in descending order (highest first)
    const sortedCoins = [...coins].sort((a, b) => b.total_mentions - a.total_mentions);
    const maxMentions = Math.max(...sortedCoins.map(coin => coin.total_mentions));

    return sortedCoins.slice(0, 16).map((coin, index) => {
      const colorClass = getColorIntensity(coin.bullish_count, coin.bearish_count);
      const sizeClass = getSizeClass(coin.total_mentions, maxMentions);

      return (
        <motion.div
          key={`${coin.symbol}-${index}`}
          className={`${colorClass} ${sizeClass} rounded-lg p-3 flex flex-col justify-between text-white relative overflow-hidden`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ scale: 1.05, z: 10 }}
        >
          <div className="relative z-10">
            <div className="text-sm font-bold">{coin.symbol}</div>
            <div className="text-xs opacity-90 capitalize">{coin.coin_name}</div>
          </div>

          <div className="relative z-10 mt-2">
            <div className="text-xs">
              {coin.unique_influencers_count && (
                <div className="flex justify-between items-center">
                  <span>Influencers</span>
                  <span>{coin.unique_influencers_count}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Bullish</span>
                <span>{coin.bullish_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Bearish</span>
                <span>{coin.bearish_count}</span>
              </div>
            </div>
          </div>

          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        </motion.div>
      );
    });
  };

  if (youtubeLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <section className="relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Market Heatmaps
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full mb-6"></div>
          <p className="text-white max-w-2xl mx-auto text-lg">
            Real-time visualization of cryptocurrency sentiment and mentions from top influencers
          </p>
        </motion.div>

        {/* YouTube Heatmap Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          {/* YouTube Header with Icon */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className="text-red-500"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <h3 className="text-3xl font-bold text-white">YouTube Influencers</h3>
          </div>

          {/* Coin Type Selection, Last Updated, and Time Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            {/* Coin Type Dropdown */}
            <div className="relative">
              <select
                value={selectedCoinType}
                onChange={(e) => setSelectedCoinType(e.target.value)}
                className="px-4 py-2 bg-white rounded-xl border border-purple-300 text-black appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10 shadow-sm"
              >
                <option value="topcoins">Top Coins</option>
                <option value="memecoins">Mem Coins</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            {/* Last Updated and Next Update Display - Only for 24hrs */}
            {youtubeData && youtubeData.resultsByTimeframe && youtubeData.resultsByTimeframe[timeFilter] && timeFilter === "24hrs" && (
              <div className="flex flex-col gap-2">
                {/* Last Updated */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-purple-300 shadow-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="text-xs text-black">
                    <span className="text-black font-medium">Last Updated (UTC): </span>
                    {new Date(youtubeData.resultsByTimeframe[timeFilter].dateRange.to).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>

                {/* Next Update */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-blue-300 shadow-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="text-xs text-black">
                    <span className="text-black font-medium">Next Update (UTC): </span>
                     {new Date(youtubeData.resultsByTimeframe[timeFilter].next_update_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Update Date Display - Only for 7days and 30days */}
            {youtubeData && youtubeData.resultsByTimeframe && youtubeData.resultsByTimeframe[timeFilter] && (timeFilter === "7days" || timeFilter === "30days") && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-purple-300 shadow-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="text-xs text-black">
                  <span className="text-black font-medium">Update Date: </span>
                 {new Date(youtubeData.resultsByTimeframe[timeFilter].dateRange.from).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                </div>
              </div>
            )}

            {/* Time Filter */}
            <div className="flex bg-gray-100 rounded-xl p-1 border border-blue-300 shadow-sm">
              {["24hrs", "7days", "30days"].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`px-3 py-2 rounded-lg transition-all duration-300 text-sm ${timeFilter === period
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-black hover:text-purple-600"
                    }`}
                >
                  {period === "24hrs" ? "24H" : period === "7days" ? "7D" : "30D"}
                </button>
              ))}
            </div>
          </div>

          {/* YouTube Heatmap Grid */}
          <div className="rounded-2xl p-6 bg-white border border-purple-300 shadow-sm">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 min-h-96">
              {renderHeatmapTiles(youtubeData, selectedCoinType, timeFilter)}
            </div>
          </div>
        </motion.div>

        {/* Telegram Heatmap Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Telegram Header with Icon */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className="text-blue-500"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <h3 className="text-3xl font-bold text-white">Telegram Influencers</h3>
          </div>

          {/* Telegram Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            {/* Coin Type Dropdown */}
            <div className="relative">
              <select
                value={telegramCoinType}
                onChange={(e) => setTelegramCoinType(e.target.value)}
                className="px-4 py-2 bg-white rounded-xl border border-purple-300 text-black appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10 shadow-sm"
              >
                <option value="topcoins">Top Coins</option>
                <option value="memecoins">Mem Coins</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">

                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            {/* Last Updated and Next Update Display - Only for 24hrs */}
            {telegramData && telegramData.resultsByTimeframe && telegramData.resultsByTimeframe[telegramTimeFilter] && telegramTimeFilter === "24hrs" && (
              <div className="flex flex-col gap-2">
                {/* Last Updated */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-blue-300 shadow-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="text-xs text-black">
                    <span className="text-black font-medium">Last Updated (UTC): </span>
                    {new Date(telegramData.resultsByTimeframe[telegramTimeFilter].dateRange.to).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>

                {/* Next Update */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-blue-300 shadow-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="text-xs text-black">
                    <span className="text-black font-medium">Next Update (UTC): </span>
                     {new Date(telegramData.resultsByTimeframe[telegramTimeFilter].next_update_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Update Date Display - Only for 7days and 30days */}
            {telegramData && telegramData.resultsByTimeframe && telegramData.resultsByTimeframe[telegramTimeFilter] && (telegramTimeFilter === "7days" || telegramTimeFilter === "30days") && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-blue-300 shadow-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="text-xs text-black">
                  <span className="text-black font-medium">Update Date: </span>
                 {new Date(telegramData.resultsByTimeframe[telegramTimeFilter].dateRange.from).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                </div>
              </div>
            )}

            {/* Time Filter */}
            <div className="flex bg-gray-100 rounded-xl p-1 border border-blue-300 shadow-sm">
              {["24hrs", "7days", "30days"].map((period) => (
                <button
                  key={period}
                  onClick={() => setTelegramTimeFilter(period)}
                  className={`px-3 py-2 rounded-lg transition-all duration-300 text-sm ${telegramTimeFilter === period
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-black hover:text-blue-600"
                    }`}
                >
                  {period === "24hrs" ? "24H" : period === "7days" ? "7D" : "30D"}
                </button>
              ))}
            </div>
          </div>

          {/* Telegram Heatmap Grid */}
          <div className="rounded-2xl p-6 bg-white border border-blue-300 shadow-sm">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 min-h-96">
              {telegramLoading ? (
                <div className="col-span-full flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                renderHeatmapTiles(telegramData, telegramCoinType, telegramTimeFilter)
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketHeatmap;