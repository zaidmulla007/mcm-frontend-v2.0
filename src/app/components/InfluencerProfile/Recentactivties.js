"use client";

import { useState, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaEye, FaThumbsUp, FaComment } from "react-icons/fa";
import moment from "moment-timezone";
import { useTimezone } from "../../contexts/TimezoneContext";

export default function RecentActivityTab({ channelID, channelData, youtubeLast5, rank }) {
  const { useLocalTime, formatDate } = useTimezone();
  const [recentPosts, setRecentPosts] = useState([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [hoveredPost, setHoveredPost] = useState(null);
  const [expandedSummaries, setExpandedSummaries] = useState({});
  const [expandedTitles, setExpandedTitles] = useState({});
  const [expandedMarketing, setExpandedMarketing] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    console.log("RecentActivities - Full channelData:", channelData);
    console.log("RecentActivities - channelData.youtube_last_5:", channelData?.youtube_last_5);
    console.log("RecentActivities - channelData.last5:", channelData?.last5);
    console.log("RecentActivities - youtubeLast5 prop:", youtubeLast5);

    // Priority: 1) youtubeLast5 prop, 2) channelData.youtube_last_5, 3) channelData.last5
    const videosData = youtubeLast5?.length
      ? youtubeLast5
      : (channelData?.youtube_last_5?.length
        ? channelData.youtube_last_5
        : channelData?.youtubeLast5);

    if (videosData && videosData.length > 0) {
      console.log("RecentActivities - videosData:", videosData);

      const formattedPosts = videosData.map((video, index) => {
        console.log(`Video ${index + 1} mentioned:`, video.mentioned);
        const coinRecommendations = (video.mentioned || []).map((coin) => {
          console.log(`Mapping coin:`, coin);
          return {
            coin: coin.symbol || coin.name,
            name: coin.name,
            sentiment: coin.sentiment,
            term: coin.cryptoRecommendationType || "short-term",
            outlook: coin.outlook || "N/A",
            action: coin.action,
            entryStrategy: coin.entryStrategy,
            exitStrategy: coin.exitStrategy,
            tradingCall: coin.tradingCall,
            price: coin.price
          };
        });
        console.log(`Final coinRecommendations for video ${index + 1}:`, coinRecommendations);

        return {
          id: (index + 1),
          title: video.title,
          date: video.publishedAt,
          summary: video.summary,
          coinRecommendations,
          videoUrl: video.videoID ? `https://www.youtube.com/watch?v=${video.videoID}` : (video.videoURL || "#"),
          outlook: video.mentioned && video.mentioned.length > 0 ? video.mentioned[0].cryptoRecommendationType || "short-term" : "medium-term",
          actionableInsights: video.actionableInsights,
          buyingPriceZone: video.buyingPriceZone,
          clarityOfAnalysis: video.clarityOfAnalysis,
          credibilityScore: video.credibilityScore,
          educationalPurpose: video.educationalPurpose,
          exitStrategyScore: video.exitStrategyScore,
          overallScore: video.overallScore,
          recommendations: video.recommendations,
          riskManagement: video.riskManagement,
          viewOnCoins: video.viewOnCoins,
          marketingContent: video.marketingContent || "No marketing content available",
          views: video.views || "0",
          likes: video.likes || "0", 
          comments: video.comments || "0"
        };
      });
      console.log("Final formattedPosts:", formattedPosts);
      setRecentPosts(formattedPosts);
    } else {
      console.log("No data found - no video data available in any format");
    }
  }, [channelData, youtubeLast5]);

  // Reset current page when recentPosts change
  useEffect(() => {
    setCurrentPage(1);
  }, [recentPosts]);

  // Force re-render when timezone changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [useLocalTime]);

  // Toggle functions
  const toggleExpanded = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleSummary = (postId) => {
    setExpandedSummaries(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleTitle = (postId) => {
    setExpandedTitles(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleMarketing = (postId) => {
    setExpandedMarketing(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Render stars based on score
  const renderStars = (score) => {
    const stars = [];
    const rating = score / 2; // Convert score to 5-star rating
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaStar key={i} className="text-gray-300" />);
      }
    }

    return (
      <div className="flex">
        {stars}
      </div>
    );
  };


  const getSentimentColor = (sentiment) => {
    if (sentiment.toLowerCase().includes("bullish")) return "text-green-500";
    if (sentiment.toLowerCase().includes("bearish")) return "text-red-500";
    return "text-blue-500"; // neutral
  };

  const getColumnColor = (index) => {
    return "bg-blue-600";
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-blue-500";
    if (score >= 4) return "text-yellow-500";
    return "text-red-500";
  };

  // Capitalize first letter of each word
  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Format coin name - first letter capitalized, rest lowercase
  const formatCoinName = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Format sentiment - capitalize each word
  const formatSentiment = (sentiment) => {
    if (!sentiment) return 'N/A';
    return sentiment.replace('_', ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Format holding period - capitalize each word and remove hyphens
  const formatHoldingPeriod = (term) => {
    if (!term || term.toLowerCase() === 'no outlook') return 'Not Specified';
    return term.replace(/-/g, ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Format engagement numbers (views, likes, comments) with comma separators
  const formatEngagementNumber = (num) => {
    if (!num || num === "0") return "0";
    const number = parseInt(num.toString().replace(/,/g, ''));
    return number.toLocaleString();
  };

  // Pagination calculations
  const totalPosts = recentPosts.length;
  const totalPages = Math.ceil(totalPosts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visiblePosts = recentPosts.slice(startIndex, endIndex);

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

  return (
    <div className="bg-white min-h-screen rounded-xl text-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {channelData?.influencer_name || "Influencer"}
          </h1>
          {rank && (
            <div className="text-xl font-semibold text-white-600 mt-2">
              Rank (180 days/Overall) : {rank}
            </div>
          )}
        </div>

        {/* Posts */}
        <div className="flex gap-4 overflow-x-auto pb-6">
          {visiblePosts.map((post, index) => (
            <div
              key={post.id}
              className="w-80 flex-shrink-0 bg-white rounded-xl overflow-hidden border border-gray-800 shadow-lg"
            >
              {/* Post Header with Number */}
              <div
                className={`${getColumnColor(index)} text-white p-3 text-center text-sm font-bold flex justify-between items-center`}
              >
                <span>POST {post.id}</span>
                <span className="text-xs">{formatDate(post.date)}</span>
              </div>

              {/* Post Title */}
              <div className="p-3 border-b border-gray-800">
                <div className="min-h-[40px] mb-2">
                  <div className={`text-sm font-medium text-gray-900 ${expandedTitles[post.id] ? '' : 'line-clamp-2'}`} title={post.title}>
                    {post.title}
                  </div>
                </div>
                <div className="h-6 mb-2">
                  {post.title.length > 80 && (
                    <button
                      onClick={() => toggleTitle(post.id)}
                      className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer"
                    >
                      {expandedTitles[post.id] ? '.....' : '......'}
                    </button>
                  )}
                </div>
                <div className="text-xs h-6">
                  <a
                    href={post.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-red-500 hover:text-red-600"
                  >
                    Watch Video
                  </a>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="px-3 py-2 border-b border-gray-800 bg-gray-50">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <FaEye className="text-blue-500" />
                    <span>{formatEngagementNumber(post.views)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaThumbsUp className="text-green-500" />
                    <span>{formatEngagementNumber(post.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaComment className="text-orange-500" />
                    <span>{formatEngagementNumber(post.comments)}</span>
                  </div>
                </div>
              </div>

              {/* MCM Scoring */}
              <div className="p-3 border-b border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-xs text-gray-700">MCM Rating</span>
                </div>
                <ul className="text-xs space-y-2">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-700">Overall</span>
                    {renderStars(post.overallScore)}
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-700">Educational</span>
                    {renderStars(post.educationalPurpose)}
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-700">Actionable Insights</span>
                    {renderStars(post.actionableInsights)}
                  </li>
                  <li className="flex flex-col">
                    <span className="text-gray-700 mb-2">Marketing Content</span>
                    <div className={`text-xs text-gray-500 ${expandedMarketing[post.id] ? 'leading-tight' : 'truncate overflow-hidden whitespace-nowrap'}`}>
                      {typeof post.marketingContent === "string"
                        ? expandedMarketing[post.id]
                          ? post.marketingContent
                            .split(" ")
                            .map((word, i) =>
                              i < 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word
                            )
                            .join(" ")
                          : post.marketingContent
                            .split(" ")
                            .map((word, i) =>
                              i < 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word
                            )
                            .join(" ")
                        : "N/A"}
                    </div>
                    <div className="h-6 mt-2">
                      {typeof post.marketingContent === "string" &&
                        post.marketingContent.length > 50 && (
                          <button
                            onClick={() => toggleMarketing(post.id)}
                            className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer self-start"
                          >
                            {expandedMarketing[post.id] ? "Read Less" : "Read More"}
                          </button>
                        )}
                    </div>
                  </li>
                </ul>
              </div>

              {/* Post Summary */}
              <div className="p-3 border-b border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-gray-700">Post Summary</span>
                  <button
                    onClick={() => toggleSummary(post.id)}
                    className="text-lg text-blue-500 hover:text-blue-700 cursor-pointer font-bold"
                  >
                    {expandedSummaries[post.id] ? '−' : '+'}
                  </button>
                </div>

                <div className="min-h-[96px] mb-2">
                  <div
                    className={`text-xs text-gray-600 leading-tight transition-all duration-300 ${expandedSummaries[post.id] ? '' : 'line-clamp-4'
                      }`}
                  >
                    {post.summary || "No summary available"}
                  </div>

                  {/* Read more / Read less toggle */}
                  {post.summary && (
                    <button
                      onClick={() => toggleSummary(post.id)}
                      className="mt-1 text-blue-500 hover:text-blue-700 text-xs font-semibold"
                    >
                      {expandedSummaries[post.id] ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>


              {/* Coins Analysis */}
              <div
                className="p-3 relative"
                onMouseEnter={() => setHoveredPost(post.id)}
                onMouseLeave={() => setHoveredPost(null)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-xs text-gray-700">Coins Analysis</span>
                </div>

                {/* Coins table */}
                <div className="flex justify-center">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-center text-gray-700 pb-1 pr-2">Name</th>
                          <th className="text-center text-gray-700 pb-1 pr-2">Sentiment</th>
                          <th className="text-center text-gray-700 pb-1">Outlook</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const allCoins = post.coinRecommendations || [];
                          const displayCoins = expandedPosts[post.id] 
                            ? allCoins
                            : allCoins.slice(0, 5);
                          
                          const rows = [];
                          
                          // First, add rows for actual coins with borders
                          displayCoins.forEach((coin, i) => {
                            rows.push(
                              <tr key={i} className="border-b border-gray-800/50">
                                <td className="py-1 pr-2 text-center">
                                  <span className="text-gray-900" title={coin.symbol}>
                                    {formatCoinName(coin.name || coin.name)}
                                  </span>
                                </td>
                                <td className="py-1 pr-2 text-center">
                                  <span className={getSentimentColor(coin.sentiment || 'neutral')}>
                                    {formatSentiment(coin.sentiment)}
                                  </span>
                                </td>
                                <td className="py-1 text-center">
                                  <span className="text-gray-700">
                                    {formatHoldingPeriod(coin.term)}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                          
                          // Add invisible placeholder rows to maintain fixed height (no borders)
                          const actualCoinCount = expandedPosts[post.id] ? allCoins.length : Math.min(allCoins.length, 5);
                          for (let i = actualCoinCount; i < 5; i++) {
                            rows.push(
                              <tr key={`placeholder-${i}`} className="">
                                <td className="py-1 pr-2 text-center">
                                  <span className="text-transparent">-</span>
                                </td>
                                <td className="py-1 pr-2 text-center">
                                  <span className="text-transparent">-</span>
                                </td>
                                <td className="py-1 text-center">
                                  <span className="text-transparent">-</span>
                                </td>
                              </tr>
                            );
                          }
                          
                          return rows;
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="h-6 mt-2">
                  {post.coinRecommendations && post.coinRecommendations.length > 5 && (
                    <button
                      onClick={() => toggleExpanded(post.id)}
                      className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer"
                    >
                      {expandedPosts[post.id]
                        ? 'Read Less'
                        : 'Read More'
                      }
                    </button>
                  )}
                </div>

                {/* Hover Tooltip */}
                {hoveredPost === post.id && (
                  <div className="absolute top-0 left-full ml-2 z-50 bg-gray-800 text-white p-4 rounded-lg shadow-xl border border-gray-300 max-w-md">
                    <div className="text-xs">
                      <div className="font-bold mb-2 text-blue-400">Complete Post Analysis</div>

                      <div className="mb-3">
                        <span className="font-semibold text-blue-400">All Recommendations ({post.coinRecommendations?.length || 0}):</span>
                        <div className="mt-1 max-h-32 overflow-y-auto">
                          {post.coinRecommendations?.map((rec, i) => (
                            <div key={i} className={`${getSentimentColor(rec.sentiment)} mb-1 flex items-start`}>
                              <span className="mr-1">•</span>
                              <span>{formatCoinName(rec.name || rec.coin)}: {formatSentiment(rec.sentiment)}, {formatHoldingPeriod(rec.term)}</span>
                              {rec.price && <span className="ml-1 text-gray-400">@ {rec.price}</span>}
                            </div>
                          )) || []}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-start">
                          <span className="mr-1 text-gray-400">•</span>
                          <span><span className="text-gray-400">Actionable:</span> <span className={getScoreColor(post.actionableInsights)}>{post.actionableInsights}/10</span></span>
                        </div>
                        <div className="flex items-start">
                          <span className="mr-1 text-gray-400">•</span>
                          <span><span className="text-gray-400">Buying Zone:</span> <span className={getScoreColor(post.buyingPriceZone)}>{post.buyingPriceZone}/10</span></span>
                        </div>
                        <div className="flex items-start">
                          <span className="mr-1 text-gray-400">•</span>
                          <span><span className="text-gray-400">Clarity:</span> <span className={getScoreColor(post.clarityOfAnalysis)}>{post.clarityOfAnalysis}/10</span></span>
                        </div>
                        <div className="flex items-start">
                          <span className="mr-1 text-gray-400">•</span>
                          <span><span className="text-gray-400">Credibility:</span> <span className={getScoreColor(post.credibilityScore)}>{post.credibilityScore}/10</span></span>
                        </div>
                        <div className="flex items-start">
                          <span className="mr-1 text-gray-400">•</span>
                          <span><span className="text-gray-400">Educational:</span> <span className={getScoreColor(post.educationalPurpose)}>{post.educationalPurpose}/10</span></span>
                        </div>
                        <div className="flex items-start">
                          <span className="mr-1 text-gray-400">•</span>
                          <span><span className="text-gray-400">Exit Strategy:</span> <span className={getScoreColor(post.exitStrategyScore)}>{post.exitStrategyScore}/10</span></span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-600">
                        <div className="text-gray-400 text-xs flex items-start">
                          <span className="mr-1">•</span>
                          <span><span className="font-semibold">Outlook:</span> {post.outlook}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center mt-8 space-y-4">
            {/* Pagination Info */}
            <div className="text-sm text-gray-400 text-center">
              Showing {startIndex + 1} to {Math.min(endIndex, totalPosts)} of {totalPosts} posts
            </div>

            {/* Mobile Pagination - Show only on small screens */}
            <div className="flex sm:hidden items-center justify-center space-x-1 w-full">
              {/* First Button - Mobile */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500'
                  }`}
              >
                ‹‹
              </button>

              {/* Previous Button - Mobile */}
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500'
                  }`}
              >
                ‹
              </button>

              {/* Current Page Info */}
              <div className="flex items-center space-x-2 px-2">
                <span className="text-xs text-gray-600">Page</span>
                <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded text-xs font-medium">
                  {currentPage}
                </span>
                <span className="text-xs text-gray-600">of {totalPages}</span>
              </div>

              {/* Next Button - Mobile */}
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === totalPages
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500'
                  }`}
              >
                ›
              </button>

              {/* Last Button - Mobile */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === totalPages
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500'
                  }`}
              >
                ››
              </button>
            </div>

            {/* Desktop/Tablet Pagination - Show on medium screens and up */}
            <div className="hidden sm:flex items-center space-x-1 md:space-x-2 flex-wrap justify-center">
              {/* First Button - Desktop */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500'
                  }`}
              >
                &lt;&lt;
              </button>

              {/* Previous Button - Desktop */}
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500'
                  }`}
              >
                &lt;
              </button>

              {/* First Page */}
              {getPageNumbers()[0] > 1 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500 transition-all duration-200"
                  >
                    1
                  </button>
                  {getPageNumbers()[0] > 2 && (
                    <span className="text-gray-500 text-xs">...</span>
                  )}
                </>
              )}

              {/* Page Numbers */}
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === page
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500'
                    }`}
                >
                  {page}
                </button>
              ))}

              {/* Last Page */}
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                <>
                  {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                    <span className="text-gray-500 text-xs">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500 transition-all duration-200"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next Button - Desktop */}
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === totalPages
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500'
                  }`}
              >
                &gt;
              </button>

              {/* Last Button - Desktop */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === totalPages
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-blue-500'
                  }`}
              >
                &gt;&gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}