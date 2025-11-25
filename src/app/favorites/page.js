"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaYoutube, FaGlobe, FaHeart } from "react-icons/fa";
import { FaTelegram } from "react-icons/fa";
import Swal from "sweetalert2";
import { useFavorites } from "../contexts/FavoritesContext";

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
  const [favoritesData, setFavoritesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { removeFavorite } = useFavorites();

  useEffect(() => {
    fetchFavoritesData();
  }, []);

  async function fetchFavoritesData() {
    setLoading(true);
    setError(null);
    try {
      // Get userId from localStorage
      const userData = localStorage.getItem('userData');
      if (!userData) {
        setError("Please login to view favorites");
        setFavoritesData([]);
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const userId = user._id;

      if (!userId) {
        setError("User ID not found");
        setFavoritesData([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/user/favorites?userId=${userId}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.favorites)) {
        setFavoritesData(data.favorites);
      } else {
        setFavoritesData([]);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError("Failed to fetch favorites data");
      setFavoritesData([]);
    } finally {
      setLoading(false);
    }
  }

  const getFilteredData = () => {
    // Filter favorites based on selected platform
    let filtered = favoritesData;

    if (selectedPlatform === "youtube") {
      filtered = favoritesData.filter(fav => fav.medium === "YOUTUBE");
    } else if (selectedPlatform === "telegram") {
      filtered = favoritesData.filter(fav => fav.medium === "TELEGRAM");
    }
    // "overall" shows all favorites (no filtering)

    // Filter out favorites without channel data and transform
    return filtered
      .filter(fav => fav.channel && fav.channel.length > 0) // Only include favorites with channel data
      .map(fav => {
        const channelData = fav.channel[0];
        const isTelegram = fav.medium === "TELEGRAM";

        // For Telegram, use channel_id as name if influencer_name is not available or is "N/A"
        let displayName = channelData?.influencer_name || channelData?.name || fav.name;

        if (isTelegram && (!displayName || displayName === "N/A")) {
          displayName = channelData?.channel_id || fav.favouriteId || "Unknown";
        }

        if (!displayName) {
          displayName = channelData?.channel_id || fav.favouriteId || "Unknown";
        }

        return {
          id: fav.favouriteId || fav.channel_id,
          name: displayName,
          platform: isTelegram ? "Telegram" : "YouTube",
          subs: channelData?.subs || 0,
          avg_score: channelData?.avg_score?.$numberDecimal ? parseFloat(channelData.avg_score.$numberDecimal) : 0,
          rank: null, // Favorites don't have ranks
          channel_thumbnails: channelData?.channel_thumbnails || null,
          prob_weighted_returns: 0, // Not available in favorites
          win_percentage: 0, // Not available in favorites
          channel_id: channelData?.channel_id || fav.favouriteId,
        };
      });
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

  // Handle remove from favorites
  const handleRemoveFavorite = async (channelId, medium) => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Remove from Favorites?',
      text: 'Do you want to remove this influencer from your favorites?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'No, keep it',
      background: '#ffffff',
      color: '#1f2937',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#8b5cf6',
    });

    // If user clicks "No" or closes the dialog, don't proceed
    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await removeFavorite(channelId, medium);

      if (response.success) {
        // Show success message
        Swal.fire({
          title: 'Removed from favorites!',
          icon: 'success',
          background: '#ffffff',
          color: '#1f2937',
          confirmButtonColor: '#8b5cf6',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });

        // Refresh the favorites list
        await fetchFavoritesData();
      } else {
        throw new Error('Failed to remove favorite');
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to remove from favorites. Please try again.',
        icon: 'error',
        background: '#ffffff',
        color: '#1f2937',
        confirmButtonColor: '#8b5cf6',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    }
  };

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
              {/* Table View */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Influencer Icon</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Influencer Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Platform</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Channel URL</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {visibleInfluencers.map((inf, index) => (
                        <tr
                          key={inf.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          {/* Profile Image */}
                          <td className="px-6 py-4">
                            {inf.channel_thumbnails?.high?.url ? (
                              <div className="w-12 h-12 rounded-full overflow-hidden shadow-md">
                                <Image
                                  src={inf.channel_thumbnails.high.url}
                                  alt={inf.name || "Channel"}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
                                {inf.channel_id?.match(/\b\w/g)?.join("") || "?"}
                              </div>
                            )}
                          </td>

                          {/* Name */}
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {inf.name?.replace(/_/g, " ") || "Unknown"}
                            </div>
                          </td>

                          {/* Platform */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              inf.platform === "YouTube"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {inf.platform === "YouTube" ? (
                                <FaYoutube className="mr-1" />
                              ) : (
                                <FaTelegram className="mr-1" />
                              )}
                              {inf.platform}
                            </span>
                          </td>

                          {/* Channel URL */}
                          <td className="px-6 py-4">
                            <a
                              href={
                                inf.platform === "YouTube"
                                  ? `https://www.youtube.com/channel/${inf.channel_id}`
                                  : `https://t.me/${inf.channel_id}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaGlobe className="text-xs" />
                              View Channel
                            </a>
                          </td>

                          {/* Action Link and Heart Icon */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <Link
                                href={
                                  inf.platform === "YouTube"
                                    ? `/influencers/${inf.channel_id}`
                                    : `/telegram-influencer/${inf.channel_id}`
                                }
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                View Details
                              </Link>
                              <button
                                onClick={() => handleRemoveFavorite(inf.channel_id, inf.platform === "YouTube" ? "YOUTUBE" : "TELEGRAM")}
                                className="p-2 rounded-lg hover:bg-red-50 transition-all duration-200 group"
                                aria-label="Remove from favorites"
                              >
                                <FaHeart className="text-red-500 text-xl group-hover:scale-110 transition-transform" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                ? "Telegram favorites"
                : "No favorites found"}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}