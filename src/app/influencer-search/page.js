"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalfAlt, FaInfoCircle, FaArrowUp, FaArrowDown, FaBitcoin, FaYoutube, FaTelegram } from "react-icons/fa";
import { FaEthereum } from "react-icons/fa6";
import { getYearOptions, getDynamicTimeframeOptions } from "../../../utils/dateFilterUtils";
import { useInfluencerLivePrice } from "../../hooks/useInfluencerLivePrice";
import { useTimezone } from "../contexts/TimezoneContext";
import moment from "moment-timezone";

// Helper function to format numbers
const formatNumber = (num) => {
  if (!num || num === 0) return '0';

  const absNum = Math.abs(num);

  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (absNum >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }

  return num.toString();
};

// Helper function to truncate text to specified word limit
const truncateText = (text, wordLimit = 30) => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ');
};

// Helper function to format recommendations from API data
const formatRecommendations = (lastPostsData, livePrices = {}, volumeData = {}) => {
  if (!lastPostsData || lastPostsData.length === 0) {
    return [];
  }

  // Check if data contains grouped posts
  const hasGroupedPosts = lastPostsData.some(post => post.isGrouped);

  const formattedPosts = lastPostsData.map(post => {
    // Handle grouped posts (multiple coins per post)
    if (post.isGrouped && post.coins) {
      // Filter coins with valid sentiment
      const validCoins = post.coins.filter(coinData => {
        const sentiment = coinData.sentiment || "";
        const validSentiments = ["strong_bullish", "strong_bearish", "mild_bullish", "mild_bearish"];
        return sentiment && validSentiments.includes(sentiment.toLowerCase());
      }).map(coinData => {
        // Format each coin in the group
        const sentiment = coinData.sentiment || "";
        const outlook = coinData.outlook || coinData.cryptoRecommendationType || "";

        let type = "bullish";
        let term = "N/A";

        // Determine type based on sentiment
        if (sentiment.toLowerCase().includes("bearish")) {
          type = "bearish";
        }

        // Determine term based on outlook - only if valid
        if (outlook && (outlook.toLowerCase() === "short_term" || outlook.toLowerCase() === "short-term")) {
          term = "short";
        } else if (outlook && (outlook.toLowerCase() === "long_term" || outlook.toLowerCase() === "long-term")) {
          term = "long";
        }

        const basePrice = coinData.binance?.base_price || coinData.price || null;
        const lastAvailablePrice = coinData.binance?.last_available_price || null;
        const lastAvailableTimestamp = coinData.binance?.last_available_timestamp || null;
        const symbol = coinData.symbol?.toUpperCase();
        const livePrice = livePrices[symbol];
        const currentPrice = livePrice && livePrice !== "-"
          ? `$${typeof livePrice === 'number' ? livePrice.toFixed(2) : livePrice}`
          : "N/A";
        const volume = volumeData[symbol] || "N/A";

        const coinIcon = coinData.image_small ? (
          <img src={coinData.image_small} alt={coinData.symbol} className="w-3 h-3" />
        ) : (
          <span className="text-gray-500 text-xs">{coinData.symbol?.[0] || "?"}</span>
        );

        return {
          coin: coinData.symbol || "N/A",
          icon: coinIcon,
          type: type,
          term: term,
          basePrice: basePrice ? (typeof basePrice === 'number' ? `$${basePrice.toFixed(2)}` : basePrice) : null,
          lastAvailablePrice: lastAvailablePrice,
          lastAvailableTimestamp: lastAvailableTimestamp,
          currentPrice: currentPrice,
          volume: volume,
          sentiment: sentiment,
          outlook: outlook,
          mcm_source_id: coinData.mcm_source_id || null,
        };
      });

      // Skip this post if no valid coins
      if (validCoins.length === 0) {
        return null;
      }

      return {
        date: post.date,
        time: post.time,
        publishedAt: post.publishedAt,
        link: post.link,
        videoID: post.videoID,
        messageID: post.messageID,
        title: post.title,
        summary: post.summary || "No summary available",
        type: post.type || "youtube",
        channel_name: post.channel_name,
        isGrouped: true,
        coins: validCoins
      };
    }

    // Handle individual coin posts (non-grouped)
    const coinData = post.coin;

    // Validate sentiment
    const sentiment = coinData.sentiment || "";
    const validSentiments = ["strong_bullish", "strong_bearish", "mild_bullish", "mild_bearish"];

    // Skip this post if sentiment is not valid
    if (!sentiment || !validSentiments.includes(sentiment.toLowerCase())) {
      return null;
    }

    const outlook = coinData.outlook || coinData.cryptoRecommendationType || "";

    let type = "bullish";
    let term = "N/A";

    // Determine type based on sentiment
    if (sentiment.toLowerCase().includes("bearish")) {
      type = "bearish";
    }

    // Determine term based on outlook - only if valid
    if (outlook && (outlook.toLowerCase() === "short_term" || outlook.toLowerCase() === "short-term")) {
      term = "short";
    } else if (outlook && (outlook.toLowerCase() === "long_term" || outlook.toLowerCase() === "long-term")) {
      term = "long";
    }

    // Format prices
    const basePrice = coinData.binance?.base_price || coinData.price || null;
    const lastAvailablePrice = coinData.binance?.last_available_price || null;
    const lastAvailableTimestamp = coinData.binance?.last_available_timestamp || null;

    // Get live price from WebSocket data
    const symbol = coinData.symbol?.toUpperCase();
    const livePrice = livePrices[symbol];
    const currentPrice = livePrice && livePrice !== "-"
      ? `$${typeof livePrice === 'number' ? livePrice.toFixed(2) : livePrice}`
      : "N/A";

    // Get volume from volume data
    const volume = volumeData[symbol] || "N/A";

    // Format percentage returns
    const percentage_1hr = coinData.binance?.["1_hour_price_returns"]
      ? (() => {
        const value = (coinData.binance["1_hour_price_returns"] * 100).toFixed(2);
        return value > 0 ? `+${value}%` : `${value}%`;
      })()
      : "N/A";

    const percentage_24hr = coinData.binance?.["24_hour_price_returns"]
      ? (() => {
        const value = (coinData.binance["24_hour_price_returns"] * 100).toFixed(2);
        return value > 0 ? `+${value}%` : `${value}%`;
      })()
      : "N/A";

    // Get coin icon from image_small
    const coinIcon = coinData.image_small ? (
      <img src={coinData.image_small} alt={coinData.symbol} className="w-3 h-3" />
    ) : (
      <span className="text-gray-500 text-xs">{coinData.symbol?.[0] || "?"}</span>
    );

    return {
      date: post.date,
      time: post.time,
      publishedAt: post.publishedAt, // Store publishedAt for sorting
      coin: coinData.symbol || "N/A",
      icon: coinIcon,
      type: type,
      term: term,
      basePrice: basePrice ? (typeof basePrice === 'number' ? `$${basePrice.toFixed(2)}` : basePrice) : null,
      lastAvailablePrice: lastAvailablePrice,
      lastAvailableTimestamp: lastAvailableTimestamp,
      currentPrice: currentPrice, // Already formatted above
      percentage_1hr: percentage_1hr,
      roi_1hr: post.roi_1hr && typeof post.roi_1hr === 'number' ? `${post.roi_1hr.toFixed(4)}` : "N/A",
      percentage_24hr: percentage_24hr,
      roi_24hr: post.roi_24hr && typeof post.roi_24hr === 'number' ? `${post.roi_24hr.toFixed(4)}` : "N/A",
      summary: post.summary || coinData.explanation || coinData.tradingCall || "No summary available",
      sentiment: sentiment,
      outlook: outlook,
      link: post.link,
      videoID: post.videoID,
      volume: volume,
      title: post.title,
      type: post.type || "youtube",
      channel_name: post.channel_name,
      mcm_source_id: coinData.mcm_source_id || null
    };
  }).filter(post => post !== null); // Remove null posts (invalid sentiment)

  // Sort by publishedAt - skip sorting for grouped posts (already sorted in getInfluencerPosts)
  if (!hasGroupedPosts) {
    formattedPosts.sort((a, b) => {
      // If both have publishedAt, use it for sorting
      if (a.publishedAt && b.publishedAt) {
        const dateA = new Date(a.publishedAt);
        const dateB = new Date(b.publishedAt);
        return dateB - dateA; // Most recent first (descending order)
      }

      // If only one has publishedAt, prioritize it
      if (a.publishedAt && !b.publishedAt) return -1;
      if (!a.publishedAt && b.publishedAt) return 1;

      // Fallback to date/time parsing if publishedAt is not available
      const parseDateTime = (dateStr, timeStr) => {
        let year, month, day;

        // Check if date format is YYYY-MM-DD
        if (dateStr.includes('-')) {
          [year, month, day] = dateStr.split('-');
        } else {
          // Assume DD/MM/YYYY format
          [day, month, year] = dateStr.split('/');
        }

        const [hours, minutes] = timeStr.split(':');
        return new Date(year, month - 1, day, hours, minutes);
      };

      const dateA = parseDateTime(a.date, a.time);
      const dateB = parseDateTime(b.date, b.time);

      // Sort descending (most recent first)
      return dateB - dateA;
    });
  }

  return formattedPosts;
};


export default function InfluencerSearchPage() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [youtubeInfluencers, setYoutubeInfluencers] = useState([]);
  const [telegramInfluencers, setTelegramInfluencers] = useState([]);
  const [youtubeLastPosts, setYoutubeLastPosts] = useState({});
  const [telegramLastPosts, setTelegramLastPosts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [binanceVolumeData, setBinanceVolumeData] = useState({});

  // Posts pagination state (from 3days-all-posts API)
  const [threeDaysAllPostsPagination, setThreeDaysAllPostsPagination] = useState({
    youtube: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    telegram: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }
  });
  const [threeDaysDateRange, setThreeDaysDateRange] = useState({ start: null, end: null });

  // Use timezone context
  const { useLocalTime, userTimezone, toggleTimezone, formatDate: formatDateFromContext } = useTimezone();

  // Get user's city from timezone
  const [userCity, setUserCity] = useState('');

  useEffect(() => {
    if (useLocalTime && userTimezone) {
      const city = userTimezone.split('/').pop()?.replace(/_/g, ' ') || 'Local';
      setUserCity(city);
    }
  }, [useLocalTime, userTimezone]);

  // Fetch Binance volume data
  useEffect(() => {
    let isMounted = true;

    const fetchBinanceVolume = async () => {
      try {
        // Fetch only USDT pairs by making individual requests or filtering
        // Since Binance doesn't support filtering in the API, we fetch all and filter
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();

        // Only update state if component is still mounted
        if (!isMounted) return;

        // Create a map of symbol to volume, priceChange, priceChangePercent, bidPrice, askPrice, bidQty, and askQty (only USDT pairs)
        const volumeMap = {};
        data.forEach(ticker => {
          // Only process USDT trading pairs
          if (ticker.symbol.endsWith('USDT')) {
            // Remove 'USDT' suffix to get the base symbol (e.g., BTCUSDT -> BTC)
            const symbol = ticker.symbol.replace('USDT', '');
            volumeMap[symbol] = {
              volume: ticker.volume,
              priceChange: ticker.priceChange,
              priceChangePercent: ticker.priceChangePercent,
              bidPrice: ticker.bidPrice,
              askPrice: ticker.askPrice,
              bidQty: ticker.bidQty,
              askQty: ticker.askQty
            };
          }
        });

        setBinanceVolumeData(volumeMap);
      } catch (error) {
        console.error('Error fetching Binance volume data:', error);
      }
    };

    fetchBinanceVolume();
    // Refresh Binance data every 5 minutes (only for volume data, bid/ask comes from WebSocket)
    const interval = setInterval(fetchBinanceVolume, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);

  // Animation state for ranking transitions
  const isFirstRenderRef = useRef(true);

  // Dropdown state
  const [selectedInfluencer, setSelectedInfluencer] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter states
  const [selectedRating, setSelectedRating] = useState("3");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1_hour");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Client-side filters
  const [roiFilter, setRoiFilter] = useState("all");
  const [winRateFilter, setWinRateFilter] = useState("all");
  const [totalCallsFilter, setTotalCallsFilter] = useState("all");

  // View mode state for toggle buttons
  const [viewMode, setViewMode] = useState("top10_influencer_latest"); // "top10_influencer_latest", "top10_recent_posts", "coins"

  // Visible recommendations state - tracks how many items to show per influencer (default: 3)
  const [visibleRecommendations, setVisibleRecommendations] = useState({});

  // State to track expanded posts (for grouped coin display)
  const [expandedPosts, setExpandedPosts] = useState({});

  // State to track expanded titles
  const [expandedTitles, setExpandedTitles] = useState({});

  // Sorting state for recommendations (default: desc to show recent posts first)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });

  // Extract unique coin symbols from YouTube and Telegram last posts
  const coinSymbols = useMemo(() => {
    const symbolsSet = new Set();

    // Helper function to extract symbols from a post
    const extractSymbolsFromPost = (post) => {
      // Handle posts with mentioned array (new API structure from 3days-all-posts)
      if (post.mentioned && Array.isArray(post.mentioned)) {
        post.mentioned.forEach(coinData => {
          if (coinData.symbol) {
            symbolsSet.add(coinData.symbol.toUpperCase());
          }
        });
      }
      // Handle grouped posts (multiple coins per post)
      else if (post.isGrouped && post.coins) {
        post.coins.forEach(coinData => {
          if (coinData.symbol) {
            symbolsSet.add(coinData.symbol.toUpperCase());
          }
        });
      }
      // Handle individual coin posts (old structure)
      else if (post.coin && post.coin.symbol) {
        symbolsSet.add(post.coin.symbol.toUpperCase());
      }
    };

    // Extract from YouTube last posts - check for results array (new structure)
    if (youtubeLastPosts.results && Array.isArray(youtubeLastPosts.results)) {
      youtubeLastPosts.results.forEach(extractSymbolsFromPost);
    } else {
      // Fallback for old structure
      Object.values(youtubeLastPosts).forEach(posts => {
        if (Array.isArray(posts)) {
          posts.forEach(extractSymbolsFromPost);
        }
      });
    }

    // Extract from Telegram last posts - check for results array (new structure)
    if (telegramLastPosts.results && Array.isArray(telegramLastPosts.results)) {
      telegramLastPosts.results.forEach(extractSymbolsFromPost);
    } else {
      // Fallback for old structure
      Object.values(telegramLastPosts).forEach(posts => {
        if (Array.isArray(posts)) {
          posts.forEach(extractSymbolsFromPost);
        }
      });
    }

    const symbols = Array.from(symbolsSet);
    return symbols;
  }, [youtubeLastPosts, telegramLastPosts]);

  // Use live price hook with extracted symbols
  const { prices, priceChanges, isConnected, bidAskData, volumeData } = useInfluencerLivePrice(coinSymbols);

  // Create a live prices map that updates when prices change
  const livePricesMap = useMemo(() => {
    const pricesMap = {};
    Object.entries(prices).forEach(([symbolKey, price]) => {
      // Remove 'USDT' suffix to get base symbol (e.g., BTCUSDT -> BTC)
      const baseSymbol = symbolKey.replace('USDT', '');
      pricesMap[baseSymbol] = price;
    });
    return pricesMap;
  }, [prices]);

  // Create a live price changes map
  const livePriceChangesMap = useMemo(() => {
    const changesMap = {};
    Object.entries(priceChanges).forEach(([symbolKey, change]) => {
      // Remove 'USDT' suffix to get base symbol (e.g., BTCUSDT -> BTC)
      const baseSymbol = symbolKey.replace('USDT', '');
      changesMap[baseSymbol] = change;
    });
    return changesMap;
  }, [priceChanges]);

  // Helper function to get live price for a symbol
  const getLivePrice = useCallback((symbol) => {
    if (!symbol) {
      return "N/A";
    }
    const upperSymbol = symbol.toUpperCase();
    const livePrice = livePricesMap[upperSymbol];
    if (livePrice && livePrice !== "-") {
      return `$${typeof livePrice === 'number' ? livePrice.toFixed(2) : livePrice}`;
    }
    return "N/A";
  }, [livePricesMap]);

  // Helper function to get live price change (EXACT same pattern as /coins)
  const getLivePriceChange = useCallback((symbol) => {
    if (!symbol) return null;
    const upperSymbol = symbol.toUpperCase();
    const priceChange = livePriceChangesMap[upperSymbol];
    return priceChange || null;
  }, [livePriceChangesMap]);

  // Helper function to get live bid/ask data from WebSocket
  const getLiveBidAsk = useCallback((symbol) => {
    if (!symbol) return null;
    const upperSymbol = symbol.toUpperCase();
    const symbolWithUSDT = `${upperSymbol}USDT`;
    return bidAskData[symbolWithUSDT] || null;
  }, [bidAskData]);

  // Helper function to get live volume data from Binance WebSocket
  const getLiveVolume = useCallback((symbol) => {
    if (!symbol) return null;
    const upperSymbol = symbol.toUpperCase();
    const symbolWithUSDT = `${upperSymbol}USDT`;
    // First try to get live data from WebSocket
    const liveData = volumeData[symbolWithUSDT];
    if (liveData) return liveData;
    // Fallback to static data if WebSocket data not available
    return binanceVolumeData[upperSymbol] || null;
  }, [volumeData, binanceVolumeData]);

  // Function to format time based on timezone preference
  const formatTime = (dateStr, timeStr) => {
    try {
      let year, month, day;

      // Check if date format is YYYY-MM-DD
      if (dateStr.includes('-')) {
        [year, month, day] = dateStr.split('-');
      } else {
        // Assume DD/MM/YYYY format
        [day, month, year] = dateStr.split('/');
      }

      // Handle time format - extract only HH:mm even if seconds are present
      const timeParts = timeStr.split(':');
      const hours = timeParts[0];
      const minutes = timeParts[1];

      // Create UTC date string
      const dateTimeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00Z`;

      if (useLocalTime) {
        // Convert to local time and return format: "11:30 AM"
        const momentTime = moment.utc(dateTimeStr).tz(userTimezone);
        return momentTime.format('hh:mm A');
      } else {
        // Return UTC time in format: "06:00 AM UTC"
        const momentTime = moment.utc(dateTimeStr);
        return `${momentTime.format('hh:mm A')} `;
      }
    } catch (error) {
      // If conversion fails, return original time
      return timeStr;
    }
  };

  // Function to format date based on timezone preference
  const formatDate = (dateStr) => {
    try {
      let year, month, day;

      // Check if date format is YYYY-MM-DD
      if (dateStr.includes('-')) {
        [year, month, day] = dateStr.split('-');
      } else {
        // Assume DD/MM/YYYY format
        [day, month, year] = dateStr.split('/');
      }

      // Create date string
      const dateStrFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      if (useLocalTime) {
        // Convert to local time and return format: "DD-MM-YYYY"
        const momentDate = moment.utc(dateStrFormatted).tz(userTimezone);
        return momentDate.format('DD-MM-YYYY');
      } else {
        // Return UTC date in format: "DD-MM-YYYY"
        const momentDate = moment.utc(dateStrFormatted);
        return momentDate.format('DD-MM-YYYY');
      }
    } catch (error) {
      // If conversion fails, return original date
      return dateStr;
    }
  };

  // Sort handler function
  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      // If clicking the same column, toggle direction
      if (prevConfig.key === key) {
        return {
          key: key,
          direction: prevConfig.direction === 'desc' ? 'asc' : 'desc'
        };
      }
      // If clicking a new column, start with desc (recent first)
      return {
        key: key,
        direction: 'desc'
      };
    });
  };

  // Function to sort recommendations globally and reorder influencers
  const sortRecommendationsAndInfluencers = (influencers) => {
    if (!sortConfig.key) return { sortedInfluencers: influencers, groupedRecommendations: {} };

    // Create a flat list of all recommendations with influencer reference
    const allRecommendations = [];
    const influencerMap = {};

    influencers.forEach(influencer => {
      influencerMap[influencer.id] = influencer;
      const lastPostsData = selectedPlatform === "youtube" ? youtubeLastPosts : telegramLastPosts;
      const lastPostsForInfluencer = getInfluencerPosts(lastPostsData, influencer.id, selectedDateFilter);

      const recommendations = formatRecommendations(lastPostsForInfluencer, livePricesMap, binanceVolumeData);

      recommendations.forEach(rec => {
        allRecommendations.push({
          ...rec,
          influencerId: influencer.id
        });
      });
    });

    // Sort all recommendations
    const sortedRecommendations = [...allRecommendations].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'date' || sortConfig.key === 'time') {
        // Parse date - support both YYYY-MM-DD and DD/MM/YYYY formats
        const parseDateTime = (dateStr, timeStr) => {
          let year, month, day;

          // Check if date format is YYYY-MM-DD
          if (dateStr.includes('-')) {
            [year, month, day] = dateStr.split('-');
          } else {
            // Assume DD/MM/YYYY format
            [day, month, year] = dateStr.split('/');
          }

          const [hours, minutes] = timeStr.split(':');
          return new Date(year, month - 1, day, hours, minutes);
        };
        aValue = parseDateTime(a.date, a.time);
        bValue = parseDateTime(b.date, b.time);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    // Group sorted recommendations back by influencer
    const groupedRecommendations = {};
    sortedRecommendations.forEach(rec => {
      if (!groupedRecommendations[rec.influencerId]) {
        groupedRecommendations[rec.influencerId] = [];
      }
      groupedRecommendations[rec.influencerId].push(rec);
    });

    // Reorder influencers based on their first (earliest/latest) recommendation
    const influencerOrder = [];
    const seenInfluencers = new Set();

    sortedRecommendations.forEach(rec => {
      if (!seenInfluencers.has(rec.influencerId)) {
        seenInfluencers.add(rec.influencerId);
        influencerOrder.push(influencerMap[rec.influencerId]);
      }
    });

    // Add influencers with no recommendations at the end
    influencers.forEach(influencer => {
      if (!seenInfluencers.has(influencer.id)) {
        influencerOrder.push(influencer);
      }
    });

    return { sortedInfluencers: influencerOrder, groupedRecommendations };
  };

  // Memoized API call functions - using 3days-all-posts API
  const fetchYouTubeData = useCallback(async (page = 1, limit = 10) => {
    console.log('📡 fetchYouTubeData called with page:', page, 'limit:', limit);
    // Only show loading on first load
    if (isFirstRenderRef.current) {
      setLoading(true);
    }
    setError(null);
    try {
      // Fetch data from the 3days-all-posts API endpoint
      const apiUrl = `/api/youtube-data/3days-all-posts?page=${page}&limit=${limit}`;
      console.log('📡 Fetching YouTube data from:', apiUrl);
      const res = await fetch(apiUrl);
      const data = await res.json();

      // Extract ranking data
      if (data.success && Array.isArray(data.ranking)) {
        // Sort by rank (ascending: 1, 2, 3, ...)
        const sortedResults = [...data.ranking].sort((a, b) => {
          const rankA = a.rank || 999999;
          const rankB = b.rank || 999999;
          return rankA - rankB;
        });
        setYoutubeInfluencers(sortedResults);
      } else {
        setYoutubeInfluencers([]);
      }

      // Extract posts data and store with results key for compatibility
      if (data.success) {
        // Store posts in results key for getInfluencerPosts compatibility
        setYoutubeLastPosts({
          ...data,
          results: data.posts || []
        });

        // Update pagination state
        if (data.pagination) {
          console.log('📡 YouTube API returned pagination:', data.pagination);
          setThreeDaysAllPostsPagination(prev => ({
            ...prev,
            youtube: data.pagination
          }));
        }

        // Update date range
        if (data.date_range) {
          setThreeDaysDateRange(data.date_range);
        }
      }
    } catch (err) {
      setError("Failed to fetch YouTube data");
      setYoutubeInfluencers([]);
    } finally {
      if (isFirstRenderRef.current) {
        setLoading(false);
        setInitialLoad(false);
        isFirstRenderRef.current = false;
      }
    }
  }, []);

  const fetchTelegramData = useCallback(async (page = 1, limit = 10) => {
    console.log('📡 fetchTelegramData called with page:', page, 'limit:', limit);
    // Only show loading on first load
    if (isFirstRenderRef.current) {
      setLoading(true);
    }
    setError(null);
    try {
      // Fetch data from the 3days-all-posts API endpoint
      const apiUrl = `/api/telegram-data/3days-all-posts?page=${page}&limit=${limit}`;
      console.log('📡 Fetching Telegram data from:', apiUrl);
      const res = await fetch(apiUrl);
      const data = await res.json();

      // Extract ranking data
      if (data.success && Array.isArray(data.ranking)) {
        // Sort by rank (ascending: 1, 2, 3, ...)
        const sortedResults = [...data.ranking].sort((a, b) => {
          const rankA = a.rank || 999999;
          const rankB = b.rank || 999999;
          return rankA - rankB;
        });
        setTelegramInfluencers(sortedResults);
      } else {
        setTelegramInfluencers([]);
      }

      // Extract posts data and store with results key for compatibility
      if (data.success) {
        // Store posts in results key for getInfluencerPosts compatibility
        setTelegramLastPosts({
          ...data,
          results: data.posts || []
        });

        // Update pagination state
        if (data.pagination) {
          console.log('📡 Telegram API returned pagination:', data.pagination);
          setThreeDaysAllPostsPagination(prev => ({
            ...prev,
            telegram: data.pagination
          }));
        }

        // Update date range
        if (data.date_range) {
          setThreeDaysDateRange(data.date_range);
        }
      }
    } catch (err) {
      setError("Failed to fetch Telegram data");
      setTelegramInfluencers([]);
    } finally {
      if (isFirstRenderRef.current) {
        setLoading(false);
        setInitialLoad(false);
        isFirstRenderRef.current = false;
      }
    }
  }, []);

  // Handler for posts pagination
  const handlePostsPageChange = (newPage) => {
    const pagination = threeDaysAllPostsPagination[selectedPlatform];
    console.log('handlePostsPageChange called:', { newPage, pagination, selectedPlatform });

    // Validate page number
    if (!pagination || newPage < 1) {
      console.log('Invalid pagination or page number');
      return;
    }

    // Allow fetching if totalPages is valid, or if it's a reasonable page number
    if (pagination.totalPages > 0 && newPage > pagination.totalPages) {
      console.log('Page number exceeds total pages');
      return;
    }

    console.log('Fetching page:', newPage);
    if (selectedPlatform === "youtube") {
      fetchYouTubeData(newPage, pagination.limit || 10);
    } else {
      fetchTelegramData(newPage, pagination.limit || 10);
    }
  };

  useEffect(() => {
    // Fetch data when platform changes
    if (selectedPlatform === "youtube") {
      fetchYouTubeData(1, 10);
    } else if (selectedPlatform === "telegram") {
      fetchTelegramData(1, 10);
    }
  }, [selectedPlatform, fetchYouTubeData, fetchTelegramData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Reset current page when platform or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPlatform, selectedRating, selectedTimeframe, selectedYear, roiFilter, winRateFilter, totalCallsFilter]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const currentInfluencers = selectedPlatform === "youtube" ? youtubeInfluencers : telegramInfluencers;
      const searchTerm = searchQuery.toLowerCase().trim();

      const filtered = currentInfluencers.filter((influencer) => {
        if (selectedPlatform === "telegram") {
          // For Telegram, search by channel_id since influencer_name is often "N/A"
          const channelId = influencer.channel_id?.toLowerCase() || "";
          return channelId.includes(searchTerm);
        } else {
          // For YouTube, search by influencer_name
          const influencerName = influencer.influencer_name?.toLowerCase() || "";
          return influencerName.includes(searchTerm);
        }
      });

      // Sort results by rank (already sorted in the main data, but ensure it here too)
      const sortedResults = filtered.sort((a, b) => {
        const rankA = a.rank || 999999;
        const rankB = b.rank || 999999;
        return rankA - rankB;
      });

      setSearchResults(sortedResults.slice(0, 10)); // Limit to 10 results for performance
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, youtubeInfluencers, telegramInfluencers, selectedPlatform]);

  // Filter influencers by platform and sort alphabetically
  const getFilteredInfluencers = () => {
    let influencers;

    if (selectedPlatform === "youtube") {
      influencers = youtubeInfluencers.map((ch) => ({
        id: ch.channel_id,
        name: ch.influencer_name,
        platform: "YouTube",
        subs: ch.subs,
        score: ch.ai_overall_score || ch.score || 0,
        rank: ch.rank,
        channel_thumbnails: ch.channel_thumbnails,
        prob_weighted_returns: ch.prob_weighted_returns || 0,
        win_percentage: ch.win_percentage || 0,
        price_counts: ch.price_counts || 0,
        ai_overall_score: ch.ai_overall_score || 0,
        final_score: ch.final_score || 0,
        current_rating: ch.current_rating || 0,
        star_rating_yearly: ch.star_rating_yearly || {},
      }));
    } else if (selectedPlatform === "telegram") {
      influencers = telegramInfluencers.map((tg) => ({
        id: tg.channel_id || tg.id,
        name: tg.influencer_name && tg.influencer_name !== "N/A" ? tg.influencer_name : (tg.channel_id || "Unknown Channel"),
        platform: "Telegram",
        subs: tg.subscribers || tg.subs || 0,
        score: tg.ai_overall_score || tg.score || 0,
        rank: tg.rank,
        channel_thumbnails: tg.channel_thumbnails,
        prob_weighted_returns: tg.prob_weighted_returns || 0,
        win_percentage: tg.win_percentage || 0,
        price_counts: tg.price_counts || 0,
        ai_overall_score: tg.ai_overall_score || 0,
        final_score: tg.final_score || 0,
        current_rating: tg.current_rating || 0,
        star_rating_yearly: tg.star_rating_yearly || {},
      }));
    } else {
      influencers = [];
    }

    return influencers;
  };

  // Apply client-side filters
  const applyClientFilters = (influencers) => {
    return influencers.filter(influencer => {
      // ROI Filter
      if (roiFilter !== "all") {
        const roi = influencer.prob_weighted_returns;
        if (roiFilter === "above_0.8" && roi < 0.8) return false;
        if (roiFilter === "0.5_to_0.8" && (roi < 0.5 || roi >= 0.8)) return false;
        if (roiFilter === "below_0.5" && roi >= 0.5) return false;
      }

      // Win Rate Filter
      if (winRateFilter !== "all") {
        const winRate = influencer.win_percentage;
        if (winRateFilter === "above_70" && winRate < 70) return false;
        if (winRateFilter === "50_to_70" && (winRate < 50 || winRate >= 70)) return false;
        if (winRateFilter === "below_50" && winRate >= 50) return false;
      }

      // Total Calls Filter
      if (totalCallsFilter !== "all") {
        const calls = influencer.price_counts;
        if (totalCallsFilter === "above_1000" && calls < 1000) return false;
        if (totalCallsFilter === "500_to_1000" && (calls < 500 || calls >= 1000)) return false;
        if (totalCallsFilter === "below_500" && calls >= 500) return false;
      }

      return true;
    });
  };

  const filteredInfluencers = applyClientFilters(getFilteredInfluencers());


  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    if (currentPage !== 1) {
      handlePageChange(1);
    }
  };

  const handleLast = () => {
    if (currentPage !== totalPages) {
      handlePageChange(totalPages);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = Math.min(totalPages, currentPage + half);

    if (endPage - startPage < maxPagesToShow - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Filter options - Dynamic rating filter based on available data
  const allRatingOptions = [
    { value: "all", label: "All", stars: 0 },
    { value: "5", label: "5", stars: 5 },
    { value: "4", label: "4", stars: 4 },
    { value: "3", label: "3", stars: 3 },
    { value: "2", label: "2", stars: 2 },
    { value: "1", label: "1", stars: 1 },
  ];

  // Get current influencers based on platform
  const currentInfluencersForFilter = selectedPlatform === "youtube" ? youtubeInfluencers : telegramInfluencers;

  // Filter rating options to show only those with at least 1 influencer
  const ratingOptions = useMemo(() => {
    return allRatingOptions.filter(option => {
      if (option.value === "all") return true; // Always show "All"

      const ratingValue = parseInt(option.value);
      // Check if any influencer has current_rating equal to or greater than this rating
      return currentInfluencersForFilter.some(influencer =>
        Math.floor(influencer.current_rating || 0) >= ratingValue
      );
    });
  }, [currentInfluencersForFilter]);

  const timeframeOptions = getDynamicTimeframeOptions(selectedYear);

  const yearOptions = selectedPlatform === "telegram"
    ? getYearOptions(2024, false)
    : getYearOptions(2022);

  // Handle year change
  const handleYearChange = (year) => {
    setSelectedYear(year);
    const newTimeframeOptions = getDynamicTimeframeOptions(year);
    const isCurrentTimeframeValid = newTimeframeOptions.some(t => t.value === selectedTimeframe);
    if (!isCurrentTimeframeValid) {
      setSelectedTimeframe("30_days");
    }
  };

  // Limit to top 10 influencers only
  const top10Influencers = filteredInfluencers.slice(0, 10);
  const [selectedDateFilter, setSelectedDateFilter] = useState("latest");

  // Function to map selected date to day key (day1, day2, day3, etc.)
  const getDateToDayKey = (selectedDate) => {
    if (selectedDate === "latest") return null;

    // Parse the selected date (format: DD-MM-YYYY)
    const [day, month, year] = selectedDate.split('-').map(Number);

    // Create UTC date for the selected date
    const selectedDateTime = new Date(Date.UTC(year, month - 1, day));

    // Get current UTC date (today in UTC)
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    // Calculate the difference in days
    const diffTime = todayUTC - selectedDateTime;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Map to day key: today UTC = day1, yesterday UTC = day2, etc.
    if (diffDays <= 0) return "day1";
    return `day${diffDays + 1}`;
  };

  // Function to extract posts for an influencer from the API response structure
  const getInfluencerPosts = (lastPostsData, channelId, selectedDateFilter) => {
    if (!lastPostsData) return [];

    const dayKey = getDateToDayKey(selectedDateFilter);
    const posts = [];

    if (dayKey === null) {
      // "Latest Posts" - use results array directly from API response, group coins by post
      if (lastPostsData.results && Array.isArray(lastPostsData.results)) {
        lastPostsData.results.forEach(item => {
          if (item.channelID === channelId && item.mentioned && Array.isArray(item.mentioned)) {
            // Group all coins for this post
            posts.push({
              date: item.date,
              time: item.time,
              coins: item.mentioned, // Array of coin objects
              videoID: item.videoID,
              messageID: item.messageID,
              link: item.link,
              publishedAt: item.publishedAt,
              title: item.title,
              summary: item.summary,
              type: item.type,
              channel_name: item.channel_name,
              roi_1hr: item["1_hour_roi"],
              roi_24hr: item["24_hours_roi"],
              isGrouped: true // Flag to indicate this is a grouped post
            });
          }
        });
      }

      // Sort posts in descending order (most recent first) by publishedAt or date/time
      posts.sort((a, b) => {
        const getTimestamp = (post) => {
          // Try publishedAt first
          if (post.publishedAt) {
            const timestamp = new Date(post.publishedAt).getTime();
            if (!isNaN(timestamp)) return timestamp;
          }

          // Fallback: parse date and time
          if (post.date && post.time) {
            try {
              // Parse date (format: YYYY-MM-DD or DD-MM-YYYY)
              let year, month, day;
              const dateParts = post.date.split('-');
              if (dateParts[0].length === 4) {
                [year, month, day] = dateParts.map(Number);
              } else {
                [day, month, year] = dateParts.map(Number);
              }

              // Parse time - handle 24-hour format
              const timeParts = post.time.split(':');
              let hours = parseInt(timeParts[0]);
              let minutes = parseInt(timeParts[1]);
              const seconds = timeParts[2] ? parseInt(timeParts[2]) : 0;

              const timestamp = new Date(year, month - 1, day, hours, minutes, seconds).getTime();

              return timestamp;
            } catch (e) {
              console.error('Error parsing time:', post.time, e);
              return 0;
            }
          }
          return 0;
        };

        return getTimestamp(b) - getTimestamp(a);
      });
    } else {
      // Specific day selected - group coins by post
      const dayData = lastPostsData[dayKey];
      if (Array.isArray(dayData)) {
        dayData.forEach(channelEntry => {
          if (channelEntry.channelID === channelId && channelEntry.data !== "No Posts" && Array.isArray(channelEntry.data)) {
            channelEntry.data.forEach(item => {
              if (item.mentioned && Array.isArray(item.mentioned)) {
                // Group all coins for this post
                posts.push({
                  date: item.date,
                  time: item.time,
                  coins: item.mentioned, // Array of coin objects
                  videoID: item.videoID,
                  messageID: item.messageID,
                  link: item.link,
                  publishedAt: item.publishedAt,
                  title: item.title,
                  summary: item.summary,
                  type: item.type,
                  channel_name: item.channel_name,
                  roi_1hr: item["1_hour_roi"],
                  roi_24hr: item["24_hours_roi"],
                  isGrouped: true // Flag to indicate this is a grouped post
                });
              }
            });
          }
        });
      }

      // Sort posts in descending order (most recent first) by publishedAt or date/time
      posts.sort((a, b) => {
        const getTimestamp = (post) => {
          // Try publishedAt first
          if (post.publishedAt) {
            const timestamp = new Date(post.publishedAt).getTime();
            if (!isNaN(timestamp)) return timestamp;
          }

          // Fallback: parse date and time
          if (post.date && post.time) {
            try {
              // Parse date (format: YYYY-MM-DD or DD-MM-YYYY)
              let year, month, day;
              const dateParts = post.date.split('-');
              if (dateParts[0].length === 4) {
                [year, month, day] = dateParts.map(Number);
              } else {
                [day, month, year] = dateParts.map(Number);
              }

              // Parse time - handle 24-hour format
              const timeParts = post.time.split(':');
              let hours = parseInt(timeParts[0]);
              let minutes = parseInt(timeParts[1]);
              const seconds = timeParts[2] ? parseInt(timeParts[2]) : 0;

              const timestamp = new Date(year, month - 1, day, hours, minutes, seconds).getTime();

              return timestamp;
            } catch (e) {
              console.error('Error parsing time:', post.time, e);
              return 0;
            }
          }
          return 0;
        };

        return getTimestamp(b) - getTimestamp(a);
      });
    }

    return posts;
  };

  // Function to get all posts as a flat list (not grouped by influencer)
  const getAllPostsFlat = useCallback((lastPostsData, influencersList) => {
    if (!lastPostsData || !lastPostsData.results) return [];

    // Create a map of influencer data by channelID
    const influencerMap = {};
    if (influencersList && influencersList.length > 0) {
      influencersList.forEach(inf => {
        // Try multiple possible ID field names (channel_id, id, channelID)
        const infId = inf.channel_id || inf.id || inf.channelID;
        if (inf && infId) {
          influencerMap[infId] = inf;
        }
      });
    }

    // Also check if lastPostsData has ranking info embedded
    if (lastPostsData.ranking && Array.isArray(lastPostsData.ranking)) {
      lastPostsData.ranking.forEach(inf => {
        // Try multiple possible ID field names
        const infId = inf.channel_id || inf.id || inf.channelID;
        if (inf && infId && !influencerMap[infId]) {
          influencerMap[infId] = inf;
        }
      });
    }

    // Get all posts directly from API results
    const allPosts = lastPostsData.results
      .filter(item => item.mentioned && Array.isArray(item.mentioned))
      .map(item => {
        const influencer = influencerMap[item.channelID];

        // Build influencer object - use found influencer or create from post data
        const influencerData = influencer ? {
          ...influencer
        } : {
          channel_id: item.channelID,
          influencer_name: item.channel_name,
          // Try to get thumbnail from post's influencer_data if available
          channel_thumbnails: item.influencer_thumbnails || item.channel_thumbnails || null,
          star_rating_yearly: item.star_rating_yearly || {}
        };

        return {
          // Post data
          date: item.date,
          time: item.time,
          coins: item.mentioned,
          videoID: item.videoID,
          messageID: item.messageID,
          link: item.link,
          publishedAt: item.publishedAt,
          title: item.title,
          summary: item.summary,
          type: item.type,
          channel_name: item.channel_name,
          channelID: item.channelID,
          roi_1hr: item["1_hour_roi"],
          roi_24hr: item["24_hours_roi"],
          isGrouped: true,
          // Influencer data attached to each post
          influencer: influencerData
        };
      });

    // Sort by publishedAt descending (most recent first)
    allPosts.sort((a, b) => {
      const getTimestamp = (post) => {
        if (post.publishedAt) {
          const timestamp = new Date(post.publishedAt).getTime();
          if (!isNaN(timestamp)) return timestamp;
        }
        if (post.date && post.time) {
          try {
            let year, month, day;
            const dateParts = post.date.split('-');
            if (dateParts[0].length === 4) {
              [year, month, day] = dateParts.map(Number);
            } else {
              [day, month, year] = dateParts.map(Number);
            }
            const timeParts = post.time.split(':');
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            const seconds = timeParts[2] ? parseInt(timeParts[2]) : 0;
            return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
          } catch (e) {
            return 0;
          }
        }
        return 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });

    return allPosts;
  }, []);

  // Get flat list of all posts with price availability hierarchy sorting
  const allPostsFlat = useMemo(() => {
    const lastPostsData = selectedPlatform === "youtube" ? youtubeLastPosts : telegramLastPosts;
    const influencersList = selectedPlatform === "youtube" ? youtubeInfluencers : telegramInfluencers;
    const posts = getAllPostsFlat(lastPostsData, influencersList);

    // Helper function to get price availability priority for a post
    // Returns: 1 = Live price, 2 = Last available price, 3 = N/A
    const getPriceAvailabilityPriority = (post) => {
      if (!post.coins || post.coins.length === 0) return 3;

      // Check the first coin's price availability (or any coin with best price)
      let bestPriority = 3; // Default to N/A

      for (const coin of post.coins) {
        const symbol = coin.symbol?.toUpperCase();
        if (!symbol) continue;

        // Check if live price is available from WebSocket
        const livePrice = livePricesMap[symbol];
        if (livePrice && livePrice !== "-" && livePrice !== "N/A") {
          return 1; // Best priority - live price available
        }

        // Check if lastAvailablePrice exists from MCM DB
        if (coin.binance?.last_available_price || coin.lastAvailablePrice) {
          bestPriority = Math.min(bestPriority, 2); // Last available price
        }
      }

      return bestPriority;
    };

    // Sort posts by price availability priority, then by publishedAt (most recent first)
    return posts.sort((a, b) => {
      const priorityA = getPriceAvailabilityPriority(a);
      const priorityB = getPriceAvailabilityPriority(b);

      // First, sort by price availability (1 = live, 2 = last available, 3 = N/A)
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Then, sort by publishedAt descending (most recent first) within same priority
      const getTimestamp = (post) => {
        if (post.publishedAt) {
          const timestamp = new Date(post.publishedAt).getTime();
          if (!isNaN(timestamp)) return timestamp;
        }
        return 0;
      };

      return getTimestamp(b) - getTimestamp(a);
    });
  }, [selectedPlatform, youtubeLastPosts, telegramLastPosts, youtubeInfluencers, telegramInfluencers, getAllPostsFlat, livePricesMap]);

  // Apply global sorting to recommendations and reorder influencers if sorting is active
  const sortedData = useMemo(() => {
    return sortRecommendationsAndInfluencers(top10Influencers);
  }, [top10Influencers, sortConfig, youtubeLastPosts, telegramLastPosts, selectedPlatform, livePricesMap, binanceVolumeData, selectedDateFilter]);

  // Use sorted influencers if sorting is active, otherwise use original order
  let displayInfluencers = sortConfig.key ? sortedData.sortedInfluencers : top10Influencers;
  const globalSortedRecommendations = sortedData.groupedRecommendations;

  // Sort influencers by most recent post date/time (applies to all view modes)
  displayInfluencers = [...displayInfluencers].sort((a, b) => {
    const lastPostsData = selectedPlatform === "youtube" ? youtubeLastPosts : telegramLastPosts;
    const postsA = getInfluencerPosts(lastPostsData, a.id, selectedDateFilter);
    const postsB = getInfluencerPosts(lastPostsData, b.id, selectedDateFilter);

    if (postsA.length === 0 && postsB.length === 0) return 0;
    if (postsA.length === 0) return 1;
    if (postsB.length === 0) return -1;

    // Find the most recent publishedAt from each influencer's posts
    const getMostRecentPublishedAt = (posts) => {
      if (!posts || posts.length === 0) return null;

      // Find the most recent publishedAt date
      let mostRecentDate = null;
      posts.forEach(post => {
        if (post.publishedAt) {
          const postDate = new Date(post.publishedAt);
          if (!mostRecentDate || postDate > mostRecentDate) {
            mostRecentDate = postDate;
          }
        }
      });

      return mostRecentDate;
    };

    const dateA = getMostRecentPublishedAt(postsA);
    const dateB = getMostRecentPublishedAt(postsB);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return dateB - dateA; // Most recent first (descending order)
  });

  // Pagination for individual posts (not grouped by influencer)
  const totalPages = Math.ceil(allPostsFlat.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPosts = allPostsFlat.slice(startIndex, endIndex);
  // Keep paginatedInfluencers for backwards compatibility if needed elsewhere
  const paginatedInfluencers = displayInfluencers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 text-gray-900 font-sans overflow-x-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <main className="mx-auto px-4 pb-8 overflow-x-hidden relative z-10">
        <div className="min-w-0">
          {/* Leaderboard Section */}
          <div className="bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-3xl shadow-2xl shadow-indigo-500/10 border-2 border-white/40">
            {/* Header with left-aligned title */}
            <div className="flex flex-col items-start px-4 py-4 border-b border-indigo-200/30 bg-gradient-to-r from-cyan-50/50 to-fuchsia-50/50 backdrop-blur-sm">
              <h2 className="text-4xl md:text-5xl font-bold flex items-center gap-3 drop-shadow-sm">
                <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Last 3 Days Posts
                </span>
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full mt-3 shadow-lg shadow-indigo-500/50"></div>
            </div>


            <div>
              <table className="w-full relative">
                <thead>
                  {/* Main header row */}
                  <tr className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 border-b border-white/20">
                    <th className="px-1 py-1 text-center text-[10px] font-bold text-white tracking-wider border-r border-white/20 w-36">
                      Influencer
                    </th>
                    <th className="px-1 py-1 text-center text-[10px] font-bold text-white tracking-wider border-r border-white/20 w-36">
                      MCM Rating{" "}
                      <span className="relative group cursor-pointer z-[9999]">
                        <span className="text-cyan-200 text-sm">ⓘ</span>
                        <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl text-left w-52 z-[9999] border border-cyan-400/30">
                          Timeframes represent how an influencer’s calls performed over different periods.<br />
                          We check the price when the call was made,<br />
                          compare it after each timeframe,<br />
                          and use those outcomes to rank influencers based on overall performance.
                        </span>
                      </span>
                    </th>
                    {/* <th className="px-1 py-1 text-center text-[10px] font-medium text-black-900 uppercase tracking-wider border-r border-white/20 w-36">
                      Date
                    </th> */}
                    <th className="px-1 py-1 text-[10px] font-bold text-white tracking-wider relative">
                      <div className="flex items-center justify-between w-full">
                        {/* Timezone Switch on Left */}
                        <div className="flex items-center gap-2">
                          {!useLocalTime && (
                            <span className="text-[9px] font-medium text-white">
                              UTC
                            </span>
                          )}
                          <button
                            onClick={() => toggleTimezone()}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 ${useLocalTime ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500' : 'bg-white/30'
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
                            <span className="text-[9px] font-medium text-white">
                              {userCity || 'Local'}
                            </span>
                          )}
                        </div>
                        {/* Info centered */}
                        <div className="flex items-center justify-center gap-1 flex-1">
                          <span className="font-bold text-white">Info</span>
                        </div>
                        {/* Empty space for balance */}
                        <div className="w-16"></div>
                      </div>
                    </th>
                  </tr>
                  {/* Sub-header row with Filters and Recommendations columns */}
                  <tr className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 border-b-2 border-white/20">
                    {/* Influencer Filter */}
                    <th className="px-1 py-0.5 border-r border-white/20">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setSelectedPlatform("youtube")}
                          className={`flex items-center justify-center px-3 py-1 rounded-full transition-all duration-200 ${selectedPlatform === "youtube"
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30"
                            : "bg-white/80 text-gray-600 hover:bg-white border border-indigo-200/50"
                            }`}
                          title="YouTube"
                        >
                          <FaYoutube className="text-lg" />
                        </button>
                        <button
                          onClick={() => setSelectedPlatform("telegram")}
                          className={`flex items-center justify-center px-3 py-1 rounded-full transition-all duration-200 ${selectedPlatform === "telegram"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                            : "bg-white/80 text-gray-600 hover:bg-white border border-indigo-200/50"
                            }`}
                          title="Telegram"
                        >
                          <FaTelegram className="text-lg" />
                        </button>
                      </div>
                    </th>
                    {/* Timeframe Filter */}
                    <th className="px-1 py-0.5 border-r border-white/20">
                      {/* <div className="flex justify-center">
                        <select
                          value={selectedTimeframe}
                          onChange={(e) => setSelectedTimeframe(e.target.value)}
                          className="w-full border border-indigo-200 bg-indigo-50 rounded-full px-2 py-0.5 text-[10px] font-medium text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                        >
                          {timeframeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div> */}
                    </th>
                    {/* Date and Time Column with Timezone Toggle */}
                    {/* <th className="px-1 py-0.5 border-r border-white/20">
                      <div className="flex justify-center">
                        <select
                          value={selectedDateFilter}
                          onChange={(e) => setSelectedDateFilter(e.target.value)}
                          className="w-full max-w-[130px] border border-gray-300 bg-gray-50 rounded-full px-2 py-0.5 text-[9px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer transition-all"
                        >
                          <option value="latest">Latest Posts</option>
                          {Array.from({ length: 7 }).map((_, i) => {
                            // Start from current UTC date and go back 7 days
                            const date = new Date();
                            date.setUTCDate(date.getUTCDate() - i);
                            const day = String(date.getUTCDate()).padStart(2, "0");
                            const month = String(date.getUTCMonth() + 1).padStart(2, "0");
                            const year = date.getUTCFullYear();
                            const formatted = `${day}-${month}-${year}`;
                            return (
                              <option key={formatted} value={formatted}>
                                {formatted}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </th> */}


                    <th className="px-0.5 py-0.5">
                      <div className="flex items-center justify-start gap-1 px-0.5 w-full">
                        <div className="w-[10%] text-[10px] font-bold text-white text-center flex flex-col  gap-1">
                          Date & Time
                        </div>
                        <div className="w-[6%] text-[10px] font-bold text-white text-left">
                          Coin&apos;s
                        </div>
                        <div className="w-[8%] text-[10px] font-bold text-white text-left">
                          <div className="flex flex-col items-start gap-0.5">
                            <span>Sentiment</span>
                            <div className="flex items-center justify-start gap-1">
                              <span>ST/LT</span>
                              <span className="relative group cursor-pointer z-[9999]">
                                <span className="text-cyan-200 text-sm">ⓘ</span>
                                <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[9999] border border-cyan-400/30">
                                  ST : Short Term<br />LT : Long Term
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-[10%] text-[10px] font-bold text-white text-left">
                          <div className="flex flex-col items-start">
                            <span>Base</span>
                            <div className="flex items-center gap-1">
                              <span>Price</span>
                              <span className="relative group cursor-pointer z-[9999]">
                                <span className="text-cyan-200 text-sm">ⓘ</span>
                                <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[9999] border border-cyan-400/30">
                                  Price at the time when post was published
                                </span>
                              </span>
                            </div>

                          </div>
                        </div>
                        {/* <div className="w-[10%] text-[10px] font-bold text-black-900 text-left">
                          <span>
                            Publish Date<br />% Change
                          </span>
                          <span className="relative group cursor-pointer z-[9999] ml-1">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              N/A : Not Available
                            </span>
                          </span>
                        </div> */}
                        <div className="w-[10%] text-[10px] font-bold text-white text-left">
                          <div className="flex flex-col items-start">

                            {/* Title */}
                            <span>Current</span>

                            {/* Price + Info Icon on the right */}
                            <div className="flex items-center gap-1">

                              {/* Price */}
                              <span className="text-[10px] font-bold text-white">
                                Price
                              </span>

                              {/* Info Icon */}
                              <span className="relative group cursor-pointer z-[9999]">
                                <span className="text-cyan-200 text-sm">ⓘ</span>

                                <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[9999] border border-cyan-400/30">
                                  Source: Binance & CoinGeko<br />
                                  N/A : Not Available
                                </span>
                              </span>

                            </div>

                          </div>
                        </div>

                        <div className="w-[10%] text-[10px] font-bold text-white text-left">
                          <div className="flex flex-col items-start">

                            {/* Title */}
                            <span>% Price</span>

                            {/* Price + Info Icon on the right */}
                            <div className="flex items-center gap-1">

                              {/* Price (same size as 24 Hours) */}
                              <span className="text-[10px] font-bold text-white">
                                Change
                              </span>

                              {/* Info Icon + Tooltip */}
                              <span className="relative group cursor-pointer z-[9999]">
                                <span className="text-cyan-200 text-sm">ⓘ</span>

                                <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900 to-indigo-900 text-white text-xs p-2 rounded-lg shadow-2xl whitespace-nowrap z-[9999] border border-cyan-400/30">
                                  % Price Change from Base Price <br />
                                  N/A : Not Available
                                </span>
                              </span>

                            </div>

                          </div>
                        </div>


                        <div className="flex flex-col items-center w-[50%] text-white text-center leading-tight">
                          {/* Row with text + AI badge */}
                          <div className="flex items-center">
                            <span className="text-[10px] font-bold mr-1">
                              Consolidated Analysis of All Posts
                            </span>
                            {/* AI Badge */}
                            <div className="text-[10px] rounded-2xl font-bold tracking-wide bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                              Ai
                            </div>
                          </div>
                          {/* Subtitle */}
                          <span className="text-[8px] font-normal text-white/90 mt-[1px]">
                            Click to View Post
                          </span>

                        </div>

                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gradient-to-br from-white/80 via-indigo-50/40 to-fuchsia-50/40 backdrop-blur-sm divide-y divide-indigo-200/30 relative" style={{ isolation: 'isolate' }}>
                  {initialLoad || (selectedPlatform === "youtube" && youtubeInfluencers.length === 0) || (selectedPlatform === "telegram" && telegramInfluencers.length === 0) ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={`skeleton-row-${i}`}>
                        {/* Influencer column skeleton */}
                        <td className="px-1 py-2 whitespace-nowrap border-r border-indigo-200/30">
                          <div className="flex items-center mb-1">
                            <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div className="ml-10 h-12 bg-gray-200 rounded w-40"></div>
                        </td>
                        {/* MCM Ranking column skeleton */}
                        <td className="px-1 py-2 whitespace-nowrap border-r border-indigo-200/30">
                          <div className="h-32 bg-gray-200 rounded w-full"></div>
                        </td>
                        {/* Date column skeleton */}
                        <td className="px-1 py-2 whitespace-nowrap border-r border-indigo-200/30">
                          <div className="h-12 bg-gray-200 rounded w-full"></div>
                        </td>
                        {/* Recommendations skeleton */}
                        <td className="px-1 py-2 whitespace-nowrap">
                          <div className="h-48 bg-gray-200 rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : !loading && allPostsFlat.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-lg font-semibold text-gray-600 mb-2">No posts found</p>
                          <p className="text-sm text-gray-500">No posts available. Try adjusting your filter criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {/* Paginated individual posts */}
                      {paginatedPosts.map((post, index) => {
                        const globalRank = startIndex + index + 1;

                        // Get influencer from the post
                        const influencer = post.influencer;

                        // Get star ratings from influencer's star_rating_yearly (from main API)
                        const starRatingYearly = influencer?.star_rating_yearly || {};

                        // Define timeframes to display vertically
                        const timeframes = ['7_days', '30_days', '90_days', '1_year'];
                        const timeframeLabels = { '7_days': '7D', '30_days': '30D', '90_days': '90D', '1_year': '1Y' };

                        // Build star data for 2024 and 2025 with timeframes
                        const starData2024 = [];
                        const starData2025 = [];

                        timeframes.forEach(tf => {
                          // 2024 data
                          if (starRatingYearly['2024'] && starRatingYearly['2024'][tf]) {
                            starData2024.push({
                              timeframe: tf,
                              label: timeframeLabels[tf],
                              rating: starRatingYearly['2024'][tf].current_rating || 0,
                              finalScore: starRatingYearly['2024'][tf].current_final_score || 0
                            });
                          } else {
                            starData2024.push({ timeframe: tf, label: timeframeLabels[tf], rating: 0, finalScore: 0 });
                          }

                          // 2025 data
                          if (starRatingYearly['2025'] && starRatingYearly['2025'][tf]) {
                            starData2025.push({
                              timeframe: tf,
                              label: timeframeLabels[tf],
                              rating: starRatingYearly['2025'][tf].current_rating || 0,
                              finalScore: starRatingYearly['2025'][tf].current_final_score || 0
                            });
                          } else {
                            starData2025.push({ timeframe: tf, label: timeframeLabels[tf], rating: 0, finalScore: 0 });
                          }
                        });

                        // Format the single post as a recommendation for display
                        const recommendations = formatRecommendations([post], livePricesMap, binanceVolumeData);

                        return (
                          <motion.tr
                            key={`${post.channelID}-${post.videoID || post.messageID}-${index}`}
                            layout
                            layoutId={`post-${post.channelID}-${post.videoID || post.messageID}-${index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{
                              layout: {
                                type: "spring",
                                stiffness: 100,
                                damping: 18,
                                mass: 1.5
                              },
                              opacity: { duration: 0.5 },
                              x: { duration: 0.5 }
                            }}
                            className="group hover:bg-gradient-to-r hover:from-indigo-50/60 hover:via-purple-50/50 hover:to-fuchsia-50/60 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200/50 hover:scale-[1.01] hover:z-10"
                            style={{ position: 'relative', zIndex: 1 }}
                          >
                            {/* Influencer Column */}
                            <td className="px-1 py-1 border-r border-indigo-200/30 group-hover:bg-white/50 transition-all duration-300">
                              <Link
                                href={
                                  selectedPlatform === "youtube"
                                    ? `/influencers/${influencer?.channel_id || influencer?.id || post.channelID}`
                                    : `/telegram-influencer/${influencer?.channel_id || influencer?.id || post.channelID}`
                                }
                                className="block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  {/* Profile Image */}
                                  <div className="flex-shrink-0 relative">
                                    {influencer?.channel_thumbnails?.high?.url ? (
                                      <Image
                                        src={influencer.channel_thumbnails.high.url}
                                        alt={influencer?.influencer_name || influencer?.name || post.channel_name || "Influencer"}
                                        width={48}
                                        height={48}
                                        className="w-11 h-11 rounded-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}

                                    {/* Name Initial Fallback */}
                                    <div
                                      className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center flex"
                                      style={{ display: influencer?.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
                                    >
                                      <span className="text-white text-base font-bold">
                                        {(influencer?.influencer_name || influencer?.name || post.channel_name)?.[0]?.toUpperCase() || "?"}
                                      </span>
                                    </div>

                                    {/* Platform Badge at bottom-right */}
                                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                                      style={{
                                        backgroundColor: selectedPlatform === "youtube" ? "#FF0000" : "#0088cc",
                                        border: "2px solid white"
                                      }}>
                                      {selectedPlatform === "youtube" ? (
                                        <FaYoutube className="text-white text-[10px]" />
                                      ) : (
                                        <FaTelegram className="text-white text-[10px]" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Name Below Image */}
                                  <div className="text-center">
                                    <span className="text-xs font-semibold text-black-500">
                                      {(influencer?.influencer_name || influencer?.name || post.channel_name)?.replace(/_/g, " ") || "Unknown"}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </td>

                            {/* MCM Ranking Column - Vertical Star Ratings for 2024 & 2025 */}
                            <td className="px-2 py-1 border-r border-indigo-200/30">
                              <div className="flex justify-start items-start gap-4">
                                {/* 2024 Column */}
                                <div className="flex flex-col items-center">
                                  <span className="text-[9px] font-bold text-gray-700 mb-1">2024</span>
                                  <div className="flex flex-col gap-0.5">
                                    {starData2024.map((item, idx) => {
                                      const fullStars = Math.floor(item.rating);
                                      const hasHalfStar = item.rating % 1 >= 0.5;
                                      const totalStars = 5;
                                      const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-1"
                                          title={`2024 ${item.label}: ${item.rating} stars`}
                                        >
                                          <span className="text-[7px] font-medium text-gray-500 w-5">{item.label}</span>
                                          <div className="flex gap-0">
                                            {[...Array(fullStars)].map((_, i) => (
                                              <FaStar key={`full-${i}`} className="text-yellow-500 w-2 h-2" />
                                            ))}
                                            {hasHalfStar && (
                                              <FaStarHalfAlt key="half" className="text-yellow-500 w-2 h-2" />
                                            )}
                                            {[...Array(emptyStars)].map((_, i) => (
                                              <FaStar key={`empty-${i}`} className="text-gray-300 w-2 h-2" />
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* 2025 Column */}
                                <div className="flex flex-col items-center">
                                  <span className="text-[9px] font-bold text-gray-700 mb-1">2025</span>
                                  <div className="flex flex-col gap-0.5">
                                    {starData2025.map((item, idx) => {
                                      const fullStars = Math.floor(item.rating);
                                      const hasHalfStar = item.rating % 1 >= 0.5;
                                      const totalStars = 5;
                                      const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-1"
                                          title={`2025 ${item.label}: ${item.rating} stars`}
                                        >
                                          <span className="text-[7px] font-medium text-gray-500 w-5">{item.label}</span>
                                          <div className="flex gap-0">
                                            {[...Array(fullStars)].map((_, i) => (
                                              <FaStar key={`full-${i}`} className="text-yellow-500 w-2 h-2" />
                                            ))}
                                            {hasHalfStar && (
                                              <FaStarHalfAlt key="half" className="text-yellow-500 w-2 h-2" />
                                            )}
                                            {[...Array(emptyStars)].map((_, i) => (
                                              <FaStar key={`empty-${i}`} className="text-gray-300 w-2 h-2" />
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Date and Time Column */}
                            {/* <td className="px-1 py-1 border-r border-indigo-200/30 group-hover:bg-white/50 transition-all duration-300">
                              <div className="flex flex-col items-center gap-1">
                                {recommendations.length > 0 ? (
                                  <>
                                    <span className="text-[8px] font-semibold text-black-900">
                                      {formatDate(recommendations[0].date)}
                                    </span>
                                    <span className="text-[8px] font-semibold text-black-900">
                                      {formatTime(recommendations[0].date, recommendations[0].time)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[8px] text-gray-400">No data</span>
                                )}
                              </div>
                            </td> */}

                            {/* Recommendations Column */}
                            <td className="px-0.5 py-0 align-top">
                              <div className="flex flex-col gap-0">
                                {/* Display recommendations - single post per row */}
                                {(() => {
                                  // Use post-specific key for this individual post
                                  const postUniqueKey = `${post.channelID}-${post.videoID || post.messageID}-${index}`;

                                  // Check if recommendations contain grouped posts (date filter applied)
                                  const hasGroupedPosts = recommendations.some(rec => rec.isGrouped);

                                  // For individual posts view, show all coins in the single post
                                  const displayedRecommendations = recommendations;

                                  // Check if there are no posts for the selected date
                                  if (displayedRecommendations.length === 0) {
                                    return (
                                      <div className="flex items-center justify-center py-4 text-gray-500">
                                        <span className="text-[10px] font-medium">
                                          {selectedPlatform === "youtube" ? "No videos posted on this date" : "No messages posted on this date"}
                                        </span>
                                      </div>
                                    );
                                  }

                                  return displayedRecommendations.map((rec, idx) => {
                                    // Handle grouped posts (when specific date is selected)
                                    // Display them exactly like Latest Posts - individual rows for each coin
                                    if (rec.isGrouped && rec.coins) {
                                      // Get the post key for tracking expansion
                                      const postKey = `${postUniqueKey}-grouped-${idx}`;
                                      const visibleCoinsCount = expandedPosts[postKey] || 3;

                                      // Sort coins by price availability: 1) Live price, 2) Last available, 3) N/A
                                      const sortedCoins = [...rec.coins].sort((coinA, coinB) => {
                                        const getCoinPricePriority = (coinData) => {
                                          const symbol = coinData.coin?.toUpperCase() || coinData.symbol?.toUpperCase();
                                          if (!symbol) return 3;

                                          // Check live price from WebSocket
                                          const livePrice = livePricesMap[symbol];
                                          if (livePrice && livePrice !== "-" && livePrice !== "N/A") {
                                            return 1; // Live price available
                                          }

                                          // Check lastAvailablePrice from MCM DB
                                          if (coinData.lastAvailablePrice) {
                                            return 2; // Last available price
                                          }

                                          return 3; // N/A
                                        };

                                        return getCoinPricePriority(coinA) - getCoinPricePriority(coinB);
                                      });

                                      const totalCoins = sortedCoins.length;
                                      const hasMoreCoins = totalCoins > visibleCoinsCount;
                                      const showingAllCoins = visibleCoinsCount >= totalCoins;

                                      // Get visible coins from sorted list
                                      const visibleCoins = sortedCoins.slice(0, visibleCoinsCount);

                                      // Single expansion key for the entire grouped post (not per coin)
                                      const groupedPostKey = `${postUniqueKey}-grouped-${idx}`;
                                      const hasExpandedSummary = expandedTitles[groupedPostKey] || false;

                                      // Flatten coins into individual rows, same as Latest Posts
                                      const coinRows = visibleCoins.map((coinData, coinIdx) => {
                                        const isSummaryExpanded = hasExpandedSummary;
                                        // Use summary for YouTube and Telegram, title for others
                                        const contentText = (rec.type === 'youtube' || rec.type === 'telegram') ? (rec.summary || '') : (rec.title || '');
                                        // Dynamic word limit based on number of coins
                                        const wordLimit = visibleCoins.length === 1 ? 25 : visibleCoins.length === 2 ? 45 : visibleCoins.length === 3 ? 75 : 85;
                                        const showReadMore = contentText.split(' ').length > wordLimit;
                                        const isFirstCoin = coinIdx === 0;
                                        const isLastVisibleCoin = coinIdx === visibleCoins.length - 1;

                                        return (
                                          <div key={`${idx}-${coinIdx}`} className={`flex justify-start gap-1 px-0.5 py-2 border-b border-gray-100 last:border-b-0 w-full items-center`} style={{ position: 'relative', minHeight: 'auto' }}>
                                            {/* Date and Time - only show for first coin with merged cell effect */}
                                            {isFirstCoin ? (
                                              <div
                                                className="flex flex-col items-center justify-center gap-1 w-[10%] px-1 border-r border-indigo-200/30 bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 group-hover:bg-indigo-50/40"
                                                style={{
                                                  position: 'absolute',
                                                  left: 0,
                                                  top: 0,
                                                  height: `${visibleCoins.length * 100}%`,
                                                  zIndex: 1
                                                }}
                                              >
                                                {rec.date && rec.time ? (
                                                  <>
                                                    <span className="text-[8px] font-semibold text-black-900 text-center">
                                                      {formatDate(rec.date)}
                                                    </span>
                                                    <span className="text-[8px] font-semibold text-black-900 text-center">
                                                      {formatTime(rec.date, rec.time)}
                                                    </span>
                                                  </>
                                                ) : (
                                                  <span className="text-[8px] text-gray-400">No data</span>
                                                )}
                                              </div>
                                            ) : null}
                                            {/* Spacer for date column */}
                                            <div className="w-[10%]" />

                                            {/* Coin Icon and Name */}
                                            <div
                                              className="flex items-center justify-start gap-0.5 w-[6%] pl-2 cursor-pointer hover:opacity-80 transition-opacity"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (coinData.mcm_source_id) {
                                                  router.push(`/coins-list/${coinData.mcm_source_id}`);
                                                }
                                              }}
                                            >
                                              <div className="flex items-center justify-center w-3">
                                                {coinData.icon}
                                              </div>
                                              <span className="text-[9px] font-bold text-gray-900">
                                                {coinData.coin}
                                              </span>
                                            </div>
                                            {/* Sentiment Badge (Pill with Bullish/Bearish ST/LT) */}
                                            <div className="w-[8%] flex justify-start">
                                              <div
                                                className={`px-2 py-1 rounded-full flex items-center gap-1 text-[7px] font-semibold ${coinData.type === "bullish"
                                                  ? "bg-green-100 text-green-700"
                                                  : "bg-red-100 text-red-700"
                                                  }`}
                                              >
                                                {/* Bullish/Bearish ST/LT in single line */}
                                                <span className="whitespace-nowrap">
                                                  {coinData.type === "bullish" ? "Bullish" : "Bearish"}{" "}
                                                  {coinData.term === "short" ? "ST" : coinData.term === "long" ? "LT" : "N/A"}
                                                </span>
                                              </div>
                                            </div>



                                            {/* Base Price */}
                                            <div className="w-[10%] flex flex-col justify-start">
                                              {coinData.basePrice ? (
                                                <span className="text-[8px] font-semibold text-gray-900">
                                                  {(() => {
                                                    const raw = coinData.basePrice?.replace(/[^0-9.-]/g, '');
                                                    const value = parseFloat(raw);

                                                    if (isNaN(value)) return coinData.basePrice;

                                                    const digits = Math.floor(Math.abs(value)).toString().length;

                                                    return `$${value.toLocaleString(undefined, {
                                                      minimumFractionDigits: digits <= 3 ? 2 : 0,
                                                      maximumFractionDigits: digits <= 3 ? 2 : 0
                                                    })}`;
                                                  })()}
                                                </span>
                                              ) : (
                                                <span className="text-[8px] font-semibold text-gray-900">N/A</span>
                                              )}

                                              {/* Price Change % */}
                                              {/* <span className="text-[8px] font-semibold">
                                                {(() => {
                                                  const basePrice =
                                                    coinData.basePrice && coinData.basePrice !== "N/A"
                                                      ? parseFloat(coinData.basePrice.replace("$", "").replace(/,/g, ""))
                                                      : null;

                                                  const livePriceStr = getLivePrice(coinData.coin);
                                                  const currentPrice =
                                                    livePriceStr && livePriceStr !== "N/A"
                                                      ? parseFloat(livePriceStr.replace("$", "").replace(/,/g, ""))
                                                      : null;

                                                  if (basePrice !== null && currentPrice !== null) {
                                                    let changePrice = currentPrice - basePrice;

                                                    if (coinData.type?.toLowerCase().includes("bearish")) {
                                                      changePrice *= -1;
                                                    }

                                                    const percentageChange = (changePrice / basePrice) * 100;
                                                    const isPositive = changePrice > 0;
                                                    const isNegative = changePrice < 0;

                                                    return (
                                                      <span
                                                        className={`${isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-900"
                                                          }`}
                                                      >
                                                        {isPositive ? "+" : ""}
                                                        {percentageChange.toLocaleString(undefined, {
                                                          minimumFractionDigits: 2,
                                                          maximumFractionDigits: 2,
                                                        })}
                                                        %
                                                      </span>
                                                    );
                                                  }

                                                  return <span className="text-gray-900">N/A</span>;
                                                })()}
                                              </span> */}
                                            </div>


                                            {/* Price Change % */}
                                            {/* <div className="w-[10%] flex justify-start">
                                              {(() => {
                                                const basePrice = coinData.basePrice && coinData.basePrice !== 'N/A'
                                                  ? parseFloat(coinData.basePrice.replace('$', '').replace(',', ''))
                                                  : null;
                                                const livePriceStr = getLivePrice(coinData.coin);
                                                const currentPrice = livePriceStr && livePriceStr !== 'N/A'
                                                  ? parseFloat(livePriceStr.replace('$', '').replace(',', ''))
                                                  : null;

                                                if (basePrice !== null && currentPrice !== null) {
                                                  let changePrice = currentPrice - basePrice;
                                                  if (coinData.type?.toLowerCase().includes("bearish")) {
                                                    changePrice *= -1;
                                                  }
                                                  const percentageChange = (changePrice / basePrice) * 100;
                                                  const isPositive = changePrice > 0;
                                                  const isNegative = changePrice < 0;

                                                  return (
                                                    <span className={`text-[8px] font-semibold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-900'}`}>
                                                      {isPositive ? '+' : ''}
                                                      {percentageChange.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                      })}%
                                                    </span>
                                                  );
                                                }
                                                return <span className="text-[8px] font-semibold text-gray-900">N/A</span>;
                                              })()}
                                            </div> */}



                                            {/* Current Price */}
                                            <div className="w-[10%] flex flex-col justify-start">
                                              {(() => {
                                                // Try to get live price from Binance WebSocket
                                                const livePrice = getLivePrice(coinData.coin);
                                                const raw = livePrice?.replace(/[^0-9.-]/g, '');
                                                const value = parseFloat(raw);

                                                // Helper function for formatting
                                                const formatPrice = (num) => {
                                                  const digits = Math.floor(Math.abs(num)).toString().length;

                                                  return num.toLocaleString(undefined, {
                                                    minimumFractionDigits: digits <= 3 ? 2 : 0,
                                                    maximumFractionDigits: digits <= 3 ? 2 : 0
                                                  });
                                                };

                                                // LIVE PRICE AVAILABLE → show formatted
                                                if (!isNaN(value) && livePrice !== 'N/A') {
                                                  return (
                                                    <span className="text-[8px] font-semibold text-blue-500">
                                                      ${formatPrice(value)}
                                                    </span>
                                                  );
                                                }

                                                // FALLBACK: MCM DB LAST AVAILABLE PRICE
                                                if (coinData.lastAvailablePrice) {
                                                  const lastValue = parseFloat(coinData.lastAvailablePrice);

                                                  return (
                                                    <div className="flex flex-col items-start gap-0.5">
                                                      <div className="flex items-center gap-1">
                                                        <span className="text-[8px] font-semibold text-gray-600">
                                                          ${formatPrice(lastValue)}
                                                        </span>

                                                        {/* Tooltip */}
                                                        <span className="relative inline-block z-[9999]">
                                                          <span
                                                            className="text-gray-600 text-[8px] cursor-pointer hover:text-gray-800 inline-block"
                                                            onMouseEnter={(e) => {
                                                              const tooltip = e.currentTarget.nextElementSibling;
                                                              if (tooltip) tooltip.classList.remove('invisible');
                                                            }}
                                                            onMouseLeave={(e) => {
                                                              const tooltip = e.currentTarget.nextElementSibling;
                                                              if (tooltip) tooltip.classList.add('invisible');
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                          >
                                                            ⓘ
                                                          </span>

                                                          <span className="invisible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[8px] p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999] pointer-events-none">
                                                            MCM DB Last Price<br />
                                                            {coinData.lastAvailableTimestamp
                                                              ? formatDateFromContext(new Date(coinData.lastAvailableTimestamp), 'DD-MM-YYYY hh:mm A')
                                                              : 'N/A'}
                                                          </span>
                                                        </span>
                                                      </div>
                                                    </div>
                                                  );
                                                }

                                                // NO PRICE AVAILABLE → show N/A
                                                return (
                                                  <span className="text-[8px] font-semibold text-gray-900">N/A</span>
                                                );
                                              })()}
                                            </div>

                                            {/* 24 Hours Price Change - From Binance WebSocket */}
                                            {/* <div className="w-[10%] flex flex-col justify-start">
                                              {(() => {
                                                // Get live 24-hour price change percentage from WebSocket
                                                const priceChangePercent = getLivePriceChange(coinData.coin);

                                                if (priceChangePercent !== null) {
                                                  const isPositive = priceChangePercent > 0;
                                                  const isNegative = priceChangePercent < 0;

                                                  return (
                                                    <span
                                                      className={`text-[8px] font-semibold ${isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-900"
                                                        }`}
                                                    >
                                                      {isPositive ? "+" : ""}
                                                      {priceChangePercent.toFixed(2)}%
                                                    </span>
                                                  );
                                                }

                                                return <span className="text-[8px] font-semibold text-gray-900">N/A</span>;
                                              })()}
                                            </div> */}

                                            {/* Price Change % (Base Price to Current Price) */}
                                            <div className="w-[10%] flex flex-col justify-start">
                                              {(() => {
                                                // Parse base price
                                                const baseRaw = coinData.basePrice?.replace(/[^0-9.-]/g, '');
                                                const baseValue = parseFloat(baseRaw);

                                                // Get current price
                                                const livePrice = getLivePrice(coinData.coin);
                                                const currentRaw = livePrice?.replace(/[^0-9.-]/g, '');
                                                let currentValue = parseFloat(currentRaw);

                                                // Fallback to lastAvailablePrice if live price is not available
                                                if (isNaN(currentValue) || livePrice === 'N/A') {
                                                  if (coinData.lastAvailablePrice) {
                                                    currentValue = parseFloat(coinData.lastAvailablePrice);
                                                  }
                                                }

                                                // Calculate percentage change: ((current - base) / base) * 100
                                                if (!isNaN(baseValue) && !isNaN(currentValue) && baseValue !== 0) {
                                                  let percentChange = ((currentValue - baseValue) / baseValue) * 100;

                                                  // ★ APPLY BEARISH SENTIMENT RULE
                                                  const sentiment = coinData.sentiment || coinData.type || "";
                                                  if (sentiment.toLowerCase().includes("bearish")) {
                                                    percentChange = percentChange * -1;  // Flip sign
                                                  }

                                                  const isPositive = percentChange > 0;
                                                  const isNegative = percentChange < 0;

                                                  return (
                                                    <span
                                                      className={`text-[8px] font-semibold ${isPositive ? "text-green-600" :
                                                        isNegative ? "text-red-600" :
                                                          "text-gray-900"
                                                        }`}
                                                    >
                                                      {isPositive ? "+" : ""}
                                                      {percentChange.toFixed(2)}%
                                                    </span>
                                                  );
                                                }

                                                return <span className="text-[8px] font-semibold text-gray-900">N/A</span>;
                                              })()}
                                            </div>

                                            {/* Summary/Title Column - only show for first coin with merged cell effect */}
                                            {isFirstCoin ? (
                                              <div
                                                className="w-[50%] flex items-start justify-center border-l border-gray-200 px-2 bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 group-hover:bg-indigo-50/40"
                                                style={{
                                                  position: (visibleCoins.length === 1 && isSummaryExpanded) ? 'relative' : 'absolute',
                                                  right: (visibleCoins.length === 1 && isSummaryExpanded) ? 'auto' : 0,
                                                  top: (visibleCoins.length === 1 && isSummaryExpanded) ? 'auto' : 0,
                                                  minHeight: isSummaryExpanded ? 'auto' : `${visibleCoins.length * 100}%`,
                                                  height: isSummaryExpanded ? 'auto' : `${visibleCoins.length * 100}%`,
                                                  width: '50%',
                                                  flex: (visibleCoins.length === 1 && isSummaryExpanded) ? '0 0 50%' : 'none',
                                                  zIndex: isSummaryExpanded ? 10 : 1,
                                                  overflow: 'visible'
                                                }}
                                              >
                                                {contentText ? (
                                                  <div className="text-[9px] text-gray-700 leading-[1.4] py-2" style={{
                                                    wordWrap: 'break-word',
                                                    overflowWrap: 'break-word',
                                                    whiteSpace: 'normal',
                                                    textAlign: 'left',
                                                    display: 'block',
                                                    width: '100%'
                                                  }}>
                                                    <p className="mb-0">
                                                      <span
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const infId = influencer?.channel_id || influencer?.id || post.channelID;
                                                          router.push(
                                                            selectedPlatform === "youtube"
                                                              ? `/influencers/${infId}?tab=recentActivities`
                                                              : `/telegram-influencer/${infId}?tab=recentActivities`
                                                          );
                                                        }}
                                                        className="hover:text-blue-600 hover:underline cursor-pointer"
                                                      >
                                                        {isSummaryExpanded ? contentText : (showReadMore ? truncateText(contentText, wordLimit) : contentText)}
                                                        {showReadMore && !isSummaryExpanded && '...'}
                                                      </span>
                                                    </p>
                                                    {showReadMore && (
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setExpandedTitles(prev => ({
                                                            ...prev,
                                                            [groupedPostKey]: !prev[groupedPostKey]
                                                          }));
                                                        }}
                                                        className="mt-1 text-blue-600 hover:text-blue-800 font-semibold text-[8px]"
                                                      >
                                                        {isSummaryExpanded ? 'Read less' : 'Read more'}
                                                      </button>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="text-[8px] text-gray-600 py-2">
                                                    <span
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const infId = influencer?.channel_id || influencer?.id || post.channelID;
                                                        router.push(
                                                          selectedPlatform === "youtube"
                                                            ? `/influencers/${infId}?tab=recentActivities`
                                                            : `/telegram-influencer/${infId}?tab=recentActivities`
                                                        );
                                                      }}
                                                      className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                                    >
                                                      click to view post
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            ) : null}
                                            {/* Spacer for summary column - hide only when 1 coin and summary is expanded */}
                                            {!(visibleCoins.length === 1 && isSummaryExpanded) && (
                                              <div className="w-[50%] flex items-start justify-center px-2" style={{
                                                minHeight: 'auto'
                                              }}>
                                                {/* Invisible placeholder for expansion - distributes content across all coin rows */}
                                                {(visibleCoins.length >= 2 && isSummaryExpanded) && (
                                                  <div className="text-[9px] text-gray-700 leading-[1.4] py-2" style={{
                                                    opacity: 0,
                                                    pointerEvents: 'none',
                                                    wordWrap: 'break-word',
                                                    overflowWrap: 'break-word',
                                                    whiteSpace: 'normal',
                                                    textAlign: 'left',
                                                    display: 'block',
                                                    width: '100%'
                                                  }}>
                                                    {/* Split content evenly across all visible coin rows */}
                                                    {contentText.substring(
                                                      Math.floor((coinIdx * contentText.length) / visibleCoins.length),
                                                      Math.floor(((coinIdx + 1) * contentText.length) / visibleCoins.length)
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      });

                                      // Add Show More/Less button if there are more than 3 coins
                                      if (totalCoins > 3) {
                                        const remainingCoins = totalCoins - visibleCoinsCount;
                                        const showMoreButton = (
                                          <div key={`show-more-${idx}`} className="flex items-center justify-start gap-1 px-0.5 py-2 border-b border-gray-100 w-full">
                                            <div className="w-[10%]"></div>
                                            <div className="w-[6%] flex justify-center">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setExpandedPosts(prev => {
                                                    if (showingAllCoins) {
                                                      // Collapse back to 3
                                                      return { ...prev, [postKey]: 3 };
                                                    } else {
                                                      // Expand by 3 more (or show all if less than 3 remaining)
                                                      const newCount = Math.min(visibleCoinsCount + 3, totalCoins);
                                                      return { ...prev, [postKey]: newCount };
                                                    }
                                                  });
                                                  // Also expand/collapse the summary when showing more/less coins
                                                  setExpandedTitles(prev => ({
                                                    ...prev,
                                                    [groupedPostKey]: !showingAllCoins
                                                  }));
                                                }}
                                                className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-md"
                                                title={showingAllCoins ? "Show less" : `Show more (${remainingCoins} remaining)`}
                                              >
                                                <span className="text-[12px] font-bold">
                                                  {showingAllCoins ? "−" : "+"}
                                                </span>
                                              </button>
                                            </div>
                                            <div className="w-[8%]"></div>
                                            <div className="w-[10%]"></div>
                                            <div className="w-[10%]"></div>
                                            <div className="w-[10%]"></div>
                                            <div className="w-[10%]"></div>
                                            <div className="w-[50%]"></div>
                                          </div>
                                        );
                                        return (
                                          <div key={`group-wrapper-${idx}`} style={{ position: 'relative', minHeight: hasExpandedSummary ? 'auto' : 'initial' }}>
                                            {[...coinRows, showMoreButton]}
                                          </div>
                                        );
                                      }

                                      return (
                                        <div key={`group-wrapper-${idx}`} style={{ position: 'relative', minHeight: hasExpandedSummary ? 'auto' : 'initial' }}>
                                          {coinRows}
                                        </div>
                                      );
                                    }

                                    // Handle individual coin posts (Latest Posts mode)
                                    const latestPostKey = `${postUniqueKey}-latest-${idx}`;
                                    const isSummaryExpanded = expandedTitles[latestPostKey] || false;
                                    // Use summary for YouTube and Telegram, title for others
                                    const contentText = (rec.type === 'youtube' || rec.type === 'telegram') ? (rec.summary || '') : (rec.title || '');
                                    // Dynamic word limit based on number of coins (for Latest Posts, usually 1 coin per post)
                                    const coinsCount = rec.coins ? rec.coins.length : 1;
                                    const wordLimit = coinsCount === 1 ? 25 : coinsCount === 2 ? 45 : coinsCount === 3 ? 75 : 85;
                                    const showReadMore = contentText.split(' ').length > wordLimit;

                                    return (
                                      <div key={idx} className={`flex justify-start gap-1 px-0.5 py-2 border-b border-gray-100 last:border-b-0 w-full ${isSummaryExpanded ? 'items-start' : 'items-center'}`} style={{ minHeight: 'initial', position: 'relative' }}>
                                        <div className="flex flex-col items-start gap-1 w-[10%] px-1">
                                          {rec.date && rec.time ? (
                                            <>
                                              <span className="text-[8px] font-semibold text-black-900">
                                                {formatDate(rec.date)}
                                              </span>
                                              <span className="text-[8px] font-semibold text-black-900">
                                                {formatTime(rec.date, rec.time)}
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-[8px] text-gray-400">No data</span>
                                          )}
                                        </div>
                                        {/* Coin Icon and Name */}
                                        <div
                                          className="flex items-center justify-start gap-0.5 w-[6%] pl-2 cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (rec.mcm_source_id) {
                                              router.push(`/coins-list/${rec.mcm_source_id}`);
                                            }
                                          }}
                                        >
                                          <div className="flex items-center justify-center w-3">
                                            {rec.icon}
                                          </div>
                                          <span className="text-[9px] font-bold text-gray-900">
                                            {rec.coin}
                                          </span>
                                        </div>

                                        {/* Sentiment with Term - Pill Badge */}
                                        <div className="w-[8%] flex justify-start">
                                          <div
                                            className={`px-2 py-1 rounded-full flex items-center gap-1 ${rec.type === "bullish"
                                              ? "bg-green-100 text-green-700"
                                              : "bg-red-100 text-red-700"
                                              }`}
                                          >
                                            {/* Arrow */}
                                            {rec.type === "bullish" ? (
                                              <FaArrowUp className="text-[7px]" />
                                            ) : (
                                              <FaArrowDown className="text-[7px]" />
                                            )}

                                            {/* Bullish/Bearish + ST/LT */}
                                            <div className="flex flex-col items-center">
                                              <span className="text-[7px] font-semibold whitespace-nowrap">
                                                {rec.type === "bullish" ? "Bullish" : "Bearish"}
                                              </span>
                                              <span className="text-[7px] font-semibold whitespace-nowrap">
                                                {rec.term === "short" ? "ST" : rec.term === "long" ? "LT" : "N/A"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>


                                        {/* PRICE AT POST DATE (formerly Base Price) */}
                                        <div className="w-[10%] flex justify-start">
                                          <span className="text-[8px] font-semibold text-gray-900">
                                            {(() => {
                                              const value = parseFloat(rec.basePrice?.replace(/[^0-9.-]/g, ''));
                                              if (isNaN(value)) return rec.basePrice;
                                              return value.toFixed(2);
                                            })()}
                                          </span>
                                        </div>

                                        {/* CURRENT PRICE */}
                                        <div className="w-[10%] flex justify-start">
                                          <span className="text-[8px] font-semibold text-blue-500">
                                            {(() => {
                                              const livePrice = getLivePrice(rec.coin);
                                              const value = parseFloat(livePrice?.replace(/[^0-9.-]/g, ''));
                                              if (isNaN(value)) return livePrice;
                                              return value.toFixed(2);
                                            })()}
                                          </span>
                                        </div>

                                        {/* Change Price (PRICE AT POST DATE - CURRENT PRICE) */}
                                        <div className="w-[10%] flex justify-start">
                                          {(() => {
                                            // Parse base price and current price
                                            const basePrice = rec.basePrice && rec.basePrice !== 'N/A'
                                              ? parseFloat(rec.basePrice.replace('$', '').replace(',', ''))
                                              : null;
                                            const livePriceStr = getLivePrice(rec.coin);
                                            const currentPrice = livePriceStr && livePriceStr !== 'N/A'
                                              ? parseFloat(livePriceStr.replace('$', '').replace(',', ''))
                                              : null;

                                            if (basePrice !== null && currentPrice !== null) {
                                              let changePrice = currentPrice - basePrice;

                                              let sentiment = rec.type || "";
                                              if (sentiment.toLowerCase().includes("bearish")) {
                                                changePrice *= -1;
                                              }

                                              // Calculate percentage change based on base price
                                              const percentageChange = (changePrice / basePrice) * 100;
                                              console.log('Percentage Change Calculation:', {
                                                percentageChange
                                              });

                                              const isPositive = changePrice > 0;
                                              const isNegative = changePrice < 0;

                                              return (
                                                <span
                                                  className={`text-[8px] font-semibold ${isPositive
                                                    ? 'text-green-600'
                                                    : isNegative
                                                      ? 'text-red-600'
                                                      : 'text-gray-900'
                                                    }`}
                                                >

                                                  {isPositive ? '+' : ''}
                                                  {percentageChange.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })}
                                                  %
                                                </span>
                                              );
                                            } else {
                                              return <span className="text-[8px] font-semibold text-gray-900">N/A</span>;
                                            }
                                          })()}
                                        </div>

                                        {/* 24 Hours Volume - From Binance */}
                                        <div className="w-[10%] flex flex-col justify-start">
                                          {(() => {
                                            // Get live volume data from Binance
                                            const liveVolume = getLiveVolume(rec.coin);

                                            if (liveVolume?.volume) {
                                              const volume = parseFloat(liveVolume.volume);

                                              return (
                                                <span className="text-[8px] font-semibold text-black-900">
                                                  {volume.toLocaleString("en-US", {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                  })}
                                                </span>
                                              );
                                            }
                                            return <span className="text-[8px] font-semibold text-gray-900">N/A</span>;
                                          })()}
                                        </div>

                                        {/* Summary/Title Column - separate */}
                                        <div className={`w-[50%] flex justify-start break-words ${isSummaryExpanded ? 'overflow-visible' : 'overflow-hidden'}`}>
                                          {contentText ? (
                                            <span className="text-[8px] text-gray-600 break-words capitalize">
                                              <span
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const infId = influencer?.channel_id || influencer?.id || post.channelID;
                                                  router.push(
                                                    selectedPlatform === "youtube"
                                                      ? `/influencers/${infId}?tab=recentActivities`
                                                      : `/telegram-influencer/${infId}?tab=recentActivities`
                                                  );
                                                }}
                                                className="hover:text-blue-600 hover:underline cursor-pointer"
                                              >
                                                {showReadMore && !isSummaryExpanded
                                                  ? `${truncateText(contentText, wordLimit)}...`
                                                  : contentText
                                                }
                                              </span>
                                              {showReadMore && (
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedTitles(prev => ({
                                                      ...prev,
                                                      [latestPostKey]: !prev[latestPostKey]
                                                    }));
                                                  }}
                                                  className="ml-1 text-blue-600 hover:text-blue-800 font-semibold"
                                                >
                                                  {isSummaryExpanded ? 'Read less' : 'Read more'}
                                                </button>
                                              )}
                                            </span>
                                          ) : (
                                            <span className="text-[8px] text-gray-600">
                                              <span
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const infId = influencer?.channel_id || influencer?.id || post.channelID;
                                                  router.push(
                                                    selectedPlatform === "youtube"
                                                      ? `/influencers/${infId}?tab=recentActivities`
                                                      : `/telegram-influencer/${infId}?tab=recentActivities`
                                                  );
                                                }}
                                                className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                              >
                                                {rec.link}
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}

                                {/* Show More/Less button removed - each row now shows a single post */}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>

            {/* Posts Pagination */}
            {(() => {
              const pagination = threeDaysAllPostsPagination[selectedPlatform];
              if (!pagination || pagination.totalPages <= 1) return null;

              const postsTotalPages = pagination.totalPages;
              const postsCurrentPage = pagination.page;

              // Generate page numbers to display
              const getPostsPageNumbers = () => {
                const maxPagesToShow = 5;
                const half = Math.floor(maxPagesToShow / 2);
                let startPage = Math.max(1, postsCurrentPage - half);
                let endPage = Math.min(postsTotalPages, postsCurrentPage + half);

                if (postsCurrentPage <= half) {
                  endPage = Math.min(postsTotalPages, maxPagesToShow);
                }
                if (postsCurrentPage > postsTotalPages - half) {
                  startPage = Math.max(1, postsTotalPages - maxPagesToShow + 1);
                }

                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }
                return pages;
              };

              return (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page <span className="font-medium">{postsCurrentPage}</span> of{" "}
                    <span className="font-medium">{postsTotalPages}</span> ({pagination.total} total posts)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePostsPageChange(1)}
                      disabled={postsCurrentPage === 1}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${postsCurrentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePostsPageChange(postsCurrentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${!pagination.hasPrevPage
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      Previous
                    </button>
                    {getPostsPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePostsPageChange(page)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${postsCurrentPage === page
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePostsPageChange(postsCurrentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${!pagination.hasNextPage
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePostsPageChange(postsTotalPages)}
                      disabled={postsCurrentPage === postsTotalPages}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${postsCurrentPage === postsTotalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      Last
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}