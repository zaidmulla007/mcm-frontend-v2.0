"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import { getYearOptions, getDynamicTimeframeOptions } from "../../../utils/dateFilterUtils";

const platforms = [
  {
    label: "YouTube",
    value: "youtube",
    logo: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  },
  {
    label: "Telegram",
    value: "telegram",
    logo: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    )
  },
];

// Render stars based on rating (0-5 scale)
const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<FaStar key={i} className="text-yellow-500" />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-500" />);
    } else {
      stars.push(<FaStar key={i} className="text-gray-400" />);
    }
  }

  return (
    <div className="flex gap-0.5">
      {stars}
    </div>
  );
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
  const [selectedYear, setSelectedYear] = useState("all");

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
  }, [selectedPlatform, selectedRating, selectedTimeframe, selectedYear]);

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
        ai_overall_score: tg.ai_overall_score || 0,
        final_score: tg.final_score || 0,
        current_rating: tg.current_rating || 0,
      }));
    } else {
      influencers = [];
    }

    return influencers;
  };

  const filteredInfluencers = getFilteredInfluencers();


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

  // Filter options
  const ratingOptions = [
    { value: "all", label: "All", stars: 0 },
    { value: "5", label: "5", stars: 5 },
    { value: "4", label: "4", stars: 4 },
    { value: "3", label: "3", stars: 3 },
    { value: "2", label: "2", stars: 2 },
    { value: "1", label: "1", stars: 1 },
  ];

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

  // Helper function to get progress bar color based on win percentage
  const getProgressBarColor = () => {
    return 'bg-gradient-to-r from-blue-600 to-purple-600';
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Header */}
      <header className="">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Influencer Performance Dashboard</h1>
        </div>
      </header>

      {/* Platform Toggle - Between header and filters */}
      <section className="mx-auto px-4 py-4">
        <div className="flex justify-center gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.value}
              onClick={() => setSelectedPlatform(platform.value)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-md ${
                selectedPlatform === platform.value
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-400'
              }`}
            >
              {platform.logo}
              <span>{platform.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filter Section */}
      <section className="mx-auto px-4 py-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ratingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value === "all" ? "All Ratings" : "⭐".repeat(option.stars)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeframeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </section>

      {/* Main Content */}
      <main className="mx-auto px-4 pb-8 overflow-x-hidden">
        <div className="min-w-0">
            {/* Leaderboard Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Influencers</h2>
              </div>
              <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full relative">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Influencer</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">ROI</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">AI Score</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Final Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1" title="Overall Rating">
                          MCM Rating
                          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1" title="Yearly Rating">
                          MCM Rating
                          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 relative" style={{ isolation: 'isolate' }}>
                    {initialLoad ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr key={`skeleton-row-${i}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-4"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <div className="h-16 bg-gray-200 rounded w-32"></div>
                          </td>
                        </tr>
                      ))
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
                            className="hover:bg-gray-50"
                            style={{ position: 'relative', zIndex: 1 }}
                          >
                            <td className="px-6 py-4">
                              <Link
                                href={
                                  selectedPlatform === "youtube"
                                    ? `/influencers/${influencer.id}`
                                    : `/telegram-influencer/${influencer.id}`
                                }
                                className="block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center mb-2">
                                  {influencer.channel_thumbnails?.high?.url ? (
                                    <Image
                                      src={influencer.channel_thumbnails.high.url}
                                      alt={influencer.name || "Influencer"}
                                      width={32}
                                      height={32}
                                      className="w-8 h-8 rounded-full object-cover mr-3"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center mr-3"
                                    style={{ display: influencer.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
                                  >
                                    <span className="text-white text-xs font-bold">
                                      {influencer.name?.match(/\b\w/g)?.join("").toUpperCase() || "?"}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">{influencer.name?.replace(/_/g, " ") || "Unknown"}</div>
                                    <div className="text-xs text-gray-500">{influencer.platform}</div>
                                  </div>
                                </div>
                                <div className="relative ml-11">
                                  <div className="relative flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500">Win %</span>
                                    {/* Percentage at filled position */}
                                    <span
                                      className="absolute text-xs font-medium text-gray-900"
                                      style={{
                                        left: `${influencer.win_percentage}%`,
                                        transform: 'translateX(-50%)'
                                      }}
                                    >
                                      {typeof influencer.win_percentage === 'number'
                                        ? influencer.win_percentage.toFixed(1)
                                        : '0'}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500">100</span>
                                  </div>
                                  <div className="relative w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`${getProgressBarColor(influencer.win_percentage)} h-2 rounded-full transition-all duration-500`}
                                      style={{ width: `${influencer.win_percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                {influencer.prob_weighted_returns !== undefined
                                  ? `${influencer.prob_weighted_returns.toFixed(1)}%`
                                  : '0%'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                {influencer.ai_overall_score !== undefined
                                  ? influencer.ai_overall_score.toFixed(1)
                                  : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                {influencer.final_score !== undefined
                                  ? influencer.final_score.toFixed(2)
                                  : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <motion.div
                                className="flex items-center"
                                layout
                                transition={{ duration: 0.3 }}
                              >
                                {renderStars(influencer.current_rating || 0)}
                              </motion.div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                              <div className="flex justify-center">
                                <div className="relative border-l-2 border-b-2 border-gray-300" style={{ width: `${Math.max(years.length * 50, 200)}px`, height: '120px' }}>
                                  {/* Scatter plot stars - displayed vertically */}
                                  <div className="relative w-full h-full pl-2 pb-2">
                                    {scatterData.length > 0 ? (
                                      scatterData.map((point, idx) => {
                                        // For ratings like 0.5, 3.5, show the appropriate number of full stars
                                        const fullStars = Math.floor(point.rating);
                                        const hasHalfStar = point.rating % 1 >= 0.5;
                                        const columnWidth = 100 / years.length;

                                        // Calculate empty stars
                                        const totalStars = 5;
                                        const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

                                        return (
                                          <div
                                            key={idx}
                                            className="absolute flex flex-col items-center"
                                            style={{
                                              left: `${point.year * columnWidth + columnWidth / 2}%`,
                                              bottom: '5px',
                                              transform: 'translateX(-50%)',
                                              fontSize: '14px',
                                              lineHeight: '1.2'
                                            }}
                                            title={`Year: ${point.yearLabel}, Rating: ${point.rating}`}
                                          >
                                            {/* Full stars using Font Awesome */}
                                            {[...Array(fullStars)].map((_, i) => (
                                              <FaStar key={`full-${i}`} className="text-yellow-500" />
                                            ))}
                                            {/* Half star */}
                                            {hasHalfStar && (
                                              <FaStarHalfAlt key="half" className="text-yellow-500" />
                                            )}
                                            {/* Empty stars */}
                                            {[...Array(emptyStars)].map((_, i) => (
                                              <FaStar key={`empty-${i}`} className="text-gray-400" />
                                            ))}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="flex items-center justify-center h-full text-xs text-gray-400">
                                        No data
                                      </div>
                                    )}
                                  </div>

                                  {/* X-axis labels */}
                                  <div className="absolute -bottom-5 left-0 w-full flex justify-around text-xs text-gray-500">
                                    {years.map((year, idx) => (
                                      <span key={idx}>{year}</span>
                                    ))}
                                  </div>
                                </div>
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