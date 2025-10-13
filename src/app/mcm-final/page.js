"use client";
import { useEffect, useState, useCallback } from "react";

const platforms = [
  {
    label: "Combined",
    value: "YTTG",
    logo: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    )
  },
  {
    label: "YouTube",
    value: "YT",
    logo: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  },
  {
    label: "Telegram",
    value: "TG",
    logo: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    )
  },
];

export default function MCMSignalPage() {
  const [coinsData, setCoinsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Platform toggle state
  const [selectedPlatform, setSelectedPlatform] = useState("YTTG");

  // New filter states based on screenshot
  // Default: October 1, 2025 to October 7, 2025
  const [dateTo, setDateTo] = useState('2025-10-07');
  const [dateFrom, setDateFrom] = useState('2025-10-01');
  const [minBullishPercent, setMinBullishPercent] = useState("90");
  const [minBearishPercent, setMinBearishPercent] = useState("");
  const [minPosts, setMinPosts] = useState("");
  const [maxPosts, setMaxPosts] = useState("");
  const [showBullishFilter, setShowBullishFilter] = useState(true);
  const [showBearishFilter, setShowBearishFilter] = useState(false);

  // Influencer selection state
  const [selectedInfluencer, setSelectedInfluencer] = useState("all");
  const [allInfluencers, setAllInfluencers] = useState({ youtube: [], telegram: [] });
  const [influencersLoading, setInfluencersLoading] = useState(true);
  const [influencerSearchQuery, setInfluencerSearchQuery] = useState("");
  const [showInfluencerDropdown, setShowInfluencerDropdown] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Sorting state
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [sortByTotalPosts, setSortByTotalPosts] = useState(true); // false = sort by price change, true = sort by total posts (default)
  const [totalPostsSortOrder, setTotalPostsSortOrder] = useState('desc'); // 'asc' or 'desc' (default descending)

  // Fetch all influencers and initial data on page load
  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        setInfluencersLoading(true);
        const res = await fetch('/api/influencer-channels');
        const data = await res.json();

        if (data.success && data.data) {
          setAllInfluencers({
            youtube: data.data.youtube?.channels || [],
            telegram: data.data.telegram?.channel_ids || []
          });
        }
      } catch (err) {
        console.error('Error fetching influencers:', err);
      } finally {
        setInfluencersLoading(false);
      }
    };

    fetchInfluencers();
  }, []);

  // Fetch initial data on page load
  useEffect(() => {
    fetchMCMSignalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch MCM Signal Data
  const fetchMCMSignalData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (selectedPlatform) params.append('source', selectedPlatform);

      // Add channel_id filter only if specific influencer is selected (not "all")
      if (selectedInfluencer && selectedInfluencer !== "all") {
        params.append('channel_id', selectedInfluencer);
      }

      if (minBullishPercent) params.append('bullish_percent', minBullishPercent);
      if (minBearishPercent) params.append('bearish_percent', minBearishPercent);
      if (minPosts) params.append('post_range_min', minPosts);
      if (maxPosts) params.append('post_range_max', maxPosts);

      const res = await fetch(`/api/mcm-signal?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.coins)) {
        setCoinsData(data.coins);
      } else {
        setCoinsData([]);
      }
    } catch (err) {
      console.error('Error fetching MCM Signal data:', err);
      setError("Failed to fetch data");
      setCoinsData([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedPlatform, selectedInfluencer, minBullishPercent, minBearishPercent, minPosts, maxPosts]);

  // Removed auto-fetch on filter changes - now only fetches on submit

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, selectedPlatform, selectedInfluencer, minBullishPercent, minBearishPercent, minPosts, maxPosts]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchMCMSignalData();
  };

  // Filter influencers based on search query for dropdown
  const getFilteredInfluencers = () => {
    if (!influencerSearchQuery.trim()) {
      return allInfluencers;
    }

    const searchTerm = influencerSearchQuery.toLowerCase();

    return {
      youtube: allInfluencers.youtube.filter(inf =>
        inf.influencer_name?.toLowerCase().includes(searchTerm) ||
        inf.channel_id?.toLowerCase().includes(searchTerm)
      ),
      telegram: allInfluencers.telegram.filter(channelId =>
        channelId?.toLowerCase().includes(searchTerm)
      )
    };
  };

  const filteredInfluencers = getFilteredInfluencers();

  // Toggle sort order for price change
  const toggleSortOrder = () => {
    setSortByTotalPosts(false);
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  };

  // Toggle sort order for total posts
  const toggleTotalPostsSort = () => {
    setSortByTotalPosts(true);
    setTotalPostsSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  };

  // Sort coins data based on selected sort option
  const sortedCoinsData = [...coinsData].sort((a, b) => {
    if (sortByTotalPosts) {
      // Sort by total posts
      const aPosts = a.total_posts || 0;
      const bPosts = b.total_posts || 0;

      if (totalPostsSortOrder === 'asc') {
        return aPosts - bPosts;
      } else {
        return bPosts - aPosts;
      }
    } else {
      // Sort by price change percentage
      const aChange = a.price_data?.price_change_percent || 0;
      const bChange = b.price_data?.price_change_percent || 0;

      if (sortOrder === 'asc') {
        return aChange - bChange;
      } else {
        return bChange - aChange;
      }
    }
  });

  // Get selected influencer display name
  const getSelectedInfluencerName = () => {
    if (selectedInfluencer === "all") return "All Influencers";

    // Check YouTube
    const ytInfluencer = allInfluencers.youtube.find(inf => inf.channel_id === selectedInfluencer);
    if (ytInfluencer) return `${ytInfluencer.influencer_name} (YT)`;

    // Check Telegram
    if (allInfluencers.telegram.includes(selectedInfluencer)) {
      return `${selectedInfluencer} (TG)`;
    }

    return "All Influencers";
  };

  // Pagination calculations
  const totalCoins = sortedCoinsData.length;
  const totalPages = Math.ceil(totalCoins / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleCoins = sortedCoinsData.slice(startIndex, endIndex);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-gray-900 font-sans pb-16">
      {/* Header */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            MCM Signal Dashboard
          </h1>
          <p className="text-gray-600">Filter and discover trending cryptocurrency signals</p>
        </div>
      </section>

      {/* Platform Toggle */}
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

      {/* Filter Controls */}
      <section>
        <div className="max-w-5xl mx-auto px-4 mb-6 w-full">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-xl">
            <h3 className="text-lg font-semibold text-purple-700 mb-4">Filters</h3>

            {/* Influencer Search and Selector */}
            <div className="mb-4">
              <div className="flex flex-col gap-2">
                {/* Search Input with Dropdown Results */}
                <label className="text-sm text-gray-700 font-medium">Search Influencer:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={influencerSearchQuery}
                    onChange={(e) => {
                      setInfluencerSearchQuery(e.target.value);
                      if (e.target.value.trim()) {
                        setShowInfluencerDropdown(true);
                      } else {
                        setShowInfluencerDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      if (influencerSearchQuery.trim()) {
                        setShowInfluencerDropdown(true);
                      }
                    }}
                    onBlur={(e) => {
                      setTimeout(() => {
                        if (!e.currentTarget.contains(document.activeElement)) {
                          setShowInfluencerDropdown(false);
                        }
                      }, 200);
                    }}
                    placeholder="Type to search influencers..."
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                  />
                  {influencerSearchQuery && (
                    <button
                      onClick={() => {
                        setInfluencerSearchQuery("");
                        setShowInfluencerDropdown(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  )}

                  {/* Search Results Dropdown */}
                  {showInfluencerDropdown && influencerSearchQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                      {/* YouTube Results */}
                      {filteredInfluencers.youtube.length > 0 && (
                        <>
                          <div className="px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-600 sticky top-0">
                            YouTube Influencers ({filteredInfluencers.youtube.length})
                          </div>
                          {filteredInfluencers.youtube.map((influencer) => (
                            <button
                              key={influencer.channel_id}
                              onClick={() => {
                                setSelectedInfluencer(influencer.channel_id);
                                setInfluencerSearchQuery("");
                                setShowInfluencerDropdown(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center gap-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white">YT</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-900 font-medium truncate">
                                  {influencer.influencer_name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {influencer.channel_id}
                                </div>
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {/* Telegram Results */}
                      {filteredInfluencers.telegram.length > 0 && (
                        <>
                          <div className="px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-600 sticky top-0">
                            Telegram Influencers ({filteredInfluencers.telegram.length})
                          </div>
                          {filteredInfluencers.telegram.map((channelId) => (
                            <button
                              key={channelId}
                              onClick={() => {
                                setSelectedInfluencer(channelId);
                                setInfluencerSearchQuery("");
                                setShowInfluencerDropdown(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center gap-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white">TG</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-gray-900 font-medium truncate">
                                  {channelId}
                                </div>
                              </div>
                            </button>
                          ))}
                        </>
                      )}

                      {/* No Results */}
                      {filteredInfluencers.youtube.length === 0 && filteredInfluencers.telegram.length === 0 && (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          No influencers found matching &quot;{influencerSearchQuery}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Influencer Selection Toggle */}
                <label className="text-sm text-gray-700 font-medium mt-2">Selected Influencer:</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedInfluencer("all")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      selectedInfluencer === "all"
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All Influencers
                  </button>
                  {selectedInfluencer !== "all" && (
                    <button
                      className="px-4 py-2 rounded-lg font-medium text-sm bg-purple-600 text-white shadow-lg"
                    >
                      Selected: {getSelectedInfluencerName()}
                    </button>
                  )}
                </div>

                {influencersLoading && (
                  <div className="text-xs text-gray-500">Loading influencers...</div>
                )}
              </div>
            </div>

            {/* First Row - Date Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-700 font-medium">
                  Date Start: <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-700 font-medium">
                  Date End: <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Total Days Label */}
            {dateFrom && dateTo && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Total Days:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {(() => {
                    const start = new Date(dateFrom);
                    const end = new Date(dateTo);
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
                    return diffDays;
                  })()}
                  {' '}
                  {(() => {
                    const start = new Date(dateFrom);
                    const end = new Date(dateTo);
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays === 1 ? 'day' : 'days';
                  })()}
                </span>
              </div>
            )}

            {/* Second Row - Toggle Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => {
                  setShowBullishFilter(!showBullishFilter);
                  if (!showBullishFilter) {
                    setShowBearishFilter(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  showBullishFilter
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Min Bullish %
              </button>
              <button
                onClick={() => {
                  setShowBearishFilter(!showBearishFilter);
                  if (!showBearishFilter) {
                    setShowBullishFilter(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  showBearishFilter
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Min Bearish %
              </button>
            </div>

            {/* Conditional Filter Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {showBullishFilter && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">Min Bullish %:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={minBullishPercent}
                    onChange={(e) => setMinBullishPercent(e.target.value)}
                    placeholder="0-100"
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {showBearishFilter && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">Min Bearish %:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={minBearishPercent}
                    onChange={(e) => setMinBearishPercent(e.target.value)}
                    placeholder="0-100"
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-700 font-medium">Min Posts:</label>
                <input
                  type="number"
                  min="0"
                  value={minPosts}
                  onChange={(e) => setMinPosts(e.target.value)}
                  placeholder="Number"
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Coins Data Table */}
      <section className="max-w-full mx-auto px-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-8">{error}</div>
        ) : (
          <>
            {visibleCoins.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Symbol</th>
                        <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Influencers</th>
                        <th
                          className="px-4 py-3 text-center font-semibold whitespace-nowrap cursor-pointer hover:bg-purple-700 transition-colors"
                          onClick={toggleTotalPostsSort}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>Total Posts</span>
                            <span className="text-sm">
                              {sortByTotalPosts ? (totalPostsSortOrder === 'desc' ? '↓' : '↑') : ''}
                            </span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Bullish Count</th>
                        <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Bullish Short</th>
                        <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Bullish Long</th>
                        <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Bearish Count</th>
                        <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Bearish Short</th>
                        <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Bearish Long</th>
                        <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Neutral/Null Outlook Count</th>
                        <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Threshold</th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Start Date</th>
                        <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Start Price</th>
                        <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">End Date</th>
                        <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">End Price</th>
                        <th
                          className="px-4 py-3 text-center font-semibold whitespace-nowrap cursor-pointer hover:bg-purple-700 transition-colors"
                          onClick={toggleSortOrder}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>Price Change %</span>
                            <span className="text-sm">
                              {!sortByTotalPosts ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                            </span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">MCM Signal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCoins.map((coin, index) => (
                        <tr
                          key={coin.mcm_symbol}
                          className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3 font-bold text-purple-600 whitespace-nowrap">
                            {coin.mcm_symbol?.toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-purple-600">
                            {coin.influencer_count || 0}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-blue-600">
                            {coin.total_posts}
                          </td>
                          <td className="px-4 py-3 text-center text-green-600 font-semibold">
                            {coin.bullish_count}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {coin.bullish_short_term || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {coin.bullish_long_term || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-red-600 font-semibold">
                            {coin.bearish_count}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {coin.bearish_short_term || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {coin.bearish_long_term || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 font-semibold">
                            {coin.null_outlook_count || 0}
                          </td>
                          <td className="px-4 py-3 text-center text-blue-600 font-semibold">
                            {coin.threshold_calculation_bullish || 0}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                            {coin.price_data?.start_price_date || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 font-mono">
                            ${coin.price_data?.start_price?.$numberDecimal
                              ? parseFloat(coin.price_data.start_price.$numberDecimal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                            {coin.price_data?.end_price_date || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 font-mono">
                            ${coin.price_data?.end_price?.$numberDecimal
                              ? parseFloat(coin.price_data.end_price.$numberDecimal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${
                              coin.price_data?.price_change_percent > 0
                                ? 'text-green-600'
                                : coin.price_data?.price_change_percent < 0
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}>
                              {coin.price_data?.price_change_percent
                                ? `${coin.price_data.price_change_percent > 0 ? '+' : ''}${coin.price_data.price_change_percent.toFixed(2)}%`
                                : 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {coin.inference_1 && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                {coin.inference_1}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : !loading && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-gray-400 text-lg">No coins found</div>
                <div className="text-gray-500 text-sm mt-2">Try adjusting your filters</div>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center mt-8 space-y-4">
                <div className="text-sm text-gray-700 text-center">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalCoins)} of {totalCoins} coins
                </div>

                <div className="flex items-center space-x-2 flex-wrap justify-center">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                    }`}
                  >
                    ««
                  </button>

                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                    }`}
                  >
                    «
                  </button>

                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                    }`}
                  >
                    »
                  </button>

                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                    }`}
                  >
                    »»
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
