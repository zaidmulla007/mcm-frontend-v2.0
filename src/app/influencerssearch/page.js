"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaStarHalfAlt, FaInfoCircle, FaArrowUp, FaArrowDown, FaBitcoin } from "react-icons/fa";
import { FaEthereum } from "react-icons/fa6";
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

// Hardcoded Recent Recommendations data
const getRecentRecommendations = () => ({
  "24_hrs": [
    { coin: "Bitcoin", icon: <FaBitcoin className="text-orange-500 text-2xl" />, direction: "bullish", term: "long" },
    { coin: "Ethereum", icon: <FaEthereum className="text-blue-500 text-2xl" />, direction: "bearish", term: "short" },
    { coin: "Cardano", icon: <span className="text-blue-600 text-2xl font-bold">₳</span>, direction: "bullish", term: "short" },
    { coin: "Solana", icon: <span className="text-purple-600 text-2xl font-bold">◎</span>, direction: "bullish", term: "long" },
    { coin: "Ripple", icon: <span className="text-gray-700 text-2xl font-bold">✕</span>, direction: "bearish", term: "long" }
  ],
  "7_days": [
    { coin: "Bitcoin", icon: <FaBitcoin className="text-orange-500 text-2xl" />, direction: "bullish", term: "long" },
    { coin: "Ethereum", icon: <FaEthereum className="text-blue-500 text-2xl" />, direction: "bearish", term: "short" },
    { coin: "Cardano", icon: <span className="text-blue-600 text-2xl font-bold">₳</span>, direction: "bullish", term: "short" },
    { coin: "Solana", icon: <span className="text-purple-600 text-2xl font-bold">◎</span>, direction: "bullish", term: "long" },
    { coin: "Ripple", icon: <span className="text-gray-700 text-2xl font-bold">✕</span>, direction: "bearish", term: "long" }
  ],
  "30_days": [
    { coin: "Bitcoin", icon: <FaBitcoin className="text-orange-500 text-2xl" />, direction: "bullish", term: "long" },
    { coin: "Ethereum", icon: <FaEthereum className="text-blue-500 text-2xl" />, direction: "bearish", term: "short" },
    { coin: "Cardano", icon: <span className="text-blue-600 text-2xl font-bold">₳</span>, direction: "bullish", term: "short" },
    { coin: "Solana", icon: <span className="text-purple-600 text-2xl font-bold">◎</span>, direction: "bullish", term: "long" },
    { coin: "Ripple", icon: <span className="text-gray-700 text-2xl font-bold">✕</span>, direction: "bearish", term: "long" }
  ]
});

// Component to render arrow based on direction and term
const RecommendationArrow = ({ direction, term }) => {
  const isFullArrow = term === "long";
  const arrowClass = direction === "bullish" ? "text-green-500" : "text-red-500";
  const ArrowIcon = direction === "bullish" ? FaArrowUp : FaArrowDown;

  return (
    <ArrowIcon
      className={`${arrowClass} ${isFullArrow ? 'text-xl' : 'text-sm'}`}
    />
  );
};

// InfluencerCard Component
function InfluencerCard({ influencer, selectedPlatform, mcmData, selectedTimeframe }) {
  const recommendations = getRecentRecommendations();

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
    <motion.div
      layout
      layoutId={`card-${influencer.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        layout: {
          type: "spring",
          stiffness: 100,
          damping: 18,
          mass: 1.5
        },
        opacity: { duration: 0.3 },
        y: { duration: 0.3 }
      }}
      className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex gap-6">
        {/* Left Side - Influencer Info */}
        <div className="w-1/3 border-r border-gray-200 pr-6">
          <Link
            href={
              selectedPlatform === "youtube"
                ? `/influencers/${influencer.id}`
                : `/telegram-influencer/${influencer.id}`
            }
            className="block"
          >
            <div className="flex flex-col items-center">
              {influencer.channel_thumbnails?.high?.url ? (
                <Image
                  src={influencer.channel_thumbnails.high.url}
                  alt={influencer.name || "Influencer"}
                  width={130}
                  height={130}
                  className="w-36 h-36 rounded-full object-cover mb-4 border-4 border-gray-100"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center mb-4 border-4 border-gray-100"
                style={{ display: influencer.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
              >
                <span className="text-white text-3xl font-bold">
                  {influencer.name?.match(/\b\w/g)?.join("").toUpperCase() || "?"}
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900">{influencer.name?.replace(/_/g, " ") || "Unknown"}</span>
                  {selectedPlatform === "youtube" ? (
                    <svg className="w-10 h-10 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  )}
                </div>
                {/* Yearly Rating Chart */}
                <div className="mt-4">
                  {scatterData.length > 0 ? (
                    <div className="space-y-2">
                      {scatterData.map((point, idx) => {
                        const fullStars = Math.floor(point.rating);
                        const hasHalfStar = point.rating % 1 >= 0.5;
                        const totalStars = 5;
                        const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-center gap-2"
                            title={`Year: ${point.yearLabel}, Rating: ${point.rating}`}
                          >
                            <span className="text-xl text-gray-600 font-xl mt-1">{point.yearLabel}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(fullStars)].map((_, i) => (
                                <FaStar key={`full-${i}`} className="text-yellow-500 w-3 h-3" />
                              ))}
                              {hasHalfStar && (
                                <FaStarHalfAlt key="half" className="text-yellow-500 w-3 h-3" />
                              )}
                              {[...Array(emptyStars)].map((_, i) => (
                                <FaStar key={`empty-${i}`} className="text-gray-400 w-3 h-3" />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      loading...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Right Side - Metrics on top, All Time Ranges on bottom */}
        <div className="flex-1 flex flex-col">
          {/* Metrics Grid - NOW ON TOP */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
              <div className="text-xs text-purple-600 font-medium mb-1">ROI</div>
              <div className="text-2xl font-bold text-purple-800">
                {influencer.prob_weighted_returns !== undefined
                  ? influencer.prob_weighted_returns.toFixed(1)
                  : '0.0'}
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
              <div className="text-xs text-blue-600 font-medium mb-1">Win %</div>
              <div className="text-2xl font-bold text-blue-800">
                {influencer.win_percentage !== undefined
                  ? `${Math.round(influencer.win_percentage)}%`
                  : '0%'}
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
              <div className="text-xs text-green-600 font-medium mb-1">Total calls</div>
              <div className="text-2xl font-bold text-green-800">
                {influencer.price_counts ? influencer.price_counts.toLocaleString() : '0'}
              </div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-200">
              <div className="text-xs text-indigo-600 font-medium mb-1">subs count</div>
              <div className="text-2xl font-bold text-indigo-800">
                {influencer.subs ? (influencer.subs >= 1000000 ? `${(influencer.subs / 1000000).toFixed(1)}M` : influencer.subs >= 1000 ? `${(influencer.subs / 1000).toFixed(1)}K` : influencer.subs) : '0'}
              </div>
            </div>
          </div>

          {/* Recent Recommendations - All Time Ranges in Horizontal Layout */}
          <div className="grid grid-cols-3 gap-3">
            {/* Last 24 hrs */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-xs font-semibold text-gray-700 mb-2 text-center">Last 24 hrs</div>
              <div className="flex flex-col items-center gap-3">
                {recommendations["24_hrs"].map((rec, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="flex items-center gap-2 h-8">
                      {rec.icon}
                      <RecommendationArrow direction={rec.direction} term={rec.term} />
                    </div>
                    <span className="text-xs text-gray-600 mt-1 font-medium">{rec.coin}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last 7 days */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-xs font-semibold text-gray-700 mb-2 text-center">Last 7 days</div>
              <div className="flex flex-col items-center gap-3">
                {recommendations["7_days"].map((rec, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="flex items-center gap-2 h-8">
                      {rec.icon}
                      <RecommendationArrow direction={rec.direction} term={rec.term} />
                    </div>
                    <span className="text-xs text-gray-600 mt-1 font-medium">{rec.coin}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last 30 days */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="text-xs font-semibold text-gray-700 mb-2 text-center">Last 30 days</div>
              <div className="flex flex-col items-center gap-3">
                {recommendations["30_days"].map((rec, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="flex items-center gap-2 h-8">
                      {rec.icon}
                      <RecommendationArrow direction={rec.direction} term={rec.term} />
                    </div>
                    <span className="text-xs text-gray-600 mt-1 font-medium">{rec.coin}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Header */}
      <header className="">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Leaderboard</h1>
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
        <div className="max-w-4xl mx-auto px-4 mb-6 w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ROI</label>
              <select
                value={roiFilter}
                onChange={(e) => setRoiFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All ROI</option>
                <option value="above_0.8">Above 0.8</option>
                <option value="0.5_to_0.8">0.5 - 0.8</option>
                <option value="below_0.5">Below 0.5</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Win Rate</label>
              <select
                value={winRateFilter}
                onChange={(e) => setWinRateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Win Rates</option>
                <option value="above_70">Above 70%</option>
                <option value="50_to_70">50% - 70%</option>
                <option value="below_50">Below 50%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Calls</label>
              <select
                value={totalCallsFilter}
                onChange={(e) => setTotalCallsFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Calls</option>
                <option value="above_1000">Above 1000</option>
                <option value="500_to_1000">500 - 1000</option>
                <option value="below_500">Below 500</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto px-4 pb-8 overflow-x-hidden">
        <div className="min-w-0">
            {/* Cards Grid Section */}
            <div className="space-y-4">
              {initialLoad ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={`skeleton-card-${i}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex gap-6">
                      <div className="w-1/3">
                        <div className="flex items-center mb-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div>
                          <div className="h-6 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="h-20 bg-gray-200 rounded mb-4"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredInfluencers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-semibold text-gray-600 mb-2">No influencers found</p>
                    <p className="text-sm text-gray-500">No influencers match the selected filters. Try adjusting your filter criteria.</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginatedInfluencers.map((influencer, index) => {
                    const mcmRatingsMap = selectedPlatform === "youtube" ? youtubeMcmRatings : telegramMcmRatings;
                    const mcmData = mcmRatingsMap[influencer.id] || {};

                    return (
                      <InfluencerCard
                        key={influencer.id}
                        influencer={influencer}
                        selectedPlatform={selectedPlatform}
                        mcmData={mcmData}
                        selectedTimeframe={selectedTimeframe}
                      />
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 flex items-center justify-between">
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
      </main>
    </div>
  );
}
