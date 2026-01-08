"use client";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { FaStar, FaStarHalfAlt, FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp } from "react-icons/fa";
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
        <div className="relative mb-4 group cursor-pointer" onClick={handleNavigate}>
          {/* Gradient Ring on Hover */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/80 transition-all group-hover:ring-0">
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

            {/* Fallback Avatar */}
            <div
              className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 flex items-center justify-center"
              style={{ display: influencer.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
            >
              <span className="text-white text-5xl font-bold">
                {influencer.name?.match(/\b\w/g)?.join("").toUpperCase() || "?"}
              </span>
            </div>
          </div>

          {/* Rank Badge - Floating */}
          <div className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-xl border-3 border-white z-10">
            <div className="text-lg font-bold">#{influencer.rank}</div>
          </div>
        </div>

        {/* Influencer Name */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center mb-2 px-2 line-clamp-2">
          {influencer.name?.replace(/_/g, " ") || "Unknown"}
        </h2>

        {/* Platform Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1.5 rounded-full shadow-lg mb-4">
          <span className="font-semibold text-sm">{influencer.platform}</span>
        </div>

        {/* Subscribers Card */}
        <div className="w-full max-w-[200px] bg-white rounded-xl p-3 shadow-md border border-blue-100">
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

  return (
    <div className="h-full w-full bg-white flex flex-col p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-white"></div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-between">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            Performance Overview
          </h3>
          <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>

        {/* MCM Ranking Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50/50 rounded-xl p-4 shadow-sm h-48 flex flex-col justify-center relative">
          <h4 className="absolute top-4 left-4 text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></span>
            MCM Ranking
          </h4>

          {scatterData.length > 0 ? (
            <div className="flex justify-center items-end gap-6 h-32 mt-6">
              {scatterData.map((point, idx) => {
                const fullStars = Math.floor(point.rating);
                const hasHalfStar = point.rating % 1 >= 0.5;
                const totalStars = 5;
                const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2 group"
                    title={`Year: ${point.yearLabel}, Rating: ${point.rating.toFixed(1)}`}
                  >
                    {/* Stars */}
                    <div className="flex flex-col-reverse gap-1.5 transition-transform group-hover:-translate-y-1 duration-300">
                      {[...Array(fullStars)].map((_, i) => (
                        <FaStar key={`full-${i}`} className="text-yellow-500 w-3.5 h-3.5 drop-shadow-sm" />
                      ))}
                      {hasHalfStar && (
                        <FaStarHalfAlt key="half" className="text-yellow-500 w-3.5 h-3.5 drop-shadow-sm" />
                      )}
                      {[...Array(emptyStars)].map((_, i) => (
                        <FaStar key={`empty-${i}`} className="text-gray-200 w-3.5 h-3.5" />
                      ))}
                    </div>
                    {/* Year */}
                    <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600 transition-colors">{point.yearLabel}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs">No rating data available</div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* ROI */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 px-1">ROI</div>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-1">
              {influencer?.prob_weighted_returns
                ? influencer.prob_weighted_returns.toFixed(1)
                : '--'}
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 px-1">Win Rate</div>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-1">
              {influencer?.win_percentage
                ? `${Math.round(influencer.win_percentage)}%`
                : '--'}
            </div>
          </div>

          {/* Total Posts */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 px-1">Total Posts</div>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-1">
              {influencer?.price_counts
                ? influencer.price_counts.toLocaleString()
                : '--'}
            </div>
          </div>

          {/* AI Score */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 px-1">AI Score</div>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-1">
              {influencer?.ai_overall_score
                ? influencer.ai_overall_score.toFixed(1)
                : '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Right Panel Component - Summary
const RightPanel = ({ influencer }) => {
  const [expandedSummary, setExpandedSummary] = useState(false);

  const getSummaryText = () => {
    if (!influencer.gemini_summary || influencer.gemini_summary === '') {
      return null;
    }
    if (Array.isArray(influencer.gemini_summary)) {
      return influencer.gemini_summary.join(', ');
    }
    if (typeof influencer.gemini_summary === 'object') {
      return Object.values(influencer.gemini_summary).join(', ');
    }
    return influencer.gemini_summary;
  };

  const summaryText = getSummaryText();
  const MAX_LENGTH = 500;
  const shouldTruncate = summaryText && summaryText.length > MAX_LENGTH;
  const displayText = summaryText
    ? (shouldTruncate && !expandedSummary)
      ? summaryText.substring(0, MAX_LENGTH) + '...'
      : summaryText
    : null;

  return (
    <div className="h-full w-full bg-gradient-to-br from-purple-50 via-blue-50 to-white flex flex-col p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#8b5cf6_25%,transparent_25%,transparent_75%,#8b5cf6_75%,#8b5cf6),linear-gradient(45deg,#8b5cf6_25%,transparent_25%,transparent_75%,#8b5cf6_75%,#8b5cf6)] bg-[length:20px_20px] bg-[0_0,10px_10px]"></div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
            AI Summary
          </h3>
          <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
        </div>

        {/* Summary Card */}
        <div className="bg-white/80 rounded-xl p-4 shadow-sm border border-purple-200/50 flex-1 overflow-y-auto">
          {displayText ? (
            <div className="flex flex-col h-full">
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line flex-1">
                {displayText}
              </div>
              {shouldTruncate && (
                <button
                  onClick={() => setExpandedSummary(!expandedSummary)}
                  className="text-purple-600 hover:text-purple-800 text-xs font-semibold mt-3 inline-flex items-center gap-1 hover:underline"
                >
                  {expandedSummary ? (
                    <>
                      <span>Show Less</span>
                      <FaChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>Read More</span>
                      <FaChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 text-sm py-8 flex items-center justify-center h-full">
              No summary available
            </div>
          )}
        </div>


      </div>

      {/* Decorative Bottom Line */}
      <div className="mt-auto text-center pt-2">
        <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto opacity-50"></div>
      </div>
    </div>
  );
};

// Table of Contents - Left Panel
const TOCLeftPanel = ({ influencers, selectedIndex, onSelect }) => {
  return (
    <div className="h-full w-full bg-white/95 backdrop-blur-sm flex flex-col p-6 md:p-8 relative overflow-hidden border-r border-gray-100">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute -top-[100px] -left-[100px] w-[300px] h-[300px] bg-blue-100/50 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex-1 flex flex-col z-10">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Table of Contents
        </h2>
        <p className="text-gray-500 text-xs md:text-sm mb-6 font-medium">Click to view metrics</p>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {influencers.length > 0 ? influencers.map((inf, idx) => (
            <div
              key={inf.id}
              onClick={() => onSelect(idx)}
              className={`group flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-md border transition-all cursor-pointer ${selectedIndex === idx
                ? 'bg-white shadow-md border-blue-200 ring-1 ring-blue-100'
                : 'bg-slate-50/50 border-transparent hover:border-blue-100'
                }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-transform flex-shrink-0 ${selectedIndex === idx
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white scale-110'
                : 'bg-gradient-to-br from-blue-400 to-purple-400 text-white group-hover:scale-110'
                }`}>
                #{inf.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm truncate transition-colors ${selectedIndex === idx ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-600'
                  }`}>
                  {inf.name}
                </div>
                <div className="text-[10px] md:text-xs text-gray-500 truncate">
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

        <div className="mt-4 flex flex-col items-center">
          <FaChevronDown className="text-gray-300 animate-bounce w-4 h-4" />
          <span className="text-[10px] text-gray-400 mt-1">Total: {influencers.length} influencers</span>
        </div>
      </div>
    </div>
  );
};

// Table of Contents - Right Panel
const TOCRightPanel = ({ influencer }) => {
  const selectedInf = influencer || {};

  return (
    <div className="h-full w-full bg-slate-50/90 backdrop-blur-sm flex flex-col p-6 md:p-8 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute -bottom-[100px] -right-[100px] w-[300px] h-[300px] bg-purple-100/50 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex-1 flex flex-col z-10 transition-all duration-300 transform key={selectedInf.id}">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 text-center">
          Key Metrics
        </h2>
        <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-8 opacity-70"></div>

        <div className="text-center mb-6">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Selected: <span className="text-gray-700 text-lg block mt-1">{selectedInf.name || "N/A"}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-auto">
          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow group">
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">ROI</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
              {selectedInf.prob_weighted_returns ? selectedInf.prob_weighted_returns.toFixed(1) : '--'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow group">
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Win Rate</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
              {selectedInf.win_percentage ? Math.round(selectedInf.win_percentage) + '%' : '--'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-shadow group">
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Total Posts</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
              {selectedInf.price_counts ? selectedInf.price_counts.toLocaleString() : '--'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-shadow group">
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">AI Score</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
              {selectedInf.ai_overall_score ? selectedInf.ai_overall_score.toFixed(1) : '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tri-Fold Flipbook Component
const TriFoldFlipbook = ({ influencers, onInfluencerClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = TOC, 1...N = Influencers
  const [tocSelectedIndex, setTocSelectedIndex] = useState(0); // For TOC view selection
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState(null); // 'next' or 'prev'

  const totalPages = influencers.length + 1; // TOC + Influencers
  const isTOC = currentIndex === 0;
  const currentInfluencer = isTOC ? null : influencers[currentIndex - 1];

  const goNext = () => {
    if (currentIndex < totalPages - 1 && !isFlipping) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 600);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0 && !isFlipping) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 600);
    }
  };

  const goToPage = (index) => {
    if (index !== currentIndex && !isFlipping) {
      setFlipDirection(index > currentIndex ? 'next' : 'prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex(index);
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
      {/* Book Container */}
      <div className="relative" style={{ perspective: '2000px' }}>
        <div className="flex gap-1 md:gap-2 justify-center" style={{ transformStyle: 'preserve-3d' }}>

          {isTOC ? (
            /* TOC View - 2 Pages */
            <>
              {/* TOC Left Panel */}
              <div
                className={`w-[280px] md:w-[320px] h-[480px] md:h-[550px] rounded-l-2xl overflow-hidden shadow-2xl transition-all duration-600 ease-in-out bg-white
                                ${isFlipping && flipDirection === 'prev' ? 'animate-flip-in-left' : ''} 
                                ${isFlipping && flipDirection === 'next' ? 'animate-flip-out-left' : ''}`}
                style={{
                  transformOrigin: 'right center',
                  boxShadow: '-8px 0 30px rgba(0,0,0,0.15), 0 10px 40px rgba(0,0,0,0.2)'
                }}
              >
                <TOCLeftPanel
                  influencers={influencers}
                  selectedIndex={tocSelectedIndex}
                  onSelect={setTocSelectedIndex}
                />
              </div>

              {/* TOC Right Panel */}
              <div
                className={`w-[280px] md:w-[320px] h-[480px] md:h-[550px] rounded-r-2xl overflow-hidden shadow-2xl transition-all duration-600 ease-in-out bg-white
                                ${isFlipping && flipDirection === 'next' ? 'animate-flip-in-right' : ''} 
                                ${isFlipping && flipDirection === 'prev' ? 'animate-flip-out-right' : ''}`}
                style={{
                  transformOrigin: 'left center',
                  boxShadow: '8px 0 30px rgba(0,0,0,0.15), 0 10px 40px rgba(0,0,0,0.2)'
                }}
              >
                <TOCRightPanel influencer={influencers[tocSelectedIndex]} />
              </div>

              {/* Spine filler for TOC (optional) */}
              <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-gray-400 via-gray-300 to-gray-400 opacity-20 -ml-0.5 z-20"></div>
            </>
          ) : (
            /* Influencer View - 3 Panels (Tri-Fold) */
            <>
              {/* Left Panel */}
              <div
                className={`w-[280px] md:w-[320px] h-[480px] md:h-[550px] rounded-l-2xl overflow-hidden shadow-2xl transition-transform duration-600 ease-in-out ${isFlipping && flipDirection === 'prev' ? 'animate-flip-in-left' : ''
                  } ${isFlipping && flipDirection === 'next' ? 'animate-flip-out-left' : ''}`}
                style={{
                  transformOrigin: 'right center',
                  boxShadow: '-8px 0 30px rgba(0,0,0,0.15), 0 10px 40px rgba(0,0,0,0.2)'
                }}
              >
                <LeftPanel influencer={currentInfluencer} />
              </div>

              {/* Middle Panel */}
              <div
                className={`w-[280px] md:w-[320px] h-[480px] md:h-[550px] overflow-hidden shadow-2xl transition-all duration-600 ease-in-out ${isFlipping ? 'opacity-80 scale-95' : 'opacity-100 scale-100'
                  }`}
                style={{
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}
              >
                <MiddlePanel influencer={currentInfluencer} />
              </div>

              {/* Right Panel */}
              <div
                className={`w-[280px] md:w-[320px] h-[480px] md:h-[550px] rounded-r-2xl overflow-hidden shadow-2xl transition-transform duration-600 ease-in-out ${isFlipping && flipDirection === 'next' ? 'animate-flip-in-right' : ''
                  } ${isFlipping && flipDirection === 'prev' ? 'animate-flip-out-right' : ''}`}
                style={{
                  transformOrigin: 'left center',
                  boxShadow: '8px 0 30px rgba(0,0,0,0.15), 0 10px 40px rgba(0,0,0,0.2)'
                }}
              >
                <RightPanel influencer={currentInfluencer} />
              </div>

            </>
          )}

        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-6 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl border border-gray-200">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0 || isFlipping}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all ${currentIndex === 0 || isFlipping
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg transform hover:scale-105'
            }`}
        >
          <FaChevronLeft />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="text-center px-4">
          <div className="text-sm font-semibold text-gray-800">
            {isTOC ? "Table of Contents" : `${currentIndex} / ${influencers.length}`}
          </div>
          <div className="text-xs text-gray-500">
            {isTOC ? "Overview" : `Rank #${currentInfluencer?.rank}`}
          </div>
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex >= totalPages - 1 || isFlipping}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all ${currentIndex >= totalPages - 1 || isFlipping
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
        {/* TOC Thumbnail */}
        <button
          onClick={() => goToPage(0)}
          className={`flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center bg-gray-100 ${currentIndex === 0
            ? 'border-blue-500 ring-2 ring-blue-300 scale-110'
            : 'border-gray-300 hover:border-blue-400'
            }`}
          title="Table of Contents"
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-4 h-0.5 bg-gray-500"></div>
            <div className="w-4 h-0.5 bg-gray-500"></div>
            <div className="w-4 h-0.5 bg-gray-500"></div>
          </div>
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

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
            className="flex items-center gap-2 overflow-x-auto max-w-[200px] sm:max-w-[300px] md:max-w-[400px] scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {influencers.map((inf, idx) => (
              <button
                key={inf.id}
                onClick={() => goToPage(idx + 1)}
                className={`flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${idx + 1 === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-300 scale-110'
                  : 'border-gray-300 hover:border-blue-400'
                  }`}
                title={inf.name}
              >
                {inf.channel_thumbnails?.high?.url ? (
                  <Image
                    src={inf.channel_thumbnails.high.url}
                    alt={inf.name || ""}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {inf.name?.charAt(0) || "?"}
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
      `}</style>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 border-b-2 border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-4xl md:text-5xl font-bold flex items-start gap-3 drop-shadow-sm">
              <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                Influencer Tri-Fold
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
          <TriFoldFlipbook
            influencers={filteredInfluencers}
          />
        )}
      </div>
    </div>
  );
}
