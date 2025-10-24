"use client";

import { FaInfoCircle, FaStar } from "react-icons/fa";
import { useState, useMemo, memo } from "react";
import Image from "next/image";

// Moon Phase Component
const MoonPhase = memo(({ percentage, year }) => {
  const getShadowPath = (percent) => {
    const radius = 28;
    const centerX = 32;
    const centerY = 32;

    // Convert percentage to phase (0 to 1)
    const phase = percent / 100;

    // Calculate the shadow offset
    const offset = (phase * 2 - 1) * radius;

    // Create ellipse for shadow based on phase
    const shadowWidth = Math.abs(offset);

    if (phase < 0.5) {
      // Waxing phase (shadow on right)
      return `M ${centerX},${centerY - radius}
              A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
              A ${shadowWidth},${radius} 0 0,0 ${centerX},${centerY - radius}`;
    } else {
      // Waning phase (shadow on left)
      return `M ${centerX},${centerY - radius}
              A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
              A ${shadowWidth},${radius} 0 0,1 ${centerX},${centerY - radius}`;
    }
  };

  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <defs>
        <radialGradient id={`moonGlow-${year}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#dbeafe" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={`moonSurface-${year}`} cx="35%" cy="35%">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="50%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </radialGradient>
      </defs>

      {/* Outer glow */}
      <circle cx="32" cy="32" r="30" fill={`url(#moonGlow-${year})`} />

      {/* Main moon body */}
      <circle cx="32" cy="32" r="28" fill={`url(#moonSurface-${year})`} />

      {/* Craters */}
      <circle cx="24" cy="24" r="4" fill="#60a5fa" opacity="0.4" />
      <circle cx="38" cy="28" r="5" fill="#60a5fa" opacity="0.3" />
      <circle cx="28" cy="38" r="3" fill="#60a5fa" opacity="0.35" />
      <circle cx="40" cy="22" r="2.5" fill="#60a5fa" opacity="0.4" />
      <circle cx="35" cy="40" r="2" fill="#60a5fa" opacity="0.3" />

      {/* Shadow overlay */}
      <path
        d={getShadowPath(percentage)}
        fill="rgba(30, 30, 50, 0.75)"
        opacity="0.9"
      />

      {/* Subtle shadow edge highlight */}
      <path
        d={getShadowPath(percentage)}
        fill="none"
        stroke="rgba(30, 30, 50, 0.3)"
        strokeWidth="1"
      />
    </svg>
  );
});

MoonPhase.displayName = 'MoonPhase';

const InfluencerFlashCard = memo(({ data, rank, rankLabel, isLoggedIn, onViewFull }) => {
  const [showTooltip, setShowTooltip] = useState(null);

  // Calculate star rating from trust score (0-5 stars)
  const getStarRating = (trustScore) => {
    return Math.min(5, Math.max(0, Math.round(trustScore / 20)));
  };

  // Extract total calls from 180 days data across all quarters
  const extractTotalCallsByQuarter = (channelData) => {
    const callsByQuarter = {};

    console.log('Full Channel Data:', channelData);
    console.log('Has Quarterly?', !!channelData?.Quarterly);
    console.log('Quarterly keys:', channelData?.Quarterly ? Object.keys(channelData.Quarterly) : 'none');

    if (channelData?.Quarterly) {
      Object.entries(channelData.Quarterly)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort quarters chronologically
        .forEach(([quarter, quarterData]) => {
          console.log(`Quarter ${quarter}:`, quarterData);
          console.log(`180_days data:`, quarterData?.["180_days"]);

          // Get total coins from 180_days data
          const calls = quarterData?.["180_days"]?.total_coins || 0;
          console.log(`Quarter ${quarter} calls:`, calls);
          callsByQuarter[quarter] = calls;
        });
    } else {
      console.log('No Quarterly data found. Channel data structure:', Object.keys(channelData || {}));
    }

    console.log('Final Calls by Quarter:', callsByQuarter);

    return callsByQuarter;
  };

  // Extract ROI data from 180 days probablity_weighted_returns_percentage
  const extractROIByQuarter = (channelData) => {
    const roiByYear = {};

    if (channelData?.Quarterly) {
      Object.entries(channelData.Quarterly).forEach(([quarter, quarterData]) => {
        // Extract year from quarter (e.g., "2023Q1" -> "2023")
        const year = quarter.substring(0, 4);

        // Get ROI percentage from 180_days data
        const roi = quarterData?.["180_days"]?.probablity_weighted_returns_percentage || 0;

        // Store quarters for each year
        if (!roiByYear[year]) {
          roiByYear[year] = [];
        }
        roiByYear[year].push(roi);
      });
    }

    console.log('ROI by Year:', roiByYear);

    return roiByYear;
  };

  const starRating = getStarRating(data?.trustScore || 75);

  // Parse data from API response
  // Determine platform based on available fields
  const channelType = data?.platform || (data?.influencer_name ? "YouTube" : (data?.channel_id ? "Telegram" : "YouTube"));
  const influencerName = data?.channel_name || data?.influencer_name || data?.name || data?.title || data?.channel_id || "Anonymous Influencer";

  // Format subscriber count for YouTube
  const formatSubscribers = (count) => {
    if (!count) return "N/A";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M subs`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K subs`;
    }
    return `${count} subs`;
  };

  const subscribers = channelType === "Telegram"
    ? (formatSubscribers(data?.subscriber_count || data?.subs || data?.subscribers) || "Channel")
    : formatSubscribers(data?.subscriber_count || data?.subs || data?.subscribers);
  const profileImage = data?.channel_thumbnails?.high?.url || data?.thumbnail || null;
  const trustScore = data?.ai_overall_score ? data.ai_overall_score * 10 : 75;
  const totalCalls = extractTotalCallsByQuarter(data);
  const roiData = extractROIByQuarter(data);
  const winRate = data?.winRate || { 2022: 82, 2023: 85, 2024: 88, 2025: 90 };
  const channelId = data?.id || data?.channel_id || data?.channelId;
  const platformType = channelType === "Telegram" ? "telegram" : "youtube";

  // Extract moonshot count from moonshotData (180_days moonshots_price_count)
  const extractMoonshotProb = (channelData, platform) => {
    const moonshotProb = {};

    // Handle both API structures:
    // 1. data.moonshotData.yearly (old structure)
    // 2. data["score.moonshots.yearly"] (new API structure)
    const moonshotData = channelData?.moonshotData?.yearly ||
      channelData?.["score.moonshots.yearly"] ||
      {};

    if (moonshotData && Object.keys(moonshotData).length > 0) {
      Object.entries(moonshotData).forEach(([year, yearData]) => {
        // Filter based on platform and year
        // For YouTube: only show data from 2022 onwards
        // For Telegram: only show data from 2024 onwards
        const yearNum = parseInt(year);

        if (platform === "Telegram") {
          // Telegram: remove all data before 2024
          if (yearNum < 2024) {
            return; // Skip this year
          }
        } else {
          // YouTube: remove all data before 2022
          if (yearNum < 2022) {
            return; // Skip this year
          }
        }

        // Get moonshots_price_count from 180_days timeframe
        const count = yearData?.["180_days"]?.moonshots_price_count || 0;

        // Include ALL years regardless of has_data status (show 0 for years without data)
        moonshotProb[year] = count;
      });
    }

    return moonshotProb;
  };

  const moonshotProb = extractMoonshotProb(data, channelType);

  // Get current year once - stable value
  const currentYear = useMemo(() => new Date().getFullYear().toString(), []);

  // Memoize chart data to prevent flickering
  const totalCallsChartData = useMemo(() => {
    if (!data?.Yearly) return null;

    const overallData = data.Yearly;

    const transformYearlyData = (yearlyData) => {
      if (!yearlyData) return [];
      return Object.keys(yearlyData)
        .map((year) => ({
          year,
          total: (yearlyData[year]?.bullish_count || 0) + (yearlyData[year]?.bearish_count || 0),
        }))
        .sort((a, b) => a.year.localeCompare(b.year));
    };

    const chartData = transformYearlyData(overallData).map((item) => ({
      year: item.year === currentYear ? item.year + '*' : item.year,
      total: item.total,
    }));

    return chartData;
  }, [data?.Yearly, currentYear]);

  // Memoize ROI graph data points to prevent recalculation on every render
  const roiGraphData = useMemo(() => {
    if (!data?.Yearly || Object.keys(totalCalls).length === 0) return null;

    const dataPoints = [];
    const years = new Set();

    if (data?.Yearly) {
      Object.keys(data.Yearly).forEach(year => years.add(year));
    }
    Object.keys(totalCalls).forEach(quarter => {
      years.add(quarter.substring(0, 4));
    });

    const sortedYears = Array.from(years).sort((a, b) => a.localeCompare(b));
    const currentMonth = new Date().getMonth() + 1;

    const getCurrentQuarterLimit = (month) => {
      if (month <= 3) return 0;
      if (month <= 6) return 1;
      if (month <= 9) return 2;
      return 3;
    };

    const maxQuarterToShow = getCurrentQuarterLimit(currentMonth);

    sortedYears.forEach(year => {
      if (data?.Yearly?.[year]) {
        const roi = data.Yearly[year]?.["180_days"]?.probablity_weighted_returns_percentage || 0;
        const clampedRoi = Math.max(-100, Math.min(100, roi));
        const yearLabel = year === currentYear ? year + '*' : year;
        dataPoints.push({ label: yearLabel, value: clampedRoi, actualValue: roi, isYearly: true });
      }

      const quarters = Object.keys(totalCalls)
        .filter(q => q.startsWith(year))
        .sort((a, b) => a.localeCompare(b));

      quarters.forEach(quarter => {
        if (year === currentYear) {
          const quarterNum = quarter.substring(4);
          const quarterIndex = parseInt(quarterNum.substring(1));
          if (quarterIndex > maxQuarterToShow) {
            return;
          }
        }

        const roi = data?.Quarterly?.[quarter]?.["180_days"]?.probablity_weighted_returns_percentage || 0;
        const clampedRoi = Math.max(-100, Math.min(100, roi));
        dataPoints.push({ label: quarter, value: clampedRoi, actualValue: roi, isYearly: false });
      });
    });

    return dataPoints;
  }, [data?.Yearly, data?.Quarterly, totalCalls, currentYear]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
        <div className="flex items-center gap-3">
          {/* Profile Image - Centered */}
          <div className="relative flex-shrink-0">
            {profileImage ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                <Image
                  src={profileImage}
                  alt={influencerName}
                  width={64}
                  height={64}
                  className="rounded-full w-full h-full object-cover"
                />
              </div>
            ) : channelType === "Telegram" ? (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shadow-lg border-2 border-white">
                <span className="text-xl font-bold text-white">
                  {influencerName ? influencerName.match(/\b\w/g)?.join("") || "?" : "?"}
                </span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300 border-2 border-white"></div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white">
                {/* Rank Badge - Above Name */}
                <h3 className="text-sm font-bold">{influencerName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">
                    {channelType === "Telegram" ? channelType : `${channelType} • ${subscribers}`}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => onViewFull(e)}
                className="text-white text-xs hover:text-gray-200 font-semibold whitespace-nowrap"
              >
                View Full →
              </button>
            </div>

            {/* MCM Trust Score / Star Rating */}
            <div className="flex items-center justify-between">
              <div className="text-white text-xs">MCM Rating</div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={star <= starRating ? "text-yellow-400" : "text-gray-400"}
                    size={16}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Total Calls */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-bold text-gray-900">Total Calls</h4>
            <button
              className="relative"
              onMouseEnter={() => setShowTooltip('totalRecommendations')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <FaInfoCircle className="text-gray-400 text-xs" />
              {showTooltip === 'totalRecommendations' && (
                <div className="absolute z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg -top-2 left-6">
                  <p className="text-left leading-relaxed">Total bullish and bearish recommendations given by the influencer each year.</p>
                </div>
              )}
            </button>
          </div>

          {/* Chart Container */}
          <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200">
            {totalCallsChartData && totalCallsChartData.length > 0 ? (
              (() => {
                const data = totalCallsChartData;
                const width = 350;
                const height = 180;
                const padding = { top: 30, right: 20, bottom: 40, left: 20 };
                const chartWidth = width - padding.left - padding.right;
                const chartHeight = height - padding.top - padding.bottom;

                // Find max value for scaling
                const maxValue = Math.max(...data.map(d => d.total));
                const barWidth = chartWidth / data.length;
                const barPadding = barWidth * 0.2;

                return (
                  <div className="flex justify-center">
                    <svg width={width} height={height}>
                      {/* Bars */}
                      {data.map((item, index) => {
                        const barHeight = (item.total / maxValue) * chartHeight;
                        const x = padding.left + (index * barWidth) + barPadding / 2;
                        const y = padding.top + (chartHeight - barHeight);

                        return (
                          <g key={`${item.year}-${item.total}`}>
                            {/* Bar */}
                            <rect
                              x={x}
                              y={y}
                              width={barWidth - barPadding}
                              height={barHeight}
                              fill="#1e3a8a"
                              rx="4"
                            />

                            {/* Value label on top */}
                            <text
                              x={x + (barWidth - barPadding) / 2}
                              y={y - 5}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#333"
                              fontWeight="bold"
                            >
                              {item.total}
                            </text>

                            {/* Year label at bottom */}
                            <text
                              x={x + (barWidth - barPadding) / 2}
                              y={height - padding.bottom + 20}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#666"
                              fontWeight="bold"
                            >
                              {item.year}
                            </text>
                          </g>
                        );
                      })}

                      {/* X-axis line */}
                      <line
                        x1={padding.left}
                        y1={height - padding.bottom}
                        x2={width - padding.right}
                        y2={height - padding.bottom}
                        stroke="#666"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                );
              })()
            ) : (
              <div className="h-24 flex items-center justify-center text-gray-400 text-xs">
                No data available
              </div>
            )}
          </div>

          {/* View Dashboard Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const userData = localStorage.getItem('userData');
              if (userData) {
                window.location.href =
                  platformType === 'youtube'
                    ? `/influencers/${channelId}`
                    : `/telegram-influencer/${channelId}`;
              } else {
                window.location.href = '/login?signup=true';
              }
            }}
            className="text-blue-600 text-xs font-semibold mt-2 hover:text-blue-700"
          >
            View Total Calls Dashboard →
          </button>
        </div>


        {/* ROI % - Win Rate Percentage */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-bold text-gray-900">ROI %</h4>
            <button
              className="relative"
              onMouseEnter={() => setShowTooltip('roi')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <FaInfoCircle className="text-gray-400 text-xs" />
              {showTooltip === 'roi' && (
                <div className="absolute z-10 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg -top-2 left-6">
                  <p className="text-left leading-relaxed">% of calls that generated positive returns (that is, where the price of the coin moved in the direction of the influencer&apos;s sentiment), for a 180 day holding period</p>
                </div>
              )}
            </button>
          </div>
          {/* Line Graph */}
          <div className="mt-3 bg-white rounded-lg p-4 border border-gray-200 overflow-x-auto">
            {roiGraphData && roiGraphData.length > 0 ? (
              (() => {
                const dataPoints = roiGraphData;

                // Fixed Y-axis scale for consistency across all graphs
                const yMax = 100;
                const yMin = -100;
                const range = yMax - yMin;

                // Dynamic width based on number of data points (30px per point for proper spacing)
                const pointSpacing = 30;
                const graphWidth = Math.max(280, dataPoints.length * pointSpacing);
                const graphHeight = 120;
                const padding = { left: 35, right: 20, top: 20, bottom: 30 };

                // Custom Y-axis labels: 100+, 100, 50, 0, -50, -100
                const yLabels = [
                  { value: 100, display: '100+' },
                  { value: 100, display: '100' },
                  { value: 50, display: '50' },
                  { value: 0, display: '0' },
                  { value: -50, display: '-50' },
                  { value: -100, display: '-100' }
                ];

                return (
                  <div className="relative" style={{ height: `${graphHeight + padding.top + padding.bottom}px`, minWidth: `${graphWidth + padding.left + padding.right}px` }}>
                    <svg width={graphWidth + padding.left + padding.right} height={graphHeight + padding.top + padding.bottom}>
                      {/* Y-axis */}
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={graphHeight + padding.top}
                        stroke="#374151"
                        strokeWidth="2"
                      />

                      {/* X-axis */}
                      <line
                        x1={padding.left}
                        y1={graphHeight + padding.top}
                        x2={graphWidth + padding.left}
                        y2={graphHeight + padding.top}
                        stroke="#374151"
                        strokeWidth="2"
                      />

                      {/* Y-axis labels and grid lines */}
                      {yLabels.map((label, i) => {
                        const y = padding.top + (i * graphHeight / (yLabels.length - 1));
                        return (
                          <g key={i}>
                            <text
                              x={padding.left - 8}
                              y={y + 4}
                              fontSize="10"
                              textAnchor="end"
                              fill="#374151"
                              fontWeight="bold"
                            >
                              {label.display}
                            </text>
                            {i < yLabels.length - 1 && (
                              <line
                                x1={padding.left}
                                y1={y}
                                x2={graphWidth + padding.left}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeWidth="1"
                              />
                            )}
                          </g>
                        );
                      })}

                      {/* Data line segments with color based on value */}
                      {dataPoints.map((point, index) => {
                        if (index === 0) return null;
                        const x1 = padding.left + ((index - 1) / (dataPoints.length - 1)) * graphWidth;
                        const y1 = graphHeight + padding.top - ((dataPoints[index - 1].value - yMin) / range * graphHeight);
                        const x2 = padding.left + (index / (dataPoints.length - 1)) * graphWidth;
                        const y2 = graphHeight + padding.top - ((point.value - yMin) / range * graphHeight);

                        // Use #1e3a8a for positive values (>= 0), #dbeafe for negative values (< 0)
                        const strokeColor = point.value >= 0 ? "#1e3a8a" : "#dbeafe";

                        return (
                          <line
                            key={`line-${index}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={strokeColor}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        );
                      })}

                      {/* Data points */}
                      {dataPoints.map((point, index) => {
                        const x = padding.left + (index / (dataPoints.length - 1)) * graphWidth;
                        const normalizedValue = (point.value - yMin) / range;
                        const y = graphHeight + padding.top - (normalizedValue * graphHeight);

                        // Use #1e3a8a for positive values (>= 0), #dbeafe for negative values (< 0)
                        const fillColor = point.value >= 0 ? "#1e3a8a" : "#dbeafe";

                        return (
                          <g key={point.label}>
                            <circle
                              cx={x}
                              cy={y}
                              r="5"
                              fill={fillColor}
                              className="cursor-pointer"
                            >
                              <title>{point.label}: {point.actualValue >= 0 ? '+' : ''}{point.actualValue.toFixed(1)}%</title>
                            </circle>
                            {/* X-axis label */}
                            <text
                              x={x}
                              y={graphHeight + padding.top + 18}
                              fontSize="9"
                              textAnchor="middle"
                              fill="#374151"
                              fontWeight="bold"
                            >
                              {point.isYearly ? point.label : 'Q' + point.label.substring(5)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()
            ) : (
              <div className="h-24 flex items-center justify-center text-gray-400 text-xs">No data available</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const userData = localStorage.getItem('userData');
              if (userData) {
                window.location.href = platformType === "youtube"
                  ? `/influencers/${channelId}`
                  : `/telegram-influencer/${channelId}`;
              } else {
                window.location.href = '/login?signup=true';
              }
            }}
            className="text-blue-600 text-xs font-semibold mt-2 hover:text-blue-700"
          >
            View ROI Dashboard →
          </button>
        </div>

        {/* Moonshot Probability */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-bold text-gray-900">Moonshots</h4>
            <button
              className="relative"
              onMouseEnter={() => setShowTooltip('moonshot')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <FaInfoCircle className="text-gray-400 text-xs" />
              {showTooltip === 'moonshot' && (
                <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-xl -top-32 left-0 right-0 mx-auto">
                  <p className="text-left leading-relaxed">Moonshot is defined by hyperactivity in a coin recommended by the influencer within a short period of time. A recommendation was considered as a moonshot if the price of the coin moved by 50% within 1 hour, or by 100% within 7 days, or by 200% within 30 days, or by 300% within 180 days or by 400% within 1 year. The display on the screen is filtered for those recommendations where the coin moved by +300% within 180 days.</p>
                </div>
              )}
            </button>
          </div>
          <div className={`grid gap-2 ${Object.keys(moonshotProb).length === 5 ? 'grid-cols-5' : Object.keys(moonshotProb).length === 4 ? 'grid-cols-4' : Object.keys(moonshotProb).length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {Object.keys(moonshotProb).length > 0 ? (
              (() => {
                const currentYear = new Date().getFullYear().toString();
                return Object.entries(moonshotProb)
                  .sort(([a], [b]) => a.localeCompare(b)) // Sort years chronologically (2021, 2022, 2023, 2024, 2025)
                  .map(([year, count]) => {
                    // Treat count as percentage (0-100)
                    // Cap at 100 if count exceeds 100
                    const percentage =100 - Math.min(count, 100);

                    // Mark current year with asterisk
                    const displayYear = year === currentYear ? year + '*' : year;

                    return (
                      <div key={year} className="flex flex-col items-center">
                        <div className="text-xs text-gray-600 mb-1">{displayYear}</div>
                        <div className="relative w-16 h-16">
                          <MoonPhase percentage={percentage} year={year} />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-white" style={{ textShadow: '0 0 3px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.6)' }}>{count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
              })()
            ) : (
              <div className="col-span-full text-center text-gray-400 text-xs py-4">No moonshot data available</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const userData = localStorage.getItem('userData');
              if (userData) {
                window.location.href = platformType === "youtube"
                  ? `/influencers/${channelId}`
                  : `/telegram-influencer/${channelId}`;
              } else {
                window.location.href = '/login?signup=true';
              }
            }}
            className="text-blue-600 text-xs font-semibold mt-2 hover:text-blue-700 transition-colors"
          >
            View Moonshot Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
});

InfluencerFlashCard.displayName = 'InfluencerFlashCard';

export default InfluencerFlashCard;