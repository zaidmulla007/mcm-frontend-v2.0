"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getYearOptions, getQuarterOptions, getDynamicTimeframeOptions } from "../../../utils/dateFilterUtils";

const platforms = [
  {
    label: "YouTube",
    value: "youtube",
    logo: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  },
  {
    label: "Telegram",
    value: "telegram",
    logo: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    )
  },
];

// Example influencer data for demonstration
const influencerList = [
  { id: "cryptoking", name: "CryptoKing", platform: "YouTube" },
  { id: "blockqueen", name: "BlockQueen", platform: "YouTube" },
  { id: "moonshot", name: "Moonshot", platform: "Telegram" },
];

export default function InfluencersPage() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [youtubeInfluencers, setYoutubeInfluencers] = useState([]);
  const [telegramInfluencers, setTelegramInfluencers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API Parameters matching the backend specification
  const [selectedSentiment, setSelectedSentiment] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1_hour");
  const [selectedType, setSelectedType] = useState("overall");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedQuarter, setSelectedQuarter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);

  // Memoize API parameters
  const apiParams = useMemo(() => ({
    sentiment: selectedSentiment,
    timeframe: selectedTimeframe,
    type: selectedType,
    year: selectedYear,
    quarter: selectedQuarter
  }), [selectedSentiment, selectedTimeframe, selectedType, selectedYear, selectedQuarter]);

  // Memoized API call functions
  const fetchYouTubeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(apiParams);
      const res = await fetch(`/api/youtube-data?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setYoutubeInfluencers(data.results);
      } else {
        setYoutubeInfluencers([]);
      }
    } catch (err) {
      setError("Failed to fetch YouTube data");
      setYoutubeInfluencers([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [apiParams]);

  const fetchTelegramData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(apiParams);
      const res = await fetch(`/api/telegram-data?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setTelegramInfluencers(data.results);
      } else {
        setTelegramInfluencers([]);
      }
    } catch (err) {
      setError("Failed to fetch Telegram data");
      setTelegramInfluencers([]);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [apiParams]);

  useEffect(() => {

    // Add a small delay to allow page to render first
    const timer = setTimeout(() => {
      if (selectedPlatform === "youtube") {
        fetchYouTubeData();
      } else if (selectedPlatform === "telegram") {
        fetchTelegramData();
      }
    }, 100); // 100ms delay for immediate page render

    return () => clearTimeout(timer);
  }, [selectedPlatform, fetchYouTubeData, fetchTelegramData]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSentiment, selectedTimeframe, selectedType, selectedYear, selectedQuarter, selectedPlatform]);

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
      
      // Sort results by relevance (exact matches first, then partial matches)
      const sortedResults = filtered.sort((a, b) => {
        const aText = selectedPlatform === "telegram" ? (a.channel_id || "").toLowerCase() : (a.influencer_name || "").toLowerCase();
        const bText = selectedPlatform === "telegram" ? (b.channel_id || "").toLowerCase() : (b.influencer_name || "").toLowerCase();
        
        const aExact = aText === searchTerm;
        const bExact = bText === searchTerm;
        const aStarts = aText.startsWith(searchTerm);
        const bStarts = bText.startsWith(searchTerm);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // If both are similar relevance, sort by rank (lower rank = higher position)
        return (a.rank || 999) - (b.rank || 999);
      });
      
      setSearchResults(sortedResults.slice(0, 10)); // Limit to 10 results for performance
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, youtubeInfluencers, telegramInfluencers, selectedPlatform]);

  // API valid values
  const sentimentOptions = [
    { value: "all", label: "All Sentiments" },
    { value: "strong_bullish", label: "Strong Bullish" },
    { value: "mild_bullish", label: "Mild Bullish" },
    { value: "mild_bearish", label: "Mild Bearish" },
    { value: "strong_bearish", label: "Strong Bearish" },
    { value: "strong_sentiment", label: "Strong Sentiment" },
  ];

  // Generate dynamic timeframe options based on selected year
  const timeframeOptions = getDynamicTimeframeOptions(selectedYear);

  const typeOptions = [
    { value: "overall", label: "Overall" },
    { value: "hyperactive", label: "Moonshots" },
    { value: "normal", label: "Normal" },
    { value: "pre_ico", label: "Pre ICO" },
  ];

  // Generate dynamic year and quarter options using utility functions
  // For Telegram, show only 2024 to current year; for YouTube, show from 2022
  const yearOptions = selectedPlatform === "telegram" 
    ? getYearOptions(2024, false) // Start from 2024 up to current year only
    : getYearOptions(2022); // Start from 2022 for YouTube
  const quarterOptions = getQuarterOptions(selectedYear);

  // Filter influencers by platform
  const getFilteredInfluencers = () => {
    let influencers;
    
    if (selectedPlatform === "youtube") {
      influencers = youtubeInfluencers.map((ch) => ({
        id: ch.channel_id,
        name: ch.influencer_name,
        platform: "YouTube",
        subs: ch.subs,
        score: ch.ai_overall_score || ch.score || 0, // Fallback for score field
        rank: ch.rank,
        channel_thumbnails: ch.channel_thumbnails,
        prob_weighted_returns: ch.prob_weighted_returns || 0, // Add ROI data
        win_percentage: ch.win_percentage || 0, // Add Win Percentage data
        price_counts: ch.price_counts || 0,
        moonshots_price_count: ch.moonshots_price_count || 0,
        moonshots_ratio: ch.moonshots_ratio || 0,
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
        moonshots_price_count: tg.moonshots_price_count || 0,
        moonshots_ratio: tg.moonshots_ratio || 0,
      }));
    } else {
      influencers = [];
    }

    return influencers;
  };

  const filteredInfluencers = getFilteredInfluencers();

  // Pagination calculations
  const totalInfluencers = filteredInfluencers.length;
  const totalPages = Math.ceil(totalInfluencers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleInfluencers = filteredInfluencers.slice(startIndex, endIndex);

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

  // Handle year selection - reset quarter and timeframe when year changes if current selections are not available
  const handleYearChange = (year) => {
    setSelectedYear(year);

    // Reset quarter to "all" if year is "all" 
    if (year === "all") {
      setSelectedQuarter("all");
      return;
    }

    // Check if current quarter is valid for the new year
    const newQuarterOptions = getQuarterOptions(year);
    const isCurrentQuarterValid = newQuarterOptions.some(q => q.value === selectedQuarter);

    if (!isCurrentQuarterValid) {
      setSelectedQuarter("all");
    }

    // Check if current timeframe is valid for the new year
    const newTimeframeOptions = getDynamicTimeframeOptions(year);
    const isCurrentTimeframeValid = newTimeframeOptions.some(t => t.value === selectedTimeframe);

    if (!isCurrentTimeframeValid) {
      // Reset to a safe default - "30_days" is always available
      setSelectedTimeframe("30_days");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-gray-900 font-sans pb-16">
      {/* Hero Section */}
      {/* <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white rounded-2xl shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-column w-6 h-6 mr-3" aria-hidden="true">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                  <path d="M18 17V9"></path>
                  <path d="M13 17V5"></path>
                  <path d="M8 17v-3"></path>
                </svg>
                Advanced ROI Analytics Dashboard
              </h2>
              <p className="text-white/90 text-sm">Real-time performance tracking with historical data analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-white/90">Show Moonshots:</label>
                <button
                  onClick={() => setSelectedType(selectedType === "hyperactive" ? "overall" : "hyperactive")}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-white/20"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${selectedType === "hyperactive" ? 'translate-x-6' : 'translate-x-1'}`}></span>
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-white/90">View:</label>
              <select
                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm cursor-not-allowed opacity-60"
                disabled
              >
                <option value="youtube" className="text-gray-900">All Influencers</option>
                <option value="telegram" className="text-gray-900">Top 10</option>
                <option value="specific" className="text-gray-900">Specific Influencer</option>
                <option value="moonshots" className="text-gray-900">Moonshots 🔒</option>
                <option value="backtest" className="text-gray-900">Full Portfolio Backtest 🔒</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-white/90">Influencer:</label>
              <select className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm cursor-not-allowed opacity-60" disabled>
                <option value="1" className="text-gray-900">#1 CryptoWhale</option>
                <option value="2" className="text-gray-900">#2 DiamondHands</option>
                <option value="3" className="text-gray-900">#3 BlockchainBear</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-white/90 whitespace-nowrap">Timeframe:</label>
              <div className="flex bg-white/10 rounded-lg p-1 backdrop-blur-sm overflow-x-auto opacity-60">
                {['1h', '24h', '7d', '30d', '60d', '90d', '180d', '1yr'].map((time) => {
                  return (
                    <button
                      key={time}
                      disabled
                      className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 text-white/80 cursor-not-allowed"
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section> */}

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

      <section>
        {/* Filter Controls - Show for both YouTube and Telegram */}
        {(selectedPlatform === "youtube" || selectedPlatform === "telegram") && (
          <div className="max-w-5xl mx-auto px-4 mb-6 w-full">
            <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-xl">
              <h3 className="text-lg font-semibold text-purple-700 mb-4">Filters & Rankings</h3>

              {/* Search Row */}
              <div className="mb-4 relative">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">Search Influencer:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim()) {
                          setShowSearchResults(true);
                        } else {
                          setShowSearchResults(false);
                          setSearchResults([]);
                        }
                      }}
                      onFocus={() => {
                        if (searchQuery.trim()) {
                          setShowSearchResults(true);
                        }
                      }}
                      onBlur={(e) => {
                        // Delay hiding to allow for clicks on results
                        setTimeout(() => {
                          if (!e.currentTarget.contains(document.activeElement)) {
                            setShowSearchResults(false);
                          }
                        }, 200);
                      }}
                      placeholder={selectedPlatform === "telegram" ? "Type influencer name" : "Type influencer name"}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setShowSearchResults(false);
                          setSearchResults([]);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    )}

                    {/* Search Results Dropdown */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                        {searchResults.map((result) => (
                          <button
                            key={result.channel_id}
                            onClick={() => {
                              // Navigate to influencer dashboard
                              window.location.href = selectedPlatform === "youtube"
                                ? `/influencers/${result.channel_id}`
                                : `/telegram-influencer/${result.channel_id}`;
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0 flex items-center gap-3"
                          >
                            {result.channel_thumbnails?.high?.url ? (
                              <Image
                                src={result.channel_thumbnails.high.url}
                                alt={result.influencer_name || "Channel"}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {selectedPlatform === "telegram"
                                    ? (result.channel_id ? result.channel_id.match(/\b\w/g)?.join("") || "?" : "?")
                                    : (result.influencer_name ? result.influencer_name.match(/\b\w/g)?.join("") || "?" : "?")
                                  }
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-gray-900 font-medium">
                                {selectedPlatform === "telegram"
                                  ? (result.channel_id ? result.channel_id.replace(/_/g, " ") : "Unknown")
                                  : (result.influencer_name ? result.influencer_name.replace(/_/g, " ") : "Unknown")
                                }
                              </div>
                              <div className="text-xs text-gray-600">
                                Rank {result.rank}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* First Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 font-medium">Sentiment:</label>
                  </div>
                  <select
                    value={selectedSentiment}
                    onChange={(e) => setSelectedSentiment(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {sentimentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">Holding Period:</label>
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {timeframeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">Type:</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {yearOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">
                    Quarter:
                    {selectedYear === "all" && (
                      <span className="text-xs text-gray-600 ml-2"></span>
                    )}
                  </label>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    disabled={selectedYear === "all"}
                    className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${selectedYear === "all"
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white text-gray-900"
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
          </div>
        )}
      </section>

      {/* Influencer Cards */}
      <section className="max-w-5xl mx-auto px-4">
        {(loading || initialLoad) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-lg animate-pulse relative min-h-[200px] border border-gray-200"
              >
                {/* Placeholder rank badge */}
                <div className="absolute top-4 right-4 w-16 h-6 bg-gray-200 rounded-full" />
                {/* Placeholder avatar */}
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-400/50 to-blue-400/50 mb-6 shadow-lg" />
                {/* Placeholder name */}
                <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
                {/* Placeholder stats */}
                <div className="grid grid-cols-3 gap-3 w-full mt-auto">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="h-3 w-12 bg-gray-200 rounded mb-1 mx-auto" />
                    <div className="h-4 w-8 bg-gray-200 rounded mx-auto" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="h-3 w-12 bg-gray-200 rounded mb-1 mx-auto" />
                    <div className="h-4 w-8 bg-gray-200 rounded mx-auto" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="h-3 w-12 bg-gray-200 rounded mb-1 mx-auto" />
                    <div className="h-4 w-8 bg-gray-200 rounded mx-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {visibleInfluencers.length > 0
                ? visibleInfluencers.map((inf, i) => (
                  <Link
                    key={inf.id}
                    href={
                      selectedPlatform === "youtube"
                        ? `/influencers/${inf.id}`
                        : `/telegram-influencer/${inf.id}`
                    }
                    className={`rounded-2xl p-8 flex flex-col items-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group relative min-h-[200px] ${(selectedPlatform === "youtube" || selectedPlatform === "telegram") && inf.rank && inf.rank <= 3
                        ? "bg-gradient-to-br from-yellow-50 via-white to-orange-50 border-2 border-yellow-400 shadow-2xl shadow-yellow-500/30"
                        : "bg-white border border-gray-200"
                      }`}
                  >
                    {/* Rank Badge - Top Right Corner */}
                    {(selectedPlatform === "youtube" || selectedPlatform === "telegram") && inf.rank && (
                      <div className={`absolute top-4 right-4 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg ${inf.rank <= 3
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600 animate-pulse shadow-yellow-400/50"
                          : "bg-gradient-to-r from-purple-500 to-blue-500"
                        }`}>
                        {inf.rank <= 3 && (
                          <span className="mr-1">
                            {inf.rank === 1 ? "🥇" : inf.rank === 2 ? "🥈" : "🥉"}
                          </span>
                        )}
                        Rank {inf.rank}
                      </div>
                    )}

                    {/* Crown icon for top 3 */}


                    {inf.channel_thumbnails?.high?.url ? (
                      <div className="w-28 h-28 rounded-full overflow-hidden shadow-lg mb-6">
                        <Image
                          src={inf.channel_thumbnails.high.url}
                          alt={inf.name || "Channel"}
                          width={112}
                          height={112}
                          className="rounded-full w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 mb-6 flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {inf.name ? inf.name.match(/\b\w/g)?.join("") || "?" : "?"}
                        </span>
                      </div>
                    )}
                    <div className="text-base text-gray-900 font-semibold text-center mb-4 px-2 leading-tight">
                      {inf.name ? inf.name.replace(/_/g, " ") : "Unknown"}
                    </div>
                    {(selectedPlatform === "youtube" || selectedPlatform === "telegram") && (
                      <div className="grid grid-cols-3 gap-3 w-full text-center mt-auto">
                        {selectedType === 'hyperactive' ? (
                          <>
                            <Link
                              href={
                                selectedPlatform === "youtube"
                                  ? `/influencers/${inf.id}`
                                  : `/telegram-influencer/${inf.id}`
                              }
                              className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 hover:scale-105 transition-all duration-200 border border-gray-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-semibold text-gray-700 mb-1 text-[10px] leading-tight">Price Counts</div>
                              <div className="font-bold text-sm text-blue-600">
                                {inf.price_counts || 0}
                              </div>
                            </Link>
                            <Link
                              href={
                                selectedPlatform === "youtube"
                                  ? `/influencers/${inf.id}`
                                  : `/telegram-influencer/${inf.id}`
                              }
                              className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 hover:scale-105 transition-all duration-200 border border-gray-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-semibold text-gray-700 mb-1 text-[10px] leading-tight">Moonshots Count</div>
                              <div className="font-bold text-sm text-purple-600">
                                {inf.moonshots_price_count || 0}
                              </div>
                            </Link>
                            <Link
                              href={
                                selectedPlatform === "youtube"
                                  ? `/influencers/${inf.id}`
                                  : `/telegram-influencer/${inf.id}`
                              }
                              className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 hover:scale-105 transition-all duration-200 border border-gray-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-semibold text-gray-700 mb-1 text-[10px] leading-tight">Moonshots Ratio</div>
                              <div className="font-bold text-sm text-orange-600">
                                {inf.moonshots_ratio
                                  ? `${(inf.moonshots_ratio * 100).toFixed(2)}%`
                                  : '0%'}
                              </div>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              href={
                                selectedPlatform === "youtube"
                                  ? `/influencers/${inf.id}`
                                  : `/telegram-influencer/${inf.id}`
                              }
                              className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 hover:scale-105 transition-all duration-200 border border-gray-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-semibold text-gray-700 mb-1">ROI</div>
                              <div className="font-bold text-sm text-purple-600">
                                {inf.prob_weighted_returns !== undefined
                                  ? `${inf.prob_weighted_returns.toFixed(1)}%`
                                  : '0%'}
                              </div>
                            </Link>
                            <Link
                              href={
                                selectedPlatform === "youtube"
                                  ? `/influencers/${inf.id}`
                                  : `/telegram-influencer/${inf.id}`
                              }
                              className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 hover:scale-105 transition-all duration-200 border border-gray-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-semibold text-gray-700 mb-1">Win %</div>
                              <div className="font-bold text-sm text-green-600">
                                {typeof inf.win_percentage === 'number'
                                  ? `${inf.win_percentage.toFixed(1)}%`
                                  : 'N/A'}
                              </div>
                            </Link>
                            <Link
                              href={
                                selectedPlatform === "youtube"
                                  ? `/influencers/${inf.id}`
                                  : `/telegram-influencer/${inf.id}`
                              }
                              className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 hover:scale-105 transition-all duration-200 border border-gray-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-semibold text-gray-700 mb-1">Loss %</div>
                              <div className="font-bold text-sm text-red-600">
                                {typeof inf.win_percentage === 'number'
                                  ? `${(100 - inf.win_percentage).toFixed(1)}%`
                                  : 'N/A'}
                              </div>
                            </Link>
                          </>
                        )}
                      </div>
                    )}
                  </Link>
                ))
                : null}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center mt-8 space-y-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-700 text-center">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalInfluencers)} of {totalInfluencers} influencers
                </div>

                {/* Mobile Pagination - Show only on small screens */}
                <div className="flex sm:hidden items-center justify-center space-x-1 w-full">
                  {/* First Button - Mobile */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    ‹‹
                  </button>

                  {/* Previous Button - Mobile */}
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    ‹
                  </button>

                  {/* Current Page Info */}
                  <div className="flex items-center space-x-2 px-2">
                    <span className="text-xs text-gray-600">Page</span>
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded text-xs font-medium">
                      {currentPage}
                    </span>
                    <span className="text-xs text-gray-600">of {totalPages}</span>
                  </div>

                  {/* Next Button - Mobile */}
                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    ›
                  </button>

                  {/* Last Button - Mobile */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    ››
                  </button>
                </div>

                {/* Desktop/Tablet Pagination - Show on medium screens and up */}
                <div className="hidden sm:flex items-center space-x-1 md:space-x-2 flex-wrap justify-center">
                  {/* First Button - Desktop */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    &lt;&lt;
                  </button>

                  {/* Previous Button - Desktop */}
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    &lt;
                  </button>

                  {/* First Page */}
                  {getPageNumbers()[0] > 1 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500 transition-all duration-200"
                      >
                        1
                      </button>
                      {getPageNumbers()[0] > 2 && (
                        <span className="text-gray-500 text-xs">...</span>
                      )}
                    </>
                  )}

                  {/* Page Numbers */}
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === page
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Last Page */}
                  {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                    <>
                      {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                        <span className="text-gray-500 text-xs">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500 transition-all duration-200"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  {/* Next Button - Desktop */}
                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    &gt;
                  </button>

                  {/* Last Button - Desktop */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    &gt;&gt;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div >
  );
}




