"use client";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo, useRef, forwardRef } from "react";
import { FaStar, FaStarHalfAlt, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import HTMLFlipBook from "react-pageflip";
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

// Page 1 - Left Panel (Influencer Image, Name, Subscribers)
const PageLeft = forwardRef(({ influencer }, ref) => {
  const handleNavigate = () => {
    const url = influencer.platform === "YouTube"
      ? `/influencers/${influencer.id}`
      : `/telegram-influencer/${influencer.id}`;
    window.location.href = url;
  };

  return (
    <div
      ref={ref}
      className="page relative h-full w-full overflow-hidden"
      data-density="hard"
      style={{
        background: 'linear-gradient(to bottom, white 0%, white 60%, #E9D5F5 60%, #E9D5F5 100%)'
      }}
    >
      {/* Dotted border on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-2 border-l-2 border-dotted border-gray-300"></div>

      {/* Top White Section */}
      <div className="relative h-[60%] bg-white p-8 flex flex-col items-center justify-center">
        {/* Page Number */}
        <div className="absolute top-4 left-4 text-xs text-gray-400 font-medium">
          #{influencer.rank}
        </div>

        {/* Influencer Image */}
        <div className="relative mb-6 mt-5 group cursor-pointer" onClick={handleNavigate}>
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-300 to-purple-300 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/80 transition-all group-hover:ring-0">
            {influencer.channel_thumbnails?.high?.url ? (
              <Image
                src={influencer.channel_thumbnails.high.url}
                alt={influencer.name || "Influencer"}
                width={192}
                height={192}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-full h-full bg-gradient-to-br from-pink-300 via-purple-300 to-pink-400 flex items-center justify-center"
              style={{ display: influencer.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
            >
              <span className="text-white text-6xl font-bold">
                {influencer.name?.match(/\b\w/g)?.join("").toUpperCase() || "?"}
              </span>
            </div>
          </div>

          {/* Rank Badge */}
          <div className="absolute -top-3 -right-3 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl border-4 border-white z-10">
            <div className="text-xl font-bold">#{influencer.rank}</div>
          </div>
        </div>

        {/* Influencer Name */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2 px-4">
          {influencer.name?.replace(/_/g, " ") || "Unknown"}
        </h2>

        {/* Platform Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-full shadow-lg mb-4">
          <span className="font-semibold text-sm">{influencer.platform}</span>
        </div>
      </div>

      {/* Bottom Pink/Lavender Section */}
      <div className="relative h-[40%] p-6 flex items-center justify-center">
        {/* Subscribers Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-xs">
          <div className="text-center">
            <span className="text-sm text-gray-600 font-semibold uppercase tracking-wide block mb-2">Subscribers</span>
            <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formatNumber(influencer.subs)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
PageLeft.displayName = 'PageLeft';

// Page 2 - Center Panel (MCM Ranking History and Key Metrics)
const PageCenter = forwardRef(({ influencer }, ref) => {
  // Get star ratings for timeline
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

  return (
    <div
      ref={ref}
      className="page relative h-full w-full overflow-hidden"
      data-density="hard"
      style={{
        background: 'linear-gradient(to bottom, white 0%, white 60%, #E9D5F5 60%, #E9D5F5 100%)'
      }}
    >
      {/* Top White Section */}
      <div className="relative h-[60%] bg-white p-6 overflow-y-auto">
        {/* MCM Ranking History */}
        <div className="mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            MCM Ranking History
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"></div>

          {scatterData.length > 0 ? (
            <div className="flex justify-center items-end gap-4 h-32 px-2">
              {scatterData.map((point, idx) => {
                const fullStars = Math.floor(point.rating);
                const hasHalfStar = point.rating % 1 >= 0.5;
                const totalStars = 5;
                const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2"
                    title={`Year: ${point.yearLabel}, Rating: ${point.rating.toFixed(1)}`}
                  >
                    <div className="flex flex-col-reverse gap-0.5">
                      {[...Array(fullStars)].map((_, i) => (
                        <FaStar key={`full-${i}`} className="text-yellow-500 w-3 h-3" />
                      ))}
                      {hasHalfStar && (
                        <FaStarHalfAlt key="half" className="text-yellow-500 w-3 h-3" />
                      )}
                      {[...Array(emptyStars)].map((_, i) => (
                        <FaStar key={`empty-${i}`} className="text-gray-300 w-3 h-3" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-700">{point.yearLabel}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-4">No rating data available</div>
          )}
        </div>

        {/* Key Metrics */}
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Key Metrics
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"></div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-3 text-white shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1">ROI</div>
              <div className="text-2xl font-bold">
                {influencer.prob_weighted_returns?.toFixed(1) || '0.0'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-3 text-white shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1">Win Rate</div>
              <div className="text-2xl font-bold">
                {influencer.win_percentage ? `${Math.round(influencer.win_percentage)}%` : '0%'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg p-3 text-white shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1">Posts</div>
              <div className="text-2xl font-bold">
                {influencer.price_counts?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg p-3 text-white shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1">AI Score</div>
              <div className="text-2xl font-bold">
                {influencer.ai_overall_score?.toFixed(1) || '0.0'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Pink/Lavender Section */}
      <div className="relative h-[40%] p-6 flex items-center justify-center">
        {/* Central Card/Pocket */}
        <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-xs">
          <div className="text-center text-sm text-gray-600">
            <p className="font-semibold">Performance Metrics</p>
            <p className="text-xs mt-1 text-gray-500">Detailed analytics available</p>
          </div>
        </div>
      </div>
    </div>
  );
});
PageCenter.displayName = 'PageCenter';

// Page 3 - Right Panel (Summary)
const PageRight = forwardRef(({ influencer }, ref) => {
  const [expandedSummary, setExpandedSummary] = useState(false);

  return (
    <div
      ref={ref}
      className="page relative h-full w-full overflow-hidden"
      data-density="hard"
      style={{
        background: 'linear-gradient(to bottom, white 0%, white 60%, #E9D5F5 60%, #E9D5F5 100%)'
      }}
    >
      {/* Dotted border on right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-2 border-r-2 border-dotted border-gray-300"></div>

      {/* Top White Section */}
      <div className="relative h-[60%] bg-white p-6 overflow-y-auto">
        {/* Summary Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Summary
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"></div>
        </div>

        {/* Summary Content */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-5 border border-pink-200 shadow-sm">
          {influencer.gemini_summary && influencer.gemini_summary !== '' ? (
            <div className="text-sm text-gray-700 leading-relaxed">
              {(() => {
                const summaryText = Array.isArray(influencer.gemini_summary)
                  ? influencer.gemini_summary.join(', ')
                  : typeof influencer.gemini_summary === 'object'
                    ? Object.values(influencer.gemini_summary).join(', ')
                    : influencer.gemini_summary;

                const MAX_LENGTH = 400;
                const shouldTruncate = summaryText.length > MAX_LENGTH;
                const displayText = (shouldTruncate && !expandedSummary)
                  ? summaryText.substring(0, MAX_LENGTH) + '...'
                  : summaryText;

                return (
                  <>
                    <div className="whitespace-pre-line">{displayText}</div>
                    {shouldTruncate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSummary(!expandedSummary);
                        }}
                        className="text-pink-600 hover:text-pink-800 text-xs font-bold mt-3 inline-block hover:underline"
                      >
                        {expandedSummary ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-6">
              No summary available
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pink/Lavender Section */}
      <div className="relative h-[40%] p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-4 shadow-xl w-full max-w-xs text-center">
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-sm text-purple-700 mb-2">Quick Info</p>
            <p>Rank: <span className="font-bold text-purple-600">#{influencer.rank}</span></p>
            <p>Platform: <span className="font-bold">{influencer.platform}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
});
PageRight.displayName = 'PageRight';

// OLD - Page 1 - Left Panel (Influencer Image, Name, Subscribers)
const PageLeft_OLD = forwardRef(({ influencer }, ref) => {
  const handleNavigate = () => {
    const url = influencer.platform === "YouTube"
      ? `/influencers/${influencer.id}`
      : `/telegram-influencer/${influencer.id}`;
    window.location.href = url;
  };

  return (
    <div
      ref={ref}
      className="page relative h-full w-full overflow-hidden"
      data-density="hard"
      style={{
        background: 'linear-gradient(to bottom, white 0%, white 60%, #E9D5F5 60%, #E9D5F5 100%)'
      }}
    >
      {/* Dotted border on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-2 border-l-2 border-dotted border-gray-300"></div>

      {/* Top White Section */}
      <div className="relative h-[60%] bg-white p-8 flex flex-col items-center justify-center">
        {/* Page Number */}
        <div className="absolute top-4 left-4 text-xs text-gray-400 font-medium">
          #{influencer.rank}
        </div>

        {/* Influencer Image */}
        <div className="relative mb-6 mt-5 group cursor-pointer" onClick={handleNavigate}>
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-300 to-purple-300 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/80 transition-all group-hover:ring-0">
            {influencer.channel_thumbnails?.high?.url ? (
              <Image
                src={influencer.channel_thumbnails.high.url}
                alt={influencer.name || "Influencer"}
                width={192}
                height={192}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-full h-full bg-gradient-to-br from-pink-300 via-purple-300 to-pink-400 flex items-center justify-center"
              style={{ display: influencer.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
            >
              <span className="text-white text-6xl font-bold">
                {influencer.name?.match(/\b\w/g)?.join("").toUpperCase() || "?"}
              </span>
            </div>
          </div>

          {/* Rank Badge */}
          <div className="absolute -top-3 -right-3 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl border-4 border-white z-10">
            <div className="text-xl font-bold">#{influencer.rank}</div>
          </div>
        </div>

        {/* Influencer Name */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2 px-4">
          {influencer.name?.replace(/_/g, " ") || "Unknown"}
        </h2>

        {/* Platform Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-full shadow-lg mb-4">
          <span className="font-semibold text-sm">{influencer.platform}</span>
        </div>
      </div>

      {/* Bottom Pink/Lavender Section */}
      <div className="relative h-[40%] p-6 flex items-center justify-center">
        {/* Subscribers Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-xs">
          <div className="text-center">
            <span className="text-sm text-gray-600 font-semibold uppercase tracking-wide block mb-2">Subscribers</span>
            <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formatNumber(influencer.subs)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
PageLeft_OLD.displayName = 'PageLeft_OLD';

// OLD - Page 2 - Center Panel (MCM Ranking History and Key Metrics)
const PageCenter_OLD = forwardRef(({ influencer }, ref) => {
  // Get star ratings for timeline
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

  return (
    <div
      ref={ref}
      className="page relative h-full w-full overflow-hidden"
      data-density="hard"
      style={{
        background: 'linear-gradient(to bottom, white 0%, white 60%, #E9D5F5 60%, #E9D5F5 100%)'
      }}
    >
      {/* Top White Section */}
      <div className="relative h-[60%] bg-white p-6 overflow-y-auto">
        {/* MCM Ranking History */}
        <div className="mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            MCM Ranking History
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"></div>

          {scatterData.length > 0 ? (
            <div className="flex justify-center items-end gap-4 h-32 px-2">
              {scatterData.map((point, idx) => {
                const fullStars = Math.floor(point.rating);
                const hasHalfStar = point.rating % 1 >= 0.5;
                const totalStars = 5;
                const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2"
                    title={`Year: ${point.yearLabel}, Rating: ${point.rating.toFixed(1)}`}
                  >
                    <div className="flex flex-col-reverse gap-0.5">
                      {[...Array(fullStars)].map((_, i) => (
                        <FaStar key={`full-${i}`} className="text-yellow-500 w-3 h-3" />
                      ))}
                      {hasHalfStar && (
                        <FaStarHalfAlt key="half" className="text-yellow-500 w-3 h-3" />
                      )}
                      {[...Array(emptyStars)].map((_, i) => (
                        <FaStar key={`empty-${i}`} className="text-gray-300 w-3 h-3" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-700">{point.yearLabel}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-4">No rating data available</div>
          )}
        </div>

        {/* Key Metrics */}
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Key Metrics
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"></div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-3 text-white shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1">ROI</div>
              <div className="text-2xl font-bold">
                {influencer.prob_weighted_returns?.toFixed(1) || '0.0'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-3 text-white shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1">Win Rate</div>
              <div className="text-2xl font-bold">
                {influencer.win_percentage ? `${Math.round(influencer.win_percentage)}%` : '0%'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg p-3 text-white shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1">Posts</div>
              <div className="text-2xl font-bold">
                {influencer.price_counts?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg p-3 text-white shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1">AI Score</div>
              <div className="text-2xl font-bold">
                {influencer.ai_overall_score?.toFixed(1) || '0.0'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Pink/Lavender Section */}
      <div className="relative h-[40%] p-6 flex items-center justify-center">
        {/* Central Card/Pocket */}
        <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-xs">
          <div className="text-center text-sm text-gray-600">
            <p className="font-semibold">Performance Metrics</p>
            <p className="text-xs mt-1 text-gray-500">Detailed analytics available</p>
          </div>
        </div>
      </div>
    </div>
  );
});
PageCenter_OLD.displayName = 'PageCenter_OLD';

// OLD - Page 3 - Right Panel (Summary)
const PageRight_OLD = forwardRef(({ influencer }, ref) => {
  const [expandedSummary, setExpandedSummary] = useState(false);

  return (
    <div
      ref={ref}
      className="page relative h-full w-full overflow-hidden"
      data-density="hard"
      style={{
        background: 'linear-gradient(to bottom, white 0%, white 60%, #E9D5F5 60%, #E9D5F5 100%)'
      }}
    >
      {/* Dotted border on right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-2 border-r-2 border-dotted border-gray-300"></div>

      {/* Top White Section */}
      <div className="relative h-[60%] bg-white p-6 overflow-y-auto">
        {/* Summary Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Summary
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4"></div>
        </div>

        {/* Summary Content */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-5 border border-pink-200 shadow-sm">
          {influencer.gemini_summary && influencer.gemini_summary !== '' ? (
            <div className="text-sm text-gray-700 leading-relaxed">
              {(() => {
                const summaryText = Array.isArray(influencer.gemini_summary)
                  ? influencer.gemini_summary.join(', ')
                  : typeof influencer.gemini_summary === 'object'
                    ? Object.values(influencer.gemini_summary).join(', ')
                    : influencer.gemini_summary;

                const MAX_LENGTH = 400;
                const shouldTruncate = summaryText.length > MAX_LENGTH;
                const displayText = (shouldTruncate && !expandedSummary)
                  ? summaryText.substring(0, MAX_LENGTH) + '...'
                  : summaryText;

                return (
                  <>
                    <div className="whitespace-pre-line">{displayText}</div>
                    {shouldTruncate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSummary(!expandedSummary);
                        }}
                        className="text-pink-600 hover:text-pink-800 text-xs font-bold mt-3 inline-block hover:underline"
                      >
                        {expandedSummary ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-6">
              No summary available
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pink/Lavender Section */}
      <div className="relative h-[40%] p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-4 shadow-xl w-full max-w-xs text-center">
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-sm text-purple-700 mb-2">Quick Info</p>
            <p>Rank: <span className="font-bold text-purple-600">#{influencer.rank}</span></p>
            <p>Platform: <span className="font-bold">{influencer.platform}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
});
PageRight_OLD.displayName = 'PageRight_OLD';

// Cover Page
const CoverPage = forwardRef((_props, ref) => {
  return (
    <div
      ref={ref}
      className="page-cover relative h-full w-full bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 overflow-hidden"
      data-density="hard"
    >
      {/* Decorative Circles */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-pink-300/40 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-300/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-2xl flex items-center justify-center mb-4">
              <span className="text-4xl">📁</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4 drop-shadow-sm">
            Influencer
          </h1>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-6 drop-shadow-sm">
            Portfolio
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6 mx-auto shadow-lg"></div>
          <p className="text-gray-700 text-base leading-relaxed mb-8">
            Organized insights and performance metrics for top influencers
          </p>
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <span className="text-purple-600 font-bold text-sm animate-bounce">Open to explore →</span>
          </div>
        </div>
      </div>
    </div>
  );
});
CoverPage.displayName = 'CoverPage';

// Back Cover Page
const BackCoverPage = forwardRef((_props, ref) => {
  return (
    <div
      ref={ref}
      className="page-cover relative h-full w-full bg-gradient-to-br from-purple-700 via-pink-600 to-orange-600 overflow-hidden"
      data-density="hard"
    >
      <div className="relative h-full flex flex-col items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <span className="text-4xl">✓</span>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-2xl">
            Thank You
          </h2>
          <p className="text-white/90 text-lg max-w-md mx-auto mb-6">
            End of Portfolio
          </p>
          <div className="w-20 h-1 bg-white/60 rounded-full mx-auto"></div>
        </div>
      </div>
    </div>
  );
});
BackCoverPage.displayName = 'BackCoverPage';

// Table of Contents Page
const TableOfContentsPage = forwardRef(({ influencers, onInfluencerClick }, ref) => {
  return (
    <div
      ref={ref}
      className="page relative h-full w-full bg-gradient-to-br from-pink-50 via-purple-50 to-white overflow-hidden shadow-inner"
      data-density="hard"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#d946ef_25%,transparent_25%,transparent_75%,#d946ef_75%,#d946ef),linear-gradient(45deg,#d946ef_25%,transparent_25%,transparent_75%,#d946ef_75%,#d946ef)] bg-[length:20px_20px] bg-[0_0,10px_10px]"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
            Table of Contents
          </h3>
          <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          <p className="text-xs text-gray-600 mt-2">Click to jump to influencer</p>
        </div>

        {/* Scrollable Influencer List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2" style={{ scrollbarWidth: 'thin' }}>
          {influencers.map((influencer, index) => (
            <div
              key={influencer.id}
              onClick={() => onInfluencerClick(index)}
              className="group bg-white rounded-lg p-3 shadow-sm border border-pink-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                  #{influencer.rank}
                </div>

                {/* Influencer Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-800 truncate group-hover:text-purple-600 transition-colors">
                    {influencer.name?.replace(/_/g, " ") || "Unknown"}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-600">{influencer.platform}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-semibold text-purple-600">
                      {formatNumber(influencer.subs)} subs
                    </span>
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">Total: {influencers.length} influencers</p>
        </div>
      </div>
    </div>
  );
});
TableOfContentsPage.displayName = 'TableOfContentsPage';

// Empty Page
const EmptyPage = forwardRef((_props, ref) => {
  return (
    <div
      ref={ref}
      className="page relative h-full w-full bg-white"
      data-density="hard"
    >
    </div>
  );
});
EmptyPage.displayName = 'EmptyPage';

export default function InfluencerSearchFlipNewDesign() {
  const [selectedPlatform, setSelectedPlatform] = useState("youtube");
  const [youtubeInfluencers, setYoutubeInfluencers] = useState([]);
  const [telegramInfluencers, setTelegramInfluencers] = useState([]);
  const [loading, setLoading] = useState(false);
  const flipBookRef = useRef();
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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

  // Flipbook navigation
  const onFlip = useCallback((e) => {
    setCurrentPage(e.data);
  }, []);

  const nextPage = () => {
    flipBookRef.current?.pageFlip()?.flipNext();
  };

  const prevPage = () => {
    flipBookRef.current?.pageFlip()?.flipPrev();
  };

  // Jump to specific influencer (3 pages per influencer)
  const jumpToInfluencer = (index) => {
    // Pages structure:
    // 0-1: Cover + TOC (2 pages)
    // 2-4: Influencer 0 (3 pages: Left, Center, Right)
    // 5-7: Influencer 1 (3 pages: Left, Center, Right)
    // etc.
    // We want to jump to the left page (first of the 3 pages)
    const leftPageIndex = 2 + (index * 3);

    if (flipBookRef.current?.pageFlip()) {
      flipBookRef.current.pageFlip().flip(leftPageIndex);
    }
  };

  useEffect(() => {
    if (flipBookRef.current?.pageFlip()) {
      setTotalPages(flipBookRef.current.pageFlip().getPageCount());
    }
  }, [filteredInfluencers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 text-gray-900">
      {/* Custom Styles */}
      <style jsx global>{`
        .flipbook .stf__block {
          background: white !important;
        }
        .flipbook .stf__item {
          background: white !important;
        }
        .stf__wrapper .stf__block,
        .stf__wrapper .stf__item,
        .stf__wrapper .page {
          background-color: white !important;
        }
        .stf__parent {
          background: transparent !important;
        }
        .flipbook-container {
          background: transparent !important;
        }
        .stf__wrapper {
          background: transparent !important;
          box-shadow: none !important;
        }
        .stf__stage {
          background: transparent !important;
        }
        .flipbook,
        .flipbook * {
          background-color: transparent !important;
        }
        .flipbook .page,
        .flipbook .page-cover {
          background-color: white !important;
        }
      `}</style>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-white border-b-2 border-pink-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                📁
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
                  Influencer Portfolio
                </h2>
                <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2 shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent uppercase mb-2 text-center">Source</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full bg-white border-2 border-pink-300 hover:border-purple-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  <option value="youtube">YouTube</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent uppercase mb-2 text-center">Rating</label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full bg-white border-2 border-pink-300 hover:border-purple-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  {ratingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value === "all" ? "All Ratings" : "⭐".repeat(option.stars)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent uppercase mb-2 text-center">Holding Period</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="w-full bg-white border-2 border-pink-300 hover:border-purple-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  {timeframeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent uppercase mb-2 text-center">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full bg-white border-2 border-pink-300 hover:border-purple-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer shadow-md hover:shadow-lg"
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

      {/* Flipbook Container */}
      <div className="max-w-7xl mx-auto py-8 px-4">
        {loading ? (
          <div className="flex justify-center items-center h-[600px]">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 border-t-4 border-t-pink-500"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">📁</div>
            </div>
          </div>
        ) : filteredInfluencers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-2xl font-semibold text-gray-700">No influencers found</p>
            <p className="text-gray-600 mt-2">Try adjusting your filter criteria</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {/* Flipbook */}
            <div className="flipbook-container" style={{ perspective: '2000px' }}>
              <HTMLFlipBook
                ref={flipBookRef}
                width={550}
                height={700}
                size="stretch"
                minWidth={400}
                maxWidth={1200}
                minHeight={500}
                maxHeight={1600}
                showCover={false}
                flippingTime={800}
                onFlip={onFlip}
                className="flipbook"
                style={{ margin: '0 auto' }}
                usePortrait={false}
                startPage={0}
                drawShadow={true}
                mobileScrollSupport={true}
                maxShadowOpacity={0.5}
                showPageCorners={true}
                disableFlipByClick={false}
              >
                {/* Cover and TOC */}
                <CoverPage key="cover" />
                <TableOfContentsPage
                  key="toc"
                  influencers={filteredInfluencers}
                  onInfluencerClick={jumpToInfluencer}
                />

                {/* Three Pages per Influencer (Left, Center, Right) */}
                {filteredInfluencers.map((influencer) => [
                  <PageLeft key={`left-${influencer.id}`} influencer={influencer} />,
                  <PageCenter key={`center-${influencer.id}`} influencer={influencer} />,
                  <PageRight key={`right-${influencer.id}`} influencer={influencer} />
                ])}

                {/* Back Cover */}
                <BackCoverPage key="back-cover" />
                <EmptyPage key="empty-right" />
              </HTMLFlipBook>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-6 bg-white rounded-full px-6 py-3 shadow-xl border-2 border-pink-200">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all ${
                  currentPage === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                <FaChevronLeft />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="text-center px-4">
                <div className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {currentPage + 1} / {totalPages}
                </div>
              </div>

              <button
                onClick={nextPage}
                disabled={totalPages > 0 && currentPage >= totalPages - 1}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all ${
                  (totalPages > 0 && currentPage >= totalPages - 1)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
