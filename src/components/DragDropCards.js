"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const DragDropCards = ({ cards = [], yearlyData = null, quarterlyData = null, channelData = null }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRegistered, setIsRegistered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [isDragTriggered, setIsDragTriggered] = useState(false);
  const constraintsRef = useRef(null);

  // API data states
  const [youtubeInfluencers, setYoutubeInfluencers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSentiment, setSelectedSentiment] = useState("strong_bullish");
  const [selectedTimeframe, setSelectedTimeframe] = useState("30");
  const [selectedType, setSelectedType] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [selectedUserId] = useState("UC4c5FPpwCpb6q8J--i8QHtA");
  const [userPerformanceData, setUserPerformanceData] = useState(null);

  // Fetch YouTube channel data from API
  useEffect(() => {
    const getChannelData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching channel data for ID: ${selectedUserId}`);

        // Fetch yearly data with strong_bullish sentiment for all timeframes
        const params = new URLSearchParams({
          sentiment: 'strong_bullish',
          type: 'yearly'
        });

        const res = await fetch(`/api/admin/influenceryoutubedata/channel/${selectedUserId}?${params.toString()}`);
        const apiRes = await res.json();

        console.log('API response:', apiRes);

        // Handle different response structures
        let results = apiRes;
        if (apiRes && apiRes.results) {
          results = apiRes.results;
        } else if (apiRes && apiRes.data) {
          results = apiRes.data;
        }

        if (!results) {
          throw new Error('No data found in response');
        }

        console.log('Channel data structure:', results);
        console.log('Available keys:', Object.keys(results));

        // Check if yearly data exists in different possible locations
        if (results.yearlyData) {
          console.log('Found yearlyData:', Object.keys(results.yearlyData));
        }
        if (results.data && results.data.yearlyData) {
          console.log('Found nested yearlyData:', Object.keys(results.data.yearlyData));
        }

        setUserPerformanceData(results);
        console.log('Set userPerformanceData:', JSON.stringify(results, null, 2));
      } catch (error) {
        console.error("Error fetching channel data", error);
        let errorMessage = "Failed to load channel data. Please try again later.";

        if (error.response) {
          console.error("Error response:", error.response.data);
          errorMessage = error.response.data?.error || error.response.data?.details || errorMessage;
        } else if (error.request) {
          console.error("No response received:", error.request);
          errorMessage = "No response received from server";
        } else {
          console.error("Error setting up request:", error.message);
          errorMessage = error.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    getChannelData();
  }, [selectedUserId]);

  // Get data for specific year with custom timeframe (similar to YearlyPerformanceTable)
  const getYearDataWithTimeframe = (yearKey, customTimeframe = null) => {
    if (!userPerformanceData) return null;

    const timeframeKey = customTimeframe ||
      (selectedTimeframe === "1" ? "1_hour"
        : selectedTimeframe === "24" ? "24_hours"
          : selectedTimeframe === "7" ? "7_days"
            : selectedTimeframe === "30" ? "30_days"
              : selectedTimeframe === "60" ? "60_days"
                : selectedTimeframe === "90" ? "90_days"
                  : selectedTimeframe === "180" ? "180_days"
                    : selectedTimeframe === "365" ? "1_year"
                      : "30_days");

    let baseData;

    // Access the Yearly data from the response structure
    const yearlyData = userPerformanceData?.Yearly || userPerformanceData?.data?.Yearly;

    console.log(`Full userPerformanceData keys:`, userPerformanceData ? Object.keys(userPerformanceData) : 'No data');
    console.log(`Checking yearly data structure:`, yearlyData ? Object.keys(yearlyData) : 'No yearly data');
    console.log(`Looking for year ${yearKey} in yearly data:`, yearlyData?.[yearKey] ? 'Found' : 'Not found');
    
    if (yearlyData) {
      console.log(`All available years:`, Object.keys(yearlyData));
    }

    if (yearlyData?.[yearKey]) {
      baseData = yearlyData[yearKey][timeframeKey];
      console.log(`Available timeframes for ${yearKey}:`, Object.keys(yearlyData[yearKey]));
    }

    console.log(`Getting data for year ${yearKey}, timeframe ${timeframeKey}:`, baseData);

    if (!baseData) return null;

    // For Strong Bullish sentiment, we want the Strong_Bullish_probablity_weighted_returns_percentage
    // But we'll return the full baseData so we can access the specific field in calculateROIMetrics
    return baseData;
  };

  // Calculate ROI metrics based on timeframe and sentiment
  const calculateROIMetrics = (timeframe, sentiment = "strong_bullish") => {
    if (!userPerformanceData) {
      console.log('No userPerformanceData available');
      return null;
    }

    console.log('UserPerformanceData structure:', userPerformanceData);

    const timeframeKey = timeframe === "1" ? "1_hour"
      : timeframe === "24" ? "24_hours"
        : timeframe === "7" ? "7_days"
          : timeframe === "30" ? "30_days"
            : timeframe === "60" ? "60_days"
              : timeframe === "90" ? "90_days"
                : timeframe === "180" ? "180_days"
                  : timeframe === "365" ? "1_year"
                    : "30_days";

    const years = ['2025', '2024', '2023', '2022'];
    const roiData = {};

    years.forEach(year => {
      const yearData = getYearDataWithTimeframe(year, timeframeKey);

      if (yearData) {
        // Get Average Return (Strong Bullish probability weighted returns percentage)
        console.log(`yearData for ${year}:`, JSON.stringify(yearData, null, 2));
        const averageReturn = yearData.Strong_Bullish_probablity_weighted_returns_percentage || 0;
        roiData[year] = averageReturn;
        console.log(`Strong Bullish Average Return for ${year}, timeframe ${timeframeKey}:`, averageReturn);
      } else {
        console.log(`No yearData found for ${year}`);
        roiData[year] = 0;
      }
    });

    console.log('Final ROI Data:', roiData);
    return roiData;
  };

  // Calculate Moonshots metrics based on timeframe - using bullish_count and probability weighted returns
  const calculateMoonshotsMetrics = (timeframe) => {
    if (!userPerformanceData) {
      console.log('No userPerformanceData available for moonshots');
      return null;
    }

    const timeframeKey = timeframe === "1" ? "1_hour"
      : timeframe === "24" ? "24_hours"
        : timeframe === "7" ? "7_days"
          : timeframe === "30" ? "30_days"
            : timeframe === "60" ? "60_days"
              : timeframe === "90" ? "90_days"
                : timeframe === "180" ? "180_days"
                  : timeframe === "365" ? "1_year"
                    : "30_days";

    const years = ['2025', '2024', '2023', '2022'];
    const moonshotsData = {};

    years.forEach(year => {
      const yearlyData = userPerformanceData?.Yearly || userPerformanceData?.data?.Yearly;

      if (yearlyData?.[year]) {
        const yearData = yearlyData[year];
        const timeframeData = yearData[timeframeKey];

        if (timeframeData) {
          // Get probability weighted returns percentage for moonshots
          const probabilityWeightedReturns = timeframeData.probablity_weighted_returns_percentage || 0;
          moonshotsData[year] = probabilityWeightedReturns;
        } else {
          moonshotsData[year] = 0;
        }
      } else {
        moonshotsData[year] = 0;
      }
    });

    console.log('Final Moonshots Data:', moonshotsData);
    return moonshotsData;
  };

  // Calculate Without Moonshots metrics based on timeframe - using normal yearly data
  const calculateWithoutMoonshotsMetrics = (timeframe) => {
    if (!userPerformanceData) {
      console.log('No userPerformanceData available for without moonshots');
      return null;
    }

    const timeframeKey = timeframe === "1" ? "1_hour"
      : timeframe === "24" ? "24_hours"
        : timeframe === "7" ? "7_days"
          : timeframe === "30" ? "30_days"
            : timeframe === "60" ? "60_days"
              : timeframe === "90" ? "90_days"
                : timeframe === "180" ? "180_days"
                  : timeframe === "365" ? "1_year"
                    : "30_days";

    const years = ['2025', '2024', '2023', '2022'];
    const withoutMoonshotsData = {};

    years.forEach(year => {
      // Access normal yearly data from the structure you provided
      const normalYearlyData = userPerformanceData?.normal?.Yearly;

      if (normalYearlyData?.[year]) {
        const yearData = normalYearlyData[year];
        const timeframeData = yearData[timeframeKey];

        if (timeframeData) {
          // Get probability weighted returns percentage for without moonshots
          const probabilityWeightedReturns = timeframeData.probablity_weighted_returns_percentage || 0;
          withoutMoonshotsData[year] = probabilityWeightedReturns;
        } else {
          withoutMoonshotsData[year] = 0;
        }
      } else {
        withoutMoonshotsData[year] = 0;
      }
    });

    console.log('Final Without Moonshots Data:', withoutMoonshotsData);
    return withoutMoonshotsData;
  };

  const handleDragStart = (event, info) => {
    setDraggedCard(currentIndex);
    const rect = event.target.getBoundingClientRect();
    setDragOffset({
      x: info.point.x - rect.left,
      y: info.point.y - rect.top
    });
  };

  const handleDragEnd = (event, info) => {
    setDraggedCard(null);

    // Calculate drag distance - more sensitive threshold
    const dragDistance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);

    // Alternative: check horizontal drag specifically
    const horizontalDrag = Math.abs(info.offset.x);
    const verticalDrag = Math.abs(info.offset.y);

    // If dragged far enough in any direction, move to next card
    if (dragDistance > 30 || horizontalDrag > 25 || verticalDrag > 25) {
      setIsDragTriggered(true); // Mark as drag-triggered for fast transition
      setCurrentIndex((prev) => (prev + 1) % cards.length);
      setAnimationKey(prev => prev + 1);

      // Reset drag trigger after a short delay
      setTimeout(() => {
        setIsDragTriggered(false);
      }, 100);
    }
  };

  // Create internal card types
  const cardTypes = ['roi', 'moonshots', 'withoutMoonshots'];

  // Auto-rotation every 5 seconds between card types
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cardTypes.length);
      setAnimationKey(prev => prev + 1);
    }, 15000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

  const currentCardType = cardTypes[currentIndex];


  return (
    <div
      ref={constraintsRef}
      className="relative w-full max-w-sm mx-auto h-[650px] overflow-visible"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: 'translateZ(0)', // Force GPU acceleration
        backfaceVisibility: 'hidden', // Prevent layout shifts
        perspective: '1000px' // Create stacking context
      }}
    >
      {/* Smooth Left-to-Right Sliding Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentIndex}-${animationKey}`}
          className="absolute inset-0 z-20"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          style={{
            willChange: 'transform, opacity', // Optimize for animations - exclude background
            contain: 'layout style paint', // Contain layout effects
          }}
        >
          <div
            className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-4 shadow-2xl border border-purple-500/20 h-full relative overflow-hidden backdrop-blur-sm"
            style={{
              transform: 'translateZ(0)', // Force GPU layer
              backfaceVisibility: 'hidden', // Prevent flickering
              background: 'linear-gradient(135deg, #0f172a 0, #581c87 50, #0f172a 100)',
              boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25)'
            }}
          >

            {/* MCM Rank - Top Right of Card */}
            <div className="absolute top-3 right-3 z-20">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg px-2 py-1 flex items-center justify-center shadow-lg border border-amber-300/50">
                <span className="text-white font-bold text-xs">MCM RANK #1</span>
              </div>
            </div>

            {/* Redesigned Card Content - Full Height */}
            <div className="px-2 py-2 h-full flex flex-col relative z-10">
              {/* Header Section - Profile & Info */}
              <div className="flex flex-col items-center mb-2">
                {/* Profile Image */}
                <div className="mb-2">
                  <motion.div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-2xl font-bold overflow-hidden shadow-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Image
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                      alt="Profile"
                      width={112}
                      height={112}
                      className="rounded-full w-full h-full object-cover blur-md"
                    />
                  </motion.div>
                </div>

                {/* Influencer Info */}
                <div className="text-center mb-1">
                  <h3 className="text-sm font-bold text-white blur-sm">
                    {loading ? 'Loading...' :
                      error ? 'Error Loading' :
                        userPerformanceData?.influencer_name || ''}
                  </h3>
                </div>
              </div>

              {/* Conditional Card Rendering based on currentCardType */}
              {currentCardType === 'roi' && (
                /* ROI Performance Tables - Modern Design */
                <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-purple-500/20 relative">
                  {/* ROI and Strong Bullish Headers */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-emerald-400 font-semibold text-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      ROI : Overall
                    </div>
                    <div className="text-purple-400 font-semibold text-sm flex items-center gap-1">
                      Bullish
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    </div>
                  </div>

                  {/* Modern ROI Table */}
                  <div className="bg-slate-700/30 rounded-lg border border-slate-600/30 overflow-hidden">
                    {/* Year Headers */}
                    <div className="grid grid-cols-5 gap-px bg-slate-600/50">
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-400 font-medium text-xs">Time</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2025</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2024</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2023</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2022</span>
                      </div>
                    </div>

                    {/* Dynamic ROI Rows */}
                    {[
                      { timeframe: "1", label: "1h", color: "text-green-400" },
                      { timeframe: "24", label: "24h", color: "text-violet-400" },
                      { timeframe: "7", label: "7d", color: "text-cyan-400" },
                      { timeframe: "30", label: "30d", color: "text-green-400" },
                      { timeframe: "60", label: "60d", color: "text-violet-400" },
                      { timeframe: "90", label: "90d", color: "text-cyan-400" },
                      { timeframe: "180", label: "180d", color: "text-green-400" },
                      { timeframe: "365", label: "1 year", color: "text-violet-400" }
                    ].map(({ timeframe, label, color }) => {
                      const roiData = calculateROIMetrics(timeframe, "strong_bullish");

                      return (
                        <div key={timeframe} className="grid grid-cols-5 gap-px bg-slate-600/50">
                          <div className="bg-slate-800/50 p-2 flex items-center justify-center">
                            <span className={`${color} font-medium text-xs`}>
                              {label}
                            </span>
                          </div>
                          {['2025', '2024', '2023', '2022'].map(year => (
                            <div key={year} className="bg-slate-800/50 p-2 text-center">
                              <span className="text-emerald-400 font-semibold text-xs">
                                {loading ? '...' :
                                  roiData?.[year] !== undefined && roiData[year] !== 0 ?
                                    `${roiData[year] > 0 ? '+' : ''}${roiData[year].toFixed(1)}%` :
                                    userPerformanceData ? 'N/A' : '-'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* View Profile Button */}
                  <div className="mt-4">
                    <Link href={`/login`}>
                      <motion.button
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 px-4 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 text-sm border border-purple-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Start Free Trial
                      </motion.button>
                    </Link>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="mt-2 text-center">
                      <p className="text-red-400 text-xs">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {currentCardType === 'moonshots' && (
                /* Moonshots Performance Tables - New Card */
                <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-cyan-500/20 relative">
                  {/* Moonshots and Bullish Headers */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-cyan-400 font-semibold text-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                      ROI : With Moonshots
                    </div>
                    <div className="text-green-400 font-semibold text-sm flex items-center gap-1">
                      Bullish
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    </div>
                  </div>

                  {/* Modern Moonshots Table */}
                  <div className="bg-slate-700/30 rounded-lg border border-slate-600/30 overflow-hidden">
                    {/* Year Headers */}
                    <div className="grid grid-cols-5 gap-px bg-slate-600/50">
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-400 font-medium text-xs">Time</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2025</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2024</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2023</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2022</span>
                      </div>
                    </div>

                    {/* Dynamic Moonshots Rows */}
                    {[
                      { timeframe: "1", label: "1h", color: "text-green-400" },
                      { timeframe: "24", label: "24h", color: "text-violet-400" },
                      { timeframe: "7", label: "7d", color: "text-cyan-400" },
                      { timeframe: "30", label: "30d", color: "text-green-400" },
                      { timeframe: "60", label: "60d", color: "text-violet-400" },
                      { timeframe: "90", label: "90d", color: "text-cyan-400" },
                      { timeframe: "180", label: "180d", color: "text-green-400" },
                      { timeframe: "365", label: "1 year", color: "text-violet-400" }
                    ].map(({ timeframe, label, color }) => {
                      const moonshotsData = calculateMoonshotsMetrics(timeframe);

                      return (
                        <div key={timeframe} className="grid grid-cols-5 gap-px bg-slate-600/50">
                          <div className="bg-slate-800/50 p-2 flex items-center justify-center">
                            <span className={`${color} font-medium text-xs`}>
                              {label}
                            </span>
                          </div>
                          {['2025', '2024', '2023', '2022'].map(year => (
                            <div key={year} className="bg-slate-800/50 p-2 text-center">
                              <span className="text-cyan-400 font-semibold text-xs">
                                {loading ? '...' :
                                  moonshotsData?.[year] !== undefined && moonshotsData[year] !== 0 ?
                                    `${moonshotsData[year] > 0 ? '+' : ''}${moonshotsData[year].toFixed(1)}%` :
                                    userPerformanceData ? 'N/A' : '-'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* View Profile Button */}
                  <div className="mt-4">
                    <Link href={`/login`}>
                      <motion.button
                        className="w-full bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-700 hover:to-cyan-900 px-4 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 text-sm border border-cyan-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Start Free Trial
                      </motion.button>
                    </Link>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="mt-2 text-center">
                      <p className="text-red-400 text-xs">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {currentCardType === 'withoutMoonshots' && (
                /* Without Moonshots Performance Tables - Third Card */
                <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-violet-500/20 relative">
                  {/* Without Moonshots and Bullish Headers */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-violet-400 font-semibold text-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
                      ROI : Without Moonshots
                    </div>
                    <div className="text-indigo-400 font-semibold text-sm flex items-center gap-1">
                      Bullish
                      <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                    </div>
                  </div>

                  {/* Modern Without Moonshots Table */}
                  <div className="bg-slate-700/30 rounded-lg border border-slate-600/30 overflow-hidden">
                    {/* Year Headers */}
                    <div className="grid grid-cols-5 gap-px bg-slate-600/50">
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-400 font-medium text-xs">Time</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2025</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2024</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2023</span>
                      </div>
                      <div className="bg-slate-700/50 p-2 text-center">
                        <span className="text-slate-300 font-semibold text-xs">2022</span>
                      </div>
                    </div>

                    {/* Dynamic Without Moonshots Rows */}
                    {[
                      { timeframe: "1", label: "1h", color: "text-green-400" },
                      { timeframe: "24", label: "24h", color: "text-violet-400" },
                      { timeframe: "7", label: "7d", color: "text-cyan-400" },
                      { timeframe: "30", label: "30d", color: "text-green-400" },
                      { timeframe: "60", label: "60d", color: "text-violet-400" },
                      { timeframe: "90", label: "90d", color: "text-cyan-400" },
                      { timeframe: "180", label: "180d", color: "text-green-400" },
                      { timeframe: "365", label: "1 year", color: "text-violet-400" }
                    ].map(({ timeframe, label, color }) => {
                      const withoutMoonshotsData = calculateWithoutMoonshotsMetrics(timeframe);

                      return (
                        <div key={timeframe} className="grid grid-cols-5 gap-px bg-slate-600/50">
                          <div className="bg-slate-800/50 p-2 flex items-center justify-center">
                            <span className={`${color} font-medium text-xs`}>
                              {label}
                            </span>
                          </div>
                          {['2025', '2024', '2023', '2022'].map(year => (
                            <div key={year} className="bg-slate-800/50 p-2 text-center">
                              <span className="text-violet-400 font-semibold text-xs">
                                {loading ? '...' :
                                  withoutMoonshotsData?.[year] !== undefined && withoutMoonshotsData[year] !== 0 ?
                                    `${withoutMoonshotsData[year] > 0 ? '+' : ''}${withoutMoonshotsData[year].toFixed(1)}%` :
                                    userPerformanceData ? 'N/A' : '-'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* View Profile Button */}
                  <div className="mt-4">
                    <Link href={`/login`}>
                      <motion.button
                        className="w-full bg-gradient-to-r from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900 px-4 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 text-sm border border-violet-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Start Free Trial
                      </motion.button>
                    </Link>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="mt-2 text-center">
                      <p className="text-red-400 text-xs">{error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DragDropCards;