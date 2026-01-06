"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalfAlt, FaInfoCircle, FaArrowUp, FaArrowDown, FaBitcoin, FaYoutube, FaTelegram } from "react-icons/fa";
import { FaEthereum } from "react-icons/fa6";
import { getYearOptions, getDynamicTimeframeOptions } from "../../../utils/dateFilterUtils";
import { useTop10LivePrice } from "../../hooks/useTop10LivePrice";
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
        coins: post.coins.map(coinData => {
          // Format each coin in the group
          const sentiment = coinData.sentiment || "";
          const outlook = coinData.outlook || coinData.cryptoRecommendationType || "";

          let type = "bullish";
          let term = "long";

          if (sentiment.toLowerCase().includes("bearish")) {
            type = "bearish";
          }

          if (outlook.toLowerCase().includes("short") || outlook === "short-term") {
            term = "short";
          }

          const basePrice = coinData.binance?.base_price || coinData.price || "N/A";
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
            basePrice: typeof basePrice === 'number' ? `$${basePrice.toFixed(2)}` : basePrice,
            currentPrice: currentPrice,
            volume: volume,
            sentiment: sentiment,
            outlook: outlook,
          };
        })
      };
    }

    // Handle individual coin posts (non-grouped)
    const coinData = post.coin;

    // Determine sentiment type and term
    const sentiment = coinData.sentiment || "";
    const outlook = coinData.outlook || coinData.cryptoRecommendationType || "";

    let type = "bullish";
    let term = "long";

    if (sentiment.toLowerCase().includes("bearish")) {
      type = "bearish";
    }

    if (outlook.toLowerCase().includes("short") || outlook === "short-term") {
      term = "short";
    }

    // Format prices
    const basePrice = coinData.binance?.base_price || coinData.price || "N/A";

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
      basePrice: typeof basePrice === 'number' ? `$${basePrice.toFixed(2)}` : basePrice,
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
      channel_name: post.channel_name
    };
  });

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

  // Use live price hook
  const { top10Data, isConnected } = useTop10LivePrice();

  // Create a live prices map that updates when top10Data changes
  const livePricesMap = useMemo(() => {
    const pricesMap = {};
    top10Data.forEach(coin => {
      pricesMap[coin.symbol.toUpperCase()] = coin.price;
    });
    return pricesMap;
  }, [top10Data]);

  // Create a live price changes map (EXACT same pattern as /coins)
  const livePriceChangesMap = useMemo(() => {
    const changesMap = {};
    top10Data.forEach(coin => {
      changesMap[coin.symbol.toUpperCase()] = coin.priceChange24h;
    });
    return changesMap;
  }, [top10Data]);

  // Helper function to get live price for a symbol
  const getLivePrice = useCallback((symbol) => {
    if (!symbol) return "N/A";
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

  // Use timezone context
  const { useLocalTime, userTimezone, toggleTimezone, setUseLocalTime } = useTimezone();

  // Get user's city from timezone
  const [userCity, setUserCity] = useState('');

  // Ensure UTC is the default on page load
  useEffect(() => {
    setUseLocalTime(false);
  }, []); // Run only once on mount

  useEffect(() => {
    if (useLocalTime && userTimezone) {
      const city = userTimezone.split('/').pop()?.replace(/_/g, ' ') || 'Local';
      setUserCity(city);
    }
  }, [useLocalTime, userTimezone]);

  // Fetch Binance volume data
  useEffect(() => {
    const fetchBinanceVolume = async () => {
      try {
        // Fetch only USDT pairs by making individual requests or filtering
        // Since Binance doesn't support filtering in the API, we fetch all and filter
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await response.json();

        // Create a map of symbol to volume, priceChange, and priceChangePercent (only USDT pairs)
        const volumeMap = {};
        data.forEach(ticker => {
          // Only process USDT trading pairs
          if (ticker.symbol.endsWith('USDT')) {
            // Remove 'USDT' suffix to get the base symbol (e.g., BTCUSDT -> BTC)
            const symbol = ticker.symbol.replace('USDT', '');
            volumeMap[symbol] = {
              volume: ticker.volume,
              priceChange: ticker.priceChange,
              priceChangePercent: ticker.priceChangePercent
            };
          }
        });

        console.log(`Loaded ${Object.keys(volumeMap).length} USDT pairs from ${data.length} total pairs`);
        setBinanceVolumeData(volumeMap);
      } catch (error) {
        console.error('Error fetching Binance volume data:', error);
      }
    };

    fetchBinanceVolume();
    // Refresh volume data every 5 minutes
    const interval = setInterval(fetchBinanceVolume, 5 * 60 * 1000);

    return () => clearInterval(interval);
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

      // Create live prices map
      const livePricesMap = {};
      top10Data.forEach(coin => {
        livePricesMap[coin.symbol.toUpperCase()] = coin.price;
      });

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

  // API parameters using filter states
  const apiParams = useMemo(() => ({
    rating: selectedRating,
    timeframe: selectedTimeframe,
    year: selectedYear
  }), [selectedRating, selectedTimeframe, selectedYear]);

  // Memoized API call functions
  const fetchYouTubeData = useCallback(async () => {
    // Only show loading on first load
    if (isFirstRenderRef.current) {
      setLoading(true);
    }
    setError(null);
    try {
      // Fetch data from the new combined API endpoint
      const res = await fetch(`/api/youtube-data/top10-last-posts?type=haplusnonha&limit=10&timeframe=1_hour`);
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

      // Extract last posts data
      if (data.success) {
        // Store the complete response including day1, day2, etc. keys
        setYoutubeLastPosts(data);
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
  }, [apiParams]);

  const fetchTelegramData = useCallback(async () => {
    // Only show loading on first load
    if (isFirstRenderRef.current) {
      setLoading(true);
    }
    setError(null);
    try {
      // Fetch data from the new combined API endpoint
      const res = await fetch(`/api/telegram-data/top10-last-posts?type=haplusnonha&limit=10&timeframe=1_hour`);
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

      // Extract last posts data
      if (data.success) {
        // Store the complete response including day1, day2, etc. keys
        setTelegramLastPosts(data);
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
  }, [apiParams]);

  useEffect(() => {
    // Fetch data when platform or filters change
    if (selectedPlatform === "youtube") {
      fetchYouTubeData();
    } else if (selectedPlatform === "telegram") {
      fetchTelegramData();
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

      // Sort posts in ascending order (oldest first) by publishedAt or date/time
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

        return getTimestamp(a) - getTimestamp(b);
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

      // Sort posts in ascending order (oldest first) by publishedAt or date/time
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

              // Debug logging
              console.log(`Post time: ${post.time}, parsed as: ${hours}:${minutes}:${seconds}, timestamp: ${timestamp}, date: ${new Date(timestamp).toLocaleString()}`);

              return timestamp;
            } catch (e) {
              console.error('Error parsing time:', post.time, e);
              return 0;
            }
          }
          return 0;
        };

        return getTimestamp(a) - getTimestamp(b);
      });
    }

    return posts;
  };

  // Apply global sorting to recommendations and reorder influencers if sorting is active
  const sortedData = useMemo(() => {
    return sortRecommendationsAndInfluencers(top10Influencers);
  }, [top10Influencers, sortConfig, youtubeLastPosts, telegramLastPosts, selectedPlatform, top10Data, binanceVolumeData, selectedDateFilter]);

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

  // Pagination for top 10 influencers
  const totalPages = Math.ceil(displayInfluencers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInfluencers = displayInfluencers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans mt-5">
      {/* Main Content */}
      <main className="mx-auto px-4 pb-8 overflow-x-hidden">
        <div className="min-w-0">
          {/* Leaderboard Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* View Mode Toggle Buttons */}
            <div className="flex justify-between items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
              {/* Timezone Toggle on Left */}
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

              {/* View Mode Buttons in Center */}
              <div className="flex gap-3">
                <button
                  onClick={() => setViewMode("top10_influencer_latest")}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === "top10_influencer_latest"
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Influencers
                </button>
                <button
                  onClick={() => router.push("/coins")}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
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

              {/* Empty space on right for balance */}
              <div className="w-40"></div>
            </div>

            <div>
              <table className="w-full relative">
                <thead>
                  {/* Main header row */}
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-1 py-1 text-center text-[10px] font-medium text-black-900  tracking-wider border-r border-gray-300 w-36">
                      Influencer
                    </th>
                    <th className="px-1 py-1 text-center text-[10px] font-medium text-black-900 tracking-wider border-r border-gray-300 w-36">
                      MCM Rating{" "}
                      <span className="relative group cursor-pointer z-[9999]">
                        <span className="text-blue-600 text-sm">ⓘ</span>
                        <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl text-left w-52 z-[9999]">
                          Timeframes represent how an influencer’s calls performed over different periods.<br />
                          We check the price when the call was made,<br />
                          compare it after each timeframe,<br />
                          and use those outcomes to rank influencers based on overall performance.
                        </span>
                      </span>
                    </th>
                    {/* <th className="px-1 py-1 text-center text-[10px] font-medium text-black-900 uppercase tracking-wider border-r border-gray-300 w-36">
                      Date
                    </th> */}
                    <th className="px-1 py-1 text-[10px] font-medium text-black-900 tracking-wider relative">
                      <div className="flex items-center justify-between w-full">
                        <span className="px-1">Date & Time</span>
                        <div className="flex items-center justify-center gap-1 flex-1">
                          <span>Latest Posts Based on MCM Ranking</span>
                          {/* <span className="relative group cursor-pointer z-[9999]">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              N/A : Not Available
                            </span>
                          </span> */}
                        </div>
                      </div>
                    </th>
                  </tr>
                  {/* Sub-header row with Filters and Recommendations columns */}
                  <tr className="bg-gray-100 border-b border-gray-300">
                    {/* Influencer Filter */}
                    <th className="px-1 py-0.5 border-r border-gray-300">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setSelectedPlatform("youtube")}
                          className={`flex items-center justify-center px-3 py-1 rounded-full transition-all ${selectedPlatform === "youtube"
                            ? "bg-red-500 text-white shadow-md"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            }`}
                          title="YouTube"
                        >
                          <FaYoutube className="text-lg" />
                        </button>
                        <button
                          onClick={() => setSelectedPlatform("telegram")}
                          className={`flex items-center justify-center px-3 py-1 rounded-full transition-all ${selectedPlatform === "telegram"
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            }`}
                          title="Telegram"
                        >
                          <FaTelegram className="text-lg" />
                        </button>
                      </div>
                    </th>
                    {/* Timeframe Filter */}
                    <th className="px-1 py-0.5 border-r border-gray-300">
                      <div className="flex justify-center">
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
                      </div>
                    </th>
                    {/* Date and Time Column with Timezone Toggle */}
                    {/* <th className="px-1 py-0.5 border-r border-gray-300">
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
                        <div className="w-[15%] flex flex-col items-start gap-1">
                          <select
                            value={selectedDateFilter}
                            onChange={(e) => setSelectedDateFilter(e.target.value)}
                            className="w-3/4 border border-gray-300 bg-gray-50 rounded-full px-2 py-0.5 text-[9px] font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer transition-all"
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
                        <div className="w-[10%] text-[10px] font-bold text-black-900 text-left">
                          Coin&apos;s
                        </div>
                        <div className="w-[15%] text-[10px] font-bold text-black-900 text-left">
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
                        </div>
                        <div className="w-[15%] text-[10px] font-bold text-black-900 text-left">
                          <div className="flex flex-col items-start">
                            <span>Post Date</span>
                            <span>Price</span>
                          </div>
                        </div>
                        <div className="w-[15%] text-[10px] font-bold text-black-900 text-left">
                          <div className="flex flex-col items-start">
                            <span>Current Price</span>

                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-normal text-black-600">(Binance)</span>

                              {/* Info Icon with Hover Tooltip */}
                              <span className="relative group cursor-pointer z-[9999]">
                                <span className="text-blue-600 text-sm">ⓘ</span>

                                <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                  N/A : Not Available
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="w-[15%] text-[10px] font-bold text-black-900 text-left">
                          <span>
                            Post Date<br />% Change
                          </span>
                          <span className="relative group cursor-pointer z-[9999] ml-1">
                            <span className="text-blue-600 text-sm">ⓘ</span>
                            <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                              N/A : Not Available
                            </span>
                          </span>
                        </div>

                        <div className="w-[15%] text-[10px] font-bold text-black-900 text-left">
                          <div className="flex flex-col items-start">
                            <span>Price Change</span>

                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-normal text-black-600">(24hrs Binance)</span>

                              {/* Info Icon + Tooltip */}
                              <span className="relative group cursor-pointer z-[9999]">
                                <span className="text-blue-600 text-sm">ⓘ</span>

                                <span className="invisible group-hover:visible absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                  N/A : Not Available
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="w-[20%] text-[10px] font-bold text-black-900 text-center">
                          <span>{selectedPlatform === "youtube" ? "Post AI Summary" : "Post AI Summary"}</span><br />
                          <span className="text-[8px] font-normal text-black-600">click to view post</span>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 relative" style={{ isolation: 'isolate' }}>
                  {initialLoad || (selectedPlatform === "youtube" && youtubeInfluencers.length === 0) || (selectedPlatform === "telegram" && telegramInfluencers.length === 0) ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={`skeleton-row-${i}`}>
                        {/* Influencer column skeleton */}
                        <td className="px-1 py-2 whitespace-nowrap border-r border-gray-200">
                          <div className="flex items-center mb-1">
                            <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div className="ml-10 h-12 bg-gray-200 rounded w-40"></div>
                        </td>
                        {/* MCM Ranking column skeleton */}
                        <td className="px-1 py-2 whitespace-nowrap border-r border-gray-200">
                          <div className="h-32 bg-gray-200 rounded w-full"></div>
                        </td>
                        {/* Date column skeleton */}
                        <td className="px-1 py-2 whitespace-nowrap border-r border-gray-200">
                          <div className="h-12 bg-gray-200 rounded w-full"></div>
                        </td>
                        {/* Recommendations skeleton */}
                        <td className="px-1 py-2 whitespace-nowrap">
                          <div className="h-48 bg-gray-200 rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : !loading && filteredInfluencers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-lg font-semibold text-gray-600 mb-2">No influencers found</p>
                          <p className="text-sm text-gray-500">No influencers match the selected filters. Try adjusting your filter criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {/* Paginated influencers */}
                      {paginatedInfluencers.map((influencer, index) => {
                        const globalRank = startIndex + index + 1;

                        // Get star ratings from influencer's star_rating_yearly (from main API)
                        const starRatingYearly = influencer.star_rating_yearly || {};

                        // Extract all available yearly ratings dynamically, starting from 2022
                        const scatterData = [];
                        const currentDate = new Date();
                        const currentRealYear = currentDate.getFullYear();
                        const currentRealMonth = currentDate.getMonth();

                        const years = Object.keys(starRatingYearly)
                          .map(year => parseInt(year))
                          .filter(year => {
                            if (year < 2022) return false;

                            // Rule: Current year is only visible if Q1 is completed (April onwards)
                            // Future years are hidden
                            if (year > currentRealYear) return false;
                            if (year === currentRealYear && currentRealMonth < 3) return false;

                            return true;
                          }) // Filter to start from 2022 and apply visibility rules
                          .sort((a, b) => a - b); // Sort in ascending order

                        // Build scatter data for each year
                        years.forEach((year, yearIndex) => {
                          const yearData = starRatingYearly[year];
                          if (yearData && yearData.current_rating) {
                            scatterData.push({
                              year: yearIndex,
                              yearLabel: year,
                              rating: yearData.current_rating,
                              finalScore: yearData.current_final_score
                            });
                          }
                        });

                        // Get recommendations for this influencer
                        // Use globally sorted recommendations if sorting is active, otherwise use unsorted
                        let recommendations;
                        if (sortConfig.key && globalSortedRecommendations[influencer.id]) {
                          recommendations = globalSortedRecommendations[influencer.id];
                        } else {
                          const lastPostsData = selectedPlatform === "youtube" ? youtubeLastPosts : telegramLastPosts;
                          const lastPostsForInfluencer = getInfluencerPosts(lastPostsData, influencer.id, selectedDateFilter);

                          // Create live prices map from top10Data
                          const livePricesMap = {};
                          top10Data.forEach(coin => {
                            livePricesMap[coin.symbol.toUpperCase()] = coin.price;
                          });

                          recommendations = formatRecommendations(lastPostsForInfluencer, livePricesMap, binanceVolumeData);
                        }

                        return (
                          <motion.tr
                            key={influencer.id}
                            layout
                            layoutId={`leaderboard-${influencer.id}`}
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
                            className="hover:bg-gray-50 cursor-pointer"
                            style={{ position: 'relative', zIndex: 1 }}
                            onClick={() => {
                              router.push(
                                selectedPlatform === "youtube"
                                  ? `/influencers/${influencer.id}`
                                  : `/telegram-influencer/${influencer.id}`
                              );
                            }}
                          >
                            {/* Influencer Column */}
                            <td className="px-1 py-1 border-r border-gray-200">
                              <Link
                                href={
                                  selectedPlatform === "youtube"
                                    ? `/influencers/${influencer.id}`
                                    : `/telegram-influencer/${influencer.id}`
                                }
                                className="block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  {/* Profile Image */}
                                  <div className="flex-shrink-0 relative">
                                    {influencer.channel_thumbnails?.high?.url ? (
                                      <Image
                                        src={influencer.channel_thumbnails.high.url}
                                        alt={influencer.name || "Influencer"}
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
                                      style={{ display: influencer.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
                                    >
                                      <span className="text-white text-base font-bold">
                                        {influencer.name?.[0]?.toUpperCase() || "?"}
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
                                      {influencer.name?.replace(/_/g, " ") || "Unknown"}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </td>

                            {/* MCM Ranking Column - Yearly Rating Graph with Stars */}
                            <td className="px-3 py-1 border-r border-gray-200">
                              <div className="flex justify-start items-center py-1">
                                {scatterData.length > 0 ? (
                                  <div className="relative">
                                    {/* Graph container with axes */}
                                    <div className="relative">
                                      {/* Data columns with stars */}
                                      <div className="flex items-end gap-3 pl-1 h-16 pb-3">
                                        {scatterData.map((point, idx) => {
                                          const fullStars = Math.floor(point.rating);
                                          const hasHalfStar = point.rating % 1 >= 0.5;
                                          const totalStars = 5;
                                          const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

                                          return (
                                            <div
                                              key={idx}
                                              className="flex flex-col items-center relative min-w-[12px]"
                                              title={`Year: ${point.yearLabel}, Rating: ${point.rating}`}
                                            >
                                              {/* Stars displayed vertically (bottom to top) */}
                                              <div className="flex flex-col-reverse gap-0">
                                                {[...Array(fullStars)].map((_, i) => (
                                                  <FaStar key={`full-${i}`} className="text-yellow-500 w-2.5 h-2.5" />
                                                ))}
                                                {hasHalfStar && (
                                                  <FaStarHalfAlt key="half" className="text-yellow-500 w-2.5 h-2.5" />
                                                )}
                                                {[...Array(emptyStars)].map((_, i) => (
                                                  <FaStar key={`empty-${i}`} className="text-gray-300 w-2.5 h-2.5" />
                                                ))}
                                              </div>
                                              {/* Year label at bottom (below x-axis) */}
                                              <span className="text-[8px] text-black-500 font-semibold absolute whitespace-nowrap" style={{ bottom: '-12px' }}>
                                                {point.yearLabel}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-gray-400">loading...</div>
                                )}
                              </div>
                            </td>

                            {/* Date and Time Column */}
                            {/* <td className="px-1 py-1 border-r border-gray-200">
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
                                {/* Display recommendations based on visible count (default 3, increment by 3) */}
                                {(() => {
                                  const visibleCount = visibleRecommendations[influencer.id] || 3;

                                  // Check if recommendations contain grouped posts (date filter applied)
                                  const hasGroupedPosts = recommendations.some(rec => rec.isGrouped);

                                  // Sort recommendations: rows with data first, N/A rows at bottom
                                  // Skip sorting for grouped posts to preserve chronological order
                                  const sortedRecommendations = hasGroupedPosts ? recommendations : [...recommendations].sort((a, b) => {
                                    const aHasData = a.basePrice !== 'N/A' || a.currentPrice !== 'N/A';
                                    const bHasData = b.basePrice !== 'N/A' || b.currentPrice !== 'N/A';

                                    if (aHasData && !bHasData) return -1;
                                    if (!aHasData && bHasData) return 1;
                                    return 0;
                                  });

                                  const displayedRecommendations = sortedRecommendations.slice(0, visibleCount);

                                  // Check if there are no posts for the selected date
                                  if (displayedRecommendations.length === 0 && selectedDateFilter !== "latest") {
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
                                      // Flatten coins into individual rows, same as Latest Posts
                                      return rec.coins.map((coinData, coinIdx) => {
                                        const latestPostKey = `${influencer.id}-grouped-${idx}-${coinIdx}`;
                                        const isSummaryExpanded = expandedTitles[latestPostKey] || false;
                                        // Use summary for YouTube and Telegram, title for others
                                        const contentText = (rec.type === 'youtube' || rec.type === 'telegram') ? (rec.summary || '') : (rec.title || '');
                                        const contentLimit = 200;
                                        const showReadMore = contentText.length > contentLimit;
                                        const isFirstCoin = coinIdx === 0;

                                        return (
                                          <div key={`${idx}-${coinIdx}`} className={`flex justify-start gap-1 px-0.5 py-2 border-b border-gray-100 last:border-b-0 w-full ${isSummaryExpanded ? 'items-start' : 'items-center'}`} style={{ position: 'relative', minHeight: isSummaryExpanded ? 'auto' : 'initial', height: isSummaryExpanded ? 'auto' : 'initial' }}>
                                            {/* Date and Time - only show for first coin with merged cell effect */}
                                            {isFirstCoin ? (
                                              <div
                                                className="flex flex-col items-center justify-center gap-1 w-[12%] px-1 border-r border-gray-200"
                                                style={{
                                                  position: 'absolute',
                                                  left: 0,
                                                  top: 0,
                                                  height: isSummaryExpanded ? 'auto' : `${rec.coins.length * 100}%`,
                                                  minHeight: `${rec.coins.length * 100}%`,
                                                  zIndex: 1,
                                                  backgroundColor: 'white'
                                                }}
                                              >
                                                {rec.date && rec.time ? (
                                                  <span className="text-[8px] font-semibold text-black-900 text-center">
                                                    {formatDate(rec.date)} {formatTime(rec.date, rec.time)}
                                                  </span>
                                                ) : (
                                                  <span className="text-[8px] text-gray-400">No data</span>
                                                )}
                                              </div>
                                            ) : null}
                                            {/* Spacer for date column */}
                                            <div className="w-[15%]" />

                                            {/* Coin Icon and Name */}
                                            <div className="flex items-center justify-start gap-0.5 w-[10%]">
                                              <div className="flex items-center justify-center w-3">
                                                {coinData.icon}
                                              </div>
                                              <span className="text-[9px] font-bold text-gray-900">
                                                {coinData.coin}
                                              </span>
                                            </div>
                                            {/* Sentiment Badge (Circular with Arrow LEFT + ST/LT RIGHT) */}
                                            <div className="w-[15%] flex justify-start">
                                              <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center ${coinData.type === "bullish"
                                                  ? "bg-green-100 text-green-700"
                                                  : "bg-red-100 text-red-700"
                                                  }`}
                                              >
                                                <div className="flex items-center gap-1">
                                                  {/* Arrow */}
                                                  {coinData.type === "bullish" ? (
                                                    <FaArrowUp className="text-[8px]" />
                                                  ) : (
                                                    <FaArrowDown className="text-[8px]" />
                                                  )}

                                                  {/* ST / LT */}
                                                  <span className="text-[8px] font-semibold">
                                                    {coinData.term === "short" ? "ST" : "LT"}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>


                                            {/* Base Price */}
                                            <div className="w-[15%] flex justify-start">
                                              <span className="text-[8px] font-semibold text-gray-900">
                                                {(() => {
                                                  const value = parseFloat(coinData.basePrice?.replace(/[^0-9.-]/g, ''));
                                                  if (isNaN(value)) return coinData.basePrice;
                                                  if (Math.abs(value) >= 1000) {
                                                    return Math.round(value).toLocaleString('en-US');
                                                  }
                                                  return value.toFixed(2);
                                                })()}
                                              </span>
                                            </div>

                                            {/* Current Price */}
                                            <div className="w-[15%] flex justify-start">
                                              <span className="text-[8px] font-semibold text-blue-500">
                                                {(() => {
                                                  const livePrice = getLivePrice(coinData.coin);
                                                  const value = parseFloat(livePrice?.replace(/[^0-9.-]/g, ''));
                                                  if (isNaN(value)) return livePrice;
                                                  if (Math.abs(value) >= 1000) {
                                                    return Math.round(value).toLocaleString('en-US');
                                                  }
                                                  return value.toFixed(2);
                                                })()}
                                              </span>
                                            </div>

                                            {/* Price Change % */}
                                            <div className="w-[15%] flex justify-start">
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
                                                  const percentageChange = (changePrice / currentPrice) * 100;
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
                                            </div>

                                            {/* Price Change (24hrs) - LIVE WebSocket data (EXACT same pattern as /coins) */}
                                            <div className="w-[15%] flex flex-col justify-start">
                                              {(() => {
                                                // Get live price change percentage from WebSocket
                                                const priceChangePercent = getLivePriceChange(coinData.coin);

                                                // Get current price to calculate absolute change
                                                const currentPriceStr = coinData.currentPrice;
                                                const currentPrice = currentPriceStr && currentPriceStr !== 'N/A'
                                                  ? parseFloat(currentPriceStr.replace('$', ''))
                                                  : null;

                                                // Calculate absolute price change from percentage (EXACT same pattern as /coins)
                                                const priceChange = (priceChangePercent !== null && currentPrice !== null)
                                                  ? (currentPrice * priceChangePercent / 100)
                                                  : null;

                                                if (priceChange !== null && priceChangePercent !== null) {
                                                  const isPositive = priceChange > 0;
                                                  const isNegative = priceChange < 0;
                                                  const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-900';

                                                  return (
                                                    <>
                                                      <span className={`text-[8px] font-semibold ${colorClass}`}>
                                                        {isPositive ? '+' : ''}{priceChange.toLocaleString('en-US', {
                                                          minimumFractionDigits: 2,
                                                          maximumFractionDigits: 2
                                                        })}
                                                      </span>
                                                      <span className={`text-[8px] font-semibold ${colorClass}`}>
                                                        ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                                                      </span>
                                                    </>
                                                  );
                                                }
                                                return <span className="text-[8px] font-semibold text-gray-900">N/A</span>;
                                              })()}
                                            </div>

                                            {/* Summary/Title Column - only show for first coin with merged cell effect */}
                                            {isFirstCoin ? (
                                              <div
                                                className="w-[20%] flex items-center justify-center border-l border-gray-200 px-2"
                                                style={{
                                                  position: 'absolute',
                                                  right: 0,
                                                  top: 0,
                                                  height: isSummaryExpanded ? 'auto' : `${rec.coins.length * 100}%`,
                                                  minHeight: isSummaryExpanded ? 'auto' : `${rec.coins.length * 100}%`,
                                                  zIndex: 1,
                                                  backgroundColor: 'white',
                                                  overflow: isSummaryExpanded ? 'visible' : 'hidden'
                                                }}
                                              >
                                                {contentText ? (
                                                  <div className="text-[9px] text-gray-700 leading-[1.4]" style={{
                                                    wordWrap: 'break-word',
                                                    overflowWrap: 'break-word',
                                                    whiteSpace: 'normal',
                                                    textAlign: 'left',
                                                    display: 'block',
                                                    width: '100%',
                                                    padding: isSummaryExpanded ? '8px 0' : '0'
                                                  }}>
                                                    <a
                                                      href={rec.link}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="hover:text-blue-600 hover:underline cursor-pointer"
                                                      style={{ display: 'inline' }}
                                                    >
                                                      {isSummaryExpanded ? contentText : (showReadMore ? `${contentText.substring(0, contentLimit)}...` : contentText)}
                                                    </a>
                                                    {showReadMore && (
                                                      <>
                                                        <br />
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedTitles(prev => ({
                                                              ...prev,
                                                              [latestPostKey]: !prev[latestPostKey]
                                                            }));
                                                          }}
                                                          className="mt-1 text-blue-600 hover:text-blue-800 font-semibold text-[8px]"
                                                        >
                                                          {isSummaryExpanded ? 'Read less' : 'Read more'}
                                                        </button>
                                                      </>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="text-[8px] text-gray-600">
                                                    <a
                                                      href={rec.link}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                                    >
                                                      click to view post
                                                    </a>
                                                  </div>
                                                )}
                                              </div>
                                            ) : null}
                                            {/* Spacer for summary column */}
                                            <div className="w-[20%]" />
                                          </div>
                                        );
                                      });
                                    }

                                    // Handle individual coin posts (Latest Posts mode)
                                    const latestPostKey = `${influencer.id}-latest-${idx}`;
                                    const isSummaryExpanded = expandedTitles[latestPostKey] || false;
                                    // Use summary for YouTube and Telegram, title for others
                                    const contentText = (rec.type === 'youtube' || rec.type === 'telegram') ? (rec.summary || '') : (rec.title || '');
                                    const contentLimit = 50;
                                    const showReadMore = contentText.length > contentLimit;

                                    return (
                                      <div key={idx} className={`flex justify-start gap-1 px-0.5 py-2 border-b border-gray-100 last:border-b-0 w-full ${isSummaryExpanded ? 'items-start' : 'items-center'}`} style={{ minHeight: isSummaryExpanded ? 'auto' : 'initial' }}>
                                        <div className="flex flex-col items-start gap-1 w-[15%] px-1">
                                          {rec.date && rec.time ? (
                                            <>
                                              <span className="text-[8px] font-semibold text-black-900">
                                                {formatDate(rec.date)} {formatTime(rec.date, rec.time)}
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-[8px] text-gray-400">No data</span>
                                          )}
                                        </div>
                                        {/* Coin Icon and Name */}
                                        <div className="flex items-center justify-start gap-0.5 w-[10%]">
                                          <div className="flex items-center justify-center w-3">
                                            {rec.icon}
                                          </div>
                                          <span className="text-[9px] font-bold text-gray-900">
                                            {rec.coin}
                                          </span>
                                        </div>

                                        {/* Sentiment with Term - Circular Badge */}
                                        <div className="w-[15%] flex justify-start">
                                          <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${rec.type === "bullish"
                                              ? "bg-green-100 text-green-700"
                                              : "bg-red-100 text-red-700"
                                              }`}
                                          >
                                            <div className="flex items-center gap-1">
                                              {/* Arrow */}
                                              {rec.type === "bullish" ? (
                                                <FaArrowUp className="text-[7px]" />
                                              ) : (
                                                <FaArrowDown className="text-[7px]" />
                                              )}

                                              {/* ST / LT */}
                                              <span className="text-[8px] font-semibold">
                                                {rec.term === "short" ? "ST" : "LT"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>


                                        {/* PRICE AT POST DATE (formerly Base Price) */}
                                        <div className="w-[15%] flex justify-start">
                                          <span className="text-[8px] font-semibold text-gray-900">
                                            {(() => {
                                              const value = parseFloat(rec.basePrice?.replace(/[^0-9.-]/g, ''));
                                              if (isNaN(value)) return rec.basePrice;

                                              // Large numbers: comma separated, no decimals
                                              if (Math.abs(value) >= 1000) {
                                                return Math.round(value).toLocaleString('en-US');
                                              }

                                              // Small numbers: show with 2 decimals
                                              return value.toFixed(2);
                                            })()}
                                          </span>
                                        </div>

                                        {/* CURRENT PRICE */}
                                        <div className="w-[15%] flex justify-start">
                                          <span className="text-[8px] font-semibold text-blue-500">
                                            {(() => {
                                              const livePrice = getLivePrice(rec.coin);
                                              const value = parseFloat(livePrice?.replace(/[^0-9.-]/g, ''));
                                              if (isNaN(value)) return livePrice;

                                              if (Math.abs(value) >= 1000) {
                                                return Math.round(value).toLocaleString('en-US');
                                              }

                                              return value.toFixed(2);
                                            })()}
                                          </span>
                                        </div>

                                        {/* Change Price (PRICE AT POST DATE - CURRENT PRICE) */}
                                        <div className="w-[15%] flex justify-start">
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

                                              // Calculate percentage change based on current price
                                              const percentageChange = (changePrice / currentPrice) * 100;

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

                                        {/* Price Change (24hrs) - LIVE WebSocket data (EXACT same pattern as /coins) */}
                                        <div className="w-[15%] flex flex-col justify-start">
                                          {(() => {
                                            // Get live price change percentage from WebSocket
                                            const priceChangePercent = getLivePriceChange(rec.coin);

                                            // Get current price to calculate absolute change
                                            const currentPriceStr = rec.currentPrice;
                                            const currentPrice = currentPriceStr && currentPriceStr !== 'N/A'
                                              ? parseFloat(currentPriceStr.replace('$', ''))
                                              : null;

                                            // Calculate absolute price change from percentage (EXACT same pattern as /coins)
                                            const priceChange = (priceChangePercent !== null && currentPrice !== null)
                                              ? (currentPrice * priceChangePercent / 100)
                                              : null;

                                            if (priceChange !== null && priceChangePercent !== null) {
                                              const isPositive = priceChange > 0;
                                              const isNegative = priceChange < 0;
                                              const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-900';

                                              return (
                                                <>
                                                  <span className={`text-[8px] font-semibold ${colorClass}`}>
                                                    {isPositive ? '+' : ''}{priceChange.toLocaleString('en-US', {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2
                                                    })}
                                                  </span>
                                                  <span className={`text-[8px] font-semibold ${colorClass}`}>
                                                    ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                                                  </span>
                                                </>
                                              );
                                            }
                                            return <span className="text-[8px] font-semibold text-gray-900">N/A</span>;
                                          })()}
                                        </div>

                                        {/* Summary/Title Column - separate */}
                                        <div className={`w-[20%] flex justify-start break-words ${isSummaryExpanded ? 'overflow-visible' : 'overflow-hidden'}`}>
                                          {contentText ? (
                                            <span className="text-[8px] text-gray-600 break-words">
                                              <a
                                                href={rec.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="hover:text-blue-600 hover:underline cursor-pointer"
                                              >
                                                {showReadMore && !isSummaryExpanded
                                                  ? `${contentText.substring(0, contentLimit)}...`
                                                  : contentText
                                                }
                                              </a>
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
                                              <a
                                                href={rec.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                              >
                                                {rec.link}
                                              </a>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}

                                {/* Show More/Less button - positioned below coin column */}
                                {recommendations.length > 3 && (() => {
                                  const visibleCount = visibleRecommendations[influencer.id] || 3;
                                  const totalCount = recommendations.length;
                                  const showingAll = visibleCount >= totalCount;

                                  const handleToggle = (e) => {
                                    e.stopPropagation();
                                    setVisibleRecommendations(prev => {
                                      const currentVisible = prev[influencer.id] || 3;

                                      if (showingAll) {
                                        // Showing all, so reset to 3 (hide all except top 3)
                                        return {
                                          ...prev,
                                          [influencer.id]: 3
                                        };
                                      } else {
                                        // Not showing all, so increase by 3
                                        const newCount = Math.min(totalCount, currentVisible + 3);
                                        return {
                                          ...prev,
                                          [influencer.id]: newCount
                                        };
                                      }
                                    });
                                  };

                                  return (
                                    <div className="flex items-center justify-center gap-1 px-0.5 py-2 border-t border-gray-200 w-full">
                                      <div className="w-[25%]"></div>
                                      <div className="w-[10%] flex justify-left">
                                        <button
                                          onClick={handleToggle}
                                          className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-md"
                                          title={showingAll ? "Show less" : `Show more (${totalCount - visibleCount} remaining)`}
                                        >
                                          <span className="text-[12px] font-bold">
                                            {showingAll ? "−" : "+"}
                                          </span>
                                        </button>
                                      </div>
                                      <div className="w-[15%]"></div>
                                      <div className="w-[15%]"></div>
                                      <div className="w-[15%]"></div>
                                      <div className="w-[15%]"></div>
                                      <div className="w-[15%]"></div>
                                    </div>
                                  );
                                })()}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(endIndex, filteredInfluencers.length)}</span> of{" "}
                  <span className="font-medium">{filteredInfluencers.length}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleFirst}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    First
                  </button>
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Previous
                  </button>
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Next
                  </button>
                  <button
                    onClick={handleLast}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}