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
    ? (data?.channel_id || data?.subs || data?.subscribers || "N/A")
    : formatSubscribers(data?.subscriber_count || data?.subs || data?.subscribers);
  const profileImage = data?.channel_thumbnails?.high?.url || data?.thumbnail || null;
  const trustScore = data?.ai_overall_score ? data.ai_overall_score * 10 : 75;
  const totalCalls = extractTotalCallsByQuarter(data);
  const roiData = extractROIByQuarter(data);
  const winRate = data?.winRate || { 2022: 82, 2023: 85, 2024: 88, 2025: 90 };
  const channelId = data?.id || data?.channel_id || data?.channelId;
  const platformType = channelType === "Telegram" ? "telegram" : "youtube";

  // Extract moonshot probability from moonshotData (180_days moonshots_ratio as percentage)
  const extractMoonshotProb = (channelData) => {
    const moonshotProb = {};

    // Handle both API structures:
    // 1. data.moonshotData.yearly (old structure)
    // 2. data["score.moonshots.yearly"] (new API structure)
    const moonshotData = channelData?.moonshotData?.yearly ||
                        channelData?.["score.moonshots.yearly"] ||
                        {};

    if (moonshotData && Object.keys(moonshotData).length > 0) {
      Object.entries(moonshotData).forEach(([year, yearData]) => {
        // Get moonshots_ratio from 180_days timeframe and convert to percentage
        const ratio = yearData?.["180_days"]?.moonshots_ratio || 0;
        const percentage = (ratio * 100);

        // Include ALL years regardless of has_data status (show 0% for years without data)
        moonshotProb[year] = parseFloat(percentage.toFixed(1));
      });
    }

    return moonshotProb;
  };

  const moonshotProb = extractMoonshotProb(data);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {profileImage ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                  <Image
                    src={profileImage}
                    alt={influencerName}
                    width={48}
                    height={48}
                    className="rounded-full w-full h-full object-cover"
                  />
                </div>
              ) : channelType === "Telegram" ? (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="text-lg font-bold text-white">
                    {influencerName ? influencerName.match(/\b\w/g)?.join("") || "?" : "?"}
                  </span>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 border-2 border-white"></div>
              )}
            </div>
            <div className="text-white">
              {/* Rank Badge - Above Name */}
              <div className="bg-yellow-400 text-black font-bold text-[10px] rounded px-1.5 py-0.5 inline-block mb-1 shadow-sm">
                {rankLabel || `#${rank}`}
              </div>
              <h3 className="text-sm font-bold">{influencerName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs">{channelType} • {subscribers}</span>
              </div>
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
        <div className="bg-white/10 backdrop-blur rounded-lg p-2">
          <div className="text-white text-xs mb-1">MCM Trust Score</div>
          <div className="flex items-center gap-2">
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
            {Object.keys(totalCalls).length > 0 || data?.Yearly ? (
              (() => {
                // Group quarters by year
                const yearlyData = {};
                Object.entries(totalCalls).forEach(([quarter]) => {
                  const year = quarter.substring(0, 4);
                  const winRate = data?.Quarterly?.[quarter]?.["180_days"]?.price_probablity_of_winning_percentage || 0;

                  if (!yearlyData[year]) {
                    yearlyData[year] = { quarters: [], yearlyWinRate: 0 };
                  }
                  yearlyData[year].quarters.push({ quarter, winRate });
                });

                // Add yearly win rate from Yearly data
                if (data?.Yearly) {
                  Object.entries(data.Yearly).forEach(([year, yearData]) => {
                    const yearlyWinRate = yearData?.["180_days"]?.price_probablity_of_winning_percentage || 0;
                    if (!yearlyData[year]) {
                      yearlyData[year] = { quarters: [], yearlyWinRate };
                    } else {
                      yearlyData[year].yearlyWinRate = yearlyWinRate;
                    }
                  });
                }

                // Calculate max for scaling (including yearly data)
                const allWinRates = [
                  ...Object.values(yearlyData).flatMap(yd => yd.quarters.map(q => q.winRate)),
                  ...Object.values(yearlyData).map(yd => yd.yearlyWinRate)
                ];
                const maxWinRate = Math.max(...allWinRates, 1);

                // Use yearlyWinRate instead of calculated average
                const yearlyAverages = {};
                Object.entries(yearlyData).forEach(([year, yearData]) => {
                  yearlyAverages[year] = yearData.yearlyWinRate;
                });

                return (
                  <div className="flex items-end gap-6 h-24 min-w-max overflow-x-auto">
                    {Object.entries(yearlyData).sort(([a], [b]) => b.localeCompare(a)).map(([year, yearData]) => {
                      const avgWinRate = yearlyAverages[year];

                      return (
                        <div key={year} className="flex items-end gap-2">
                          {/* Yearly average bar first */}
                          {(() => {
                            let height = 0;
                            if (maxWinRate > 0 && avgWinRate > 0) {
                              height = (avgWinRate / maxWinRate) * 100;
                              if (height < 15) height = 15;
                            }

                            return (
                              <div className="flex flex-col items-center min-w-[40px]">
                                <div className="text-[10px] font-bold mb-1 whitespace-nowrap text-green-700">
                                  {avgWinRate.toFixed(0)}%
                                </div>
                                <div className="w-full flex items-end" style={{ height: '60px' }}>
                                  <div
                                    className="w-full bg-gradient-to-t from-green-700 to-green-600 rounded-t-sm cursor-pointer hover:from-green-800 hover:to-green-700 transition-colors"
                                    style={{ height: height > 0 ? `${height}%` : '0px', minHeight: avgWinRate > 0 ? '5px' : '0px' }}
                                    title={`${year} Avg: ${avgWinRate.toFixed(0)}%`}
                                  ></div>
                                </div>
                                <div className="text-[9px] text-gray-900 font-bold mt-1 text-center whitespace-nowrap">
                                  {year}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Quarterly bars */}
                          {yearData.quarters.sort((a, b) => a.quarter.localeCompare(b.quarter)).map(({ quarter, winRate }) => {
                            let height = 0;
                            if (maxWinRate > 0 && winRate > 0) {
                              height = (winRate / maxWinRate) * 100;
                              if (height < 15) height = 15;
                            }

                            return (
                              <div key={quarter} className="flex flex-col items-center min-w-[40px]">
                                {/* Win Rate percentage above bar */}
                                <div className="text-[10px] font-semibold mb-1 whitespace-nowrap text-green-500">
                                  {winRate.toFixed(0)}%
                                </div>
                                {/* Bar with gradient */}
                                <div className="w-full flex items-end" style={{ height: '60px' }}>
                                  <div
                                    className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t-sm cursor-pointer hover:from-green-600 hover:to-green-400 transition-colors"
                                    style={{ height: height > 0 ? `${height}%` : '0px', minHeight: winRate > 0 ? '5px' : '0px' }}
                                    title={`${quarter}: ${winRate.toFixed(0)}%`}
                                  ></div>
                                </div>
                                {/* Quarter label below bar */}
                                <div className="text-[9px] text-gray-700 mt-1 text-center whitespace-nowrap">
                                  Q{quarter.substring(5)}
                                </div>
                              </div>
                            );
                          })}
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
          {/* Bar Graph */}
          <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200 overflow-x-auto">
            {Object.keys(totalCalls).length > 0 ? (
              (() => {
                // Group quarters by year
                const yearlyData = {};
                Object.entries(totalCalls).forEach(([quarter]) => {
                  const year = quarter.substring(0, 4);
                  const roi = data?.Quarterly?.[quarter]?.["180_days"]?.probablity_weighted_returns_percentage || 0;

                  if (!yearlyData[year]) {
                    yearlyData[year] = { quarters: [], sum: 0, count: 0 };
                  }
                  yearlyData[year].quarters.push({ quarter, roi });
                  yearlyData[year].sum += roi;
                  yearlyData[year].count += 1;
                });

                // Calculate yearly averages and max for scaling
                const yearlyAverages = {};
                Object.entries(yearlyData).forEach(([year, yearData]) => {
                  const sum = yearData.quarters.reduce((acc, q) => acc + q.roi, 0);
                  yearlyAverages[year] = sum / yearData.quarters.length;
                });

                const allROIs = [
                  ...Object.values(yearlyData).flatMap(yd => yd.quarters.map(q => q.roi)),
                  ...Object.values(yearlyAverages)
                ];
                const maxROI = Math.max(...allROIs.map(Math.abs), 1);

                return (
                  <div className="flex items-end gap-6 h-24 min-w-max overflow-x-auto">
                    {Object.entries(yearlyData).sort(([a], [b]) => b.localeCompare(a)).map(([year, yearData]) => {
                      const avgROI = yearlyAverages[year];

                      return (
                        <div key={year} className="flex items-end gap-2">
                          {/* Yearly average bar first */}
                          {(() => {
                            let height = 0;
                            if (maxROI > 0) {
                              height = (Math.abs(avgROI) / maxROI) * 100;
                              if (Math.abs(avgROI) > 0 && height < 15) height = 15;
                            }

                            return (
                              <div className="flex flex-col items-center min-w-[40px]">
                                <div className={`text-[10px] font-bold mb-1 whitespace-nowrap ${avgROI >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                  {avgROI >= 0 ? '+' : ''}{avgROI.toFixed(0)}%
                                </div>
                                <div className="w-full flex items-end" style={{ height: '60px' }}>
                                  <div
                                    className={`w-full rounded-t-sm cursor-pointer transition-colors ${avgROI >= 0
                                        ? 'bg-gradient-to-t from-green-700 to-green-600 hover:from-green-800 hover:to-green-700'
                                        : 'bg-gradient-to-t from-red-600 to-red-400 hover:from-red-700 hover:to-red-500'
                                      }`}
                                    style={{ height: height > 0 ? `${height}%` : '0px', minHeight: Math.abs(avgROI) > 0 ? '5px' : '0px' }}
                                    title={`${year} Avg: ${avgROI >= 0 ? '+' : ''}${avgROI.toFixed(0)}%`}
                                  ></div>
                                </div>
                                <div className="text-[9px] text-gray-900 font-bold mt-1 text-center whitespace-nowrap">
                                  {year}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Quarterly bars */}
                          {yearData.quarters.sort((a, b) => a.quarter.localeCompare(b.quarter)).map(({ quarter, roi }) => {
                            let height = 0;
                            if (maxROI > 0) {
                              height = (Math.abs(roi) / maxROI) * 100;
                              if (Math.abs(roi) > 0 && height < 15) height = 15;
                            }

                            return (
                              <div key={quarter} className="flex flex-col items-center min-w-[40px]">
                                {/* ROI percentage above bar */}
                                <div className={`text-[10px] font-semibold mb-1 whitespace-nowrap ${roi >= 0 ? 'text-green-500' : 'text-red-600'}`}>
                                  {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
                                </div>
                                {/* Bar with gradient */}
                                <div className="w-full flex items-end" style={{ height: '60px' }}>
                                  <div
                                    className={`w-full rounded-t-sm cursor-pointer transition-colors ${roi >= 0
                                        ? 'bg-gradient-to-t from-green-500 to-green-300 hover:from-green-600 hover:to-green-400'
                                        : 'bg-gradient-to-t from-red-600 to-red-400 hover:from-red-700 hover:to-red-500'
                                      }`}
                                    style={{ height: height > 0 ? `${height}%` : '0px', minHeight: Math.abs(roi) > 0 ? '5px' : '0px' }}
                                    title={`${quarter}: ${roi >= 0 ? '+' : ''}${roi.toFixed(0)}%`}
                                  ></div>
                                </div>
                                {/* Quarter label below bar */}
                                <div className="text-[9px] text-gray-700 mt-1 text-center whitespace-nowrap">
                                  Q{quarter.substring(5)}
                                </div>
                              </div>
                            );
                          })}
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
            View ROI Dashboard →
          </button>
        </div>

        {/* Moonshot Probability */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-bold text-gray-900">Moonshot Probability %</h4>
            <button
              className="relative"
              onMouseEnter={() => setShowTooltip('moonshot')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <FaInfoCircle className="text-gray-400 text-xs" />
              {showTooltip === 'moonshot' && (
                <div className="absolute z-10 w-80 p-2 bg-gray-900 text-white text-xs rounded shadow-lg -top-2 left-6">
                  Moonshot is defined by hyperactivity in a coin recommended by the influencer within a short period of time. A recommendation was considered as a moonshot if the price of the coin moved by 50% within 1 hour, or by 100% within 7 days, or by 200% within 30 days, or by 300% within 180 days or by 400% within 1 year. The display on the screen is filtered for those recommendations where the coin moved by +300% within 180 days.
                </div>
              )}
            </button>
          </div>
          <div className={`grid gap-2 ${Object.keys(moonshotProb).length === 5 ? 'grid-cols-5' : Object.keys(moonshotProb).length === 4 ? 'grid-cols-4' : Object.keys(moonshotProb).length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {Object.keys(moonshotProb).length > 0 ? (
              Object.entries(moonshotProb)
                .sort(([a], [b]) => a.localeCompare(b)) // Sort years chronologically
                .map(([year, prob]) => (
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
                          strokeDasharray={`${(prob / 100) * 175.93} 175.93`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-900">{prob}%</span>
                      </div>
                    </div>
                  </div>
                ))
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
