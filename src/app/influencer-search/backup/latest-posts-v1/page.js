"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalfAlt, FaInfoCircle, FaArrowUp, FaArrowDown, FaBitcoin, FaYoutube, FaTelegram } from "react-icons/fa";
import { FaEthereum } from "react-icons/fa6";
import { getYearOptions, getDynamicTimeframeOptions } from "../../../../../utils/dateFilterUtils";
import { useTop10LivePrice } from "../../../../hooks/useTop10LivePrice";

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
const formatRecommendations = (lastPostsData, livePrices = {}) => {
  if (!lastPostsData || lastPostsData.length === 0) {
    return [];
  }

  return lastPostsData.map(post => {
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
      summary: coinData.explanation || coinData.tradingCall || "No summary available",
      sentiment: sentiment,
      outlook: outlook,
      link: post.link,
      videoID: post.videoID
    };
  });
};


export default function LatestPostsV1Page() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [youtubeInfluencers, setYoutubeInfluencers] = useState([]);
  const [telegramInfluencers, setTelegramInfluencers] = useState([]);
  const [youtubeMcmRatings, setYoutubeMcmRatings] = useState({});
  const [telegramMcmRatings, setTelegramMcmRatings] = useState({});
  const [youtubeLastPosts, setYoutubeLastPosts] = useState({});
  const [telegramLastPosts, setTelegramLastPosts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use live price hook
  const { top10Data, isConnected } = useTop10LivePrice();

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

  // Visible recommendations state - tracks how many items to show per influencer (default: 3)
  const [visibleRecommendations, setVisibleRecommendations] = useState({});

  // Sorting state for recommendations (default: desc to show recent posts first)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });

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
      const lastPostsForInfluencer = lastPostsData[influencer.id] || [];

      // Create live prices map
      const livePricesMap = {};
      top10Data.forEach(coin => {
        livePricesMap[coin.symbol.toUpperCase()] = coin.price;
      });

      const recommendations = formatRecommendations(lastPostsForInfluencer, livePricesMap);

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
      const params = new URLSearchParams(apiParams);
      const res = await fetch(`/api/youtube-data?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        // Sort by rank (ascending: 1, 2, 3, ...)
        const sortedResults = [...data.results].sort((a, b) => {
          const rankA = a.rank || 999999;
          const rankB = b.rank || 999999;
          return rankA - rankB;
        });
        setYoutubeInfluencers(sortedResults);
      } else {
        setYoutubeInfluencers([]);
      }

      // Fetch MCM ratings
      const mcmRes = await fetch(`/api/youtube-data/mcm-ratings?timeframe=${apiParams.timeframe}`);
      const mcmData = await mcmRes.json();
      if (mcmData.success && Array.isArray(mcmData.results)) {
        const ratingsMap = {};
        mcmData.results.forEach(item => {
          ratingsMap[item.channel_id] = item;
        });
        setYoutubeMcmRatings(ratingsMap);
      }

      // Fetch last posts for recommendations
      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        const channelIds = data.results.map(item => item.channel_id).join(',');
        const lastPostsRes = await fetch(`/api/youtube-data/last-posts?channel_ids=${encodeURIComponent(channelIds)}`);
        const lastPostsData = await lastPostsRes.json();

        if (lastPostsData.success && Array.isArray(lastPostsData.results)) {
          const postsMap = {};
          lastPostsData.results.forEach(item => {
            if (!postsMap[item.channelID]) {
              postsMap[item.channelID] = [];
            }
            // Flatten mentioned coins into individual recommendations
            if (item.mentioned && Array.isArray(item.mentioned)) {
              item.mentioned.forEach(coin => {
                postsMap[item.channelID].push({
                  date: item.date,
                  time: item.time,
                  coin: coin,
                  videoID: item.videoID,
                  link: item.link,
                  publishedAt: item.publishedAt,
                  title: item.title,
                  roi_1hr: item["1_hour_roi"],
                  roi_24hr: item["24_hours_roi"]
                });
              });
            }
          });
          setYoutubeLastPosts(postsMap);
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
  }, [apiParams]);

  const fetchTelegramData = useCallback(async () => {
    // Only show loading on first load
    if (isFirstRenderRef.current) {
      setLoading(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams(apiParams);
      const res = await fetch(`/api/telegram-data?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        // Sort by rank (ascending: 1, 2, 3, ...)
        const sortedResults = [...data.results].sort((a, b) => {
          const rankA = a.rank || 999999;
          const rankB = b.rank || 999999;
          return rankA - rankB;
        });
        setTelegramInfluencers(sortedResults);
      } else {
        setTelegramInfluencers([]);
      }

      // Fetch MCM ratings
      const mcmRes = await fetch(`/api/telegram-data/mcm-ratings?timeframe=${apiParams.timeframe}`);
      const mcmData = await mcmRes.json();
      if (mcmData.success && Array.isArray(mcmData.results)) {
        const ratingsMap = {};
        mcmData.results.forEach(item => {
          ratingsMap[item.channel_id] = item;
        });
        setTelegramMcmRatings(ratingsMap);
      }

      // Fetch last posts for recommendations
      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        const channelIds = data.results.map(item => item.channel_id).join(',');
        const lastPostsRes = await fetch(`/api/telegram-data/last-posts?channel_ids=${encodeURIComponent(channelIds)}`);
        const lastPostsData = await lastPostsRes.json();

        if (lastPostsData.success && Array.isArray(lastPostsData.results)) {
          const postsMap = {};
          lastPostsData.results.forEach(item => {
            if (!postsMap[item.channelID]) {
              postsMap[item.channelID] = [];
            }
            // Flatten mentioned coins into individual recommendations
            if (item.mentioned && Array.isArray(item.mentioned)) {
              item.mentioned.forEach(coin => {
                postsMap[item.channelID].push({
                  date: item.date,
                  time: item.time,
                  coin: coin,
                  messageID: item.messageID,
                  link: item.link,
                  publishedAt: item.publishedAt,
                  channel_name: item.channel_name,
                  roi_1hr: item["1_hour_roi"],
                  roi_24hr: item["24_hours_roi"]
                });
              });
            }
          });
          setTelegramLastPosts(postsMap);
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

  // Apply global sorting to recommendations and reorder influencers if sorting is active
  const sortedData = useMemo(() => {
    return sortRecommendationsAndInfluencers(top10Influencers);
  }, [top10Influencers, sortConfig, youtubeLastPosts, telegramLastPosts, selectedPlatform, top10Data]);

  // Use sorted influencers if sorting is active, otherwise use original order
  const displayInfluencers = sortConfig.key ? sortedData.sortedInfluencers : top10Influencers;
  const globalSortedRecommendations = sortedData.groupedRecommendations;

  // Pagination for top 10 influencers
  const totalPages = Math.ceil(displayInfluencers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInfluencers = displayInfluencers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans mt-5">
      {/* Backup Version Banner */}
      <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-center">
        <p className="text-sm font-semibold text-yellow-800">
          Backup Version: Latest Posts V1 (Created: 2025-11-12)
        </p>
      </div>

      {/* Main Content */}
      <main className="mx-auto px-4 pb-8 overflow-x-hidden">
        <div className="min-w-0">
          {/* Leaderboard Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full relative">
                <thead>
                  {/* Main header row */}
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-1 py-1 text-center text-[10px] font-medium text-black-900 uppercase tracking-wider border-r border-gray-300 w-36">
                      Influencer
                    </th>
                    <th className="px-1 py-1 text-center text-[10px] font-medium text-black-900 uppercase tracking-wider border-r border-gray-300 w-36">
                      MCM Rating
                    </th>
                    <th className="px-1 py-1 text-center text-[10px] font-medium text-black-900 uppercase tracking-wider relative">
                      <div className="flex items-center justify-center gap-1">
                        <span>Latest Posts</span>
                        <span className="relative group cursor-pointer z-[9999]">
                          <span className="text-blue-600 text-sm">ⓘ</span>
                          <span className="invisible group-hover:visible absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                            ST : Short Term<br />LT : Long Term
                          </span>
                        </span>
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
                          className={`flex items-center justify-center px-3 py-1 rounded-full transition-all ${
                            selectedPlatform === "youtube"
                              ? "bg-red-500 text-white shadow-md"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                          title="YouTube"
                        >
                          <FaYoutube className="text-lg" />
                        </button>
                        <button
                          onClick={() => setSelectedPlatform("telegram")}
                          className={`flex items-center justify-center px-3 py-1 rounded-full transition-all ${
                            selectedPlatform === "telegram"
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                          title="Telegram"
                        >
                          <FaTelegram className="text-lg" />
                        </button>
                      </div>
                    </th>
                    {/* MCM Rating Filter */}
                    <th className="px-1 py-0.5 border-r border-gray-300">
                      <div className="flex justify-center">
                        <div className="w-full max-w-[120px]">
                          <select
                            value={selectedRating}
                            onChange={(e) => setSelectedRating(e.target.value)}
                            className="w-full border border-indigo-200 bg-indigo-50 rounded-full px-2 py-0.5 text-[10px] font-medium text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                          >
                            {ratingOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.value === "all" ? "All Ratings" : "⭐".repeat(option.stars)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </th>
                    <th className="px-0.5 py-0.5">
                      <div className="flex items-center gap-1 px-0.5 w-full">
                        <div
                          className="w-[6%] text-[7px] font-semibold text-black-700 text-left pl-1 cursor-pointer hover:bg-gray-200 flex items-center gap-0.5"
                          onClick={() => handleSort('date')}
                        >
                          Date
                          <span className="text-[8px]">
                            {sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </div>
                        <div
                          className="w-[6%] text-[7px] font-semibold text-black-700 text-left cursor-pointer hover:bg-gray-200 flex items-center gap-0.5"
                          onClick={() => handleSort('time')}
                        >
                          Time
                          <span className="text-[8px]">
                            {sortConfig.key === 'time' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        </div>
                        <div className="w-[5%] text-[7px] font-semibold text-black-700 text-left">
                          Coin
                        </div>
                        <div className="w-[9%] text-[7px] font-semibold text-black-700 text-left">
                          Sentiment (ST/LT)
                        </div>
                        <div className="w-[6%] text-[7px] font-semibold text-black-700 text-left">
                          Base Price
                        </div>
                        <div className="w-[6%] text-[7px] font-semibold text-black-700 text-left">
                          1hr Price
                        </div>
                        <div className="w-[6%] text-[7px] font-semibold text-black-700 text-left">
                          1hr Change
                        </div>
                        <div className="w-[6%] text-[7px] font-semibold text-black-700 text-left">
                          24hr Price
                        </div>
                        <div className="w-[6%] text-[7px] font-semibold text-black-700 text-left">
                          24hr Change
                        </div>
                        <div className="w-[6%] text-[7px] font-semibold text-black-700 text-left">
                          Current Price
                        </div>
                        <div className="flex-1 text-[7px] font-semibold text-black-700 text-left">
                          Summary Analysis
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 relative" style={{ isolation: 'isolate' }}>
                  {initialLoad ? (
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
                        {/* Recommendations skeleton */}
                        <td className="px-1 py-2 whitespace-nowrap">
                          <div className="h-48 bg-gray-200 rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredInfluencers.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center">
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

                        // Get MCM ratings from API
                        const mcmRatingsMap = selectedPlatform === "youtube" ? youtubeMcmRatings : telegramMcmRatings;
                        const mcmData = mcmRatingsMap[influencer.id] || {};

                        // Extract all available yearly ratings dynamically
                        const scatterData = [];
                        const years = [];

                        // Find all year fields in the data
                        Object.keys(mcmData).forEach(key => {
                          const match = key.match(/star_rating\.yearly\.(\d{4})\./);
                          if (match) {
                            const year = parseInt(match[1]);
                            if (!years.includes(year)) {
                              years.push(year);
                            }
                          }
                        });

                        // Sort years in ascending order
                        years.sort((a, b) => a - b);

                        // Build scatter data for each year
                        years.forEach((year, yearIndex) => {
                          const fieldKey = `star_rating.yearly.${year}.${selectedTimeframe}`;
                          if (mcmData[fieldKey] && mcmData[fieldKey].current_rating) {
                            scatterData.push({
                              year: yearIndex,
                              yearLabel: year,
                              rating: mcmData[fieldKey].current_rating,
                              finalScore: mcmData[fieldKey].current_final_score
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
                          const lastPostsForInfluencer = lastPostsData[influencer.id] || [];

                          // Create live prices map from top10Data
                          const livePricesMap = {};
                          top10Data.forEach(coin => {
                            livePricesMap[coin.symbol.toUpperCase()] = coin.price;
                          });

                          recommendations = formatRecommendations(lastPostsForInfluencer, livePricesMap);
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
                                        className="w-13 h-13 rounded-full object-cover"
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
                                        {influencer.name?.match(/\b\w/g)?.join("").toUpperCase() || "?"}
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
                              <div className="flex justify-center items-center py-1">
                                {scatterData.length > 0 ? (
                                  <div className="relative">
                                    {/* Graph container with axes */}
                                    <div className="relative">
                                      {/* Data columns with stars */}
                                      <div className="flex items-end gap-3 pl-1 h-16 pb-3">
                                        {scatterData.filter(point => point.yearLabel !== 2021).map((point, idx) => {
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

                            {/* Recommendations Column */}
                            <td className="px-0.5 py-0 align-top">
                              <div className="flex flex-col gap-0">
                                {/* Display recommendations based on visible count (default 3, increment by 3) */}
                                {(() => {
                                  const visibleCount = visibleRecommendations[influencer.id] || 3;
                                  const displayedRecommendations = recommendations.slice(0, visibleCount);

                                  return displayedRecommendations.map((rec, idx) => (
                                    <div key={idx} className="flex items-center gap-1 px-0.5 py-0 border-b border-gray-100 last:border-b-0 w-full">
                                      {/* Date */}
                                      <div className="w-[6%]">
                                        <span className="text-[7px] text-black-900 font-semibold leading-tight">{rec.date}</span>
                                      </div>

                                      {/* Time */}
                                      <div className="w-[6%]">
                                        <span className="text-[7px] text-black-900 font-semibold leading-tight">{rec.time}</span>
                                      </div>

                                      {/* Coin Icon and Name */}
                                      <div className="flex items-center gap-0.5 w-[5%]">
                                        <div className="flex items-center justify-center w-3">
                                          {rec.icon}
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-900">
                                          {rec.coin}
                                        </span>
                                      </div>

                                      {/* Sentiment with Term */}
                                      <div className="w-[9%]">
                                        {rec.type === "bullish" ? (
                                          <span className="inline-flex items-center gap-0.5 px-1 py-0 bg-green-100 text-green-700 rounded-full text-[8px] font-medium capitalize">
                                            <FaArrowUp className="text-[6px]" />
                                            Bullish {rec.term === "short" ? "ST" : "LT"}
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-0.5 px-1 py-0 bg-red-100 text-red-700 rounded-full text-[8px] font-medium capitalize">
                                            <FaArrowDown className="text-[6px]" />
                                            Bearish {rec.term === "short" ? "ST" : "LT"}
                                          </span>
                                        )}
                                      </div>

                                      {/* Base Price */}
                                      <div className="w-[6%]">
                                        <span className="text-[8px] font-semibold text-gray-900">{rec.basePrice}</span>
                                      </div>

                                      {/* 1hr Price */}
                                      <div className="w-[6%]">
                                        <span className={`text-[8px] font-semibold ${rec.percentage_1hr.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                          {rec.percentage_1hr}
                                        </span>
                                      </div>

                                      {/* 1hr Change */}
                                      <div className="w-[6%]">
                                        <span className="text-[8px] font-semibold text-gray-900">
                                          {rec.roi_1hr || 'N/A'}
                                        </span>
                                      </div>

                                      {/* 24hr Price */}
                                      <div className="w-[6%]">
                                        <span className={`text-[8px] font-semibold ${rec.percentage_24hr.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                          {rec.percentage_24hr}
                                        </span>
                                      </div>

                                      {/* 24hr Change */}
                                      <div className="w-[6%]">
                                        <span className="text-[8px] font-semibold text-gray-900">
                                          {rec.roi_24hr || 'N/A'}
                                        </span>
                                      </div>

                                      {/* Current Price */}
                                      <div className="w-[6%]">
                                        <span className="text-[8px] font-semibold text-gray-900">{rec.currentPrice}</span>
                                      </div>

                                      {/* Summary Analysis */}
                                      <div className="flex-1">
                                        <span className="text-[8px] text-black-900 font-semibold leading-tight line-clamp-1" title={rec.summary}>
                                          {rec.summary ? rec.summary.charAt(0).toUpperCase() + rec.summary.slice(1) : ''}
                                        </span>
                                      </div>
                                    </div>
                                  ));
                                })()}

                                {/* Show More/Less button - incremental by 3 */}
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
                                    <div className="flex items-center justify-center py-0.5 border-t border-gray-200">
                                      <button
                                        onClick={handleToggle}
                                        className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                                        title={showingAll ? "Show less" : `Show more (${totalCount - visibleCount} remaining)`}
                                      >
                                        <span className="text-[10px] font-bold">
                                          {showingAll ? "−" : "+"}
                                        </span>
                                      </button>
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
