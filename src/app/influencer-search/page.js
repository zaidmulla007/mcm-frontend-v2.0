"use client";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

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

  // Dropdown state
  const [selectedInfluencer, setSelectedInfluencer] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Default API parameters for fetching data
  const apiParams = useMemo(() => ({
    sentiment: "all",
    timeframe: "1_hour",
    type: "overall",
    year: "all",
    quarter: "all"
  }), []);

  // Memoized API call functions
  const fetchYouTubeData = useCallback(async () => {
    setLoading(true);
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

  // Reset current page when platform changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPlatform]);

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

  // Get top 3 influencers for podium
  const topThreeInfluencers = filteredInfluencers.slice(0, 3);
  const remainingInfluencers = filteredInfluencers.slice(3);

  // Pagination for table (excluding top 3)
  const totalRemainingInfluencers = remainingInfluencers.length;
  const totalPages = Math.ceil(totalRemainingInfluencers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInfluencers = remainingInfluencers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-gray-900 font-sans pb-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto pt-16 pb-6 px-4 flex flex-col items-center gap-6">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent text-center">
          Influencer Leaderboard
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl text-center">
          Discover top-performing crypto influencers ranked by their performance metrics.
        </p>
        
        {/* Platform Toggle */}
        <div className="flex justify-center gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.value}
              onClick={() => setSelectedPlatform(platform.value)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-md ${selectedPlatform === platform.value
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-400'
                }`}
            >
              {platform.logo}
              <span>{platform.label}</span>
            </button>
          ))}
        </div>
        {/* Top 3 Podium */}
        {!loading && !initialLoad && topThreeInfluencers.length >= 3 && (
          <div className="w-full max-w-4xl mt-8 mb-8">
            <div className="flex items-end justify-center gap-4 md:gap-8">
              {/* 2nd Place */}
              <div className="flex flex-col items-center flex-1 max-w-[180px]">
                <div className="relative mb-4">
                  {topThreeInfluencers[1]?.channel_thumbnails?.high?.url ? (
                    <Image
                      src={topThreeInfluencers[1].channel_thumbnails.high.url}
                      alt={topThreeInfluencers[1].name || "2nd Place"}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-300 shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-4 border-gray-300 shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {topThreeInfluencers[1]?.name?.match(/\b\w/g)?.join("") || "2"}
                      </span>
                    </div>
                  )}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-lg">🥈</span>
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-center text-gray-800 mb-1 line-clamp-2 px-2">
                  {topThreeInfluencers[1]?.name?.replace(/_/g, " ") || "Unknown"}
                </h3>
                <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-t-2xl w-full h-32 flex items-center justify-center shadow-xl">
                  <span className="text-5xl font-bold text-white">2</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center flex-1 max-w-[200px]">
                <div className="relative mb-4">
                  {topThreeInfluencers[0]?.channel_thumbnails?.high?.url ? (
                    <Image
                      src={topThreeInfluencers[0].channel_thumbnails.high.url}
                      alt={topThreeInfluencers[0].name || "1st Place"}
                      width={100}
                      height={100}
                      className="w-25 h-25 rounded-full object-cover border-4 border-yellow-400 shadow-2xl"
                    />
                  ) : (
                    <div className="w-25 h-25 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center border-4 border-yellow-400 shadow-2xl">
                      <span className="text-2xl font-bold text-white">
                        {topThreeInfluencers[0]?.name?.match(/\b\w/g)?.join("") || "1"}
                      </span>
                    </div>
                  )}
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                    <span className="text-2xl">🥇</span>
                  </div>
                </div>
                <h3 className="font-bold text-base text-center text-gray-900 mb-1 line-clamp-2 px-2">
                  {topThreeInfluencers[0]?.name?.replace(/_/g, " ") || "Unknown"}
                </h3>
                <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-t-2xl w-full h-40 flex items-center justify-center shadow-2xl">
                  <span className="text-6xl font-bold text-white">1</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center flex-1 max-w-[180px]">
                <div className="relative mb-4">
                  {topThreeInfluencers[2]?.channel_thumbnails?.high?.url ? (
                    <Image
                      src={topThreeInfluencers[2].channel_thumbnails.high.url}
                      alt={topThreeInfluencers[2].name || "3rd Place"}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-4 border-orange-300 shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center border-4 border-orange-300 shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {topThreeInfluencers[2]?.name?.match(/\b\w/g)?.join("") || "3"}
                      </span>
                    </div>
                  )}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-lg">🥉</span>
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-center text-gray-800 mb-1 line-clamp-2 px-2">
                  {topThreeInfluencers[2]?.name?.replace(/_/g, " ") || "Unknown"}
                </h3>
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-2xl w-full h-24 flex items-center justify-center shadow-xl">
                  <span className="text-4xl font-bold text-white">3</span>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Search Section */}
        <div className="w-full px-4 mb-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-purple-200">
            <h3 className="text-lg font-semibold text-purple-600 mb-4">Search Influencers</h3>

            {/* Search and Dropdown Row */}
            <div className="mb-4 relative">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-700 font-medium">Search by Name:</label>
                <div className="flex gap-2">
                  {/* Search Input - 70% */}
                  <div className="relative flex-[0.7]">
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
                        setSelectedInfluencer("");
                      }}
                      onFocus={() => {
                        if (searchQuery.trim()) {
                          setShowSearchResults(true);
                        }
                        setShowDropdown(false);
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
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setShowSearchResults(false);
                          setSearchResults([]);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900"
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

                  {/* All Influencers Dropdown - 30% */}
                  <div className="relative flex-[0.3] dropdown-container">
                    <button
                      onClick={() => {
                        setShowDropdown(!showDropdown);
                        setShowSearchResults(false);
                        setSearchQuery("");
                      }}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-left flex items-center justify-between"
                    >
                      <span className="truncate">
                        {selectedInfluencer || "Select Influencer"}
                      </span>
                      <svg
                        className={`w-4 h-4 transform transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* All Influencers Dropdown */}
                    {showDropdown && filteredInfluencers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                        {filteredInfluencers.map((influencer) => (
                          <button
                            key={influencer.id}
                            onClick={() => {
                              setSelectedInfluencer(influencer.name);
                              setShowDropdown(false);
                              // Navigate to influencer dashboard
                              window.location.href = selectedPlatform === "youtube"
                                ? `/influencers/${influencer.id}`
                                : `/telegram-influencer/${influencer.id}`;
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0 flex items-center gap-3"
                          >
                            {influencer.channel_thumbnails?.high?.url ? (
                              <Image
                                src={influencer.channel_thumbnails.high.url}
                                alt={influencer.name || "Channel"}
                                width={24}
                                height={24}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white">
                                  {influencer.name ? influencer.name.match(/\b\w/g)?.join("") || "?" : "?"}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-900 font-medium text-sm truncate">
                                {influencer.name ? influencer.name.replace(/_/g, " ") : "Unknown"}
                              </div>
                              <div className="text-xs text-gray-600">
                                Rank {influencer.rank}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="w-full px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-purple-100">
          {(loading || initialLoad) ? (
            <div className="animate-pulse">
              {/* Table Header Skeleton */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-6 py-4">
                <div className="h-6 bg-gray-200 rounded w-48" />
              </div>
              {/* Table Rows Skeleton */}
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="border-b border-gray-200 px-6 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-200 rounded" />
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Leaderboard Rankings
                </h2>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Influencer
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        ROI
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Win %
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Loss %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedInfluencers.length > 0 ? (
                      paginatedInfluencers.map((inf, index) => {
                        const globalRank = startIndex + index + 4; // +4 because we skip top 3
                        return (
                          <tr
                            key={inf.id}
                            onClick={() => {
                              window.location.href = selectedPlatform === "youtube"
                                ? `/influencers/${inf.id}`
                                : `/telegram-influencer/${inf.id}`;
                            }}
                            className="hover:bg-purple-50 transition-colors cursor-pointer group"
                          >
                            {/* Rank */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-2xl font-bold text-gray-400 group-hover:text-purple-600 transition-colors">
                                  {globalRank}
                                </span>
                              </div>
                            </td>

                            {/* Influencer Info */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {inf.channel_thumbnails?.high?.url ? (
                                  <Image
                                    src={inf.channel_thumbnails.high.url}
                                    alt={inf.name || "Influencer"}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 group-hover:border-purple-400 transition-colors"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center border-2 border-purple-200 group-hover:border-purple-400 transition-colors">
                                    <span className="text-sm font-bold text-white">
                                      {inf.name?.match(/\b\w/g)?.join("") || "?"}
                                    </span>
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                                    {inf.name?.replace(/_/g, " ") || "Unknown"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* ROI */}
                            <td className="px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                {inf.prob_weighted_returns !== undefined
                                  ? `${inf.prob_weighted_returns.toFixed(1)}%`
                                  : '0%'}
                              </span>
                            </td>

                            {/* Win % */}
                            <td className="px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                {typeof inf.win_percentage === 'number'
                                  ? `${inf.win_percentage.toFixed(1)}%`
                                  : 'N/A'}
                              </span>
                            </td>

                            {/* Loss % */}
                            <td className="px-6 py-4 whitespace-nowrap text-center hidden lg:table-cell">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                                {typeof inf.win_percentage === 'number'
                                  ? `${(100 - inf.win_percentage).toFixed(1)}%`
                                  : 'N/A'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                          No influencers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center px-6 py-6 border-t-2 border-gray-200 space-y-4">
                  {/* Pagination Info */}
                  <div className="text-sm text-gray-600 text-center">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalRemainingInfluencers)} of {totalRemainingInfluencers} influencers
                  </div>

                  {/* Mobile Pagination - Show only on small screens */}
                  <div className="flex sm:hidden items-center justify-center space-x-1 w-full">
                    {/* First Button - Mobile */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500'
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
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500'
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
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500'
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
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500'
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
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500'
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
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500'
                        }`}
                    >
                      &lt;
                    </button>

                    {/* First Page */}
                    {getPageNumbers()[0] > 1 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500 transition-all duration-200"
                        >
                          1
                        </button>
                        {getPageNumbers()[0] > 2 && (
                          <span className="text-gray-600 text-xs">...</span>
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
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500'
                          }`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Last Page */}
                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                      <>
                        {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                          <span className="text-gray-600 text-xs">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500 transition-all duration-200"
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
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500'
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
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-purple-500'
                        }`}
                    >
                      &gt;&gt;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div >
  );
}