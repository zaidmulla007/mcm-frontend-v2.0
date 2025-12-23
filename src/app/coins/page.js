"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaBell, FaYoutube, FaTelegramPlane, FaCertificate, FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { useCoinsLivePrice } from "@/hooks/useCoinsLivePrice";
import { useTimezone } from "../contexts/TimezoneContext";
import ReactMarkdown from "react-markdown";
import SimpleTAGauge from "@/components/SimpleTAGauge";
import GaugeComponent from "react-gauge-component";

export default function CoinsPage() {
  const router = useRouter();
  const [coinsData, setCoinsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coinSymbols, setCoinSymbols] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedSummaries, setExpandedSummaries] = useState({}); // Track expanded state for each coin and timeframe
  const [selectedSummaryTimeframe, setSelectedSummaryTimeframe] = useState("6hrs"); // 6hrs, 24hrs, or 7days
  const [influencerModal, setInfluencerModal] = useState({ isOpen: false, type: '', influencers: {}, coinName: '', position: { x: 0, y: 0 } });
  const [isMouseOverModal, setIsMouseOverModal] = useState(false);

  // Use timezone context for local/UTC time switching
  const { formatDate, useLocalTime, toggleTimezone, userTimezone } = useTimezone();

  // Get city name from timezone
  const userCity = userTimezone ? userTimezone.split('/').pop().replace(/_/g, ' ') : 'Local Time';

  // ========================================
  // DYNAMIC COLUMN WIDTH CONFIGURATION
  // ========================================
  const NUM_COLUMNS = 9; // Coins, Social Media Sentiment, Posts, Fundamental Score, Technical Analysis, MCM Signal, Live Price, MCM Knowledge Center, Top Social Media Influencers
  const COLUMN_WIDTH = 100 / NUM_COLUMNS; // Equal distribution for all columns
  // ========================================

  // Threshold constants for bell alerts
  const THRESHOLD_50_PERCENT = 30;
  const THRESHOLD_TOP15_PERCENT = 15;
  const TOP_COINS_RANK_LIMIT = 15;

  // Threshold constants for meme coins
  const MEME_THRESHOLD_TOP15_PERCENT = 20;
  const MEME_THRESHOLD_50_PERCENT = 50;

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

        // Store the entire data object including notifications
        setCoinsData(data);

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

  // Close modal on scroll only if mouse is not over the modal
  useEffect(() => {
    const handleScroll = () => {
      if (influencerModal.isOpen && !isMouseOverModal) {
        setInfluencerModal({ isOpen: false, type: '', influencers: {}, coinName: '', position: { x: 0, y: 0 } });
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [influencerModal.isOpen, isMouseOverModal]);

  // Reset mouse over state when modal closes
  useEffect(() => {
    if (!influencerModal.isOpen) {
      setIsMouseOverModal(false);
    }
  }, [influencerModal.isOpen]);

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

  // Check if price change exceeds threshold based on 24hr Binance data
  const hasPriceAlert = useCallback((coin) => {
    const priceChange = getLivePriceChange(coin?.symbol);

    if (priceChange === null) return false;

    const marketCapRank = coin?.market_cap_rank;
    const isMeme = coin?.mem_coin === true;

    // For meme coins, use different thresholds
    if (isMeme) {
      // Show bell when:
      // 1. Meme coin with rank <= 15 and price change is ±20%
      // 2. OR meme coin with rank > 15 (or no rank) and price change is ±50%
      if (marketCapRank && marketCapRank <= TOP_COINS_RANK_LIMIT) {
        return Math.abs(priceChange) >= MEME_THRESHOLD_TOP15_PERCENT;
      } else {
        return Math.abs(priceChange) >= MEME_THRESHOLD_50_PERCENT;
      }
    }

    // For regular coins (not meme coins), use original thresholds
    // Show bell when:
    // 1. Price change is ±30% (THRESHOLD_50_PERCENT)
    // 2. OR if coin's market_cap_rank <= 15 and price change is ±15%
    if (Math.abs(priceChange) >= THRESHOLD_50_PERCENT) {
      return true;
    }

    if (marketCapRank && marketCapRank <= TOP_COINS_RANK_LIMIT && Math.abs(priceChange) >= THRESHOLD_TOP15_PERCENT) {
      return true;
    }

    return false;
  }, [getLivePriceChange, THRESHOLD_50_PERCENT, THRESHOLD_TOP15_PERCENT, TOP_COINS_RANK_LIMIT, MEME_THRESHOLD_TOP15_PERCENT, MEME_THRESHOLD_50_PERCENT]);

  // Get alert reason for tooltip
  const getAlertReason = useCallback((coin) => {
    const priceChange = getLivePriceChange(coin?.symbol);
    const isMeme = coin?.mem_coin === true;

    if (priceChange !== null) {
      const absChange = Math.abs(priceChange);

      // For meme coins, use meme thresholds
      if (isMeme) {
        if (coin?.market_cap_rank && coin.market_cap_rank <= TOP_COINS_RANK_LIMIT && absChange >= MEME_THRESHOLD_TOP15_PERCENT) {
          return `24H % Change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
        }
        if (absChange >= MEME_THRESHOLD_50_PERCENT) {
          return `24H % Change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
        }
      } else {
        // For regular coins, use original thresholds
        if (absChange >= THRESHOLD_50_PERCENT) {
          return `24H % Change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
        }
        if (coin?.market_cap_rank && coin.market_cap_rank <= TOP_COINS_RANK_LIMIT && absChange >= THRESHOLD_TOP15_PERCENT) {
          return `24H % Change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
        }
      }
    }
    return '24H Price Alert';
  }, [getLivePriceChange, THRESHOLD_50_PERCENT, THRESHOLD_TOP15_PERCENT, TOP_COINS_RANK_LIMIT, MEME_THRESHOLD_TOP15_PERCENT, MEME_THRESHOLD_50_PERCENT]);

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

  // Helper function to get coin data from a specific timeframe
  const getCoinFromTimeframe = useCallback((symbol, timeframe) => {
    if (!coinsData) return null;

    // Handle both old and new response formats
    const resultsByTimeframe = coinsData.resultsByTimeframe || coinsData;
    if (!resultsByTimeframe || !resultsByTimeframe[timeframe]) return null;

    const allCoins = resultsByTimeframe[timeframe].all_coins || [];
    const memCoins = resultsByTimeframe[timeframe].mem_coins || [];
    const combined = [...allCoins, ...memCoins];

    return combined.find(coin => coin.symbol === symbol);
  }, [coinsData]);

  // Helper function to truncate text to specified word limit
  const truncateText = (text, wordLimit = 50) => {
    if (!text) return '';
    // Ensure text is a string before calling split
    const textStr = typeof text === 'string' ? text : String(text);
    const words = textStr.split(' ');
    if (words.length <= wordLimit) return textStr;
    return words.slice(0, wordLimit).join(' ');
  };

  // Toggle expand/collapse for summary
  const toggleSummaryExpand = (coinSymbol, timeframe) => {
    const key = `${coinSymbol}-${timeframe}`;
    setExpandedSummaries(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Check if summary is expanded
  const isSummaryExpanded = (coinSymbol, timeframe) => {
    const key = `${coinSymbol}-${timeframe}`;
    return expandedSummaries[key] || false;
  };

  // Parse AI summary to extract sections
  const parseAISummary = (summary) => {
    if (!summary) return null;

    // Check if summary is already an object (new format)
    if (typeof summary === 'object' && !Array.isArray(summary)) {
      const sections = {
        coinInfo: '',
        tradingInfo: ''
      };

      // Build Coin Info from summary, why_it_matters, market_trends, key_events, important_alerts
      const coinInfoParts = [];
      if (summary.summary) coinInfoParts.push(`**Summary:**\n${summary.summary}`);
      if (summary.why_it_matters) coinInfoParts.push(`**Why It Matters:**\n${summary.why_it_matters}`);
      if (summary.market_trends) coinInfoParts.push(`**Market Trends:**\n${summary.market_trends}`);
      if (summary.key_events) coinInfoParts.push(`**Key Events:**\n${summary.key_events}`);
      if (summary.important_alerts) coinInfoParts.push(`**Important Alerts:**\n${summary.important_alerts}`);

      sections.coinInfo = coinInfoParts.join('\n\n');

      // Build Trading Info from outlook, buying_range, bullish_factors, selling_range, bearish_concerns, recent_price_movement
      const tradingInfoParts = [];
      if (summary.outlook) tradingInfoParts.push(`**Outlook:**\n${summary.outlook}`);
      if (summary.buying_range) tradingInfoParts.push(`**Buying Range:**\n${summary.buying_range}`);
      if (summary.bullish_factors) tradingInfoParts.push(`**Bullish Factors:**\n${summary.bullish_factors}`);
      if (summary.selling_range) tradingInfoParts.push(`**Selling Range:**\n${summary.selling_range}`);
      if (summary.bearish_concerns) tradingInfoParts.push(`**Bearish Concerns:**\n${summary.bearish_concerns}`);
      if (summary.recent_price_movement) tradingInfoParts.push(`**Recent Price Movement:**\n${summary.recent_price_movement}`);

      sections.tradingInfo = tradingInfoParts.join('\n\n');

      return sections;
    }

    // Handle old string format for backward compatibility
    const sections = {
      coinInfo: '',
      tradingInfo: ''
    };

    // Trading Info sections in the EXACT order they should appear
    const tradingInfoSectionsOrder = [
      'Outlook',
      'Buying Range',
      'Bullish Factors',
      'Selling Range',
      'Bearish Concerns',
      'Recent Price Movement'
    ];

    // Split summary by ** headers
    const allSections = summary.split(/(?=\*\*[A-Za-z\s]+:?\*\*)/);

    let coinInfoParts = [];
    let tradingInfoMap = {}; // Store trading sections in a map first

    allSections.forEach(section => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return;

      // Check if this section matches any Trading Info section
      let matchedTradingSection = null;
      for (const tradingSection of tradingInfoSectionsOrder) {
        const regex = new RegExp(`^\\*\\*${tradingSection}:?\\*\\*`, 'i');
        if (regex.test(trimmedSection)) {
          matchedTradingSection = tradingSection;
          break;
        }
      }

      if (matchedTradingSection) {
        // Store in map to maintain order later
        tradingInfoMap[matchedTradingSection] = trimmedSection;
      } else {
        // All other sections go to Coin Info
        coinInfoParts.push(trimmedSection);
      }
    });

    // Build Trading Info in the specified order
    let tradingInfoParts = [];
    tradingInfoSectionsOrder.forEach(sectionName => {
      if (tradingInfoMap[sectionName]) {
        tradingInfoParts.push(tradingInfoMap[sectionName]);
      }
    });

    sections.coinInfo = coinInfoParts.join('\n\n');
    sections.tradingInfo = tradingInfoParts.join('\n\n');

    return sections;
  };

  // Get top 10 coins from selected timeframe with memoization
  // Only depends on coinsData and selectedSummaryTimeframe (not prices) to avoid unnecessary recalculations
  // The live prices are fetched via getLivePrice callbacks during render
  const top10Coins = useMemo(() => {
    if (!coinsData) return [];

    // Handle both old and new response formats
    const resultsByTimeframe = coinsData.resultsByTimeframe || coinsData;
    if (!resultsByTimeframe || !resultsByTimeframe[selectedSummaryTimeframe]) return [];

    const allCoins = resultsByTimeframe[selectedSummaryTimeframe].all_coins || [];
    const memCoins = resultsByTimeframe[selectedSummaryTimeframe].mem_coins || [];
    const combined = [...allCoins, ...memCoins];

    // Sort by total_mentions in descending order
    combined.sort((a, b) => (b.total_mentions || 0) - (a.total_mentions || 0));

    return combined.slice(0, 10);
  }, [coinsData, selectedSummaryTimeframe]);

  // Update coinSymbols when top10Coins changes (only subscribe to visible coins)
  useEffect(() => {
    const symbols = top10Coins.map(coin => coin.symbol).filter(Boolean);
    setCoinSymbols(symbols);
  }, [top10Coins]);

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
          {/* Leaderboard Section */}
          <div className="bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-3xl shadow-2xl shadow-indigo-500/10 border-2 border-white/40">
            {/* View Mode Toggle Buttons */}
            <div className="px-4 py-3 border-b border-indigo-200/30 bg-gradient-to-r from-cyan-50/50 to-fuchsia-50/50 backdrop-blur-sm">
              {/* View Mode Buttons in Center */}
              {/* <div className="flex justify-center items-center gap-3">
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
              </div> */}
              {/* Header with Title on Left and Timezone Switch on Right */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-2">
                {/* Left: Header Title */}
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold flex items-center gap-3 drop-shadow-sm">
                    <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                      Trending Coin&apos;s
                    </span>
                    {top10Coins.some(coin => hasPriceAlert(coin)) && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-r from-green-500 to-green-600 animate-pulse">
                        <FaBell className="text-white text-[16px]" />
                      </div>
                    )}
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full flex-shrink-0 mt-5 shadow-lg shadow-indigo-500/50"></div>
                </div>

                {/* Right: Timezone Switch */}
                <div className="flex flex-col items-end gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    {!useLocalTime && (
                      <span className="text-xs font-medium text-black-700">
                        UTC
                      </span>
                    )}
                    <button
                      onClick={() => toggleTimezone()}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-lg ${useLocalTime ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 shadow-indigo-500/50' : 'bg-gray-300'
                        }`}
                      role="switch"
                      aria-checked={useLocalTime}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${useLocalTime ? 'translate-x-5 shadow-indigo-300' : 'translate-x-0.5'
                          }`}
                      />
                    </button>
                    {useLocalTime && (
                      <span className="text-xs font-medium text-black-700">
                        {userCity || 'Local'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-black-900">
                    Update: {lastUpdated ? formatDate(lastUpdated) : "N/A"}
                  </p>
                  <p className="text-xs font-medium text-black-900">
                    Next Update: {lastUpdated ? formatDate(new Date(lastUpdated.getTime() + 6 * 60 * 60 * 1000)) : "N/A"}
                  </p>
                </div>
              </div>

              {/* Last Updated and Timeframe Buttons */}
              <div className="flex items-center gap-6 mt-2">
                {/* Last Updated */}
                {/* Timeframe Buttons */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-black-600">
                    Timeframe
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSummaryTimeframe("6hrs")}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${selectedSummaryTimeframe === "6hrs"
                        ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-white/80 text-gray-700 hover:bg-white border border-indigo-200/50'
                        }`}
                    >
                      6 Hours
                    </button>
                    <button
                      onClick={() => setSelectedSummaryTimeframe("24hrs")}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${selectedSummaryTimeframe === "24hrs"
                        ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-white/80 text-gray-700 hover:bg-white border border-indigo-200/50'
                        }`}
                    >
                      24 Hours
                    </button>
                    <button
                      onClick={() => setSelectedSummaryTimeframe("7days")}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${selectedSummaryTimeframe === "7days"
                        ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-white/80 text-gray-700 hover:bg-white border border-indigo-200/50'
                        }`}
                    >
                      7 Days
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
            <div className="w-full overflow-hidden rounded-b-3xl">
              <table className="w-full table-fixed border-separate border-spacing-0">
                <thead>
                  <tr className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500">
                    {/* Row 1, Col 1: Coins (Rowspan 2) */}
                    <th rowSpan="2" className="px-3 py-3 text-center text-[11px] font-bold text-white tracking-wide align-middle w-[8%] border-r border-white/20">
                      Coins
                    </th>

                    {/* Row 1, Col 2: Group Header for Influencers (Colspan 6) */}
                    <th colSpan="6" className="px-3 py-3 text-center text-[13px] font-extrabold text-white tracking-wide align-middle border-b border-white/30 border-r border-white/20">
                      Social Media Sentiment
                    </th>

                    {/* Row 1, Col 3: Fundamental Score (Rowspan 2) */}
                    <th rowSpan="2" className="px-2 py-3 text-center text-[10px] font-bold text-white tracking-wide align-middle w-[8%] border-r border-white/20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="leading-tight">Fundamental</span>
                        <div className="flex items-center gap-0.5">
                          <span className="leading-tight">Score</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-cyan-200 text-[11px]">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-3 rounded-xl shadow-2xl whitespace-nowrap z-[9999] border border-cyan-400/30">
                              Score (1-10) based <br /> on deep fundamental analysis
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>

                    {/* Row 1, Col 4: Technical Analysis (Rowspan 2) */}
                    <th rowSpan="2" className="px-2 py-3 text-center text-[10px] font-bold text-white tracking-wide align-middle w-[10%] border-r border-white/20">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="leading-tight">Technical</span>
                        <div className="flex items-center gap-0.5">
                          <span className="leading-tight">Analysis</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-cyan-200 text-[11px]">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl z-[99999] text-left w-64 whitespace-normal border border-indigo-400/20">
                              Based on Moving Averages and oscillators indicators
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>

                    {/* Row 1, Col 5: MCM Signal (Rowspan 2) */}
                    <th rowSpan="2" className="px-2 py-3 text-center text-[10px] font-bold text-white tracking-wide align-middle w-[7%] border-r border-white/20">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="leading-tight">MCM</span>
                        <div className="flex items-center gap-0.5">
                          <span className="leading-tight">Signal</span>
                          <span className="relative group cursor-pointer">
                            <span className="text-cyan-200 text-[11px]">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[99999] border border-indigo-400/20">
                              MCM proprietary signal indicator
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>

                    {/* Row 1, Col 6: Live Price (Rowspan 2) */}
                    <th rowSpan="2" className="px-2 py-3 text-center text-[10px] font-bold text-white tracking-wide align-middle w-[9%] border-r border-white/20">
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="leading-tight">Live Price</span>
                        <span className="relative group cursor-pointer">
                          <span className="text-cyan-200 text-[11px]">ⓘ</span>
                          <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[99999] border border-indigo-400/20">
                            Real-time price from Binance
                          </span>
                        </span>
                      </div>
                    </th>

                    {/* Row 1, Col 7: MCM Knowledge Center (Rowspan 2) */}
                    <th rowSpan="2" className="px-2 py-3 text-center text-[10px] font-bold text-white tracking-wide align-middle w-[7%]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="leading-tight">MCM</span>
                        <span className="leading-tight">Knowledge</span>
                        <div className="flex items-center gap-0.5">
                          <span className="leading-tight">Center</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-cyan-200 text-[11px]">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 right-0 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[99999] border border-indigo-400/20">
                              Click to view market overview
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                  </tr>

                  {/* Row 2: Sub-columns for Influencers Group */}
                  <tr className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 border-b-2 border-white/20">
                    <th className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300 text-[10px] font-semibold text-white tracking-tight align-middle w-[6%] border-r border-white/20">
                      <div className="flex flex-col items-center leading-tight">
                        <span>All</span>
                        <span>Influencers</span>
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300 text-[10px] font-semibold text-white tracking-tight align-middle w-[13%] border-r border-white/20">
                      <div className="leading-tight">
                        <div>All Ratings</div>
                        <div className="flex items-center justify-center gap-0.5">
                          <span>Influencers</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-cyan-200 text-[11px]">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[99999] border border-indigo-400/20">
                              ST : Short Term<br />
                              LT : Long Term<br />
                              NA : Not Available
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300 text-[10px] font-semibold text-white tracking-tight align-middle w-[5%] border-r border-white/20">
                      <div className="flex items-center justify-center gap-0.5 leading-tight">
                        <span>Avg Rating</span>
                        <span className="relative group cursor-pointer z-[9999]">
                          <span className="text-cyan-200 text-[11px]">ⓘ</span>
                          <span className="invisible group-hover:visible absolute top-full mt-2 right-0 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[99999] border border-indigo-400/20">
                            Short Term : 30 Days Overall Rating<br />
                            Long Term : 180 Days Overall Rating
                          </span>
                        </span>
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300 text-[10px] font-semibold text-white tracking-tight align-middle w-[6%] border-r border-white/20">
                      <div className="flex flex-col items-center leading-tight">
                        <span>Only 3 Star &</span>
                        <span>Above Influencers</span>
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300 text-[10px] font-semibold text-white tracking-tight align-middle w-[10%] border-r border-white/20">
                      <div className="flex flex-col items-center leading-tight">
                        <span>Top Rated</span>
                        <div className="flex items-center gap-0.5">
                          <span>Influencers</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-cyan-200 text-[11px]">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 right-0 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[99999] border border-indigo-400/20">
                              Only 3 Star & Above Influencers<br />
                              Short Term : 30 Days Overall Rating<br />
                              Long Term : 180 Days Overall Rating
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300 text-[10px] font-semibold text-white tracking-tight align-middle w-[5%] border-r border-white/20">
                      <div className="flex items-center justify-center gap-0.5 leading-tight">
                        <span>Avg Rating</span>
                        <span className="relative group cursor-pointer z-[9999]">
                          <span className="text-cyan-200 text-[11px]">ⓘ</span>
                          <span className="invisible group-hover:visible absolute top-full mt-2 right-0 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[99999] border border-indigo-400/20">
                            Only 3 Star & Above Influencers<br />
                            Short Term : 30 Days Overall Rating<br />
                            Long Term : 180 Days Overall Rating
                          </span>
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gradient-to-br from-white/80 via-indigo-50/40 to-fuchsia-50/40 backdrop-blur-sm divide-y divide-indigo-200/30">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 border-t-4 border-t-cyan-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-red-600 font-semibold">
                        {error}
                      </td>
                    </tr>
                  ) : top10Coins.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-gray-500 font-medium">
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

                      // Get coin data from selected timeframe for AI summaries and all data
                      const coinDataForTimeframe = getCoinFromTimeframe(coin.symbol, selectedSummaryTimeframe);

                      // Check for price alert
                      const showPriceAlert = hasPriceAlert(coin);
                      const alertReason = getAlertReason(coin);

                      return (
                        <tr key={`${coin.symbol}-${index}`} className="group hover:bg-gradient-to-r hover:from-indigo-50/60 hover:via-purple-50/50 hover:to-fuchsia-50/60 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200/50 hover:scale-[1.01] hover:z-10 border-b border-indigo-100/30 relative">
                          {/* Coin - Image and Name only */}
                          <td className="px-2 py-3 group-hover:bg-white/50 transition-all duration-300">
                            <div className="flex flex-col items-center gap-1">
                              {coin.image_small && (
                                <div className="relative group">
                                  <img
                                    src={coin.image_small}
                                    alt={coin.symbol}
                                    className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-indigo-300/50 hover:rotate-6"
                                    onClick={() => router.push(`/coins-list/${coin.source_id}`)}
                                  />
                                  {/* MCM Badge - top left outside of coin image */}
                                  {isNewCoin(coin) && (
                                    <div className="absolute -top-2 -left-4 group/newcoin cursor-pointer z-[9999]">
                                      <div className="relative inline-flex items-center justify-center h-5 w-5">
                                        <FaCertificate className="text-blue-500 w-full h-full drop-shadow-sm" />
                                        <span className="absolute text-[11px] font-bold text-white uppercase tracking-tighter">M</span>
                                      </div>
                                      <div className="invisible group-hover/newcoin:visible absolute top-0 left-full ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-[9999]">
                                        New Mention in last 6 hours
                                      </div>
                                    </div>
                                  )}
                                  {/* Bell icon for coins exceeding price change threshold - top right outside of coin */}
                                  {showPriceAlert && (
                                    <div className="absolute -top-2 -right-6 group/bell cursor-pointer z-[9999]">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${priceChangePercent > 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}>
                                        <FaBell className="text-white text-[12px]" />
                                      </div>
                                      {/* Tooltip on hover - positioned to the right of the bell */}
                                      <div className="invisible group-hover/bell:visible absolute top-0 left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                        {alertReason}
                                      </div>
                                    </div>
                                  )}
                                  {/* Show live price tooltip when hovering on coin image */}
                                  {currentPrice !== 'N/A' && (
                                    <div className="invisible group-hover:visible absolute top-full left-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[99999]">
                                      Live Price: ${typeof currentPrice === 'number' ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : currentPrice}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <div className="text-xs font-bold text-balck-900"> {coin.symbol ? coin.symbol.charAt(0).toUpperCase() + coin.symbol.slice(1).toLowerCase() : ''}</div>
                                  {coin.mem_coin === true && (
                                    <span className="relative group cursor-pointer z-[9999]">
                                      <span className="text-blue-600 text-xs">ⓘ</span>
                                      <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                        Meme Coin
                                      </span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-black-500">
                                  {coin.coin_name.charAt(0).toUpperCase() + coin.coin_name.slice(1)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Posts Column - Total posts + YouTube/Telegram channels */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            <div className="flex flex-col gap-0.5 items-center">
                              {/* Total Posts */}
                              <div
                                className="text-[10px] font-semibold text-black cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => {
                                  router.push(`/landing-page?source_id=${coin.source_id}&name=${encodeURIComponent(coin.coin_name)}&symbol=${coin.symbol}`);
                                }}
                              >
                                {coin.total_mentions} posts
                              </div>

                              {/* YouTube Channels */}
                              {coin.yt_unique_influencers_count > 0 && (
                                <div
                                  className="cursor-pointer"
                                  onClick={(e) => {
                                    if (coin.yt_unique_inf && coin.yt_unique_inf.length > 0) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setInfluencerModal({
                                        isOpen: true,
                                        type: 'YouTube',
                                        influencers: coin.yt_unique_inf,
                                        position: { x: rect.right + 10, y: rect.top }
                                      });
                                    }
                                  }}
                                >
                                  <div className="text-[10px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap">
                                    <FaYoutube className="text-red-600 text-xs" />
                                    <span className="text-black">{coin.yt_unique_influencers_count} {coin.yt_unique_influencers_count === 1 ? 'Channel' : 'Channels'}</span>
                                  </div>
                                </div>
                              )}

                              {/* Telegram Channels */}
                              {coin.tg_unique_influencers_count > 0 && (
                                <div
                                  className="cursor-pointer"
                                  onClick={(e) => {
                                    if (coin.tg_unique_inf && coin.tg_unique_inf.length > 0) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setInfluencerModal({
                                        isOpen: true,
                                        type: 'Telegram',
                                        influencers: coin.tg_unique_inf,
                                        position: { x: rect.right + 10, y: rect.top }
                                      });
                                    }
                                  }}
                                >
                                  <div className="text-[10px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap">
                                    <FaTelegramPlane className="text-blue-600 text-xs" />
                                    <span className="text-black">{coin.tg_unique_influencers_count} {coin.tg_unique_influencers_count === 1 ? 'Channel' : 'Channels'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Sentiment - Segmented Bar Ladder Style */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            {(() => {
                              // Calculate sentiment data for Short Term and Long Term
                              const shortTermBullish = coin.yt_tg_bullish_short_term_percent || 0;
                              const shortTermBearish = coin.yt_tg_bearish_short_term_percent || 0;
                              const shortTermPosts = (coin.yt_tg_bullish_short_term || 0) + (coin.yt_tg_bearish_short_term || 0);

                              const longTermBullish = coin.yt_tg_bullish_long_term_percent || 0;
                              const longTermBearish = coin.yt_tg_bearish_long_term_percent || 0;
                              const longTermPosts = (coin.yt_tg_bullish_long_term || 0) + (coin.yt_tg_bearish_long_term || 0);

                              // If no data, show N/A
                              if (shortTermPosts === 0 && longTermPosts === 0) {
                                return <span className="text-xs text-gray-400">N/A</span>;
                              }

                              // Calculate ball positions
                              const shortTermBallPosition = shortTermBullish >= shortTermBearish ? shortTermBullish : (100 - shortTermBearish);
                              const longTermBallPosition = longTermBullish >= longTermBearish ? longTermBullish : (100 - longTermBearish);

                              return (
                                <div className="space-y-4">
                                  {/* Short Term */}
                                  <div className="flex flex-col items-center">
                                    <div className="mb-1 text-[10px] whitespace-nowrap">
                                      <span className="text-black font-semibold">ST:</span> <span className="text-black">{shortTermPosts} posts</span>
                                    </div>
                                    {shortTermPosts === 0 ? (
                                      <>
                                        <div className="segmented-bar-container" style={{ width: '80px' }}>
                                          <div style={{ display: 'flex', width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ backgroundColor: '#9ca3af', flex: 1, height: '100%' }} />
                                            <div style={{ backgroundColor: '#6b7280', flex: 1, height: '100%' }} />
                                            <div style={{ backgroundColor: '#4b5563', flex: 1, height: '100%' }} />
                                          </div>
                                        </div>
                                        <div className="text-[10px] text-center text-gray-500">N/A</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="segmented-bar-container" style={{ width: '80px' }}>
                                          <div className="segmented-bar-background">
                                            <div className="segment segment-red" />
                                            <div className="segment segment-yellow" />
                                            <div className="segment segment-green" />
                                          </div>
                                          <div
                                            className="percentage-ball"
                                            style={{
                                              left: `${Math.min(Math.max(shortTermBallPosition, 6), 94)}%`,
                                              backgroundColor: shortTermBullish >= shortTermBearish ? '#00ff15' : '#ff2121',
                                              borderColor: shortTermBullish >= shortTermBearish ? '#00cc11' : '#cc1a1a'
                                            }}
                                          />
                                        </div>
                                        <div className={`mt-1 text-[10px] text-center font-semibold ${shortTermBullish >= shortTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                          {(shortTermBullish >= shortTermBearish ? shortTermBullish : shortTermBearish).toFixed(0)}% {shortTermBullish >= shortTermBearish ? 'Bullish' : 'Bearish'}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Long Term */}
                                  <div className="flex flex-col items-center">
                                    <div className="mb-1 text-[10px] whitespace-nowrap">
                                      <span className="text-black font-semibold">LT:</span> <span className="text-black">{longTermPosts} posts</span>
                                    </div>
                                    {longTermPosts === 0 ? (
                                      <>
                                        <div className="segmented-bar-container" style={{ width: '80px' }}>
                                          <div style={{ display: 'flex', width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ backgroundColor: '#9ca3af', flex: 1, height: '100%' }} />
                                            <div style={{ backgroundColor: '#6b7280', flex: 1, height: '100%' }} />
                                            <div style={{ backgroundColor: '#4b5563', flex: 1, height: '100%' }} />
                                          </div>
                                        </div>
                                        <div className="text-[10px] text-center text-gray-500">N/A</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="segmented-bar-container" style={{ width: '80px' }}>
                                          <div className="segmented-bar-background">
                                            <div className="segment segment-red" />
                                            <div className="segment segment-yellow" />
                                            <div className="segment segment-green" />
                                          </div>
                                          <div
                                            className="percentage-ball"
                                            style={{
                                              left: `${Math.min(Math.max(longTermBallPosition, 6), 94)}%`,
                                              backgroundColor: longTermBullish >= longTermBearish ? '#00ff15' : '#ff2121',
                                              borderColor: longTermBullish >= longTermBearish ? '#00cc11' : '#cc1a1a'
                                            }}
                                          />
                                        </div>
                                        <div className={`mt-1 text-[10px] text-center font-semibold ${longTermBullish >= longTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                          {(longTermBullish >= longTermBearish ? longTermBullish : longTermBearish).toFixed(0)}% {longTermBullish >= longTermBearish ? 'Bullish' : 'Bearish'}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Avg Rating Column (All Influencers) */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            {(() => {
                              const renderStars = (rating) => {
                                const fullStars = Math.floor(rating);
                                const hasHalfStar = rating % 1 >= 0.5;
                                const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));
                                return (
                                  <div className="flex gap-0.5">
                                    {[...Array(fullStars)].map((_, i) => <FaStar key={`f${i}`} className="text-yellow-400 text-[8px]" />)}
                                    {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-[8px]" />}
                                    {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`e${i}`} className="text-gray-300 text-[8px]" />)}
                                  </div>
                                );
                              };

                              if (coin.avg_short_term_rating !== undefined || coin.avg_long_term_rating !== undefined) {
                                return (
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    {coin.avg_short_term_rating !== undefined && (
                                      <div className="flex items-center gap-1 whitespace-nowrap">
                                        <span className="text-[8px] font-semibold text-gray-600">ST:</span>
                                        {renderStars(coin.avg_short_term_rating)}
                                      </div>
                                    )}
                                    {coin.avg_long_term_rating !== undefined && (
                                      <div className="flex items-center gap-1 whitespace-nowrap">
                                        <span className="text-[8px] font-semibold text-gray-600">LT:</span>
                                        {renderStars(coin.avg_long_term_rating)}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return <span className="text-xs text-gray-400">N/A</span>;
                            })()}
                          </td>

                          {/* 3★ & Above Influencers Column */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            {(() => {
                              const stats = coin['3star_inf_stats'];
                              const ytInf = coin['3star_yt_inf'] || [];
                              const tgInf = coin['3star_tg_inf'] || [];

                              // If no 3-star influencers, show N/A
                              if (!stats || stats.total_3star_influencers === 0) {
                                return <span className="text-xs text-gray-400">N/A</span>;
                              }

                              return (
                                <div className="flex flex-col gap-0.5 items-center">
                                  {/* Total Posts */}
                                  <div className="text-[10px] font-semibold text-black">
                                    {stats.total_posts_yt_tg} {stats.total_posts_yt_tg === 1 ? 'post' : 'posts'}
                                  </div>

                                  {/* YouTube Channels */}
                                  {ytInf.length > 0 && (
                                    <div
                                      className="cursor-pointer"
                                      onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setInfluencerModal({
                                          isOpen: true,
                                          type: 'YouTube',
                                          influencers: ytInf,
                                          position: { x: rect.right + 10, y: rect.top }
                                        });
                                      }}
                                    >
                                      <div className="text-[10px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap">
                                        <FaYoutube className="text-red-600 text-xs" />
                                        <span className="text-black">{ytInf.length} {ytInf.length === 1 ? 'Channel' : 'Channels'}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Telegram Channels */}
                                  {tgInf.length > 0 && (
                                    <div
                                      className="cursor-pointer"
                                      onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setInfluencerModal({
                                          isOpen: true,
                                          type: 'Telegram',
                                          influencers: tgInf,
                                          position: { x: rect.right + 10, y: rect.top }
                                        });
                                      }}
                                    >
                                      <div className="text-[10px] font-semibold flex items-center justify-center gap-1 whitespace-nowrap">
                                        <FaTelegramPlane className="text-blue-600 text-xs" />
                                        <span className="text-black">{tgInf.length} {tgInf.length === 1 ? 'Channel' : 'Channels'}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Top Social Media Influencers Column - Using 3star_inf_stats data */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            {(() => {
                              // Get 3star_inf_stats data from coin
                              const stats = coin['3star_inf_stats'];

                              // If no stats data, show N/A
                              if (!stats || stats.total_3star_influencers === 0) {
                                return <span className="text-xs text-gray-400">N/A</span>;
                              }

                              const shortTermBullish = stats.short_term_bullish_percent || 0;
                              const shortTermBearish = stats.short_term_bearish_percent || 0;
                              const shortTermPosts = stats.short_term_bullish + stats.short_term_bearish || 0;

                              const longTermBullish = stats.long_term_bullish_percent || 0;
                              const longTermBearish = stats.long_term_bearish_percent || 0;
                              const longTermPosts = stats.long_term_bullish + stats.long_term_bearish || 0;

                              // Calculate ball positions
                              const shortTermBallPosition = shortTermBullish >= shortTermBearish ? shortTermBullish : (100 - shortTermBearish);
                              const longTermBallPosition = longTermBullish >= longTermBearish ? longTermBullish : (100 - longTermBearish);

                              return (
                                <div className="space-y-4">
                                  {/* Influencer Stats Header */}
                                  {/* <div className="flex flex-col items-center gap-0.5 mb-1">
                                    <div className="flex items-center justify-center gap-2 text-[9px]">
                                      <span className="flex items-center gap-0.5">
                                        <FaYoutube className="text-red-600 text-[10px]" />
                                        {stats.total_3star_yt_influencers} {stats.total_3star_yt_influencers === 1 ? 'channel' : 'channels'}
                                      </span>
                                      <span className="flex items-center gap-0.5">
                                        <FaTelegramPlane className="text-blue-600 text-[10px]" />
                                        {stats.total_3star_tg_influencers} {stats.total_3star_tg_influencers === 1 ? 'channel' : 'channels'}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-black-600">
                                      {stats.total_posts_yt_tg} {stats.total_posts_yt_tg === 1 ? 'post' : 'posts'}
                                    </div>
                                  </div> */}

                                  {/* Short Term */}
                                  {shortTermPosts > 0 && (
                                    <div className="flex flex-col items-center">
                                      <div className="mb-1 text-[10px] whitespace-nowrap">
                                        <span className="text-black font-semibold">ST:</span> <span className="text-black">{shortTermPosts} {shortTermPosts === 1 ? 'post' : 'posts'}</span>
                                      </div>
                                      <div className="segmented-bar-container" style={{ width: '80px' }}>
                                        <div className="segmented-bar-background">
                                          <div className="segment segment-red" />
                                          <div className="segment segment-yellow" />
                                          <div className="segment segment-green" />
                                        </div>
                                        <div
                                          className="percentage-ball"
                                          style={{
                                            left: `${Math.min(Math.max(shortTermBallPosition, 6), 94)}%`,
                                            backgroundColor: shortTermBullish >= shortTermBearish ? '#00ff15' : '#ff2121',
                                            borderColor: shortTermBullish >= shortTermBearish ? '#00cc11' : '#cc1a1a'
                                          }}
                                        />
                                      </div>
                                      <div className={`mt-1 text-[10px] text-center font-semibold ${shortTermBullish >= shortTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                        {(shortTermBullish >= shortTermBearish ? shortTermBullish : shortTermBearish).toFixed(0)}% {shortTermBullish >= shortTermBearish ? 'Bullish' : 'Bearish'}
                                      </div>
                                    </div>
                                  )}

                                  {/* Long Term */}
                                  {longTermPosts > 0 && (
                                    <div className="flex flex-col items-center">
                                      <div className="mb-1 text-[10px] whitespace-nowrap">
                                        <span className="text-black font-semibold">LT:</span> <span className="text-black">{longTermPosts} {longTermPosts === 1 ? 'post' : 'posts'}</span>
                                      </div>
                                      <div className="segmented-bar-container" style={{ width: '80px' }}>
                                        <div className="segmented-bar-background">
                                          <div className="segment segment-red" />
                                          <div className="segment segment-yellow" />
                                          <div className="segment segment-green" />
                                        </div>
                                        <div
                                          className="percentage-ball"
                                          style={{
                                            left: `${Math.min(Math.max(longTermBallPosition, 6), 94)}%`,
                                            backgroundColor: longTermBullish >= longTermBearish ? '#00ff15' : '#ff2121',
                                            borderColor: longTermBullish >= longTermBearish ? '#00cc11' : '#cc1a1a'
                                          }}
                                        />
                                      </div>
                                      <div className={`mt-1 text-[10px] text-center font-semibold ${longTermBullish >= longTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                        {(longTermBullish >= longTermBearish ? longTermBullish : longTermBearish).toFixed(0)}% {longTermBullish >= longTermBearish ? 'Bullish' : 'Bearish'}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Avg Rating Column (3★ & Above) */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            {(() => {
                              const stats = coin['3star_inf_stats'];
                              if (!stats || (stats.avg_short_term_rating === undefined && stats.avg_long_term_rating === undefined)) {
                                return <span className="text-xs text-gray-400">N/A</span>;
                              }

                              const renderStars = (rating) => {
                                const fullStars = Math.floor(rating);
                                const hasHalfStar = rating % 1 >= 0.5;
                                const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));
                                return (
                                  <div className="flex gap-0.5">
                                    {[...Array(fullStars)].map((_, i) => <FaStar key={`f${i}`} className="text-yellow-400 text-[8px]" />)}
                                    {hasHalfStar && <FaStarHalfAlt className="text-yellow-400 text-[8px]" />}
                                    {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`e${i}`} className="text-gray-300 text-[8px]" />)}
                                  </div>
                                );
                              };

                              return (
                                <div className="flex flex-col items-center justify-center gap-1">
                                  {stats.avg_short_term_rating !== undefined && (
                                    <div className="flex items-center gap-1 whitespace-nowrap">
                                      <span className="text-[8px] font-semibold text-gray-600">ST:</span>
                                      {renderStars(stats.avg_short_term_rating)}
                                    </div>
                                  )}
                                  {stats.avg_long_term_rating !== undefined && (
                                    <div className="flex items-center gap-1 whitespace-nowrap">
                                      <span className="text-[8px] font-semibold text-gray-600">LT:</span>
                                      {renderStars(stats.avg_long_term_rating)}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>



                          {/* Publish Price + Price Change % */}
                          {/* <td className="pl-0.5 pr-2 py-3">
                            <div className="flex flex-col justify-start">
                              {coin.avg_base_price ? (
                                (() => {
                                  const num = Number(coin.avg_base_price);
                                  const isThreeDigitsOrLess = Math.floor(num).toString().length <= 3;

                                  return (
                                    <span className="text-[10px] font-semibold text-gray-900">
                                      $
                                      {num.toLocaleString("en-US", {
                                        minimumFractionDigits: isThreeDigitsOrLess ? 2 : 0,
                                        maximumFractionDigits: isThreeDigitsOrLess ? 2 : 0,
                                      })}
                                    </span>
                                  );
                                })()
                              ) : (
                                <span className="text-[10px] font-semibold text-gray-900">
                                  No base price available
                                </span>
                              )}
                            </div>
                          </td> */}
                          {/* Current Price */}
                          {/* <td className="px-2 py-3 text-center">
                            {currentPrice !== 'N/A' ? (
                              (() => {
                                const num = Number(currentPrice);
                                const isNum = typeof num === "number" && !isNaN(num);
                                const isThreeDigitsOrLess =
                                  isNum && Math.floor(num).toString().length <= 3;
                                return (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-xs font-semibold text-blue-500">
                                      $
                                      {isNum
                                        ? num.toLocaleString("en-US", {
                                          minimumFractionDigits: isThreeDigitsOrLess ? 2 : 0,
                                          maximumFractionDigits: isThreeDigitsOrLess ? 2 : 0,
                                        })
                                        : currentPrice}
                                    </span>
                                  </div>
                                );
                              })()
                            ) : coin.binance?.last_available_price ? (
                              (() => {
                                const num = Number(coin.binance.last_available_price);
                                const isThreeDigitsOrLess =
                                  Math.floor(num).toString().length <= 3;

                                return (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-semibold text-gray-600">
                                        $
                                        {num.toLocaleString("en-US", {
                                          minimumFractionDigits: isThreeDigitsOrLess ? 2 : 0,
                                          maximumFractionDigits: isThreeDigitsOrLess ? 2 : 0,
                                        })}
                                      </span>
                                      <span className="relative group cursor-pointer z-[9999]">
                                        <span className="text-gray-600 text-xs">ⓘ</span>
                                        <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                          MCM DB Last Price<br />
                                          {coin.binance.last_available_timestamp
                                            ? formatDate(new Date(coin.binance.last_available_timestamp))
                                            : "N/A"}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <span className="text-xs text-gray-500">N/A</span>
                            )}
                          </td> */}
                          {/* 24 Hours Price Change - From Binance Live Data */}
                          {/* <td className="px-2 py-3 text-center">
                            {(() => {
                              const livePriceChange = getLivePriceChange(coin.symbol);
                              if (livePriceChange !== null) {
                                const isPositive = livePriceChange > 0;
                                const isNegative = livePriceChange < 0;
                                return (
                                  <span
                                    className={`text-[10px] font-semibold ${isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-900"
                                      }`}
                                  >
                                    {isPositive ? "+" : ""}
                                    {livePriceChange.toFixed(2)}%
                                  </span>
                                );
                              }
                              return <span className="text-[10px] font-semibold text-gray-500">N/A</span>;
                            })()}
                          </td> */}

                          {/* Fundamental Score Column */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            {(() => {
                              // Pick up fundamental_score from ai_summary for the selected timeframe
                              let fundamentalScore;

                              if (coinDataForTimeframe?.ai_summary) {
                                // Check if ai_summary is an object with fundamental_score
                                if (typeof coinDataForTimeframe.ai_summary === 'object' && !Array.isArray(coinDataForTimeframe.ai_summary)) {
                                  fundamentalScore = coinDataForTimeframe.ai_summary.fundamental_score;
                                } else {
                                  // Fallback to coin.fundamental_score if ai_summary doesn't have it
                                  fundamentalScore = coin.fundamental_score;
                                }
                              } else {
                                // Fallback to coin.fundamental_score if no ai_summary
                                fundamentalScore = coin.fundamental_score;
                              }

                              // If fundamental_score is not present, default to 0
                              const numScore = parseFloat(fundamentalScore);
                              const finalScore = (fundamentalScore === undefined || fundamentalScore === null || isNaN(numScore)) ? 0 : numScore;

                              // Calculate position percentage (0-10 scale to 0-100%)
                              // For score 0, position at start (2%), otherwise clamp between 6% and 94%
                              const position = (finalScore / 10) * 100;
                              const clampedPosition = finalScore === 0 ? 2 : Math.min(Math.max(position, 6), 94);

                              // Determine color based on score (>= 5 is green, < 5 is red)
                              const isHigh = finalScore >= 5;

                              return (
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <div className="segmented-bar-container" style={{ width: '80px' }}>
                                    <div className="segmented-bar-background">
                                      <div className="segment segment-red" />
                                      <div className="segment segment-yellow" />
                                      <div className="segment segment-green" />
                                    </div>
                                    <div
                                      className="percentage-ball"
                                      style={{
                                        left: `${clampedPosition}%`,
                                        backgroundColor: isHigh ? '#00ff15' : '#ff2121',
                                        borderColor: isHigh ? '#00cc11' : '#cc1a1a'
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-black">
                                    {Number.isInteger(finalScore) ? `${finalScore}/10` : `${finalScore.toFixed(1)}/10`}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>

                          {/* TA (Technical Analysis) Column */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            {(() => {
                              // Get TA data from coin object
                              const taData = coin?.TA_data;

                              // Debug logging
                              {
                                const mcm = taData?.mcm_signal || coin.mcm_signal;
                                const rec = taData?.recommendation;
                                console.log(`[${coin.symbol}] MCM Signal:`, mcm, '| Recommendation:', rec);
                              }

                              if (taData && taData.total_counts) {
                                return (
                                  <div className="w-full flex items-center justify-center">
                                    <SimpleTAGauge taData={taData} signal={taData.mcm_signal || coin.mcm_signal} />
                                  </div>
                                );
                              }

                              return <span className="text-[10px] font-semibold text-gray-500">N/A</span>;
                            })()}
                          </td>

                          {/* MCM Signal Column */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            {(() => {
                              // Get signal from coin data
                              const dummySignals = ["Strong Buy", "Buy", "Neutral", "Sell", "Strong Sell"];
                              const signal = (coin.mcm_signal && coin.mcm_signal !== 'N/A')
                                ? coin.mcm_signal
                                : dummySignals[(coin.symbol.length + index) % dummySignals.length];

                              let colorClass = 'text-gray-600';
                              if (signal && signal !== 'N/A') {
                                const sigLower = signal.toLowerCase();
                                if (sigLower.includes('bullish') || sigLower.includes('buy')) {
                                  colorClass = 'text-green-600';
                                } else if (sigLower.includes('bearish') || sigLower.includes('sell')) {
                                  colorClass = 'text-red-600';
                                }
                              }

                              return (
                                <div className="flex items-center justify-center">
                                  <span className={`text-xs font-bold ${colorClass}`}>
                                    {signal}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Live Price Column */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            {currentPrice !== 'N/A' ? (
                              (() => {
                                const num = Number(currentPrice);
                                const isNum = typeof num === "number" && !isNaN(num);
                                const isThreeDigitsOrLess =
                                  isNum && Math.floor(num).toString().length <= 3;
                                return (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className={`text-xs font-semibold ${priceChangePercent !== null ? (priceChangePercent > 0 ? 'text-green-600' : priceChangePercent < 0 ? 'text-red-600' : 'text-gray-900') : 'text-blue-500'}`}>
                                      $
                                      {isNum
                                        ? num.toLocaleString("en-US", {
                                          minimumFractionDigits: isThreeDigitsOrLess ? 2 : 0,
                                          maximumFractionDigits: isThreeDigitsOrLess ? 8 : 0,
                                        })
                                        : currentPrice}
                                    </span>
                                    {priceChangePercent !== null && (
                                      <span className={`text-[10px] font-semibold ${priceChangePercent > 0 ? 'text-green-600' : priceChangePercent < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                                      </span>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <span className="text-xs text-gray-500">N/A</span>
                            )}
                          </td>

                          {/* MCM Knowledge Center Column */}
                          <td className="px-2 py-3 text-center group-hover:bg-white/50 transition-all duration-300">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => router.push('/market-overview')}
                                className="text-sm font-semibold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer transition-colors"
                              >
                                {(index + 1) * 5}
                              </button>
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

      {/* Influencer Popup */}
      {influencerModal.isOpen && (
        <>
          {/* Transparent overlay to close on click */}
          <div
            className="fixed inset-0 z-[9999]"
            onClick={() => setInfluencerModal({ isOpen: false, type: '', influencers: {}, coinName: '', position: { x: 0, y: 0 } })}
          />

          {/* Popup positioned near clicked element */}
          <div
            className="fixed z-[10000] bg-gray-800 text-white rounded-lg shadow-2xl p-3 w-[250px] max-h-[400px] overflow-hidden flex flex-col"
            style={{
              left: `${influencerModal.position.x}px`,
              top: `${influencerModal.position.y}px`,
            }}
            onMouseEnter={() => setIsMouseOverModal(true)}
            onMouseLeave={() => setIsMouseOverModal(false)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                {influencerModal.type === 'YouTube' ? (
                  <FaYoutube className="text-red-500 text-xs" />
                ) : (
                  <FaTelegramPlane className="text-blue-400 text-xs" />
                )}
                {influencerModal.type} Influencers
              </h3>
              <button
                onClick={() => setInfluencerModal({ isOpen: false, type: '', influencers: {}, coinName: '', position: { x: 0, y: 0 } })}
                className="text-gray-400 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Coin Name */}
            <div className="mb-2 text-[10px] text-gray-300">
              <span className="font-semibold text-white">{influencerModal.coinName}</span>
            </div>

            {/* Influencer List */}
            <div className="overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: 'thin' }}>
              <div className="space-y-1">
                {Array.isArray(influencerModal.influencers) ? (
                  influencerModal.influencers.map((influencer) => (
                    <div
                      key={influencer.channel_id}
                      className="text-[10px] py-1 text-gray-200 hover:text-white cursor-pointer hover:bg-gray-700 px-1 rounded transition-colors"
                      onClick={() => {
                        const route = influencerModal.type === 'YouTube'
                          ? `/influencers/${influencer.channel_id}?tab=recentActivities`
                          : `/telegram-influencer/${influencer.channel_id}?tab=recentActivities`;
                        router.push(route);
                      }}
                    >
                      • {influencer.influencer_name}
                    </div>
                  ))
                ) : (
                  Object.entries(influencerModal.influencers).map(([channelId, name]) => (
                    <div
                      key={channelId}
                      className="text-[10px] py-1 text-gray-200 hover:text-white cursor-pointer hover:bg-gray-700 px-1 rounded transition-colors"
                      onClick={() => {
                        const route = influencerModal.type === 'YouTube'
                          ? `/influencers/${channelId}?tab=recentActivities`
                          : `/telegram-influencer/${channelId}?tab=recentActivities`;
                        router.push(route);
                      }}
                    >
                      • {name}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
