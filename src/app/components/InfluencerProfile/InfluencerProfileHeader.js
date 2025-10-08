"use client"; // Add this at the top if using Next.js 13+ with app router
import Image from "next/image";
import { FaTrophy, FaHeart, FaRegHeart } from "react-icons/fa";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { favoritesAPI } from "../../api/favorites/route";

export default function InfluencerProfileHeader({ channelData }) {
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
            fav => fav.favouriteId === channelData._id && fav.medium === "YOUTUBE"
          );
          setIsFavorite(isCurrentlyFavorite);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };

    if (channelData?._id && userId) {
      checkFavoriteStatus();
    }
  }, [channelData?._id, userId]);

  const handleFavoriteClick = async () => {
    if (isLoading || !userId) return;
    
    setIsLoading(true);
    const newFavoriteState = !isFavorite;
    
    try {
      const requestData = {
        op: newFavoriteState ? "ADD" : "DEL",
        medium: "YOUTUBE",
        userId: userId,
        favouriteId: channelData._id,
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
          {/* Avatar */}
          {/* <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-4xl font-bold overflow-hidden">
            {channelData.channel_thumbnails?.high?.url ? (
              <Image
                src={channelData.channel_thumbnails.high.url}
                alt={channelData.influencer_name || channelData.channel_title}
                width={112}
                height={112}
                className="rounded-full w-full h-full object-cover"
              />
            ) : (
              (channelData.influencer_name || channelData.channel_title || "U")
                .match(/\b\w/g)
                ?.join("") || "U"
            )}
          </div> */}
          {/* Details and Heart Icon for Desktop */}
          <div className="flex-1 flex flex-col md:flex-row gap-8">
            {/* Channel Details */}
            <div className="flex-1 flex flex-col gap-2 items-center md:items-start">
              {/* Title Section with Heart Icon (Mobile Only) */}
              <div className="flex flex-col items-center md:items-start w-full">
                <div className="flex items-center justify-center md:justify-start gap-2 w-full">
                  <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-2">
                    {channelData.influencer_name ||
                      channelData.channel_title ||
                      "Unknown Channel"}
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
                href={`https://www.youtube.com/channel/${channelData.channel_id}`}
                className="text-blue-400 hover:underline text-base mb-2 flex items-center gap-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0 ml-1"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                {channelData.channel_custom_url || "@Unknown"} -{" "}
                {channelData.subscriber_count
                  ? `${channelData.subscriber_count.toLocaleString()} Subscribers`
                  : "Unknown Subscribers"}
              </a>
              {/* Analysis Dates */}
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-400">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span>📅 Analysis Start Date:</span>
                    <span className="text-white">
                      {channelData.Overall?.start_date
                        ? new Date(
                          channelData.Overall.start_date
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
                    <span>🔄 Influencer Last Video:</span>
                    <span className="text-white">
                      {channelData.Overall?.end_date
                        ? new Date(
                          channelData.Overall.end_date
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
                    <span className="text-white">{channelData.last_updated
                      ? `${new Date(channelData.last_updated).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        timeZone: "UTC",
                      })}`
                      : "Not available"}
                    </span>
                  </div>
                </div>
              </div>
              {/* Video Counts */}
              {/* <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-400 mt-3">
                <div className="flex items-center gap-2">
                  <span>📊 Total No of Videos:</span>
                  <span className="text-white font-semibold">
                    {(channelData.total_records || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>₿ Crypto Related Videos:</span>
                  <span className="text-white font-semibold">
                    {(channelData.crypto_related || 0).toLocaleString()}
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