"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalfAlt, FaInfoCircle, FaArrowUp, FaArrowDown, FaBitcoin } from "react-icons/fa";
import { FaEthereum } from "react-icons/fa6";
import { getYearOptions, getDynamicTimeframeOptions } from "../../../utils/dateFilterUtils";

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

// Hardcoded Recent Recommendations data - Last 4 recommendations per influencer
const getRecentRecommendations = () => [
  {
    date: "2024-01-15",
    time: "14:30",
    coin: "BTC",
    icon: <FaBitcoin className="text-orange-500 text-sm" />,
    type: "bullish",
    term: "long",
    basePrice: "$45,230",
    currentPrice: "$47,890",
    percentage_1hr: "+2.3%",
    percentage_24hr: "+5.8%",
    percentage_7days: "+12.4%",
    percentage_30days: "+18.7%",
    percentage_60days: "+28.5%",
    percentage_90days: "+35.2%",
    percentage_180days: "+52.8%",
    summary: "Strong bullish momentum with consistent upward trend. Market sentiment remains positive."
  },
  {
    date: "2024-01-15",
    time: "12:45",
    coin: "ETH",
    icon: <FaEthereum className="text-blue-500 text-sm" />,
    type: "bullish",
    term: "short",
    basePrice: "$2,340",
    currentPrice: "$2,520",
    percentage_1hr: "+1.8%",
    percentage_24hr: "+7.7%",
    percentage_7days: "+15.2%",
    percentage_30days: "+22.1%",
    percentage_60days: "+32.4%",
    percentage_90days: "+41.6%",
    percentage_180days: "+58.9%",
    summary: "Excellent short-term gains. Price action showing strong support levels."
  },
  {
    date: "2024-01-14",
    time: "18:20",
    coin: "ADA",
    icon: <span className="text-blue-600 text-sm font-bold">₳</span>,
    type: "bearish",
    term: "short",
    basePrice: "$0.58",
    currentPrice: "$0.52",
    percentage_1hr: "-1.5%",
    percentage_24hr: "-10.3%",
    percentage_7days: "-18.6%",
    percentage_30days: "-25.4%",
    percentage_60days: "-32.7%",
    percentage_90days: "-38.9%",
    percentage_180days: "-45.2%",
    summary: "Bearish trend confirmed. Consider taking profits or implementing stop-loss strategies."
  },
  {
    date: "2024-01-14",
    time: "09:15",
    coin: "SOL",
    icon: <span className="text-purple-600 text-sm font-bold">◎</span>,
    type: "bearish",
    term: "long",
    basePrice: "$105.30",
    currentPrice: "$98.20",
    percentage_1hr: "-0.8%",
    percentage_24hr: "-6.7%",
    percentage_7days: "-12.9%",
    percentage_30days: "-19.3%",
    percentage_60days: "-26.8%",
    percentage_90days: "-33.5%",
    percentage_180days: "-42.1%",
    summary: "Long-term bearish outlook. Market facing resistance at key levels."
  }
];


export default function InfluencerSearchPage() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [youtubeInfluencers, setYoutubeInfluencers] = useState([]);
  const [telegramInfluencers, setTelegramInfluencers] = useState([]);
  const [youtubeMcmRatings, setYoutubeMcmRatings] = useState({});
  const [telegramMcmRatings, setTelegramMcmRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Pagination for ALL influencers
  const totalPages = Math.ceil(filteredInfluencers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInfluencers = filteredInfluencers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans mt-5">
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
                    <th className="px-1 py-1 text-center text-[10px] font-medium text-black-900 uppercase tracking-wider border-r border-gray-300 w-42">
                      Influencer
                    </th>
                    <th className="px-1 py-1 text-center text-[10px] font-medium text-black-900 uppercase tracking-wider border-r border-gray-300 w-40">
                      MCM Rating
                    </th>
                    <th className="px-1 py-1 text-center text-[10px] font-medium text-black-900 uppercase tracking-wider">
                      Latest Recommendations
                    </th>
                  </tr>
                  {/* Sub-header row with Filters and Recommendations columns */}
                  <tr className="bg-gray-100 border-b border-gray-300">
                    {/* Influencer Filter */}
                    <th className="px-1 py-0.5 border-r border-gray-300">
                      <div className="flex justify-center">
                        <div className="w-full max-w-[120px]">
                          <select
                            value={selectedPlatform}
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                            className="w-full border border-indigo-200 bg-indigo-50 rounded-full px-2 py-0.5 text-[10px] font-medium text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                          >
                            <option value="youtube">YouTube</option>
                            <option value="telegram">Telegram</option>
                          </select>
                        </div>
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
                        <div className="w-[6%] text-[7px] font-semibold text-black-700 text-left pl-1">
                          Date
                        </div>
                        <div className="w-[4%] text-[7px] font-semibold text-black-700 text-left">
                          Time
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
                          Current Price
                        </div>
                        <div className="w-[4%] text-[7px] font-semibold text-black-700 text-left">
                          1hr %
                        </div>
                        <div className="w-[4%] text-[7px] font-semibold text-black-700 text-left">
                          24hr %
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

                        const recommendations = getRecentRecommendations();

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
                                  <div className="flex-shrink-0">
                                    {influencer.channel_thumbnails?.high?.url ? (
                                      <Image
                                        src={influencer.channel_thumbnails.high.url}
                                        alt={influencer.name || "Influencer"}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 rounded-full object-cover"
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
                                {recommendations.map((rec, idx) => (
                                  <div key={idx} className="flex items-center gap-1 px-0.5 py-0 border-b border-gray-100 last:border-b-0 w-full">
                                    {/* Date */}
                                    <div className="w-[6%]">
                                      <span className="text-[7px] text-black-900 font-semibold leading-tight">{rec.date}</span>
                                    </div>

                                    {/* Time */}
                                    <div className="w-[4%]">
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

                                    {/* Current Price */}
                                    <div className="w-[6%]">
                                      <span className="text-[8px] font-semibold text-gray-900">{rec.currentPrice}</span>
                                    </div>

                                    {/* 1hr % */}
                                    <div className="w-[4%]">
                                      <span className={`text-[8px] font-semibold ${rec.percentage_1hr.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                        {rec.percentage_1hr}
                                      </span>
                                    </div>

                                    {/* 24hr % */}
                                    <div className="w-[4%]">
                                      <span className={`text-[8px] font-semibold ${rec.percentage_24hr.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                        {rec.percentage_24hr}
                                      </span>
                                    </div>

                                    {/* Summary Analysis */}
                                    <div className="flex-1">
                                      <span className="text-[8px] text-black-900 font-semibold leading-tight">
                                        {rec.summary}
                                      </span>
                                    </div>
                                  </div>
                                ))}
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