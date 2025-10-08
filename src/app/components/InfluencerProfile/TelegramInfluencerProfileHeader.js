"use client";
import Image from "next/image";
import { FaTrophy, FaHeart, FaRegHeart, FaTelegram } from "react-icons/fa";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { favoritesAPI } from "../../api/favorites/route";

export default function TelegramInfluencerProfileHeader({ channelData }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Get userId from localStorage
  useEffect(() => {
    try {
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserId(userData._id || userData.user?._id);
      }
    } catch (error) {
      console.error('Error parsing userData:', error);
    }
  }, []);

  // Check if item is already in favorites on component mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!userId) return;
      
      try {
        const favorites = await favoritesAPI.getAllFavorites(userId);
        if (favorites.success && favorites.results) {
          const isCurrentlyFavorite = favorites.results.some(
            fav => fav.favouriteId === channelData.results?._id && fav.medium === "TELEGRAM"
          );
          setIsFavorite(isCurrentlyFavorite);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };

    if (channelData?.results?._id && userId) {
      checkFavoriteStatus();
    }
  }, [channelData?.results?._id, userId]);

  const handleFavoriteClick = async () => {
    if (isLoading || !userId) return;
    
    setIsLoading(true);
    const newFavoriteState = !isFavorite;
    
    try {
      const requestData = {
        op: newFavoriteState ? "ADD" : "DEL",
        medium: "TELEGRAM",
        userId: userId,
        favouriteId: channelData.results._id,
        favouriteType: "INFLUENCER"
      };

      const response = await favoritesAPI.toggleFavorite(requestData);
      
      if (response.success) {
        setIsFavorite(newFavoriteState);
        
        // Show SweetAlert with layout colors based on action
        Swal.fire({
          title: newFavoriteState ? 'Added to favourites' : 'Removed from favourite list',
          icon: newFavoriteState ? 'success' : 'info',
          background: '#232042',
          color: '#ffffff',
          confirmButtonColor: '#8b5cf6',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
          customClass: {
            popup: 'colored-toast'
          }
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Show error message
      Swal.fire({
        title: 'Error',
        text: 'Failed to update favorite status. Please try again.',
        icon: 'error',
        background: '#232042',
        color: '#ffffff',
        confirmButtonColor: '#8b5cf6',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        customClass: {
          popup: 'colored-toast'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full bg-gradient-to-br from-purple-400/10 to-blue-400/10 border-b border-[#232042] mb-3 py-5">
      <div className="flex flex-col gap-6 px-4">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Details and Heart Icon for Desktop */}
          <div className="flex-1 flex flex-col md:flex-row gap-8">
            {/* Channel Details */}
            <div className="flex-1 flex flex-col gap-2 items-center md:items-start">
              {/* Title Section with Heart Icon (Mobile Only) */}
              <div className="flex flex-col items-center md:items-start w-full">
                <div className="flex items-center justify-center md:justify-start gap-2 w-full">
                  <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-2">
                    {channelData.results?.channel_id || "Unknown Channel"}
                  </h1>
                  {/* Heart Icon Button - Mobile View Only */}
                  <button
                    onClick={handleFavoriteClick}
                    disabled={isLoading}
                    className={`md:hidden focus:outline-none transition-all duration-300 hover:scale-110 flex-shrink-0 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {isLoading ? (
                      <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                    ) : isFavorite ? (
                      <FaHeart className="text-red-500" size={24} />
                    ) : (
                      <FaRegHeart className="text-gray-400" size={24} />
                    )}
                  </button>
                </div>
              </div>

              <a
                href={`https://t.me/${channelData.results?.channel_id}`}
                className="text-blue-400 hover:underline text-base mb-2 flex items-center gap-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaTelegram className="w-4 h-4 text-blue-500 flex-shrink-0" />
                @{channelData.results?.channel_id || "Unknown"} - Telegram Channel
              </a>

              {/* Analysis Dates */}
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-400">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span>📅 Analysis Start Date:</span>
                    <span className="text-white">
                      {channelData.results?.Overall?.start_date
                        ? new Date(
                          channelData.results.Overall.start_date
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                        : "Not available"}
                    </span>
                  </div>
                </div>
                {/* <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span>🔄 Last Message Date:</span>
                    <span className="text-white">
                      {channelData.results?.Overall?.end_date
                        ? new Date(
                          channelData.results.Overall.end_date
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                        : "Not available"}
                    </span>
                  </div>
                </div> */}
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <span>🔄 Last System Updated:</span>
                    <span className="text-white">
                      {channelData.results?.last_updated
                        ? new Date(channelData.results.last_updated).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          timeZone: "UTC",
                        })
                        : "Not available"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Counts */}
              {/* <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-400 mt-3">
                <div className="flex items-center gap-2">
                  <span>📊 Total Posts:</span>
                  <span className="text-white font-semibold">
                    {(channelData.results?.total_records || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>₿ Crypto Related Posts:</span>
                  <span className="text-white font-semibold">
                    {(channelData.results?.crypto_related || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🪙 Total Coins Analyzed:</span>
                  <span className="text-white font-semibold">
                    {(channelData.results?.Overall?.total_coins || 0).toLocaleString()}
                  </span>
                </div>
              </div> */}

              {/* Sentiment Distribution */}
              {/* <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-400 mt-2">
                <div className="flex items-center gap-2">
                  <span>📈 Bullish Calls:</span>
                  <span className="text-green-400 font-semibold">
                    {(channelData.results?.Overall?.bullish_count || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📉 Bearish Calls:</span>
                  <span className="text-red-400 font-semibold">
                    {(channelData.results?.Overall?.bearish_count || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>➖ Neutral Calls:</span>
                  <span className="text-gray-400 font-semibold">
                    {(channelData.results?.Overall?.neutral_count || 0).toLocaleString()}
                  </span>
                </div>
              </div> */}
            </div>

            {/* Heart Icon for Desktop View */}
            <div className="hidden md:flex flex-col items-center md:items-end relative">
              <div className="flex flex-col items-center gap-2">
                {/* Heart Icon Button - Desktop View Only */}
                <button
                  onClick={handleFavoriteClick}
                  disabled={isLoading}
                  className={`focus:outline-none transition-all duration-300 hover:scale-110 flex-shrink-0 p-3 rounded-full bg-white/5 border border-gray-600 hover:bg-white/10 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {isLoading ? (
                    <div className="animate-spin w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  ) : isFavorite ? (
                    <FaHeart className="text-red-500" size={32} />
                  ) : (
                    <FaRegHeart className="text-gray-400" size={32} />
                  )}
                </button>
                <span className="text-sm text-gray-400">
                  {isLoading ? "Processing..." : isFavorite ? "Added to Favorites" : "Add to Favorites"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}