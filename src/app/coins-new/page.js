"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaYoutube, FaTelegramPlane, FaCertificate, FaBell, FaFileAlt } from "react-icons/fa";
import { useCoinsLivePrice } from "@/hooks/useCoinsLivePrice";
import { useTimezone } from "../contexts/TimezoneContext";
import SimpleTAGauge from "@/components/SimpleTAGauge";
import GaugeComponent from "react-gauge-component";

export default function CoinsNewPage() {
  const router = useRouter();
  const [coinsData, setCoinsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coinSymbols, setCoinSymbols] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [coinsWithReports, setCoinsWithReports] = useState(new Set());

  // Use timezone context for local/UTC time switching
  const { formatDate, useLocalTime, toggleTimezone, userTimezone } = useTimezone();

  // Get city name from timezone
  const userCity = userTimezone ? userTimezone.split('/').pop().replace(/_/g, ' ') : 'Local Time';

  // Use live price hook
  const { prices, priceChanges, isConnected } = useCoinsLivePrice(coinSymbols);

  // Create a live prices map
  const livePricesMap = useMemo(() => {
    const pricesMap = {};
    Object.entries(prices).forEach(([symbolKey, price]) => {
      const baseSymbol = symbolKey.replace('USDT', '');
      pricesMap[baseSymbol] = price;
    });
    return pricesMap;
  }, [prices]);

  // Create a live price changes map
  const livePriceChangesMap = useMemo(() => {
    const changesMap = {};
    Object.entries(priceChanges).forEach(([symbolKey, change]) => {
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
        setCoinsData(data);

        // Extract lastUpdated from the 6hrs timeframe
        const resultsByTimeframe = data.resultsByTimeframe || data;
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

  // Fetch list of coins with reports from /api/document
  useEffect(() => {
    const fetchCoinsWithReports = async () => {
      try {
        const response = await fetch('/api/document');
        if (!response.ok) {
          console.error("Failed to fetch coins with reports");
          return;
        }
        const data = await response.json();
        if (data.success && data.results) {
          // Create a Set of symbols and source_ids that have reports
          const reportsSet = new Set();
          data.results.forEach(coin => {
            // Add both symbol and source_id to the set (case-insensitive)
            if (coin.symbol) {
              reportsSet.add(coin.symbol.toUpperCase());
            }
            if (coin.source_id) {
              reportsSet.add(coin.source_id.toUpperCase());
            }
          });
          setCoinsWithReports(reportsSet);
        }
      } catch (err) {
        console.error("Error fetching coins with reports:", err);
      }
    };

    fetchCoinsWithReports();
  }, []);

  // Get top 10 coins from each timeframe and merge to unique list
  const uniqueCoins = useMemo(() => {
    if (!coinsData) return [];

    const resultsByTimeframe = coinsData.resultsByTimeframe || coinsData;
    const timeframes = ["6hrs", "24hrs", "7days", "30days"];
    const allCoinsMap = new Map();

    timeframes.forEach(timeframe => {
      if (!resultsByTimeframe || !resultsByTimeframe[timeframe]) return;

      const allCoins = resultsByTimeframe[timeframe].all_coins || [];
      const memCoins = resultsByTimeframe[timeframe].mem_coins || [];
      const combined = [...allCoins, ...memCoins];

      // Sort by total_mentions and take top 10
      combined.sort((a, b) => (b.total_mentions || 0) - (a.total_mentions || 0));
      const top10 = combined.slice(0, 10);

      // Add to map with timeframe data
      top10.forEach(coin => {
        const symbol = coin.symbol;
        if (!allCoinsMap.has(symbol)) {
          allCoinsMap.set(symbol, {
            ...coin,
            timeframeData: {}
          });
        }
        // Store data for this timeframe
        // API returns yt_total_mentions and tg_total_mentions, not yt_mentions and tg_mentions
        allCoinsMap.get(symbol).timeframeData[timeframe] = {
          total_mentions: coin.total_mentions || 0,
          yt_mentions: coin.yt_total_mentions || coin.yt_mentions || 0,
          tg_mentions: coin.tg_total_mentions || coin.tg_mentions || 0,
          bullish_percent: coin.bullish_percent || 0,
          bearish_percent: coin.bearish_percent || 0,
          yt_tg_bullish_short_term_percent: coin.yt_tg_bullish_short_term_percent || 0,
          yt_tg_bearish_short_term_percent: coin.yt_tg_bearish_short_term_percent || 0,
          yt_tg_bullish_long_term_percent: coin.yt_tg_bullish_long_term_percent || 0,
          yt_tg_bearish_long_term_percent: coin.yt_tg_bearish_long_term_percent || 0,
          TA_data: coin.TA_data
        };
      });
    });

    return Array.from(allCoinsMap.values());
  }, [coinsData]);

  // Update coinSymbols when uniqueCoins changes
  useEffect(() => {
    const symbols = uniqueCoins.map(coin => coin.symbol).filter(Boolean);
    setCoinSymbols(symbols);
  }, [uniqueCoins]);

  // Helper function to get live price
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
    return livePriceChangesMap[upperSymbol] || null;
  }, [livePriceChangesMap]);

  // Check if coin is new in last 6 hours
  const isNewCoin = useCallback((coin) => {
    if (!coinsData || !coinsData.notifications || !coinsData.notifications.new_coins) {
      return false;
    }
    const newCoins = coinsData.notifications.new_coins;
    return newCoins.some(newCoin =>
      newCoin.source_id === coin.source_id ||
      newCoin.symbol?.toLowerCase() === coin.symbol?.toLowerCase()
    );
  }, [coinsData]);

  // Mini Gauge Component for Bullish/Bearish - Using same style as SimpleTAGauge
  const MiniGauge = ({ bullishPercent, bearishPercent }) => {
    const total = bullishPercent + bearishPercent;

    if (total === 0) {
      return (
        <div className="flex flex-col items-center justify-center">
          <div style={{ width: 60, height: 60 }} className="flex items-center justify-center">
            <span className="text-xs text-gray-400">N/A</span>
          </div>
        </div>
      );
    }

    // Calculate score (0 to 100) similar to SimpleTAGauge
    // 100 = All Bullish, 50 = Neutral, 0 = All Bearish
    const score = bullishPercent;

    // Determine sentiment text and color
    let sentimentText = "Neutral";
    let sentimentColor = "text-gray-500";

    if (score >= 60) {
      sentimentText = "Bullish";
      sentimentColor = "text-green-600 font-semibold";
    } else if (score <= 40) {
      sentimentText = "Bearish";
      sentimentColor = "text-red-600 font-semibold";
    }

    return (
      <div className="flex flex-col items-center">
        <GaugeComponent
          type="radial"
          style={{ width: 60, height: 60 }}
          value={score}
          labels={{
            valueLabel: { hide: true },
            tickLabels: {
              ticks: [
                { value: 20 },
                { value: 50 },
                { value: 80 },
                { value: 100 }
              ]
            }
          }}
          arc={{
            colorArray: ['#CE1F1F', '#00FF15'], // Red to Green like SimpleTAGauge
            nbSubArcs: 90,
            padding: 0.01,
            width: 0.4
          }}
          pointer={{
            animationDelay: 0,
            strokeWidth: 7
          }}
        />
        {/* Sentiment text below gauge */}
        <div className={`text-[10px] font-semibold text-center mt-1 ${sentimentColor}`}>
          {sentimentText}
        </div>
      </div>
    );
  };

  // Vertical Bar Component for Posts with Balanced Scaling
  const PostsBar = ({ ytPosts, tgPosts, maxPosts, timeframe }) => {
    const total = ytPosts + tgPosts;
    const maxBarHeight = 60; // Maximum height in pixels
    const minBarHeight = 20; // Minimum bar height for non-zero values
    const minSegmentHeight = 3; // Minimum height for individual YT/TG segments

    let barHeight = 0;

    if (total === 0) {
      barHeight = 0;
    } else if (maxPosts > 0) {
      // Balanced scaling: compress the range so all values are visible
      // Uses a power scale (0.4) to compress differences while maintaining order
      const ratio = total / maxPosts;

      // Apply power scaling to compress the range
      // This makes small values more visible while keeping relative order
      const scaledRatio = Math.pow(ratio, 0.4);

      // Map to bar height range (minBarHeight to maxBarHeight)
      barHeight = minBarHeight + (scaledRatio * (maxBarHeight - minBarHeight));
    }

    // Calculate segment heights with minimum visible height
    const ytPercent = total > 0 ? (ytPosts / total) * 100 : 50;
    let tgHeight = (barHeight * (100 - ytPercent)) / 100;
    let ytHeight = (barHeight * ytPercent) / 100;

    // Ensure each non-zero segment has minimum visible height
    if (tgPosts > 0 && tgHeight < minSegmentHeight) {
      tgHeight = minSegmentHeight;
    }
    if (ytPosts > 0 && ytHeight < minSegmentHeight) {
      ytHeight = minSegmentHeight;
    }

    // Adjust total bar height if segments were adjusted
    if (tgHeight + ytHeight > barHeight) {
      barHeight = tgHeight + ytHeight;
    }

    // Color palettes from client's image - different shade for each timeframe
    // Using darker shades for YouTube (top) and lighter shades for Telegram (bottom)
    const colorMap = {
      '6hrs': {
        youtube: '#C1D9ED',  // Light blue for YouTube
        telegram: '#E8F1F8', // Very light blue for Telegram
      },
      '24hrs': {
        youtube: '#92AECF',  // Medium-light blue for YouTube
        telegram: '#C1D9ED', // Light blue for Telegram
      },
      '7days': {
        youtube: '#6B8CAE',  // Medium-dark blue for YouTube
        telegram: '#92AECF', // Medium-light blue for Telegram
      },
      '30days': {
        youtube: '#5C7A94',  // Darker blue for YouTube
        telegram: '#6B8CAE', // Medium-dark blue for Telegram
      },
    };

    const colors = colorMap[timeframe] || colorMap['6hrs'];

    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-8 flex flex-col-reverse" style={{ minHeight: '60px' }}>
          {/* Stack bars from bottom - Telegram first (bottom), then YouTube on top */}
          {tgHeight > 0 && (
            <div
              className="w-full transition-all duration-300 cursor-pointer rounded-b-sm"
              style={{
                height: `${tgHeight}px`,
                background: `linear-gradient(to top, ${colors.telegram}, ${colors.telegram})`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
              }}
              title={`Telegram: ${tgPosts} posts`}
            />
          )}
          {ytHeight > 0 && (
            <div
              className="w-full transition-all duration-300 cursor-pointer rounded-t-lg"
              style={{
                height: `${ytHeight}px`,
                background: `linear-gradient(to top, ${colors.youtube}, ${colors.youtube})`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              title={`YouTube: ${ytPosts} posts`}
            />
          )}
        </div>
        <span className="text-[9px] font-medium text-gray-600">{timeframe}</span>
        <span className="text-[8px] text-gray-500">{total}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 text-gray-900 font-sans overflow-x-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="mx-auto px-4 pb-8 max-w-full overflow-x-hidden relative z-10">
        <div className="min-w-0 overflow-x-hidden">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-3xl shadow-2xl shadow-indigo-500/10 border-2 border-white/40">
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-indigo-200/30 bg-gradient-to-r from-cyan-50/50 to-fuchsia-50/50 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Left: Header Title */}
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold flex items-center gap-3 drop-shadow-sm">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      Trending Coins
                    </span>
                  </h2>
                  <p className="text-sm text-gray-600 mt-2">
                    Unique coins from top 10 across all timeframes ({uniqueCoins.length} coins)
                  </p>
                  <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 mt-3 shadow-lg shadow-indigo-500/50"></div>
                </div>

                {/* Right: Timezone Switch */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {!useLocalTime && (
                      <span className="text-xs font-medium text-gray-700">UTC</span>
                    )}
                    <button
                      onClick={() => toggleTimezone()}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-lg ${useLocalTime ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-indigo-500/50' : 'bg-gray-300'}`}
                      role="switch"
                      aria-checked={useLocalTime}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${useLocalTime ? 'translate-x-5 shadow-indigo-300' : 'translate-x-0.5'}`} />
                    </button>
                    {useLocalTime && (
                      <span className="text-xs font-medium text-gray-700">{userCity || 'Local'}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-900">
                    Update: {lastUpdated ? formatDate(lastUpdated) : "N/A"}
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#6B8CAE' }}></div>
                  <FaYoutube className="text-red-600" />
                  <span>YouTube</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#C1D9ED' }}></div>
                  <FaTelegramPlane className="text-blue-600" />
                  <span>Telegram</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-b-3xl">
              <table className="w-full table-fixed border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-purple-500">
                    {/* Coins */}
                    <th className="px-3 py-3 text-center text-xs font-bold text-white tracking-wide align-middle w-[10%] border-r border-white/20">
                      Coins
                    </th>
                    {/* No. of Posts */}
                    <th className="px-3 py-3 text-center text-xs font-bold text-white tracking-wide align-middle w-[35%] border-r border-white/20">
                      <div className="flex flex-col items-center gap-1">
                        <span>Social Media Sentiments</span>
                      </div>
                    </th>
                    {/* Fundamental - HOLD */}
                    <th className="px-3 py-3 text-center text-xs font-bold text-white tracking-wide align-middle w-[15%] border-r border-white/20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Fundamental Score</span>
                      </div>
                    </th>
                    {/* Technical Analysis */}
                    <th className="px-3 py-3 text-center text-xs font-bold text-white tracking-wide align-middle w-[25%] border-r border-white/20">
                      <div className="flex flex-col items-center gap-1">
                        <span>Technical Indicators</span>
                      </div>
                    </th>
                    {/* MCM Analysis */}
                    <th className="px-3 py-3 text-center text-xs font-bold text-white tracking-wide align-middle w-[15%]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>MCM Summary</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gradient-to-br from-white/80 via-indigo-50/40 to-fuchsia-50/40 backdrop-blur-sm divide-y divide-indigo-200/30">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 border-t-4 border-t-cyan-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-red-600 font-semibold">
                        {error}
                      </td>
                    </tr>
                  ) : uniqueCoins.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium">
                        No coins data available
                      </td>
                    </tr>
                  ) : (
                    uniqueCoins.map((coin, index) => {
                      const timeframes = ["6hrs", "24hrs", "7days", "30days"];
                      const timeframeLabels = ["6hrs", "24hrs", "7days", "30days"];

                      // Calculate max posts for scaling bars
                      let maxPosts = 0;
                      timeframes.forEach(tf => {
                        const data = coin.timeframeData[tf];
                        if (data) {
                          maxPosts = Math.max(maxPosts, data.total_mentions || 0);
                        }
                      });

                      return (
                        <tr key={`${coin.symbol}-${index}`} className="group hover:bg-gradient-to-r hover:from-indigo-50/60 hover:via-purple-50/50 hover:to-fuchsia-50/60 transition-all duration-300">
                          {/* Coins Column */}
                          <td className="px-3 py-4 group-hover:bg-white/50 transition-all duration-300">
                            <div className="flex flex-col items-center gap-2">
                              {coin.image_small && (
                                <div className="relative">
                                  <img
                                    src={coin.image_small}
                                    alt={coin.symbol}
                                    className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                                    onClick={() => router.push(`/coins-list/${coin.source_id}`)}
                                  />
                                  {isNewCoin(coin) && (
                                    <div className="absolute -top-1 -left-2 group/newcoin cursor-pointer">
                                      <div className="relative inline-flex items-center justify-center h-4 w-4">
                                        <FaCertificate className="text-blue-500 w-full h-full drop-shadow-sm" />
                                        <span className="absolute text-[8px] font-bold text-white">M</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="text-center">
                                <div className="text-xs font-bold text-gray-900">
                                  {coin.symbol?.toUpperCase()}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {coin.coin_name?.charAt(0).toUpperCase() + coin.coin_name?.slice(1)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* No. of Posts Column - Vertical Bars with Gauges */}
                          <td className="px-3 py-4 group-hover:bg-white/50 transition-all duration-300">
                            <div className="flex items-end justify-center gap-7">
                              {timeframes.map((tf, tfIndex) => {
                                const data = coin.timeframeData[tf] || {};
                                const ytPosts = data.yt_mentions || 0;
                                const tgPosts = data.tg_mentions || 0;
                                // Use bullish_percent and bearish_percent from the API
                                const bullish = data.bullish_percent || 0;
                                const bearish = data.bearish_percent || 0;

                                return (
                                  <div key={tf} className="flex flex-col items-center">
                                    {/* Mini Gauge on top */}
                                    <MiniGauge
                                      bullishPercent={bullish}
                                      bearishPercent={bearish}
                                    />
                                    {/* Spacer - increased space between gauge and bar */}
                                    <div className="h-6"></div>
                                    {/* Vertical Bar */}
                                    <PostsBar
                                      ytPosts={ytPosts}
                                      tgPosts={tgPosts}
                                      maxPosts={maxPosts || 1}
                                      timeframe={timeframeLabels[tfIndex]}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Fundamental Column - Display Fundamental Score */}
                          <td className="px-3 py-4 text-center group-hover:bg-white/50 transition-all duration-300">
                            <div className="flex flex-col items-center justify-center gap-1 px-2">
                              {coin.whitepaper_analysis?.fundamental_score !== undefined && coin.whitepaper_analysis?.fundamental_score !== null ? (
                                <>
                                  <div className="w-full h-[8px] bg-gray-200 rounded-full overflow-hidden relative">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                      style={{ width: `${(coin.whitepaper_analysis.fundamental_score / 10) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-700">
                                    {coin.whitepaper_analysis.fundamental_score}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">N/A</span>
                              )}
                            </div>
                          </td>

                          {/* Technical Analysis Column */}
                          <td className="px-3 py-4 group-hover:bg-white/50 transition-all duration-300">
                            <div className="flex items-center justify-center gap-4">
                              {/* Short Term (1hr) - Use 6hrs data */}
                              <div className="flex flex-col items-center gap-1">
                                {coin.timeframeData?.["6hrs"]?.TA_data ? (
                                  <SimpleTAGauge
                                    taData={coin.timeframeData["6hrs"].TA_data}
                                    signal={coin.timeframeData["6hrs"].TA_data.mcm_signal}
                                    size="small"
                                  />
                                ) : (
                                  <MiniGauge bullishPercent={50} bearishPercent={50} />
                                )}
                                <span className="text-[9px] font-semibold text-gray-600">Short</span>
                                <span className="text-[8px] font-semibold text-gray-600">Term</span>
                              </div>
                              {/* Medium Term (1day) - Use 24hrs data */}
                              <div className="flex flex-col items-center gap-1">
                                {coin.timeframeData?.["24hrs"]?.TA_data ? (
                                  <SimpleTAGauge
                                    taData={coin.timeframeData["24hrs"].TA_data}
                                    signal={coin.timeframeData["24hrs"].TA_data.mcm_signal}
                                    size="small"
                                  />
                                ) : (
                                  <MiniGauge bullishPercent={50} bearishPercent={50} />
                                )}
                                <span className="text-[9px] font-semibold text-gray-600">Mid</span>
                                <span className="text-[8px] font-semibold text-gray-600">Term</span>
                              </div>
                              {/* Long Term (1week) - Use 7days data */}
                              <div className="flex flex-col items-center gap-1">
                                {coin.timeframeData?.["7days"]?.TA_data ? (
                                  <SimpleTAGauge
                                    taData={coin.timeframeData["7days"].TA_data}
                                    signal={coin.timeframeData["7days"].TA_data.mcm_signal}
                                    size="small"
                                  />
                                ) : (
                                  <MiniGauge bullishPercent={50} bearishPercent={50} />
                                )}
                                <span className="text-[9px] font-semibold text-gray-600">Long</span>
                                <span className="text-[8px] font-semibold text-gray-600">Term</span>
                              </div>
                            </div>
                          </td>

                          {/* MCM Analysis Column - Download Report */}
                          <td className="px-3 py-4 text-center group-hover:bg-white/50 transition-all duration-300">
                            {(coinsWithReports.has(coin.symbol?.toUpperCase()) || coinsWithReports.has(coin.source_id?.toUpperCase())) ? (
                              <button
                                onClick={() => router.push(`/document?coin=${coin.source_id || coin.symbol}&download=true`)}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 mx-auto"
                              >
                                <FaFileAlt className="text-sm" />
                                <span>Download Report</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
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

      {/* Segmented Bar Styles */}
      <style jsx>{`
        .segmented-bar-container {
          position: relative;
          width: 100px;
          height: 8px;
          border-radius: 4px;
          overflow: visible;
        }

        .segmented-bar-background {
          display: flex;
          width: 100%;
          height: 100%;
        }

        .segmented-bar-background-gray {
          display: block;
          width: 100px;
          height: 8px;
          background: linear-gradient(to right, #9ca3af 0%, #6b7280 33%, #4b5563 66%, #374151 100%) !important;
          border-radius: 4px;
          position: relative;
        }

        .segment {
          flex: 1;
          height: 100%;
        }

        .segment-red {
          background-color: #ef4444;
        }

        .segment-yellow {
          background-color: #f59e0b;
        }

        .segment-green {
          background-color: #10b981;
        }

        .segment-gray-light {
          background-color: #9ca3af !important;
        }

        .segment-gray-medium {
          background-color: #6b7280 !important;
        }

        .segment-gray-dark {
          background-color: #4b5563 !important;
        }

        .percentage-ball {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 14px;
          height: 14px;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          border-width: 2px;
          border-style: solid;
        }

        .percentage-ball-gray {
          position: absolute;
          top: -2px;
          width: 12px;
          height: 12px;
          background-color: #e5e7eb;
          border: 2px solid #9ca3af;
          border-radius: 50%;
          transform: translateX(-50%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
