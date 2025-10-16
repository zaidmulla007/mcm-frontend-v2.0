"use client";

import { FaInfoCircle, FaStar } from "react-icons/fa";
import { useState } from "react";
import Image from "next/image";

export default function InfluencerFlashCard({ data, rank, rankLabel, isLoggedIn, onViewFull }) {
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
              onMouseEnter={() => setShowTooltip('totalCalls')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <FaInfoCircle className="text-gray-400 text-xs" />
              {showTooltip === 'totalCalls' && (
                <div className="absolute z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg -top-2 left-6">
                  Total recommendations given by the influencer during the period
                </div>
              )}
            </button>
          </div>
          <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200 overflow-x-auto">
            {data?.Yearly ? (
              (() => {
                // Get yearly win rate data only
                const yearlyData = {};

                Object.entries(data.Yearly).forEach(([year, yearData]) => {
                  const yearlyWinRate = yearData?.["180_days"]?.price_probablity_of_winning_percentage || 0;
                  yearlyData[year] = yearlyWinRate;
                });

                // Calculate max for scaling
                const maxWinRate = Math.max(...Object.values(yearlyData), 1);

                return (
                  <div className="flex items-end gap-6 h-24 min-w-max overflow-x-auto justify-center">
                    {Object.entries(yearlyData).sort(([a], [b]) => b.localeCompare(a)).map(([year, winRate]) => {
                      let height = 0;
                      if (maxWinRate > 0 && winRate > 0) {
                        height = (winRate / maxWinRate) * 100;
                        if (height < 15) height = 15;
                      }

                      return (
                        <div key={year} className="flex flex-col items-center min-w-[50px]">
                          <div className="text-[10px] font-bold mb-1 whitespace-nowrap text-green-700">
                            {winRate.toFixed(0)}%
                          </div>
                          <div className="w-full flex items-end" style={{ height: '60px' }}>
                            <div
                              className="w-full bg-gradient-to-t from-green-700 to-green-600 rounded-t-sm cursor-pointer hover:from-green-800 hover:to-green-700 transition-colors"
                              style={{ height: height > 0 ? `${height}%` : '0px', minHeight: winRate > 0 ? '5px' : '0px' }}
                              title={`${year}: ${winRate.toFixed(0)}%`}
                            ></div>
                          </div>
                          <div className="text-[10px] text-gray-900 font-bold mt-1 text-center whitespace-nowrap">
                            {year}
                          </div>
                        </div>
                      );
                    })}
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
              const userData = localStorage.getItem('UserData');
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
                <div className="absolute z-10 w-72 p-2 bg-gray-900 text-white text-xs rounded shadow-lg -top-2 left-6">
                  % of calls that generated positive returns (that is, where the price of the coin moved in the direction of the influencer’s sentiment), for a 180 day holding period                </div>
              )}
            </button>
          </div>
          {/* Line Graph */}
          <div className="mt-3 bg-white rounded-lg p-4 border border-gray-200 overflow-x-auto">
            {Object.keys(totalCalls).length > 0 ? (
              (() => {
                // Collect all data points organized by year, then quarters
                const dataPoints = [];

                // Get all unique years from both Yearly and Quarterly data
                const years = new Set();
                if (data?.Yearly) {
                  Object.keys(data.Yearly).forEach(year => years.add(year));
                }
                Object.keys(totalCalls).forEach(quarter => {
                  years.add(quarter.substring(0, 4));
                });

                // Sort years from newest to oldest
                const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));

                // For each year, add year data first, then its quarters
                sortedYears.forEach(year => {
                  // Add yearly data point
                  if (data?.Yearly?.[year]) {
                    const roi = data.Yearly[year]?.["180_days"]?.probablity_weighted_returns_percentage || 0;
                    const clampedRoi = Math.max(-100, Math.min(100, roi));
                    dataPoints.push({ label: year, value: clampedRoi, actualValue: roi, isYearly: true });
                  }

                  // Add quarterly data points for this year (Q4, Q3, Q2, Q1)
                  const quarters = Object.keys(totalCalls)
                    .filter(q => q.startsWith(year))
                    .sort((a, b) => b.localeCompare(a)); // Q4 to Q1

                  quarters.forEach(quarter => {
                    const roi = data?.Quarterly?.[quarter]?.["180_days"]?.probablity_weighted_returns_percentage || 0;
                    const clampedRoi = Math.max(-100, Math.min(100, roi));
                    dataPoints.push({ label: quarter, value: clampedRoi, actualValue: roi, isYearly: false });
                  });
                });

                // Fixed Y-axis scale for consistency across all graphs
                const yMax = 100;
                const yMin = -100;
                const range = yMax - yMin;

                // Dynamic width based on number of data points (30px per point for proper spacing)
                const pointSpacing = 30;
                const graphWidth = Math.max(280, dataPoints.length * pointSpacing);
                const graphHeight = 120;
                const padding = { left: 35, right: 20, top: 20, bottom: 30 };

                // Calculate Y-axis ticks
                const yTicks = 5;
                const yStep = range / (yTicks - 1);

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
                      {Array.from({ length: yTicks }).map((_, i) => {
                        const value = yMax - (i * yStep);
                        const y = padding.top + (i * graphHeight / (yTicks - 1));
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
                              {value.toFixed(0)}
                            </text>
                            {i < yTicks - 1 && (
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

                        // Use green if current point is positive, red if negative or zero
                        const strokeColor = point.value > 0 ? "#00a63e" : "#ef4444";

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

                        // Use green for positive values, red for negative or zero
                        const fillColor = point.value > 0 ? "#00a63e" : "#ef4444";

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
              const userData = localStorage.getItem('UserData');
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
            <h4 className="text-sm font-bold text-gray-900">Moonshot %</h4>
            <button
              className="relative"
              onMouseEnter={() => setShowTooltip('moonshot')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <FaInfoCircle className="text-gray-400 text-xs" />
              {showTooltip === 'moonshot' && (
                <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-xl -top-32 left-0 right-0 mx-auto">
                  Moonshot is defined by hyperactivity in a coin recommended by the influencer within a short period of time. A recommendation was considered as a moonshot if the price of the coin moved by 50% within 1 hour, or by 100% within 7 days, or by 200% within 30 days, or by 300% within 180 days or by 400% within 1 year. The display on the screen is filtered for those recommendations where the coin moved by +300% within 180 days.
                </div>
              )}
            </button>
          </div>
          <div className={`grid gap-2 ${Object.keys(moonshotProb).length === 5 ? 'grid-cols-5' : Object.keys(moonshotProb).length === 4 ? 'grid-cols-4' : Object.keys(moonshotProb).length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {Object.keys(moonshotProb).length > 0 ? (
              Object.entries(moonshotProb)
                .sort(([a], [b]) => b.localeCompare(a)) // Sort years in reverse (latest first: 2025, 2024, ...)
                .map(([year, count]) => {
                  // Treat count as percentage (0-100)
                  // Cap at 100 if count exceeds 100
                  const percentage = Math.min(count, 100);
                  const circumference = 175.93; // 2 * PI * radius (28)

                  // Calculate stroke dasharray based on percentage (0-100)
                  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

                  return (
                    <div key={year} className="flex flex-col items-center">
                      <div className="text-xs text-gray-600 mb-1">{year}</div>
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="#e5e7eb"
                            strokeWidth="4"
                            fill="none"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="#16a34a"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={strokeDasharray}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-900">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="col-span-full text-center text-gray-400 text-xs py-4">No moonshot data available</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const userData = localStorage.getItem('UserData');
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
            View Moonshot Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
