"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaYoutube, FaGlobe } from "react-icons/fa";
import { FaTelegram } from "react-icons/fa";

const platforms = [
  {
    label: "Overall",
    value: "overall",
    logo: <FaGlobe className="text-xl" />
  },
  {
    label: "YouTube",
    value: "youtube",
    logo: <FaYoutube className="text-xl" />
  },
  {
    label: "Telegram",
    value: "telegram",
    logo: <FaTelegram className="text-xl" />
  },
];

export default function FavoritesPage() {
  const [selectedPlatform, setSelectedPlatform] = useState("overall");
  const [youtubeData, setYoutubeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    if (selectedPlatform === "youtube" || selectedPlatform === "overall") {
      fetchYouTubeData();
    }
  }, [selectedPlatform]);

  async function fetchYouTubeData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube-data?metric=ai_scoring");
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setYoutubeData(data.results);
      } else {
        setYoutubeData([]);
      }
    } catch (err) {
      setError("Failed to fetch YouTube data");
      setYoutubeData([]);
    } finally {
      setLoading(false);
    }
  }

  const getFilteredData = () => {
    switch (selectedPlatform) {
      case "overall":
        return youtubeData.map(ch => ({
          id: ch.channel_id,
          name: ch.influencer_name || ch.name,
          platform: "YouTube",
          subs: ch.subs,
          avg_score: ch.ai_overall_score || ch.avg_score,
          rank: ch.rank,
          channel_thumbnails: ch.channel_thumbnails,
          prob_weighted_returns: ch.prob_weighted_returns,
          win_percentage: ch.win_percentage,
        }));
      case "youtube":
        return youtubeData.map(ch => ({
          id: ch.channel_id,
          name: ch.influencer_name || ch.name,
          platform: "YouTube",
          subs: ch.subs,
          avg_score: ch.ai_overall_score || ch.avg_score,
          rank: ch.rank,
          channel_thumbnails: ch.channel_thumbnails,
          prob_weighted_returns: ch.prob_weighted_returns,
          win_percentage: ch.win_percentage,
        }));
      case "telegram":
        return [];
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();

  // Pagination logic
  const totalInfluencers = filteredData.length;
  const totalPages = Math.ceil(totalInfluencers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleInfluencers = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Reset to page 1 when platform changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPlatform]);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 transition pt-8"
        >
          <FaArrowLeft />
          <span>Back to Profile</span>
        </Link>

        <section className="pt-8 pb-6 flex flex-col items-center gap-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent text-center">
            My Favorites
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl text-center">
            Your favorite crypto influencers in one place
          </p>
        </section>

        {/* Platform Toggle */}
        <section className="max-w-5xl mx-auto px-4 pb-6">
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

        <section className="max-w-5xl mx-auto">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              Loading influencers...
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : filteredData.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {visibleInfluencers.map((inf) => (
                <Link
                  key={inf.id}
                  href={`/influencers/${inf.id}`}
                  className="rounded-2xl p-6 flex flex-col items-center shadow-md hover:shadow-lg hover:scale-105 transition cursor-pointer group relative bg-white border border-gray-200"
                >
                  {/* Rank Badge */}
                  {inf.rank && (
                    <div className="absolute top-4 right-4 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-blue-500">
                      Rank {inf.rank}
                    </div>
                  )}

                  {/* Thumbnail or Avatar */}
                  {inf.channel_thumbnails?.high?.url ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg mb-4">
                      <Image
                        src={inf.channel_thumbnails.high.url}
                        alt={inf.name || "Channel"}
                        width={80}
                        height={80}
                        className="rounded-full w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      {inf.name?.match(/\b\w/g)?.join("") || "?"}
                    </div>
                  )}

                  <div className="mt-3 text-sm text-gray-800 font-semibold text-center">
                    {inf.name?.replace(/_/g, " ") || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500 mb-4">{inf.platform}</div>

                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-3 gap-3 w-full mt-auto">
                    <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 hover:scale-105 transition-all duration-200 border border-gray-200">
                      <div className="font-semibold text-gray-700 mb-1">ROI</div>
                      <div className="font-bold text-sm text-purple-600">
                        {inf.prob_weighted_returns !== undefined
                          ? `${inf.prob_weighted_returns.toFixed(1)}%`
                          : '0%'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 hover:scale-105 transition-all duration-200 border border-gray-200">
                      <div className="font-semibold text-gray-700 mb-1">Win %</div>
                      <div className="font-bold text-sm text-green-600">
                        {typeof inf.win_percentage === 'number'
                          ? `${inf.win_percentage.toFixed(1)}%`
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 hover:scale-105 transition-all duration-200 border border-gray-200">
                      <div className="font-semibold text-gray-700 mb-1">Loss %</div>
                      <div className="font-bold text-sm text-red-600">
                        {typeof inf.win_percentage === 'number'
                          ? `${(100 - inf.win_percentage).toFixed(1)}%`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center mt-8 space-y-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-700 text-center">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalInfluencers)} of {totalInfluencers} influencers
                </div>

                {/* Mobile Pagination - Show only on small screens */}
                <div className="flex sm:hidden items-center justify-center space-x-1 w-full">
                  {/* First Button - Mobile */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    ‹‹
                  </button>

                  {/* Previous Button - Mobile */}
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    ‹
                  </button>

                  {/* Current Page Info */}
                  <div className="flex items-center space-x-2 px-2">
                    <span className="text-xs text-gray-600">Page</span>
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded text-xs font-medium">
                      {currentPage}
                    </span>
                    <span className="text-xs text-gray-600">of {totalPages}</span>
                  </div>

                  {/* Next Button - Mobile */}
                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    ›
                  </button>

                  {/* Last Button - Mobile */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
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
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    &lt;&lt;
                  </button>

                  {/* Previous Button - Desktop */}
                  <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    &lt;
                  </button>

                  {/* First Page */}
                  {getPageNumbers()[0] > 1 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500 transition-all duration-200"
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
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
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
                        className="px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500 transition-all duration-200"
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
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    &gt;
                  </button>

                  {/* Last Button - Desktop */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-2 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-purple-500'
                      }`}
                  >
                    &gt;&gt;
                  </button>
                </div>
              </div>
            )}
          </>
          ) : (
            <div className="text-center text-gray-500 py-16">
              {selectedPlatform === "telegram"
                ? "Telegram favorites coming soon..."
                : "No favorites found"}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}