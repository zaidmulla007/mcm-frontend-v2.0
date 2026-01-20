"use client";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { FaStar, FaStarHalfAlt, FaChevronLeft, FaChevronRight, FaEye, FaYoutube, FaTelegramPlane } from "react-icons/fa";
import { getYearOptions, getDynamicTimeframeOptions } from "../../../utils/dateFilterUtils";

// Helper function to format numbers
const formatNumber = (num) => {
  if (!num || num === 0) return '0';
  const absNum = Math.abs(num);
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (absNum >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Left Panel Component - Profile Image, Rank, Name, Subscribers
const LeftPanel = ({ influencer }) => {
  const handleNavigate = () => {
    const url = influencer.platform === "YouTube"
      ? `/influencers/${influencer.id}`
      : `/telegram-influencer/${influencer.id}`;
    window.location.href = url;
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 via-purple-50 to-white flex flex-col p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#3b82f6_25%,transparent_25%,transparent_75%,#3b82f6_75%,#3b82f6),linear-gradient(45deg,#3b82f6_25%,transparent_25%,transparent_75%,#3b82f6_75%,#3b82f6)] bg-[length:20px_20px] bg-[0_0,10px_10px]"></div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center">
        {/* Large Influencer Image */}
        <div className="relative mb-2 group cursor-pointer" onClick={handleNavigate}>
          {/* Gradient Ring on Hover */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/80 transition-all group-hover:ring-0">
            {influencer.channel_thumbnails?.high?.url ? (
              <Image
                src={influencer.channel_thumbnails.high.url}
                alt={influencer.name || "Influencer"}
                width={144}
                height={144}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}

            {/* Fallback Avatar */}
            <div
              className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 flex items-center justify-center"
              style={{ display: influencer.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
            >
              <span className="text-white text-4xl font-bold">
                {influencer.name?.match(/\b\w/g)?.join("").toUpperCase() || "?"}
              </span>
            </div>
          </div>

        </div>

        {/* Influencer Name */}
        <h2 className="text-lg md:text-xl font-bold text-gray-800 text-center mb-1 px-2 line-clamp-2">
          {influencer.name?.replace(/_/g, " ") || "Unknown"}
        </h2>

        {/* Platform Badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-gray-100 px-4 py-1.5 rounded-full shadow-md mb-3">
          {influencer.platform === "YouTube" ? (
            <FaYoutube className="text-red-600 text-sm" />
          ) : (
            <FaTelegramPlane className="text-blue-500 text-sm" />
          )}
          <span className="font-bold text-xs text-gray-700">{influencer.platform}</span>
        </div>

        {/* Last Post Date and Time Card */}
        <div className="w-full max-w-[200px] bg-white rounded-xl p-2 shadow-md border border-blue-100 mb-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-600 font-medium">Last Post</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">
                {influencer.last_post_date_string || '--'}
              </span>
              <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {influencer.last_post_time || '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Posts History (Hardcoded) */}
        <div className="w-full max-w-[200px] bg-white/60 rounded-xl p-2 shadow-md border border-blue-100 mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase text-gray-600 px-1">Posts History</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-white rounded-md p-1 border border-blue-50 text-center shadow-sm">
              <div className="text-[8px] text-gray-500 font-medium mb-0">2025</div>
              <div className="text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">142</div>
            </div>
            <div className="bg-white rounded-md p-1 border border-blue-50 text-center shadow-sm">
              <div className="text-[8px] text-gray-500 font-medium mb-0">2024</div>
              <div className="text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">385</div>
            </div>
            <div className="bg-white rounded-md p-1 border border-blue-50 text-center shadow-sm">
              <div className="text-[8px] text-gray-500 font-medium mb-0">2023</div>
              <div className="text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">210</div>
            </div>
          </div>
        </div>

        {/* Subscribers Card - Lifted Layout */}
        <div className="w-full max-w-[200px] bg-white rounded-xl p-3 shadow-md border border-blue-100 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">Subscribers</span>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatNumber(influencer.subs)}
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Line */}
      <div className="mt-auto text-center">
        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto opacity-50"></div>
      </div>
    </div>
  );
};

// Middle Panel Component - MCM Ranking & Key Metrics
// Middle Panel Component - MCM Ranking & Key Metrics
const MiddlePanel = ({ influencer }) => {
  // Get star ratings
  const starRatingYearly = influencer.star_rating_yearly || {};
  const currentDate = new Date();
  const currentRealYear = currentDate.getFullYear();
  const currentRealMonth = currentDate.getMonth();

  const years = Object.keys(starRatingYearly)
    .map(year => parseInt(year))
    .filter(year => {
      if (year < 2022) return false;
      if (year > currentRealYear) return false;
      if (year === currentRealYear && currentRealMonth < 3) return false;
      return true;
    })
    .sort((a, b) => a - b);

  const scatterData = [];
  years.forEach((year, yearIndex) => {
    const yearData = starRatingYearly[year];
    if (yearData && yearData.current_rating) {
      scatterData.push({
        year: yearIndex,
        yearLabel: year,
        rating: yearData.current_rating,
        finalScore: yearData.current_final_score
      });
    }
  });

  // Get AI scoring data for all years
  const getAllYearsAIScoring = () => {
    if (!influencer?.ai_scoring_yearly) return [];

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Only show current year data if at least Q1 is complete (i.e., we're in Q2 or later)
    const shouldShowCurrentYear = currentMonth >= 3; // April or later

    const years = Object.keys(influencer.ai_scoring_yearly)
      .map(y => parseInt(y))
      .filter(y => {
        if (y < 2022) return false;
        if (y > currentYear) return false;
        if (y === currentYear && !shouldShowCurrentYear) return false;
        return true;
      })
      .sort((a, b) => b - a); // Sort descending (newest first)

    return years.map(year => ({
      year,
      data: influencer.ai_scoring_yearly[year]
    }));
  };

  const yearsAIData = getAllYearsAIScoring();

  // Metrics to display with definitions
  const metrics = [
    {
      key: 'overall_score',
      label: 'Overall Score',
      field: 'avg_overall_score',
      color: '#1e3a8a',
      definition: 'Combined score reflecting overall quality across all metrics.'
    },
    {
      key: 'credibility_score',
      label: 'Credibility Score',
      field: 'avg_credibility_score',
      color: '#1d4ed8',
      definition: 'Trustworthiness and accuracy of the content.'
    },
    {
      key: 'risk_management',
      label: 'Risk Management',
      field: 'avg_risk_management',
      color: '#3b82f6',
      definition: 'How well risk strategies are addressed (e.g. sizing, risk-reward ratios, portfolio allocation).'
    },
    {
      key: 'actionable_insights',
      label: 'Actionable Insights',
      field: 'avg_actionable_insights',
      color: '#93c5fd',
      definition: 'Presence and quality of actionable insights. Higher score when the reader can take specific actions.'
    }
  ];

  return (
    <div className="h-full w-full bg-white flex flex-col p-3 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-white"></div>

      {/* Content - Scrollable */}
      <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex-shrink-0 mb-3">
          <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            Influencer Overview
          </h3>
          <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-0">
          {/* MCM Ranking Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50/50 rounded-xl p-3 shadow-sm border border-blue-100/50">
            <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></span>
              MCM Ranking
            </h4>
            {scatterData.length > 0 ? (
              <div className="flex justify-center items-end gap-4 h-32">
                {scatterData.map((point, idx) => {
                  const fullStars = Math.floor(point.rating);
                  const hasHalfStar = point.rating % 1 >= 0.5;
                  const totalStars = 5;
                  const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-1.5 group"
                      title={`Year: ${point.yearLabel}, Rating: ${point.rating.toFixed(1)}`}
                    >
                      {/* Stars */}
                      <div className="flex flex-col-reverse gap-1 transition-transform group-hover:-translate-y-1 duration-300">
                        {[...Array(fullStars)].map((_, i) => (
                          <FaStar key={`full-${i}`} className="text-yellow-500 w-3 h-3 drop-shadow-sm" />
                        ))}
                        {hasHalfStar && (
                          <FaStarHalfAlt key="half" className="text-yellow-500 w-3 h-3 drop-shadow-sm" />
                        )}
                        {[...Array(emptyStars)].map((_, i) => (
                          <FaStar key={`empty-${i}`} className="text-gray-200 w-3 h-3" />
                        ))}
                      </div>
                      {/* Year */}
                      <span className="text-[10px] font-bold text-gray-600 group-hover:text-blue-600 transition-colors">{point.yearLabel}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 text-xs">No rating data</div>
            )}
          </div>

          {/* AI Scoring Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></span>
              AI Scoring
            </h4>
            {metrics.map((metric) => (
              <div key={metric.key} className="bg-white/60 rounded-lg p-2 border border-blue-100/50 overflow-visible mb-2 last:mb-0">
                {/* Metric Header */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-gray-800">{metric.label}</span>
                  <div className="relative group/tooltip">
                    <FaEye className="w-2.5 h-2.5 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors" />
                    <div className="absolute bottom-full mb-1 right-0 hidden group-hover/tooltip:block w-40 bg-gray-800 text-white text-[9px] rounded px-2 py-1 shadow-lg" style={{ zIndex: 9999 }}>
                      {metric.definition}
                      <div className="absolute top-full -mt-1 right-0 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>

                {/* Segmented Bars for All Years */}
                {yearsAIData.length > 0 ? (
                  <div className="space-y-1.5">
                    {[...yearsAIData].reverse().map((yearData) => {
                      const scoreValue = yearData.data?.[metric.field] || 0;
                      const ballPosition = (scoreValue / 10) * 100;
                      const isGoodScore = scoreValue >= 5;

                      return (
                        <div key={yearData.year} className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-gray-600 w-10">{yearData.year}</span>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="segmented-bar-container flex-1" style={{ height: '8px', position: 'relative' }}>
                              <div className="segmented-bar-background" style={{
                                display: 'flex',
                                width: '100%',
                                height: '100%',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                background: 'linear-gradient(to right, #FF2121, #FF8C00, #FFD700, #ADFF2F, #00FF15)'
                              }}>
                              </div>
                              <div
                                className="percentage-ball"
                                style={{
                                  position: 'absolute',
                                  left: `${Math.min(Math.max(ballPosition, 5), 95)}%`,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: '12px',
                                  height: '12px',
                                  borderRadius: '50%',
                                  backgroundColor: isGoodScore ? '#00ff15' : '#ff2121',
                                  border: `2px solid ${isGoodScore ? '#00cc11' : '#cc1a1a'}`,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                }}
                              />
                            </div>
                            <span className={`text-[10px] font-bold w-10 text-right ${isGoodScore ? 'text-green-700' : 'text-red-700'}`}>
                              {scoreValue.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 text-[9px] py-4">No data available</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// RightPanel Component - ROI & Win Rate Analysis (All Years)
const RightPanel = ({ influencer }) => {
  // Get all available years from score_yearly_timeframes
  const getAllYearsData = () => {
    if (!influencer?.score_yearly_timeframes) return [];

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11 (Jan=0, Dec=11)

    // Determine if current year should be shown
    // Only show current year data if at least Q1 is complete (i.e., we're in Q2 or later)
    // Q1: Jan-Mar (months 0-2), show after Mar 31 (i.e., month >= 3)
    const shouldShowCurrentYear = currentMonth >= 3; // April or later

    const years = Object.keys(influencer.score_yearly_timeframes)
      .map(y => parseInt(y))
      .filter(y => {
        if (y < 2022) return false;
        if (y > currentYear) return false;
        if (y === currentYear && !shouldShowCurrentYear) return false;
        return true;
      })
      .sort((a, b) => b - a); // Sort descending (newest first)

    return years.map(year => ({
      year,
      data: influencer.score_yearly_timeframes[year]
    }));
  };

  const yearsData = getAllYearsData();

  // Timeframes to display: 1hr, 7days, 60days, 180days, 1year
  const timeframes = [
    { key: '1_hour', label: '1hr' },
    { key: '7_days', label: '7d' },
    { key: '60_days', label: '60d' },
    { key: '180_days', label: '180d' },
    { key: '1_year', label: '1y' },
  ];

  const formatROI = (value) => {
    if (value === undefined || value === null || value === 0) return '--';
    const formatted = value.toFixed(1);
    return value > 0 ? `+${formatted}` : `${formatted}`;
  };

  const formatWinRate = (value) => {
    if (value === undefined || value === null || value === 0) return '--';
    return `${Math.round(value)}%`;
  };

  const getROIColor = (value) => {
    if (value === undefined || value === null || value === 0) return 'text-gray-400';
    return value > 0 ? 'text-green-600' : 'text-red-500';
  };

  const getWinRateColor = (value) => {
    if (value === undefined || value === null || value === 0) return 'text-gray-400';
    if (value >= 60) return 'text-green-600';
    if (value >= 50) return 'text-blue-600';
    return 'text-orange-500';
  };

  return (
    <div className="h-full w-full bg-white flex flex-col p-3 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#8b5cf6_25%,transparent_25%,transparent_75%,#8b5cf6_75%,#8b5cf6),linear-gradient(45deg,#8b5cf6_25%,transparent_25%,transparent_75%,#8b5cf6_75%,#8b5cf6)] bg-[length:20px_20px] bg-[0_0,10px_10px]"></div>
      </div>

      {/* Content - Scrollable */}
      <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex-shrink-0 mb-3">
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
            Performance
          </h3>
          <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
        </div>

        {/* Tables Container */}
        <div className="flex-1 overflow-y-auto overflow-x-auto pr-1 space-y-6 custom-scrollbar min-h-0 py-2">

          {/* ROI Table */}
          <div className="bg-white/60 rounded-lg border border-purple-100/50 overflow-hidden shadow-sm">
            <div className="bg-purple-50/50 px-2 py-2 border-b border-purple-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <h4 className="text-xs font-bold text-gray-800">ROI Performance</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse min-w-[200px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="py-3 px-1.5 text-[9px] font-bold text-gray-500 border-b border-gray-100 text-left pl-2">Year</th>
                    {timeframes.map((tf) => (
                      <th key={tf.key} className="py-3 px-1.5 text-[9px] font-bold text-gray-500 border-b border-gray-100 whitespace-nowrap">
                        {tf.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {yearsData.length > 0 ? (
                    yearsData.map(({ year, data }) => (
                      <tr key={`${year}-roi`} className="border-b border-gray-50 last:border-0 hover:bg-purple-50/30 transition-colors">
                        <td className="py-3 px-1.5 text-[9px] font-bold text-gray-600 text-left pl-2">{year}</td>
                        {timeframes.map((tf) => {
                          const roi = data?.[tf.key]?.prob_weighted_returns;
                          return (
                            <td key={tf.key} className={`py-3 px-1.5 text-[9px] font-bold whitespace-nowrap ${getROIColor(roi)}`}>
                              {formatROI(roi)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={timeframes.length + 1} className="p-4 text-center text-[9px] text-gray-400">
                        No ROI data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Win Rate Table */}
          <div className="bg-white/60 rounded-lg border border-blue-100/50 overflow-hidden shadow-sm">
            <div className="bg-blue-50/50 px-2 py-2 border-b border-blue-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <h4 className="text-xs font-bold text-gray-800">Win Rates</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse min-w-[200px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="py-3 px-1.5 text-[9px] font-bold text-gray-500 border-b border-gray-100 text-left pl-2">Year</th>
                    {timeframes.map((tf) => (
                      <th key={tf.key} className="py-3 px-1.5 text-[9px] font-bold text-gray-500 border-b border-gray-100 whitespace-nowrap">
                        {tf.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {yearsData.length > 0 ? (
                    yearsData.map(({ year, data }) => (
                      <tr key={`${year}-win`} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-1.5 text-[9px] font-bold text-gray-600 text-left pl-2">{year}</td>
                        {timeframes.map((tf) => {
                          const winRate = data?.[tf.key]?.win_percentage;
                          return (
                            <td key={tf.key} className={`py-3 px-1.5 text-[9px] font-bold whitespace-nowrap ${getWinRateColor(winRate)}`}>
                              {formatWinRate(winRate)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={timeframes.length + 1} className="p-4 text-center text-[9px] text-gray-400">
                        No Win Rate data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Table of Contents - Left Panel
const TOCLeftPanel = ({ influencers, selectedIndex, onSelect }) => {
  return (
    <div className="h-full w-full bg-white/95 backdrop-blur-sm flex flex-col p-4 md:p-6 relative border-r border-gray-100">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute -top-[100px] -left-[100px] w-[300px] h-[300px] bg-blue-100/50 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex flex-col z-10 h-full min-h-0">
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            Influencers
          </h2>
          <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar min-h-0">
          {influencers.length > 0 ? influencers.map((inf, idx) => (
            <div
              key={inf.id}
              onClick={() => onSelect(idx)}
              className={`group flex items-center gap-2 p-2 rounded-xl hover:bg-white hover:shadow-md border transition-all cursor-pointer ${selectedIndex === idx
                ? 'bg-white shadow-md border-blue-200 ring-1 ring-blue-100'
                : 'bg-slate-50/50 border-transparent hover:border-blue-100'
                }`}
            >
              <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm shadow-md transition-transform flex-shrink-0 ${selectedIndex === idx ? 'scale-110 ring-2 ring-blue-400' : 'group-hover:scale-110'}`}>
                {inf.platform === "YouTube" && inf.channel_thumbnails?.high?.url ? (
                  <Image
                    src={inf.channel_thumbnails.high.url}
                    alt={inf.name || ""}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {inf.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-xs truncate transition-colors ${selectedIndex === idx ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-600'
                  }`}>
                  {inf.name}
                </div>
                <div className="text-[9px] text-gray-500 truncate">
                  {inf.platform} • <span className="text-blue-500 font-medium">{formatNumber(inf.subs)} subs</span>
                </div>
              </div>
              {selectedIndex === idx && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></div>
              )}
            </div>
          )) : (
            <div className="text-center text-gray-400 text-sm py-10">No influencers</div>
          )}
        </div>

        <div className="mt-2 flex flex-col items-center flex-shrink-0">
          <span className="text-[9px] text-gray-400">Total: {influencers.length} influencers</span>
        </div>
      </div>
    </div>
  );
};

// Four-Fold Flipbook Component
const FourFoldFlipbook = ({ influencers }) => {
  const [selectedIndex, setSelectedIndex] = useState(0); // Selected influencer index
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState(null); // 'next' or 'prev'

  const currentInfluencer = influencers[selectedIndex] || null;

  const goNext = () => {
    if (selectedIndex < influencers.length - 1 && !isFlipping) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setSelectedIndex(prev => prev + 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 600);
    }
  };

  const goPrev = () => {
    if (selectedIndex > 0 && !isFlipping) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setSelectedIndex(prev => prev - 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 600);
    }
  };

  const handleSelect = (index) => {
    if (index !== selectedIndex && !isFlipping) {
      setFlipDirection(index > selectedIndex ? 'next' : 'prev');
      setIsFlipping(true);
      setTimeout(() => {
        setSelectedIndex(index);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 600);
    }
  };

  if (!influencers || influencers.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl font-semibold text-gray-700">No influencers found</p>
        <p className="text-gray-600 mt-2">Try adjusting your filter criteria</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Book Container - Four-Fold Layout */}
      <div className="relative" style={{ perspective: '2000px' }}>
        <div className="flex gap-1 md:gap-2 justify-center" style={{ transformStyle: 'preserve-3d' }}>

          {/* Panel 1: Influencers List */}
          <div
            className="w-[220px] md:w-[260px] h-[480px] md:h-[550px] rounded-l-2xl overflow-hidden shadow-2xl bg-white"
            style={{
              boxShadow: '-8px 0 30px rgba(0,0,0,0.15), 0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <TOCLeftPanel
              influencers={influencers}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
            />
          </div>

          {/* Panel 2: Left Panel (Profile) */}
          <div
            className={`w-[220px] md:w-[260px] h-[480px] md:h-[550px] overflow-hidden shadow-2xl transition-all duration-600 ease-in-out ${isFlipping ? 'opacity-80 scale-[0.98]' : 'opacity-100 scale-100'}`}
            style={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <LeftPanel influencer={currentInfluencer} />
          </div>

          {/* Panel 3: Middle Panel (Performance) */}
          <div
            className={`w-[220px] md:w-[260px] h-[480px] md:h-[550px] overflow-hidden shadow-2xl transition-all duration-600 ease-in-out ${isFlipping ? 'opacity-80 scale-[0.98]' : 'opacity-100 scale-100'}`}
            style={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <MiddlePanel influencer={currentInfluencer} />
          </div>

          {/* Panel 4: Right Panel (ROI & Win Rate Analysis) */}
          <div
            className={`w-[220px] md:w-[260px] h-[480px] md:h-[550px] rounded-r-2xl overflow-hidden shadow-2xl transition-all duration-600 ease-in-out ${isFlipping ? 'opacity-80 scale-[0.98]' : 'opacity-100 scale-100'}`}
            style={{
              boxShadow: '8px 0 30px rgba(0,0,0,0.15), 0 10px 40px rgba(0,0,0,0.2)'
            }}
          >
            <RightPanel influencer={currentInfluencer} />
          </div>

        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-6 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-gray-200">
        <button
          onClick={goPrev}
          disabled={selectedIndex === 0 || isFlipping}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all ${selectedIndex === 0 || isFlipping
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg transform hover:scale-105'
            }`}
        >
          <FaChevronLeft />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="text-center px-4">
          <div className="text-sm font-semibold text-gray-800">
            {selectedIndex + 1} / {influencers.length}
          </div>
          {/* <div className="text-xs text-gray-500">
            Rank #{currentInfluencer?.rank}
          </div> */}
        </div>

        <button
          onClick={goNext}
          disabled={selectedIndex >= influencers.length - 1 || isFlipping}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all ${selectedIndex >= influencers.length - 1 || isFlipping
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg transform hover:scale-105'
            }`}
        >
          <span className="hidden sm:inline">Next</span>
          <FaChevronRight />
        </button>
      </div>

      {/* Quick Navigation - Influencer Thumbnails */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full px-4 py-2 custom-scrollbar">
        {/* Scrollable Container with Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const container = document.getElementById('thumbnail-container');
              if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
            }}
            className="p-2 rounded-full bg-white shadow-md border hover:bg-gray-50 text-gray-600 transition-all z-10"
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>

          <div
            id="thumbnail-container"
            className="flex items-center gap-2 overflow-x-auto max-w-[300px] sm:max-w-[400px] md:max-w-[600px] scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {influencers.map((inf, idx) => (
              <button
                key={inf.id}
                onClick={() => handleSelect(idx)}
                className={`flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${idx === selectedIndex
                  ? 'border-blue-500 ring-2 ring-blue-300 scale-110'
                  : 'border-gray-300 hover:border-blue-400'
                  }`}
                title={inf.name}
              >
                {inf.platform === "YouTube" && inf.channel_thumbnails?.high?.url ? (
                  <Image
                    src={inf.channel_thumbnails.high.url}
                    alt={inf.name || ""}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {inf.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const container = document.getElementById('thumbnail-container');
              if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
            }}
            className="p-2 rounded-full bg-white shadow-md border hover:bg-gray-50 text-gray-600 transition-all z-10"
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function InfluencerSearchFlipPage() {
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [youtubeInfluencers, setYoutubeInfluencers] = useState([]);
  const [telegramInfluencers, setTelegramInfluencers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [selectedRating, setSelectedRating] = useState("3");
  const [selectedTimeframe, setSelectedTimeframe] = useState("180_days");
  const [selectedYear, setSelectedYear] = useState(() => {
    const d = new Date();
    if (d.getMonth() < 3) {
      return (d.getFullYear() - 1).toString();
    }
    return d.getFullYear().toString();
  });

  // API parameters
  const apiParams = useMemo(() => ({
    rating: selectedRating,
    timeframe: selectedTimeframe,
    year: selectedYear
  }), [selectedRating, selectedTimeframe, selectedYear]);

  // Fetch data functions
  const fetchYouTubeData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(apiParams);
      const res = await fetch(`/api/youtube-data?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
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
      console.error("Failed to fetch YouTube data:", err);
      setYoutubeInfluencers([]);
    } finally {
      setLoading(false);
    }
  }, [apiParams]);

  const fetchTelegramData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(apiParams);
      const res = await fetch(`/api/telegram-data?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
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
      console.error("Failed to fetch Telegram data:", err);
      setTelegramInfluencers([]);
    } finally {
      setLoading(false);
    }
  }, [apiParams]);

  useEffect(() => {
    if (selectedPlatform === "youtube") {
      fetchYouTubeData();
    } else if (selectedPlatform === "telegram") {
      fetchTelegramData();
    }
  }, [selectedPlatform, fetchYouTubeData, fetchTelegramData]);

  // Get filtered influencers
  const getFilteredInfluencers = () => {
    let influencers;

    if (selectedPlatform === "youtube") {
      influencers = youtubeInfluencers.map((ch) => ({
        id: ch.channel_id,
        name: ch.influencer_name,
        platform: "YouTube",
        subs: ch.subs,
        rank: ch.rank,
        channel_thumbnails: ch.channel_thumbnails,
        prob_weighted_returns: ch.prob_weighted_returns || 0,
        win_percentage: ch.win_percentage || 0,
        price_counts: ch.price_counts || 0,
        ai_overall_score: ch.ai_overall_score || 0,
        final_score: ch.final_score || 0,
        current_rating: ch.current_rating || 0,
        gemini_summary: ch.gemini_summary || '',
        star_rating_yearly: ch.star_rating_yearly || {},
        score_yearly_timeframes: ch.score_yearly_timeframes || {},
        ai_scoring_yearly: ch.ai_scoring_yearly || {},
        last_post_date: ch.last_post_date || '',
        last_post_date_string: ch.last_post_date_string || '',
        last_post_time: ch.last_post_time || '',
      }));
    } else if (selectedPlatform === "telegram") {
      influencers = telegramInfluencers.map((tg) => ({
        id: tg.channel_id || tg.id,
        name: tg.influencer_name && tg.influencer_name !== "N/A" ? tg.influencer_name : (tg.channel_id || "Unknown Channel"),
        platform: "Telegram",
        subs: tg.subscribers || tg.subs || 0,
        rank: tg.rank,
        channel_thumbnails: tg.channel_thumbnails,
        prob_weighted_returns: tg.prob_weighted_returns || 0,
        win_percentage: tg.win_percentage || 0,
        price_counts: tg.price_counts || 0,
        ai_overall_score: tg.ai_overall_score || 0,
        final_score: tg.final_score || 0,
        current_rating: tg.current_rating || 0,
        gemini_summary: tg.gemini_summary || '',
        star_rating_yearly: tg.star_rating_yearly || {},
        score_yearly_timeframes: tg.score_yearly_timeframes || {},
        ai_scoring_yearly: tg.ai_scoring_yearly || {},
        last_post_date: tg.last_post_date || '',
        last_post_date_string: tg.last_post_date_string || '',
        last_post_time: tg.last_post_time || '',
      }));
    } else {
      influencers = [];
    }

    return influencers;
  };

  const filteredInfluencers = getFilteredInfluencers();

  // Filter options
  const allRatingOptions = [
    { value: "all", label: "All", stars: 0 },
    { value: "5", label: "5", stars: 5 },
    { value: "4", label: "4", stars: 4 },
    { value: "3", label: "3", stars: 3 },
    { value: "2", label: "2", stars: 2 },
    { value: "1", label: "1", stars: 1 },
  ];

  const currentInfluencersForFilter = selectedPlatform === "youtube" ? youtubeInfluencers : telegramInfluencers;

  const ratingOptions = useMemo(() => {
    return allRatingOptions.filter(option => {
      if (option.value === "all") return true;
      const ratingValue = parseInt(option.value);
      return currentInfluencersForFilter.some(influencer =>
        Math.floor(influencer.current_rating || 0) >= ratingValue
      );
    });
  }, [currentInfluencersForFilter, allRatingOptions]);

  const timeframeOptions = getDynamicTimeframeOptions(selectedYear);
  const yearOptions = selectedPlatform === "telegram"
    ? getYearOptions(2024, false)
    : getYearOptions(2022);

  const handleYearChange = (year) => {
    setSelectedYear(year);
    const newTimeframeOptions = getDynamicTimeframeOptions(year);
    const isCurrentTimeframeValid = newTimeframeOptions.some(t => t.value === selectedTimeframe);
    if (!isCurrentTimeframeValid) {
      setSelectedTimeframe("30_days");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 text-gray-900">
      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes flip-in-left {
          0% { transform: rotateY(-90deg); opacity: 0; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
        @keyframes flip-out-left {
          0% { transform: rotateY(0deg); opacity: 1; }
          100% { transform: rotateY(-90deg); opacity: 0; }
        }
        @keyframes flip-in-right {
          0% { transform: rotateY(90deg); opacity: 0; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
        @keyframes flip-out-right {
          0% { transform: rotateY(0deg); opacity: 1; }
          100% { transform: rotateY(90deg); opacity: 0; }
        }
        .animate-flip-in-left { animation: flip-in-left 0.6s ease-in-out; }
        .animate-flip-out-left { animation: flip-out-left 0.6s ease-in-out; }
        .animate-flip-in-right { animation: flip-in-right 0.6s ease-in-out; }
        .animate-flip-out-right { animation: flip-out-right 0.6s ease-in-out; }
        .duration-600 { transition-duration: 600ms; }

        /* Custom Scrollbar for Influencers List */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 border-b-2 border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-4xl md:text-5xl font-bold flex items-start gap-3 drop-shadow-sm">
              <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                Influencers
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full mt-3 shadow-lg shadow-indigo-500/50"></div>
          </div>

          {/* Filters */}
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent uppercase mb-2 text-center">Source</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-fuchsia-500/10 backdrop-blur-sm border-2 border-indigo-300/50 hover:border-indigo-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  <option value="youtube">YouTube</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent uppercase mb-2 text-center">Rating</label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-fuchsia-500/10 backdrop-blur-sm border-2 border-indigo-300/50 hover:border-indigo-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  {ratingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value === "all" ? "All Ratings" : "⭐".repeat(option.stars)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent uppercase mb-2 text-center">Holding Period</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="w-full bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-fuchsia-500/10 backdrop-blur-sm border-2 border-indigo-300/50 hover:border-indigo-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  {timeframeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent uppercase mb-2 text-center">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-fuchsia-500/10 backdrop-blur-sm border-2 border-indigo-300/50 hover:border-indigo-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  {yearOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tri-Fold Container */}
      <div className="max-w-7xl mx-auto py-8 px-4">
        {loading ? (
          <div className="flex justify-center items-center h-[600px]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 border-t-4 border-t-purple-500"></div>
          </div>
        ) : (
          <FourFoldFlipbook
            influencers={filteredInfluencers}
          />
        )}
      </div>
    </div>
  );
}
