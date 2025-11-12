"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalfAlt, FaInfoCircle } from "react-icons/fa";
import { getYearOptions, getDynamicTimeframeOptions } from "../../../../../utils/dateFilterUtils";

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

  // State to track expanded summaries
  const [expandedSummaries, setExpandedSummaries] = useState({});

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
        gemini_summary: ch.gemini_summary || '',
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
        gemini_summary: tg.gemini_summary || '',
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
      {/* Backup Link Banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-800">
              Need to access previous versions?
            </span>
          </div>
          <Link
            href="/influencerssearch/backup"
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FaInfoCircle />
            View Backups
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto px-4 pb-8 overflow-x-hidden">
        <div className="min-w-0">
          {/* Leaderboard Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              {/* Filter Section inside Influencers */}
              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2 text-center">Source</label>
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="w-full border-2 border-indigo-200 bg-indigo-50 rounded-full px-4 py-2.5 text-sm font-medium text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="telegram">Telegram</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2 text-center">Rating</label>
                    <select
                      value={selectedRating}
                      onChange={(e) => setSelectedRating(e.target.value)}
                      className="w-full border-2 border-indigo-200 bg-indigo-50 rounded-full px-4 py-2.5 text-sm font-medium text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                    >
                      {ratingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value === "all" ? "All Ratings" : "⭐".repeat(option.stars)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2 text-center">Holding Period</label>
                    <select
                      value={selectedTimeframe}
                      onChange={(e) => setSelectedTimeframe(e.target.value)}
                      className="w-full border-2 border-indigo-200 bg-indigo-50 rounded-full px-4 py-2.5 text-sm font-medium text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                    >
                      {timeframeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2 text-center">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => handleYearChange(e.target.value)}
                      className="w-full border-2 border-indigo-200 bg-indigo-50 rounded-full px-4 py-2.5 text-sm font-medium text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                    >
                      {yearOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full relative">
                <thead>
                  {/* Main header row */}
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300 w-[10%]">
                      Influencer
                    </th>
                    <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300 w-[15%]">
                      MCM Ranking
                    </th>
                    <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300 w-[15%]">
                      Details
                    </th>
                    <th className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-[55%]">
                      Summary
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 relative" style={{ isolation: 'isolate' }}>
                  {initialLoad ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={`skeleton-row-${i}`}>
                        {/* Influencer column skeleton */}
                        <td className="px-1 py-1 whitespace-nowrap w-[10%]">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="h-2 bg-gray-200 rounded w-16"></div>
                          </div>
                        </td>
                        {/* MCM Ranking column skeleton */}
                        <td className="px-1 py-1 whitespace-nowrap w-[15%]">
                          <div className="h-20 bg-gray-200 rounded w-full"></div>
                        </td>
                        {/* Metrics column skeleton */}
                        <td className="px-2 py-1 whitespace-nowrap w-[20%]">
                          <div className="h-16 bg-gray-200 rounded w-full"></div>
                        </td>
                        {/* Summary column skeleton */}
                        <td className="px-3 py-1 whitespace-nowrap w-[75%]">
                          <div className="h-16 bg-gray-200 rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredInfluencers.length === 0 ? (
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
                            <td className="px-1 py-1 border-r border-gray-200 w-[10%]">
                              <Link
                                href={
                                  selectedPlatform === "youtube"
                                    ? `/influencers/${influencer.id}`
                                    : `/telegram-influencer/${influencer.id}`
                                }
                                className="block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col items-center gap-0.5">
                                  {/* Profile Image */}
                                  <div className="flex-shrink-0">
                                    {influencer.channel_thumbnails?.high?.url ? (
                                      <Image
                                        src={influencer.channel_thumbnails.high.url}
                                        alt={influencer.name || "Influencer"}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}

                                    {/* Name Initial Fallback */}
                                    <div
                                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center flex"
                                      style={{ display: influencer.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
                                    >
                                      <span className="text-white text-sm font-bold">
                                        {influencer.name?.match(/\b\w/g)?.join("").toUpperCase() || "?"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Name Only */}
                                  <div className="text-center">
                                    <span className="text-[10px] font-semibold text-gray-900 line-clamp-2">
                                      {influencer.name?.replace(/_/g, " ") || "Unknown"}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </td>

                            {/* MCM Ranking Column - Yearly Rating Graph with Stars */}
                            <td className="px-3 py-1 border-r border-gray-200 w-[15%]">
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

                            {/* Metrics Column */}
                            <td className="px-2 py-1 border-r border-gray-300 w-[15%]">
                              <div className="flex items-center justify-center h-full">
                                {/* 2x3 Metrics Grid */}
                                <div className="grid grid-cols-2 gap-1">
                                {/* ROI */}
                                <div className="bg-blue-50 rounded p-1.5 text-center flex flex-col items-center justify-center aspect-square">
                                  <div className="text-[9px] text-gray-600 font-medium">ROI</div>
                                  <div className="text-xs font-bold text-blue-700">
                                    {influencer.prob_weighted_returns
                                      ? influencer.prob_weighted_returns.toFixed(1)
                                      : '0.0'}
                                  </div>
                                </div>

                                {/* Win Rate */}
                                <div className="bg-green-50 rounded p-1.5 text-center flex flex-col items-center justify-center aspect-square">
                                  <div className="text-[9px] text-gray-600 font-medium">Win Rate</div>
                                  <div className="text-xs font-bold text-green-700">
                                    {influencer.win_percentage
                                      ? `${Math.round(influencer.win_percentage)}%`
                                      : '0%'}
                                  </div>
                                </div>

                                {/* Recommendations */}
                                <div className="bg-purple-50 rounded p-1.5 text-center flex flex-col items-center justify-center aspect-square">
                                  <div className="text-[9px] text-gray-600 font-medium">No.of Posts</div>
                                  <div className="text-xs font-bold text-purple-700">
                                    {influencer.price_counts
                                      ? influencer.price_counts.toLocaleString()
                                      : '0'}
                                  </div>
                                </div>

                                {/* Subscribers */}
                                <div className="bg-orange-50 rounded p-1.5 text-center flex flex-col items-center justify-center aspect-square">
                                  <div className="text-[9px] text-gray-600 font-medium">Subscribers</div>
                                  <div className="text-xs font-bold text-orange-700">
                                    {influencer.subs
                                      ? formatNumber(influencer.subs)
                                      : '0'}
                                  </div>
                                </div>
                              </div>
                              </div>
                            </td>

                            {/* Summary Column */}
                            <td className="px-3 py-1 align-top w-[75%]">
                              {influencer.gemini_summary && influencer.gemini_summary !== '' ? (
                                <div className="bg-gray-50 rounded p-2">
                                  {(() => {
                                    const summaryText = Array.isArray(influencer.gemini_summary)
                                      ? influencer.gemini_summary.join(', ')
                                      : typeof influencer.gemini_summary === 'object'
                                        ? Object.values(influencer.gemini_summary).join(', ')
                                        : influencer.gemini_summary;

                                    const isExpanded = expandedSummaries[influencer.id];
                                    const MAX_LENGTH = 690; // characters to show before "Read More"
                                    const shouldTruncate = summaryText.length > MAX_LENGTH;
                                    const displayText = (shouldTruncate && !isExpanded)
                                      ? summaryText.substring(0, MAX_LENGTH) + '...'
                                      : summaryText;

                                    return (
                                      <>
                                        <div className="text-[11px] text-gray-700 leading-snug whitespace-pre-line">
                                          {displayText}
                                        </div>
                                        {shouldTruncate && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpandedSummaries(prev => ({
                                                ...prev,
                                                [influencer.id]: !prev[influencer.id]
                                              }));
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-[10px] font-semibold mt-1 inline-block"
                                          >
                                            {isExpanded ? 'Read Less' : 'Read More'}
                                          </button>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400 text-center">No summary available</div>
                              )}
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