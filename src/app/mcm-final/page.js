"use client";
import { useEffect, useState, useCallback, useRef } from "react";

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
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState(null);
  const [summary, setSummary] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [expandedPeriods, setExpandedPeriods] = useState({});

  // AbortController ref to cancel previous requests
  const abortControllerRef = useRef(null);

  // Platform toggle state
  const [selectedPlatform, setSelectedPlatform] = useState("YTTG");

  // New filter states based on screenshot
  // Default: January 1, 2024 to December 31, 2024
  const [dateTo, setDateTo] = useState('2024-12-31');
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [minBullishPercent, setMinBullishPercent] = useState("90");
  const [minBearishPercent, setMinBearishPercent] = useState("");
  const [minPosts, setMinPosts] = useState("");
  const [maxPosts, setMaxPosts] = useState("");
  const [showBullishFilter, setShowBullishFilter] = useState(true);
  const [showBearishFilter, setShowBearishFilter] = useState(false);

  // Analysis Filters - Basic Settings
  const [sentimentType, setSentimentType] = useState("Bullish");
  const [source, setSource] = useState("YouTube + Telegram");
  const [coinType, setCoinType] = useState("Overall");
  const [timePeriodFilter, setTimePeriodFilter] = useState("Daily");

  // Analysis Filters - Time-Based Rules
  const [rule1MinPosts, setRule1MinPosts] = useState("250");
  const [rule1Sentiment, setRule1Sentiment] = useState("75");
  const [rule2MinPosts, setRule2MinPosts] = useState("150");
  const [rule2Sentiment, setRule2Sentiment] = useState("75");
  const [rule3MinPosts, setRule3MinPosts] = useState("25");
  const [rule3Sentiment, setRule3Sentiment] = useState("80");
  const [rule4MinPosts, setRule4MinPosts] = useState("15");
  const [rule4Sentiment, setRule4Sentiment] = useState("85");

  // Analysis Filters - Advanced Settings
  const [avgInfluenceScore, setAvgInfluenceScore] = useState("");
  const [shortTermMinCount, setShortTermMinCount] = useState("");
  const [shortTermMinPercent, setShortTermMinPercent] = useState("");
  const [shortTermInfluencerMinRating, setShortTermInfluencerMinRating] = useState("");
  const [longTermMinCount, setLongTermMinCount] = useState("");
  const [longTermMinPercent, setLongTermMinPercent] = useState("");
  const [longTermInfluencerMinRating, setLongTermInfluencerMinRating] = useState("");

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
    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Clear previous data immediately to free memory
    setCoinsData([]);
    setPeriods([]);
    setStatistics(null);
    setFilters(null);
    setSummary(null);
    setExpandedPeriods({});

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      // Date filters
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      // Basic filters
      if (sentimentType) params.append('sentimentType', sentimentType.toLowerCase());
      if (coinType) params.append('coinType', coinType.toLowerCase());

      // Map source to API format
      let sourceValue = selectedPlatform;
      if (source === "YouTube + Telegram") {
        sourceValue = "YTTG";
      } else if (source === "YouTube") {
        sourceValue = "YT";
      } else if (source === "Telegram") {
        sourceValue = "TG";
      }
      if (sourceValue) params.append('source', sourceValue);

      if (timePeriodFilter) params.append('timePeriod', timePeriodFilter.toLowerCase());

      // Time-based rules
      if (rule1MinPosts) params.append('rule_60_min_posts', rule1MinPosts);
      if (rule1Sentiment) params.append('rule_60_sentiment_pct', rule1Sentiment);

      if (rule2MinPosts) params.append('rule_30_min_posts', rule2MinPosts);
      if (rule2Sentiment) params.append('rule_30_sentiment_pct', rule2Sentiment);

      if (rule3MinPosts) params.append('rule_7_min_posts', rule3MinPosts);
      if (rule3Sentiment) params.append('rule_7_sentiment_pct', rule3Sentiment);

      if (rule4MinPosts) params.append('rule_24_min_posts', rule4MinPosts);
      if (rule4Sentiment) params.append('rule_24_sentiment_pct', rule4Sentiment);

      // Advanced Settings - Short Term (always send, default to 0 if empty)
      params.append('short_term_min_count', shortTermMinCount || '0');
      params.append('short_term_min_percent', shortTermMinPercent || '0');
      params.append('short_term_influencer_min_rating', shortTermInfluencerMinRating || '0');

      // Advanced Settings - Long Term (always send, default to 0 if empty)
      params.append('long_term_min_count', longTermMinCount || '0');
      params.append('long_term_min_percent', longTermMinPercent || '0');
      params.append('long_term_influencer_min_rating', longTermInfluencerMinRating || '0');

      // Debug: Log the complete URL being sent
      console.log('API Request URL:', `/api/admin/mcmsignal/mcm-signal?${params.toString()}`);
      console.log('Advanced Settings Values:', {
        shortTermMinCount,
        shortTermMinPercent,
        shortTermInfluencerMinRating,
        longTermMinCount,
        longTermMinPercent,
        longTermInfluencerMinRating
      });

      const res = await fetch(`/api/admin/mcmsignal/mcm-signal?${params.toString()}`, {
        signal: abortControllerRef.current.signal
      });
      const data = await res.json();

      // Debug: Log the response
      console.log('API Response:', data);
      console.log('Received influencerFilters:', data.filters?.influencerFilters);

      if (data.success) {
        setFilters(data.filters);
        setSummary(data.summary);

        // Handle daily data (has signals array directly)
        if (Array.isArray(data.signals)) {
          setCoinsData(data.signals);
          setStatistics(data.statistics);
          setPeriods([]);
          setExpandedPeriods({});
        }
        // Handle weekly/monthly data (has periods array)
        else if (Array.isArray(data.periods)) {
          setPeriods(data.periods);
          // Flatten all signals from all periods for display
          const allSignals = data.periods.flatMap(period => period.signals || []);
          setCoinsData(allSignals);
          // Use statistics from the first period or aggregate
          setStatistics(data.periods[0]?.statistics || null);
          // Initialize all periods as collapsed
          const initialExpandedState = {};
          data.periods.forEach(period => {
            initialExpandedState[period.periodKey] = false;
          });
          setExpandedPeriods(initialExpandedState);
        } else {
          setCoinsData([]);
          setStatistics(null);
          setPeriods([]);
          setExpandedPeriods({});
        }
      } else {
        setCoinsData([]);
        setStatistics(null);
        setFilters(null);
        setSummary(null);
        setPeriods([]);
        setExpandedPeriods({});
      }
    } catch (err) {
      // Don't set error if request was aborted (user clicked submit again)
      if (err.name === 'AbortError') {
        console.log('Previous request was cancelled');
        return;
      }
      console.error('Error fetching MCM Signal data:', err);
      setError("Failed to fetch data");
      setCoinsData([]);
      setStatistics(null);
      setFilters(null);
      setSummary(null);
      setPeriods([]);
      setExpandedPeriods({});
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, sentimentType, coinType, source, selectedPlatform, timePeriodFilter, rule1MinPosts, rule1Sentiment, rule2MinPosts, rule2Sentiment, rule3MinPosts, rule3Sentiment, rule4MinPosts, rule4Sentiment, shortTermMinCount, shortTermMinPercent, shortTermInfluencerMinRating, longTermMinCount, longTermMinPercent, longTermInfluencerMinRating]);

  // Removed auto-fetch on filter changes - now only fetches on submit

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, sentimentType, coinType, source, selectedPlatform, timePeriodFilter, rule1MinPosts, rule1Sentiment, rule2MinPosts, rule2Sentiment, rule3MinPosts, rule3Sentiment, rule4MinPosts, rule4Sentiment, shortTermMinCount, shortTermMinPercent, shortTermInfluencerMinRating, longTermMinCount, longTermMinPercent, longTermInfluencerMinRating]);

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

  // Toggle period expansion
  const togglePeriod = (periodKey) => {
    setExpandedPeriods(prev => ({
      ...prev,
      [periodKey]: !prev[periodKey]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-gray-900 font-sans pb-16">
      {/* Header */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MCM Signal Dashboard
          </h1>
          <p className="text-black-600">Filter and discover trending cryptocurrency signals</p>
        </div>
      </section>

      {/* Filter Controls */}
      <section>
        <div className="max-w-7xl mx-auto px-4 mb-6 w-full">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Analysis Filters</h3>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Basic Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-base mb-4">Basic Settings</h4>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">
                    Sentiment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sentimentType}
                    onChange={(e) => setSentimentType(e.target.value)}
                    required
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Bullish">Bullish</option>
                    <option value="Bearish">Bearish</option>
                    <option value="bullishandbearish">Bullish + Bearish</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">
                    Source <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    required
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="YouTube + Telegram">YouTube + Telegram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Telegram">Telegram</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">
                    Coin Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={coinType}
                    onChange={(e) => setCoinType(e.target.value)}
                    required
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Overall">Overall</option>
                    <option value="meme">meme</option>
                    <option value="normal">normal</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="space-y-2 pt-4">
                  <h5 className="text-sm font-semibold text-gray-800">
                    Date Range <span className="text-red-500">*</span>
                  </h5>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">From</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        required
                        className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">To</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        required
                        className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-700 font-medium">
                    Filter <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={timePeriodFilter}
                    onChange={(e) => setTimePeriodFilter(e.target.value)}
                    required
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Time-Based Rules - ALL RULES ARE MANDATORY */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 text-base mb-4">
                  All Rules
                  {/* <span className="text-red-500">*</span> */}
                </h4>

                {/* Rule 1 - 60 Days */}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-gray-800">
                    Rule 1 - 60 Days <span className="text-red-500">*</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">
                        Min Posts <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={rule1MinPosts}
                        onChange={(e) => setRule1MinPosts(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">
                        Sentiment % <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={rule1Sentiment}
                        onChange={(e) => setRule1Sentiment(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Rule 2 - 30 Days */}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-gray-800">
                    Rule 2 - 30 Days <span className="text-red-500">*</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">
                        Min Posts <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={rule2MinPosts}
                        onChange={(e) => setRule2MinPosts(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">
                        Sentiment % <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={rule2Sentiment}
                        onChange={(e) => setRule2Sentiment(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Rule 3 - 7 Days */}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-gray-800">
                    Rule 3 - 7 Days <span className="text-red-500">*</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">
                        Min Posts <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={rule3MinPosts}
                        onChange={(e) => setRule3MinPosts(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">
                        Sentiment % <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={rule3Sentiment}
                        onChange={(e) => setRule3Sentiment(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Rule 4 - 24 Hours */}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-gray-800">
                    Rule 4 - 24 Hours <span className="text-red-500">*</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">
                        Min Posts <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={rule4MinPosts}
                        onChange={(e) => setRule4MinPosts(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">
                        Sentiment % <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={rule4Sentiment}
                        onChange={(e) => setRule4Sentiment(e.target.value)}
                        required
                        className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="font-semibold text-gray-900 text-base">Advanced Settings</h4>
                </div>

                {/* Short Term */}
                <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                  <h5 className="text-sm font-semibold text-blue-900">Short Term</h5>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-700">Min Count</label>
                    <input
                      type="text"
                      value={shortTermMinCount}
                      onChange={(e) => setShortTermMinCount(e.target.value)}
                      placeholder="Optional"
                      className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-700">Min Percent</label>
                    <input
                      type="text"
                      value={shortTermMinPercent}
                      onChange={(e) => setShortTermMinPercent(e.target.value)}
                      placeholder="Optional"
                      className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-700">Min Influencer Star Rating</label>
                    <input
                      type="text"
                      value={shortTermInfluencerMinRating}
                      onChange={(e) => setShortTermInfluencerMinRating(e.target.value)}
                      placeholder="Optional"
                      className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Long Term */}
                <div className="bg-green-50 p-3 rounded-lg space-y-2">
                  <h5 className="text-sm font-semibold text-green-900">Long Term</h5>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-700">Min Count</label>
                    <input
                      type="text"
                      value={longTermMinCount}
                      onChange={(e) => setLongTermMinCount(e.target.value)}
                      placeholder="Optional"
                      className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-700">Min Percent</label>
                    <input
                      type="text"
                      value={longTermMinPercent}
                      onChange={(e) => setLongTermMinPercent(e.target.value)}
                      placeholder="Optional"
                      className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-700">Min Influencer Star Rating</label>
                    <input
                      type="text"
                      value={longTermInfluencerMinRating}
                      onChange={(e) => setLongTermInfluencerMinRating(e.target.value)}
                      placeholder="Optional"
                      className="bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Buttons at Bottom */}
            <div className="mt-6 flex justify-center gap-4">
              {/* <button
                type="button"
                onClick={() => {
                  setDateFrom('2025-10-01');
                  setDateTo('2025-10-07');
                  setSentimentType('Bullish');
                  setSource('YouTube + Telegram');
                  setCoinType('Overall');
                  setTimePeriodFilter('Weekly');
                  setRule1MinPosts('250');
                  setRule1Sentiment('75');
                  setRule2MinPosts('150');
                  setRule2Sentiment('75');
                  setRule3MinPosts('25');
                  setRule3Sentiment('80');
                  setRule4MinPosts('15');
                  setRule4Sentiment('85');
                  setAvgInfluenceScore('');
                  setShortTermMinCount('');
                  setShortTermMinPercent('');
                  setLongTermMinCount('');
                  setLongTermMinPercent('');
                }}
                className="px-6 py-2.5 bg-white text-gray-700 border-2 border-gray-300 font-semibold rounded-lg shadow hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filters
              </button> */}
              <button
                type="submit"
                className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg> */}
                Submit
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* OLD FILTERS SECTION - KEPT FOR REFERENCE */}
      <section className="hidden">
        <div className="max-w-5xl mx-auto px-4 mb-6 w-full">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-xl">
            <h3 className="text-lg font-semibold text-purple-700 mb-4">Old Filters</h3>

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
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedInfluencer === "all"
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
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${showBullishFilter
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
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${showBearishFilter
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

      {/* Period Overview - Show when weekly/monthly data is available */}
      {periods.length > 0 && (
        <section className="max-w-full mx-auto px-4 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Period Overview</h3>
          <div className="space-y-4">
            {periods.map((period) => (
              <div key={period.periodKey} className="bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden">
                {/* Period Header - Clickable */}
                <button
                  onClick={() => togglePeriod(period.periodKey)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold flex items-center justify-between hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg">{period.period}</span>
                    <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm text-black">
                      {period.signalCount} Signals
                    </span>
                  </div>
                  <svg
                    className={`w-6 h-6 transition-transform ${expandedPeriods[period.periodKey] ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Period Content - Expandable */}
                {expandedPeriods[period.periodKey] && (
                  <div className="p-6">
                    {/* Statistics Table for this period */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Statistics for {period.period}</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold border-r border-gray-300">Summary</th>
                              <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">24 Hrs</th>
                              <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">7 Days</th>
                              <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">30 Days</th>
                              <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">60 Days</th>
                              <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">90 Days</th>
                              <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">180 Days</th>
                              <th className="px-4 py-3 text-center font-semibold">1 Year</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-300 bg-white">
                              <td className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">Win Count</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Count']?.['24hrs'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Count']?.['7days'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Count']?.['30days'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Count']?.['60days'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Count']?.['90days'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Count']?.['180days'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700">{period.statistics?.['Win Count']?.['1year'] || 0}</td>
                            </tr>
                            <tr className="border-b border-gray-300 bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">Total Signals</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Total Signals']?.['24hrs'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Total Signals']?.['7days'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Total Signals']?.['30days'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Total Signals']?.['60days'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Total Signals']?.['90days'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Total Signals']?.['180days'] || 0}</td>
                              <td className="px-4 py-3 text-center text-gray-700">{period.statistics?.['Total Signals']?.['1year'] || 0}</td>
                            </tr>
                            <tr className="border-b border-gray-300 bg-white">
                              <td className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">Win Rate %</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Rate %']?.['24hrs'] || '0.00%'}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Rate %']?.['7days'] || '0.00%'}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Rate %']?.['30days'] || '0.00%'}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Rate %']?.['60days'] || '0.00%'}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Rate %']?.['90days'] || '0.00%'}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Win Rate %']?.['180days'] || '0.00%'}</td>
                              <td className="px-4 py-3 text-center text-gray-700">{period.statistics?.['Win Rate %']?.['1year'] || '0.00%'}</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">Average ROI</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Average ROI']?.['24hrs'] != null ? period.statistics['Average ROI']['24hrs'].toFixed(2) : '0.00'}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Average ROI']?.['7days'] != null ? period.statistics['Average ROI']['7days'].toFixed(2) : '0.00'}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Average ROI']?.['30days'] != null ? period.statistics['Average ROI']['30days'].toFixed(2) : '0.00'}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Average ROI']?.['60days'] != null ? period.statistics['Average ROI']['60days'].toFixed(2) : '0.00'}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Average ROI']?.['90days'] != null ? period.statistics['Average ROI']['90days'].toFixed(2) : '0.00'}</td>
                              <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{period.statistics?.['Average ROI']?.['180days'] != null ? period.statistics['Average ROI']['180days'].toFixed(2) : '0.00'}</td>
                              <td className="px-4 py-3 text-center text-gray-700">{period.statistics?.['Average ROI']?.['1year'] != null ? period.statistics['Average ROI']['1year'].toFixed(2) : '0.00'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Signals Table for this period */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Signals</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100 text-black">
                            <tr>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300 ">Date</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">Symbol</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">Coin Name</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300 ">Base Price</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">24 Hrs Price</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">24 Hrs %</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">7 Days %</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">30 Days %</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">60 Days %</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">90 Days %</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">180 Days %</th>
                              <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">1 Year %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {period.signals?.map((signal, idx) => (
                              <tr
                                key={signal.Symbol + signal.Date + idx}
                                className={`border-b border-gray-300 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                              >
                                <td className="px-3 py-2 text-center text-gray-700 whitespace-nowrap border-r border-gray-200">{signal.Date || 'N/A'}</td>
                                <td className="px-3 py-2 text-center text-gray-700 whitespace-nowrap border-r border-gray-200">{signal.Symbol || 'N/A'}</td>
                                <td className="px-3 py-2 text-center text-gray-700 whitespace-nowrap border-r border-gray-200">{signal['Coin Name'] || 'N/A'}</td>
                                <td className="px-3 py-2 text-center text-gray-700 font-mono whitespace-nowrap border-r border-gray-200">
                                  ${signal['Base Price'] ? Math.round(parseFloat(signal['Base Price'])).toLocaleString('en-US') : 'N/A'}
                                </td>
                                <td className="px-3 py-2 text-center text-gray-700 font-mono whitespace-nowrap border-r border-gray-200">
                                  ${signal['24 Hrs Price'] ? Math.round(parseFloat(signal['24 Hrs Price'])).toLocaleString('en-US') : 'N/A'}
                                </td>
                                <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(signal['24 Hrs % returns'] || 0) > 0 ? 'text-green-600' : (signal['24 Hrs % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {signal['24 Hrs % returns'] != null ? `${signal['24 Hrs % returns'] > 0 ? '+' : ''}${Math.round(signal['24 Hrs % returns'])}%` : 'N/A'}
                                </td>
                                <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(signal['7 Days % returns'] || 0) > 0 ? 'text-green-600' : (signal['7 Days % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {signal['7 Days % returns'] != null ? `${signal['7 Days % returns'] > 0 ? '+' : ''}${Math.round(signal['7 Days % returns'])}%` : 'N/A'}
                                </td>
                                <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(signal['30 Days % returns'] || 0) > 0 ? 'text-green-600' : (signal['30 Days % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {signal['30 Days % returns'] != null ? `${signal['30 Days % returns'] > 0 ? '+' : ''}${Math.round(signal['30 Days % returns'])}%` : 'N/A'}
                                </td>
                                <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(signal['60 Days % returns'] || 0) > 0 ? 'text-green-600' : (signal['60 Days % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {signal['60 Days % returns'] != null ? `${signal['60 Days % returns'] > 0 ? '+' : ''}${Math.round(signal['60 Days % returns'])}%` : 'N/A'}
                                </td>
                                <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(signal['90 Days % returns'] || 0) > 0 ? 'text-green-600' : (signal['90 Days % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {signal['90 Days % returns'] != null ? `${signal['90 Days % returns'] > 0 ? '+' : ''}${Math.round(signal['90 Days % returns'])}%` : 'N/A'}
                                </td>
                                <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(signal['180 Days % returns'] || 0) > 0 ? 'text-green-600' : (signal['180 Days % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {signal['180 Days % returns'] != null ? `${signal['180 Days % returns'] > 0 ? '+' : ''}${Math.round(signal['180 Days % returns'])}%` : 'N/A'}
                                </td>
                                <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap ${(signal['1 Year % returns'] || 0) > 0 ? 'text-green-600' : (signal['1 Year % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {signal['1 Year % returns'] != null ? `${signal['1 Year % returns'] > 0 ? '+' : ''}${Math.round(signal['1 Year % returns'])}%` : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* First Table - Performance Metrics - Only show for daily data */}
      {periods.length === 0 && (
        <section className="max-w-full mx-auto px-4 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Metrics</h3>
          {loading ? (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold border-r border-gray-300">Summary</th>
                      <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">24 Hrs</th>
                      <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">7 Days</th>
                      <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">30 Days</th>
                      <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">60 Days</th>
                      <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">90 Days</th>
                      <th className="px-4 py-3 text-center font-semibold border-r border-gray-300">180 Days</th>
                      <th className="px-4 py-3 text-center font-semibold">1 Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-300 bg-white">
                      <td className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">Win Count</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Count']?.['24hrs'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Count']?.['7days'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Count']?.['30days'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Count']?.['60days'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Count']?.['90days'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Count']?.['180days'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{statistics?.['Win Count']?.['1year'] || 0}</td>
                    </tr>
                    <tr className="border-b border-gray-300 bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">Total Signals</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Total Signals']?.['24hrs'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Total Signals']?.['7days'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Total Signals']?.['30days'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Total Signals']?.['60days'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Total Signals']?.['90days'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Total Signals']?.['180days'] || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{statistics?.['Total Signals']?.['1year'] || 0}</td>
                    </tr>
                    <tr className="border-b border-gray-300 bg-white">
                      <td className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">Win Rate %</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Rate %']?.['24hrs'] || '0.00%'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Rate %']?.['7days'] || '0.00%'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Rate %']?.['30days'] || '0.00%'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Rate %']?.['60days'] || '0.00%'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Rate %']?.['90days'] || '0.00%'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Win Rate %']?.['180days'] || '0.00%'}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{statistics?.['Win Rate %']?.['1year'] || '0.00%'}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">Average ROI</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Average ROI']?.['24hrs'] != null ? statistics['Average ROI']['24hrs'].toFixed(2) : '0.00'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Average ROI']?.['7days'] != null ? statistics['Average ROI']['7days'].toFixed(2) : '0.00'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Average ROI']?.['30days'] != null ? statistics['Average ROI']['30days'].toFixed(2) : '0.00'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Average ROI']?.['60days'] != null ? statistics['Average ROI']['60days'].toFixed(2) : '0.00'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Average ROI']?.['90days'] != null ? statistics['Average ROI']['90days'].toFixed(2) : '0.00'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-r border-gray-200">{statistics?.['Average ROI']?.['180days'] != null ? statistics['Average ROI']['180days'].toFixed(2) : '0.00'}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{statistics?.['Average ROI']?.['1year'] != null ? statistics['Average ROI']['1year'].toFixed(2) : '0.00'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Second Table - Coins Historical Price Data - Only show for daily data */}
      {periods.length === 0 && (
        <section className="max-w-full mx-auto px-4 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Historical Price Performance</h3>
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
              {sortedCoinsData.length > 0 ? (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 text-black">
                        <tr>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300 ">Date</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">Sentiment</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">Coin Name</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">Base Price</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">24 Hrs Price</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">24 Hrs % Returns</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">7 Days % change</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">30 Days % change</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">60 Days % change</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300 ">90 Days % change</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-300">180 Days % change</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap ">1 Year % change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCoinsData.map((coin, index) => (
                          <tr
                            key={coin.Symbol + coin.Date + index}
                            className={`border-b border-gray-300 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                          >
                            <td className="px-3 py-2 text-center text-gray-700 whitespace-nowrap border-r border-gray-200">
                              {coin.Date || 'N/A'}
                            </td>
                            <td className="px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${(filters?.sentimentType === 'bullishandbearish' ? coin.Sentiment?.toLowerCase() : filters?.sentimentType) === 'bullish'
                                  ? 'bg-green-100 text-green-800'
                                  : (filters?.sentimentType === 'bullishandbearish' ? coin.Sentiment?.toLowerCase() : filters?.sentimentType) === 'bearish'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                {filters?.sentimentType === 'bullishandbearish'
                                  ? (coin.Sentiment || 'N/A')
                                  : filters?.sentimentType
                                    ? filters.sentimentType.charAt(0).toUpperCase() + filters.sentimentType.slice(1)
                                    : 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center text-gray-700 whitespace-nowrap border-r border-gray-200">
                              {coin['Coin Name'] || 'N/A'}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-700 font-mono whitespace-nowrap border-r border-gray-200">
                              ${coin['Base Price'] ? Math.round(parseFloat(coin['Base Price'])).toLocaleString('en-US') : 'N/A'}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-700 font-mono whitespace-nowrap border-r border-gray-200">
                              ${coin['24 Hrs Price'] ? Math.round(parseFloat(coin['24 Hrs Price'])).toLocaleString('en-US') : 'N/A'}
                            </td>
                            <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(coin['24 Hrs % returns'] || 0) > 0 ? 'text-green-600' : (coin['24 Hrs % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                              {coin['24 Hrs % returns'] != null ? `${coin['24 Hrs % returns'] > 0 ? '+' : ''}${Math.round(coin['24 Hrs % returns'])}%` : 'N/A'}
                            </td>
                            <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(coin['7 Days % returns'] || 0) > 0 ? 'text-green-600' : (coin['7 Days % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                              {coin['7 Days % returns'] != null ? `${coin['7 Days % returns'] > 0 ? '+' : ''}${Math.round(coin['7 Days % returns'])}%` : 'N/A'}
                            </td>
                            <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(coin['30 Days % returns'] || 0) > 0 ? 'text-green-600' : (coin['30 Days % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                              {coin['30 Days % returns'] != null ? `${coin['30 Days % returns'] > 0 ? '+' : ''}${Math.round(coin['30 Days % returns'])}%` : 'N/A'}
                            </td>
                            <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(coin['60 Days % returns'] || 0) > 0 ? 'text-green-600' : (coin['60 Days % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                              {coin['60 Days % returns'] != null ? `${coin['60 Days % returns'] > 0 ? '+' : ''}${Math.round(coin['60 Days % returns'])}%` : 'N/A'}
                            </td>
                            <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(coin['90 Days % returns'] || 0) > 0 ? 'text-green-600' : (coin['90 Days % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                              {coin['90 Days % returns'] != null ? `${coin['90 Days % returns'] > 0 ? '+' : ''}${Math.round(coin['90 Days % returns'])}%` : 'N/A'}
                            </td>
                            <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap border-r border-gray-200 ${(coin['180 Days % returns'] || 0) > 0 ? 'text-green-600' : (coin['180 Days % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                              {coin['180 Days % returns'] != null ? `${coin['180 Days % returns'] > 0 ? '+' : ''}${Math.round(coin['180 Days % returns'])}%` : 'N/A'}
                            </td>
                            <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap ${(coin['1 Year % returns'] || 0) > 0 ? 'text-green-600' : (coin['1 Year % returns'] || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                              {coin['1 Year % returns'] != null ? `${coin['1 Year % returns'] > 0 ? '+' : ''}${Math.round(coin['1 Year % returns'])}%` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : !loading && (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center border border-gray-300">
                  <div className="text-gray-400 text-lg">No coins found</div>
                  <div className="text-gray-500 text-sm mt-2">Try adjusting your filters</div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Pagination Controls */}
      {/* <section className="max-w-full mx-auto px-4 mb-8">
        {!loading && visibleCoins.length > 0 && totalPages > 1 && (
          <div className="flex flex-col items-center mt-8 space-y-4">
            <div className="text-sm text-gray-700 text-center">
              Showing {startIndex + 1} to {Math.min(endIndex, totalCoins)} of {totalCoins} coins
            </div>

            <div className="flex items-center space-x-2 flex-wrap justify-center">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                  }`}
              >
                ««
              </button>

              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${currentPage === 1
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
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${currentPage === page
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
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                  }`}
              >
                »
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                  }`}
              >
                »»
              </button>
            </div>
          </div>
        )}
      </section> */}
    </div>
  );
}
