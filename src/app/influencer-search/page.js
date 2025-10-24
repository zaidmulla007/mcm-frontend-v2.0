"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getYearOptions, getQuarterOptions, getDynamicTimeframeOptions } from "../../../utils/dateFilterUtils";

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

export default function InfluencerSearchPage() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [youtubeInfluencers, setYoutubeInfluencers] = useState([]);
  const [telegramInfluencers, setTelegramInfluencers] = useState([]);
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
  const [selectedSentiment, setSelectedSentiment] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1_hour");
  const [selectedType, setSelectedType] = useState("overall");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedQuarter, setSelectedQuarter] = useState("all");

  // API parameters using filter states
  const apiParams = useMemo(() => ({
    sentiment: selectedSentiment,
    timeframe: selectedTimeframe,
    type: selectedType,
    year: selectedYear,
    quarter: selectedQuarter
  }), [selectedSentiment, selectedTimeframe, selectedType, selectedYear, selectedQuarter]);

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
  }, [selectedPlatform, selectedSentiment, selectedTimeframe, selectedType, selectedYear, selectedQuarter]);

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
  const sentimentOptions = [
    { value: "all", label: "All Sentiment" },
    { value: "bullish", label: "Bullish" },
    { value: "bearish", label: "Bearish" },
    { value: "mild_bullish", label: "Mild Bullish" },
    { value: "mild_bearish", label: "Mild Bearish" },
    { value: "strong_bearish", label: "Strong Bearish" },
    { value: "strong_sentiment", label: "Strong Sentiment" },
  ];

  const timeframeOptions = getDynamicTimeframeOptions(selectedYear);

  const typeOptions = [
    { value: "overall", label: "Overall" },
    { value: "hyperactive", label: "Moonshots" },
    { value: "normal", label: "Normal" },
    { value: "pre_ico", label: "Pre ICO" },
  ];

  const yearOptions = selectedPlatform === "telegram"
    ? getYearOptions(2024, false)
    : getYearOptions(2022);
  const quarterOptions = getQuarterOptions(selectedYear);

  // Handle year change
  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (year === "all") {
      setSelectedQuarter("all");
      return;
    }
    const newQuarterOptions = getQuarterOptions(year);
    const isCurrentQuarterValid = newQuarterOptions.some(q => q.value === selectedQuarter);
    if (!isCurrentQuarterValid) {
      setSelectedQuarter("all");
    }
    const newTimeframeOptions = getDynamicTimeframeOptions(year);
    const isCurrentTimeframeValid = newTimeframeOptions.some(t => t.value === selectedTimeframe);
    if (!isCurrentTimeframeValid) {
      setSelectedTimeframe("30_days");
    }
  };

  // Get top 5 influencers for top sellers section
  const topFiveInfluencers = filteredInfluencers.slice(0, 5);

  // Pagination for ALL influencers (including top 5)
  const totalPages = Math.ceil(filteredInfluencers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInfluencers = filteredInfluencers.slice(startIndex, endIndex);

  // Hardcoded data for the right sidebar
  const monthlyTarget = 1000000;
  const currentEarnings = filteredInfluencers.reduce((sum, inf) => sum + (inf.prob_weighted_returns * 1000 || 0), 0);
  const topInfluencer = filteredInfluencers[0];
  const bestDealInfluencer = filteredInfluencers[0];

  // Helper function to get progress bar color based on win percentage
  const getProgressBarColor = () => {
    return 'bg-gradient-to-r from-blue-600 to-purple-600';
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Header */}
      <header className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Influencer Performance Dashboard</h1>
        </div>
      </header>

      {/* Platform Toggle - Between header and filters */}
      <section className="max-w-5xl mx-auto px-4 py-4">
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
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sentiment</label>
              <select
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sentimentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {typeOptions.map((option) => (
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                disabled={selectedYear === "all"}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedYear === "all"
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : ""
                  }`}
              >
                {quarterOptions.map((option) => (
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
      <main className="max-w-7xl mx-auto px-4 pb-8 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row gap-6 min-w-0">
          {/* Left Content - Top Sellers and Leaderboard */}
          <div className="flex-1 min-w-0">
            {/* Top Sellers Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Top Sellers</h2>
              </div>
              <div className="p-6">
                {initialLoad ? (
                  <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={`skeleton-${i}`} className="w-full h-32 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                ) : topFiveInfluencers.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <AnimatePresence mode="popLayout">
                    {topFiveInfluencers.map((influencer, index) => (
                      <motion.div
                        key={influencer.id}
                        layout
                        layoutId={`top-seller-${influencer.id}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          layout: {
                            type: "spring",
                            stiffness: 120,
                            damping: 20,
                            mass: 1.2
                          },
                          opacity: { duration: 0.6 },
                          scale: { duration: 0.6 }
                        }}
                        className="w-full"
                      >
                      <Link
                        href={
                          selectedPlatform === "youtube"
                            ? `/influencers/${influencer.id}`
                            : `/telegram-influencer/${influencer.id}`
                        }
                        className="top-seller-card block w-full bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-shadow"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className="relative">
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
                            <div
                              className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center"
                              style={{ display: influencer.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
                            >
                              <span className="text-white font-bold text-lg">
                                {influencer.name?.match(/\b\w/g)?.join("").toUpperCase() || "?"}
                              </span>
                            </div>
                            {index === 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                <span className="text-xs">👑</span>
                              </div>
                            )}
                          </div>
                          <div className="w-full">
                            <div className="font-semibold text-gray-900 text-sm truncate" title={influencer.name?.replace(/_/g, " ") || "Unknown"}>
                              {influencer.name?.replace(/_/g, " ") || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{influencer.platform}</div>
                          </div>
                          <div className="w-full pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-500">ROI</div>
                            <div className="text-lg font-bold text-purple-600">
                              {influencer.prob_weighted_returns?.toFixed(1) || 0}%
                            </div>
                          </div>
                        </div>
                      </Link>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                )}
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
              </div>
              <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full relative">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Influencer</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">ROI</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Win %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 relative" style={{ isolation: 'isolate' }}>
                    {initialLoad ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr key={`skeleton-row-${i}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-4"></div>
                          </td>
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
                        </tr>
                      ))
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {/* Paginated influencers */}
                        {paginatedInfluencers.map((influencer, index) => {
                          const globalRank = startIndex + index + 1;

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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <motion.div
                                className="flex items-center"
                                layout
                                transition={{ duration: 0.3 }}
                              >
                                {globalRank === 1 && <span className="text-yellow-500 mr-1">🥇</span>}
                                {globalRank === 2 && <span className="text-gray-400 mr-1">🥈</span>}
                                {globalRank === 3 && <span className="text-orange-600 mr-1">🥉</span>}
                                <span className="text-sm font-medium text-gray-900">{globalRank}</span>
                              </motion.div>
                            </td>
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
                                  <div className="w-full bg-gray-200 rounded-full h-2">
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
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                {typeof influencer.win_percentage === 'number'
                                  ? `${influencer.win_percentage.toFixed(1)}%`
                                  : 'N/A'}
                              </span>
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

          {/* Right Sidebar - Stats and Badges */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            {/* Monthly Sales Target */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Monthly Sales Target</h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-2xl font-bold text-gray-900">£{currentEarnings.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">of £{monthlyTarget.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${Math.min((currentEarnings / monthlyTarget) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {Math.round((currentEarnings / monthlyTarget) * 100)}% Complete
                  </div>
                </div>
              </div>
            </div>

            {/* Top Seller Badges */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Achievements</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Top Seller Last Month */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm">Top seller last month</div>
                    <div className="text-sm text-gray-500 truncate">
                      {topInfluencer?.name?.replace(/_/g, " ") || "John Smith"}
                    </div>
                  </div>
                </div>

                {/* Best Deal Ever */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💎</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm">Best deal ever</div>
                    <div className="text-sm text-gray-500 truncate">
                      {bestDealInfluencer?.name?.replace(/_/g, " ") || "John Smith"}
                    </div>
                  </div>
                </div>

                {/* Most Transactions */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm">Most transactions</div>
                    <div className="text-sm text-gray-500 truncate">
                      {filteredInfluencers[0]?.name?.replace(/_/g, " ") || "John Smith"}
                    </div>
                  </div>
                </div>

                {/* Highest Win Rate */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm">Highest win rate</div>
                    <div className="text-sm text-gray-500 truncate">
                      {filteredInfluencers.length > 0
                        ? filteredInfluencers.reduce((prev, current) =>
                            (prev.win_percentage > current.win_percentage) ? prev : current
                          )?.name?.replace(/_/g, " ") || "John Smith"
                        : "John Smith"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Influencers</span>
                  <span className="text-sm font-medium text-gray-900">{filteredInfluencers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average ROI</span>
                  <span className="text-sm font-medium text-gray-900">
                    {filteredInfluencers.length > 0
                      ? (filteredInfluencers.reduce((sum, inf) => sum + (inf.prob_weighted_returns || 0), 0) / filteredInfluencers.length).toFixed(1) + "%"
                      : "0%"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Win Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {filteredInfluencers.length > 0
                      ? (filteredInfluencers.reduce((sum, inf) => sum + (inf.win_percentage || 0), 0) / filteredInfluencers.length).toFixed(1) + "%"
                      : "0%"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="text-sm font-medium text-gray-900">£{currentEarnings.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}