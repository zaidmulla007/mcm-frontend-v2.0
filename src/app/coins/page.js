"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaBell, FaYoutube, FaTelegramPlane } from "react-icons/fa";
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
  // To adjust column widths, simply change TRADING_INFO_WIDTH below
  // Example: Change to 40 for 40% Trading Info width, other columns will auto-adjust to 15% each
  // Example: Change to 25 for 25% Trading Info width, other columns will auto-adjust to 18.75% each
  const TRADING_INFO_WIDTH = 55; // Trading Info column width percentage (%)
  const NUM_OTHER_COLUMNS = 4; // Number of other columns (Coins, Social Media Sentiment, Fundamental Score, Technical Analysis)
  const OTHER_COLUMN_WIDTH = (100 - TRADING_INFO_WIDTH) / NUM_OTHER_COLUMNS; // Automatically calculated for equal distribution
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
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans mt-5">
      <main className="mx-auto px-4 pb-8">
        <div className="min-w-0">
          {/* Leaderboard Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* View Mode Toggle Buttons */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
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
              {/* Header Title */}
              <div className="flex justify-center mt-2">
                <p className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Trending Coins <br />
                  {/* (Updated every 6 Hrs) */}
                </p>
              </div>

              {/* Timezone Switch */}
              <div className="flex items-center gap-2 mt-2">
                {!useLocalTime && (
                  <span className="text-xs font-medium text-black-700">
                    UTC
                  </span>
                )}
                <button
                  onClick={() => toggleTimezone()}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${useLocalTime ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-300'
                    }`}
                  role="switch"
                  aria-checked={useLocalTime}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${useLocalTime ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                  />
                </button>
                {useLocalTime && (
                  <span className="text-xs font-medium text-black-700">
                    {userCity || 'Local'}
                  </span>
                )}
              </div>

              {/* Last Updated and Timeframe Buttons */}
              <div className="flex items-center gap-6 mt-2">
                {/* Last Updated */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-black-600">
                    Last Updated
                  </span>
                  <p className="text-xs text-black-600">
                    {lastUpdated ? formatDate(lastUpdated) : "N/A"}
                  </p>
                </div>

                {/* Timeframe Buttons */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-black-600">
                    Timeframe
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSummaryTimeframe("6hrs")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${selectedSummaryTimeframe === "6hrs"
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      6 Hours
                    </button>
                    <button
                      onClick={() => setSelectedSummaryTimeframe("24hrs")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${selectedSummaryTimeframe === "24hrs"
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      24 Hours
                    </button>
                    <button
                      onClick={() => setSelectedSummaryTimeframe("7days")}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${selectedSummaryTimeframe === "7days"
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th rowSpan="2" className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider align-middle" style={{ width: `${OTHER_COLUMN_WIDTH}%` }}>
                      Coins
                    </th>
                    <th rowSpan="2" className="pl-2 pr-0.5 py-3 text-left text-xs font-bold text-black-900 tracking-wider align-middle" style={{ width: `${OTHER_COLUMN_WIDTH}%` }}>
                      <div className="flex flex-col items-start gap-0.5">
                        <span>Social Media</span>
                        <div className="flex items-center justify-start gap-1">
                          <span>Sentiment</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              ST : Short Term<br />LT : Long Term
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                    {/* <th rowSpan="2" className="pl-0.5 pr-2 py-3 text-left text-xs font-bold text-black-900 tracking-wider w-[5%] align-middle">
                      <div className="flex flex-col items-start">
                        <span>Base</span>
                        <div className="flex items-center gap-1">
                          <span>Price</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              Price at the time when post was published
                            </span>
                          </span>
                        </div>
                      </div>
                    </th> */}
                    {/* <th rowSpan="2" className="pl-0.5 pr-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider w-[6%] align-middle">
                      <div className="flex flex-col items-center">
                        <span>Current</span>
                        <div className="flex items-center gap-1">
                          <span>Price</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl z-[9999] text-left w-48">
                              Source: Binance & CoinGeko <br />
                              N/A : Not Available
                            </span>
                          </span>
                        </div>
                      </div>
                    </th> */}
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
                    {/* Fundamental Score Header */}
                    <th rowSpan="2" className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider align-middle" style={{ width: `${OTHER_COLUMN_WIDTH}%` }}>
                      <div className="flex flex-col items-center">
                        <span>Fundamental</span>
                        <div className="flex items-center gap-1">
                          <span>Score</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              Score (1-10) based <br /> on deep fundamental analysis
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                    {/* <th rowSpan="2" className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider w-[6%] align-middle">
                      <div className="flex flex-col items-center">
                        <span>24 Hrs %</span>
                        <div className="flex items-center gap-1">
                          <span>Price Change</span>
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999] text-left">
                              Source: Binance<br />
                              N/A : Not Available
                            </span>
                          </span>
                        </div>
                      </div>
                    </th> */}
                    <th rowSpan="2" className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider align-middle" style={{ width: `${OTHER_COLUMN_WIDTH}%` }}>
                      <div className="flex flex-col items-center">
                        <span>Technical Analysis</span>
                        <div className="flex items-center gap-1">
                          <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-1 left-[-40px] bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999] text-left">
                              Technical Analysis:
                              We calculate all MA indicators (SMA & EMA for 5,10,20,50,100,200)
                              <br />
                              and all oscillator indicators (RSI, Stochastic, CCI, ADX, MACD, AO, Momentum, Williams %R, BullBear).
                              <br />
                              Each indicator gives a BUY/SELL/NEUTRAL vote, and we simply total how many votes fall into each category.
                            </span>
                          </span>
                        </div>
                      </div>
                    </th>
                    <th
                      colSpan="1"
                      className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider"
                      style={{ width: `${TRADING_INFO_WIDTH}%` }}
                    >
                      <div className="flex justify-center items-center gap-1">
                        <span>Consolidated Analysis of All Posts</span>
                        <span className="text-[10px] rounded-2xl font-bold tracking-wide bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                          Ai
                        </span>
                      </div>
                    </th>

                  </tr>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {/* <th className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider w-[40%]">
                      <div className="flex items-center justify-center gap-1">
                        <span>Coin Info</span>
                        <span className="relative group cursor-pointer z-[9999]">
                          <span className="text-blue-600 text-sm">ⓘ</span>
                          <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                            Past {selectedSummaryTimeframe === '6hrs' ? '6 hrs' : selectedSummaryTimeframe === '24hrs' ? '24 hrs' : '7 days'} all Posts
                          </span>
                        </span>
                      </div>
                    </th> */}
                    <th className="px-2 py-3 text-center text-xs font-bold text-black-900 tracking-wider" style={{ width: `${TRADING_INFO_WIDTH}%` }}>
                      <div className="flex items-center justify-center gap-1">
                        <span>Trading Info</span>
                        <span className="relative group cursor-pointer z-[9999]">
                          <span className="text-blue-600 text-sm">ⓘ</span>
                          <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                            Past {selectedSummaryTimeframe === '6hrs' ? '6 hrs' : selectedSummaryTimeframe === '24hrs' ? '24 hrs' : '7 days'} All Posts
                          </span>
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : top10Coins.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-6 py-12 text-center text-gray-500">
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
                        <tr key={`${coin.symbol}-${index}`} className="hover:bg-gray-50">
                          {/* Coin - Image and Name Vertically Stacked with Total Posts */}
                          <td className="px-2 py-3">
                            <div className="flex flex-col items-center gap-2">
                              {coin.image_small && (
                                <div className="relative group">
                                  <img
                                    src={coin.image_small}
                                    alt={coin.symbol}
                                    className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => router.push(`/coins-list/${coin.source_id}`)}
                                  />
                                  {/* Bell icon for coins exceeding price change threshold */}
                                  {showPriceAlert && (
                                    <div className="absolute -top-1 -right-1 group/bell cursor-pointer z-[9999]">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${priceChangePercent > 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}>
                                        <FaBell className="text-white text-[12px]" />
                                      </div>
                                      {/* Tooltip on hover - positioned to the right of the bell */}
                                      <div className="invisible group-hover/bell:visible absolute top-0 left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                        {alertReason}
                                      </div>
                                    </div>
                                  )}
                                  {/* Show live price tooltip when hovering on coin image (only if NO bell or when not hovering bell) */}
                                  {currentPrice !== 'N/A' && (
                                    <div className="invisible group-hover:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                      Live Price: ${typeof currentPrice === 'number' ? currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : currentPrice}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <div className="text-xs font-bold text-balck-900"> {coin.symbol ? coin.symbol.charAt(0).toUpperCase() + coin.symbol.slice(1).toLowerCase() : ''}</div>
                                  {/* New coin dot notification - only for 6hrs data */}
                                  {isNewCoin(coin) && (
                                    <div className="relative group/newcoin">
                                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                      <div className="invisible group-hover/newcoin:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-[9999]">
                                        New in last 6 hours
                                      </div>
                                    </div>
                                  )}
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
                                <div
                                  className="text-[10px] font-semibold text-black-900 mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={() => {
                                    // Navigate to landing page with coin data as query parameters
                                    router.push(`/landing-page?source_id=${coin.source_id}&name=${encodeURIComponent(coin.coin_name)}&symbol=${coin.symbol}`);
                                  }}
                                >
                                  {coin.total_mentions} posts
                                </div>

                                {/* YouTube Influencer Count */}
                                {coin.yt_unique_influencers_count > 0 && (
                                  <div
                                    className="cursor-pointer mt-1"
                                    onClick={(e) => {
                                      if (coin.yt_unique_inf && coin.yt_unique_inf.length > 0) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setInfluencerModal({
                                          isOpen: true,
                                          type: 'YouTube',
                                          influencers: coin.yt_unique_inf,
                                          // coinName: coin.coin_name,
                                          position: { x: rect.right + 10, y: rect.top }
                                        });
                                      }
                                    }}
                                  >
                                    <div className="text-[10px] font-semibold flex items-center justify-center gap-1">
                                      <FaYoutube className="text-red-600 text-xs" />
                                      <span className="text-black">{coin.yt_unique_influencers_count} {coin.yt_unique_influencers_count === 1 ? 'Channel' : 'Channels'}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Telegram Influencer Count */}
                                {coin.tg_unique_influencers_count > 0 && (
                                  <div
                                    className="cursor-pointer mt-1"
                                    onClick={(e) => {
                                      if (coin.tg_unique_inf && coin.tg_unique_inf.length > 0) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setInfluencerModal({
                                          isOpen: true,
                                          type: 'Telegram',
                                          influencers: coin.tg_unique_inf,
                                          // coinName: coin.coin_name,
                                          position: { x: rect.right + 10, y: rect.top }
                                        });
                                      }
                                    }}
                                  >
                                    <div className="text-[10px] font-semibold flex items-center justify-center gap-1">
                                      <FaTelegramPlane className="text-blue-600 text-xs" />
                                      <span className="text-black">{coin.tg_unique_influencers_count} {coin.tg_unique_influencers_count === 1 ? 'Channel' : 'Channels'}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Sentiment - Bullish and Bearish Gauges */}
                          <td className="px-2 py-3 text-center">
                            {(() => {
                              const hasBullish = (coin.yt_tg_bullish_short_term > 0 || coin.yt_tg_bullish_long_term > 0);
                              const hasBearish = (coin.yt_tg_bearish_short_term > 0 || coin.yt_tg_bearish_long_term > 0);
                              const hasBothGauges = hasBullish && hasBearish;

                              // If no data, show N/A
                              if (!hasBullish && !hasBearish) {
                                return <span className="text-xs text-gray-400">N/A</span>;
                              }

                              // If both gauges exist, use vertical layout with combined post counts
                              if (hasBothGauges) {
                                return (
                                  <div className="flex flex-col gap-4">
                                    {/* Bullish Row */}
                                    {hasBullish && coin.bullish_percent !== undefined && (
                                      <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center">
                                          <GaugeComponent
                                            id={`gauge-bullish-${coin.symbol}-${index}`}
                                            type="radial"
                                            style={{ width: 60, height: 60 }}
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
                                              colorArray: ['#CE1F1F', '#00FF15'],
                                              nbSubArcs: 90,
                                              padding: 0.01,
                                              width: 0.4
                                            }}
                                            pointer={{
                                              animationDelay: 0,
                                              strokeWidth: 7
                                            }}
                                            value={coin.bullish_percent}
                                          />
                                          <div className="text-[10px] font-bold text-center mt-2">
                                            <span className="text-black">
                                              {Math.round(coin.bullish_percent)}% Bullish
                                            </span>
                                          </div>
                                        </div>

                                        {/* Bullish Counts */}
                                        <div className="flex flex-col gap-1 text-left">
                                          <div className="text-[10px] font-bold text-green-600">Bullish:</div>
                                          {coin.yt_tg_bullish_short_term > 0 && (
                                            <div className="text-[10px] text-black">
                                              <span className="font-semibold">ST:</span> {coin.yt_tg_bullish_short_term} {coin.yt_tg_bullish_short_term === 1 ? 'post' : 'posts'}
                                            </div>
                                          )}
                                          {coin.yt_tg_bullish_long_term > 0 && (
                                            <div className="text-[10px] text-black">
                                              <span className="font-semibold">LT:</span> {coin.yt_tg_bullish_long_term} {coin.yt_tg_bullish_long_term === 1 ? 'post' : 'posts'}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Bearish Row */}
                                    {hasBearish && coin.bullish_percent !== undefined && (
                                      <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center">
                                          <GaugeComponent
                                            id={`gauge-bearish-${coin.symbol}-${index}`}
                                            type="radial"
                                            style={{ width: 60, height: 60 }}
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
                                              colorArray: ['#00FF15', '#CE1F1F'],
                                              nbSubArcs: 90,
                                              padding: 0.01,
                                              width: 0.4
                                            }}
                                            pointer={{
                                              animationDelay: 0,
                                              strokeWidth: 7
                                            }}
                                            value={100 - coin.bullish_percent}
                                          />
                                          <div className="text-[10px] font-bold text-center mt-2">
                                            <span className="text-black">
                                              {Math.round(100 - coin.bullish_percent)}% Bearish
                                            </span>
                                          </div>
                                        </div>

                                        {/* Bearish Counts */}
                                        <div className="flex flex-col gap-1 text-left">
                                          <div className="text-[10px] font-bold text-red-600">Bearish:</div>
                                          {coin.yt_tg_bearish_short_term > 0 && (
                                            <div className="text-[10px] text-black">
                                              <span className="font-semibold">ST:</span> {coin.yt_tg_bearish_short_term} {coin.yt_tg_bearish_short_term === 1 ? 'post' : 'posts'}
                                            </div>
                                          )}
                                          {coin.yt_tg_bearish_long_term > 0 && (
                                            <div className="text-[10px] text-black">
                                              <span className="font-semibold">LT:</span> {coin.yt_tg_bearish_long_term} {coin.yt_tg_bearish_long_term === 1 ? 'post' : 'posts'}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }

                              // If only one gauge exists, use horizontal layout
                              return (
                                <div className="flex items-center gap-3">
                                  {/* Single Gauge */}
                                  <div className="flex flex-col items-center">
                                    <GaugeComponent
                                      id={`gauge-${hasBullish ? 'bullish' : 'bearish'}-${coin.symbol}-${index}`}
                                      type="radial"
                                      style={{ width: 60, height: 60 }}
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
                                        colorArray: hasBullish ? ['#CE1F1F', '#00FF15'] : ['#00FF15', '#CE1F1F'],
                                        nbSubArcs: 90,
                                        padding: 0.01,
                                        width: 0.4
                                      }}
                                      pointer={{
                                        animationDelay: 0,
                                        strokeWidth: 7
                                      }}
                                      value={hasBullish ? coin.bullish_percent : (100 - coin.bullish_percent)}
                                    />
                                    <div className="text-[10px] font-bold text-center mt-2">
                                      <span className="text-black">
                                        {hasBullish
                                          ? `${Math.round(coin.bullish_percent)}% Bullish`
                                          : `${Math.round(100 - coin.bullish_percent)}% Bearish`
                                        }
                                      </span>
                                    </div>
                                  </div>

                                  {/* Post counts to the right */}
                                  <div className="flex flex-col gap-1 text-left">
                                    <div className={`text-[10px] font-bold ${hasBullish ? 'text-green-600' : 'text-red-600'}`}>
                                      {hasBullish ? 'Bullish:' : 'Bearish:'}
                                    </div>
                                    {hasBullish ? (
                                      <>
                                        {coin.yt_tg_bullish_short_term > 0 && (
                                          <div className="text-[10px] text-black">
                                            <span className="font-semibold">ST:</span> {coin.yt_tg_bullish_short_term} {coin.yt_tg_bullish_short_term === 1 ? 'post' : 'posts'}
                                          </div>
                                        )}
                                        {coin.yt_tg_bullish_long_term > 0 && (
                                          <div className="text-[10px] text-black">
                                            <span className="font-semibold">LT:</span> {coin.yt_tg_bullish_long_term} {coin.yt_tg_bullish_long_term === 1 ? 'post' : 'posts'}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {coin.yt_tg_bearish_short_term > 0 && (
                                          <div className="text-[10px] text-black">
                                            <span className="font-semibold">ST:</span> {coin.yt_tg_bearish_short_term} {coin.yt_tg_bearish_short_term === 1 ? 'post' : 'posts'}
                                          </div>
                                        )}
                                        {coin.yt_tg_bearish_long_term > 0 && (
                                          <div className="text-[10px] text-black">
                                            <span className="font-semibold">LT:</span> {coin.yt_tg_bearish_long_term} {coin.yt_tg_bearish_long_term === 1 ? 'post' : 'posts'}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
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
                          <td className="px-2 py-3 text-center">
                            {(() => {
                              // Pick up fundamental_score directly from coin object
                              const fundamentalScore = coin.fundamental_score;
                              const numScore = parseFloat(fundamentalScore);

                              if (fundamentalScore === undefined || fundamentalScore === null || isNaN(numScore)) {
                                return <span className="text-[10px] font-semibold text-gray-500">N/A</span>;
                              }

                              // Calculate position percentage (0-10 scale to 0-100%)
                              // Clamp between 6% and 94% to keep ball within bar limits similar to reference
                              const position = (numScore / 10) * 100;
                              const clampedPosition = Math.min(Math.max(position, 6), 94);

                              // Determine color based on score (>= 5 is green, < 5 is red)
                              const isHigh = numScore >= 5;

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
                                    {numScore.toFixed(1)}/10
                                  </span>
                                </div>
                              );
                            })()}
                          </td>

                          {/* TA (Technical Analysis) Column */}
                          <td className="px-2 py-3 text-center">
                            {(() => {
                              // Get TA data from coin object
                              const taData = coin?.TA_data?.total_counts;

                              // Debug logging
                              if (index === 0) {
                                console.log('Coin TA_data:', coin?.TA_data);
                                console.log('Total counts:', taData);
                              }

                              if (taData && (taData.BUY !== undefined || taData.NEUTRAL !== undefined || taData.SELL !== undefined)) {
                                return (
                                  <div className="w-full flex items-center justify-center">
                                    <SimpleTAGauge
                                      buy={taData.BUY || 0}
                                      neutral={taData.NEUTRAL || 0}
                                      sell={taData.SELL || 0}
                                    />
                                  </div>
                                );
                              }

                              return <span className="text-[10px] font-semibold text-gray-500">N/A</span>;
                            })()}
                          </td>

                          {/* Coin Info Column */}
                          {/* <td className="px-2 py-3 text-left align-top w-[40%]">
                            <div className="text-[11px] text-gray-700 break-words prose prose-sm max-w-none">
                              {(() => {
                                if (!coinDataForTimeframe?.ai_summary) {
                                  return <span className="text-gray-500">Summary processing under progress....</span>;
                                }

                                const parsed = parseAISummary(coinDataForTimeframe.ai_summary);
                                const content = parsed?.coinInfo || coinDataForTimeframe.ai_summary;

                                return (
                                  <>
                                    <ReactMarkdown>
                                      {isSummaryExpanded(coin.symbol, `${selectedSummaryTimeframe}-coin`)
                                        ? content
                                        : truncateText(content, 57)}
                                    </ReactMarkdown>
                                    {(typeof content === 'string' ? content.split(' ') : String(content).split(' ')).length > 57 && (
                                      <>
                                        {!isSummaryExpanded(coin.symbol, `${selectedSummaryTimeframe}-coin`) && '... '}
                                        <button
                                          onClick={() => toggleSummaryExpand(coin.symbol, `${selectedSummaryTimeframe}-coin`)}
                                          className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] mt-1 inline-block"
                                        >
                                          {isSummaryExpanded(coin.symbol, `${selectedSummaryTimeframe}-coin`) ? 'Read less' : 'Read more'}
                                        </button>
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </td> */}

                          {/* Trading Info Column */}
                          <td className="px-2 py-3 text-left align-top" style={{ width: `${TRADING_INFO_WIDTH}%` }}>
                            <div className="text-[11px] text-gray-700 break-words prose prose-sm max-w-none">
                              {(() => {
                                if (!coinDataForTimeframe?.ai_summary) {
                                  return <span className="text-gray-500">Summary processing under progress....</span>;
                                }

                                const parsed = parseAISummary(coinDataForTimeframe.ai_summary);
                                const content = parsed?.tradingInfo || coinDataForTimeframe.ai_summary;

                                return (
                                  <>
                                    <ReactMarkdown>
                                      {isSummaryExpanded(coin.symbol, `${selectedSummaryTimeframe}-trading`)
                                        ? content
                                        : truncateText(content, 57)}
                                    </ReactMarkdown>
                                    {(typeof content === 'string' ? content.split(' ') : String(content).split(' ')).length > 57 && (
                                      <>
                                        {!isSummaryExpanded(coin.symbol, `${selectedSummaryTimeframe}-trading`) && '... '}
                                        <button
                                          onClick={() => toggleSummaryExpand(coin.symbol, `${selectedSummaryTimeframe}-trading`)}
                                          className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] mt-1 inline-block"
                                        >
                                          {isSummaryExpanded(coin.symbol, `${selectedSummaryTimeframe}-trading`) ? 'Read less' : 'Read more'}
                                        </button>
                                      </>
                                    )}
                                  </>
                                );
                              })()}
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
