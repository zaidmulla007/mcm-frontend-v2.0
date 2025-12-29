"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { FaArrowLeft, FaYoutube, FaGlobe, FaHeart, FaUsers, FaCoins } from "react-icons/fa";
import { FaTelegram } from "react-icons/fa";
import Swal from "sweetalert2";
import { useFavorites } from "../contexts/FavoritesContext";

const tabs = [
  {
    label: "Influencers",
    value: "influencers",
    icon: <FaUsers className="text-xl" />
  },
  {
    label: "Coins",
    value: "coins",
    icon: <FaCoins className="text-xl" />
  },
];

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState("influencers");
  const [favoritesData, setFavoritesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [binancePrices, setBinancePrices] = useState({});
  const itemsPerPage = 9;
  const { removeFavorite } = useFavorites();
  const wsRef = useRef(null);

  useEffect(() => {
    fetchFavoritesData();
  }, []);

  // Set up WebSocket for live prices when coins tab is active
  useEffect(() => {
    if (activeTab !== 'coins' || !favoritesData.length) return;

    const coins = favoritesData.filter(fav => fav.medium === "CRYPTO" && fav.favouriteType === "COIN");
    if (coins.length === 0) return;

    // Get symbols for WebSocket
    const symbols = coins
      .map(fav => fav.coin?.symbol?.toUpperCase())
      .filter(Boolean)
      .map(sym => `${sym}USDT`);

    if (symbols.length === 0) return;

    // Fetch initial snapshot
    fetchBinanceSnapshot(symbols);

    // Open WebSocket for live updates
    openBinanceWebSocket(symbols);

    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) { }
        wsRef.current = null;
      }
    };
  }, [activeTab, favoritesData]);

  // Fetch initial Binance snapshot
  async function fetchBinanceSnapshot(symbols) {
    try {
      const q = `?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr${q}`);
      const data = await response.json();

      const priceMap = {};
      data.forEach(ticker => {
        const symbol = ticker.symbol.replace('USDT', '').toLowerCase();
        priceMap[symbol] = {
          lastPrice: parseFloat(ticker.lastPrice),
          priceChangePercent: parseFloat(ticker.priceChangePercent)
        };
      });

      setBinancePrices(priceMap);
    } catch (error) {
      console.error('Error fetching Binance snapshot:', error);
    }
  }

  // Open WebSocket for live price updates
  function openBinanceWebSocket(symbols) {
    if (!symbols || symbols.length === 0) return;

    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const data = msg.data ?? msg;
          const sym = data.s; // BTCUSDT
          if (!sym) return;

          const base = sym.replace(/USDT$/i, '').toLowerCase();
          const payload = {
            lastPrice: data.c !== undefined ? Number(data.c) : null,
            priceChangePercent: data.P !== undefined ? Number(data.P) : null,
          };

          setBinancePrices(prev => ({
            ...prev,
            [base]: payload
          }));
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      ws.onerror = (err) => console.error('Binance WebSocket error:', err);
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }
  }

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

  const getFilteredInfluencers = () => {
    // Filter only influencers (YOUTUBE and TELEGRAM)
    return favoritesData
      .filter(fav =>
        (fav.medium === "YOUTUBE" || fav.medium === "TELEGRAM") &&
        fav.channel &&
        fav.channel.length > 0
      )
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

  const getFilteredCoins = () => {
    // Filter only coins (CRYPTO medium)
    return favoritesData
      .filter(fav => fav.medium === "CRYPTO" && fav.favouriteType === "COIN")
      .map(fav => {
        // Handle coin data - it's an object, not an array
        const coinData = fav.coin;

        console.log('Coin Data:', coinData); // Debug log
        console.log('Binance Prices:', binancePrices); // Debug log

        // Get Binance data for this coin
        const symbol = coinData?.symbol?.toLowerCase() || "";
        const binanceData = binancePrices[symbol] || null;

        console.log('Symbol:', symbol, 'Binance Data:', binanceData); // Debug log

        // Format name: First letter capital, rest lowercase
        const formatName = (name) => {
          if (!name) return "Unknown";
          return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        };

        // Format symbol: First letter capital, rest lowercase
        const formatSymbol = (sym) => {
          if (!sym) return "?";
          return sym.charAt(0).toUpperCase() + sym.slice(1).toLowerCase();
        };

        return {
          id: fav.favouriteId,
          source_id: fav.favouriteId,
          name: formatName(coinData?.name || fav.name),
          symbol: formatSymbol(coinData?.symbol),
          image: coinData?.image_large || coinData?.image_small || coinData?.image_thumb || "",
          current_price: binanceData?.lastPrice || coinData?.end_timestamp_price || 0,
          price_change_24h: binanceData?.priceChangePercent || 0,
          market_cap: coinData?.market_cap_usd || 0,
          market_cap_rank: coinData?.market_cap_rank || null,
          hasBinanceData: !!binanceData, // Debug flag
        };
      });
  };

  const filteredInfluencers = getFilteredInfluencers();
  const filteredCoins = getFilteredCoins();
  const filteredData = activeTab === "influencers" ? filteredInfluencers : filteredCoins;

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

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Handle remove from favorites (influencers)
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

  // Handle remove coin from favorites
  const handleRemoveCoinFavorite = async (coinId) => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Remove from Favorites?',
      text: 'Do you want to remove this coin from your favorites?',
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
      // Get userId from localStorage
      const userData = localStorage.getItem('userData');
      if (!userData) {
        throw new Error('User not logged in');
      }

      const user = JSON.parse(userData);
      const userId = user._id || user.id;

      const payload = {
        op: 'DEL',
        medium: 'CRYPTO',
        userId: userId,
        favouriteId: coinId,
        favouriteType: 'COIN'
      };

      const response = await fetch('/api/proxy/favorites/toggleFavourite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
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
        throw new Error(data.message || 'Failed to remove favorite');
      }
    } catch (error) {
      console.error("Error removing coin favorite:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 text-gray-900 font-sans pb-16 overflow-x-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <section className="pt-8 pb-6 flex flex-col items-center gap-6">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight drop-shadow-lg">
            <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
              My Favorites
            </span>
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full shadow-lg shadow-indigo-500/50"></div>
        </section>

        {/* Tabs Toggle */}
        <section className="max-w-5xl mx-auto px-4 pb-6">
          <div className="flex justify-center gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 shadow-lg ${activeTab === tab.value
                  ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white shadow-indigo-500/30 scale-105'
                  : 'bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-xl border-2 border-indigo-200/50 hover:border-indigo-400'
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto">
          {activeTab === "influencers" ? (
            // Influencers Tab Content
            loading ? (
              <div className="text-center text-gray-500 py-8">
                Loading influencers...
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : filteredData.length > 0 ? (
              <>
                {/* Influencers Table View */}
                <div className="bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-3xl shadow-2xl shadow-indigo-500/10 border-2 border-white/40 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Influencer Icon</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Influencer Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Platform</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Channel URL</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-100/50">
                        {visibleInfluencers.map((inf, index) => (
                          <tr
                            key={inf.id}
                            className="transition-all duration-300 border-b border-indigo-100/50 bg-gradient-to-r from-indigo-50/20 to-fuchsia-50/20 hover:from-cyan-50/40 hover:via-indigo-50/40 hover:to-fuchsia-50/40 hover:shadow-lg cursor-pointer"
                          >
                            {/* Profile Image */}
                            <td className="px-6 py-4">
                              {inf.channel_thumbnails?.high?.url ? (
                                <div className="w-14 h-14 rounded-full overflow-hidden shadow-lg ring-2 ring-indigo-200/50 ring-offset-2">
                                  <Image
                                    src={inf.channel_thumbnails.high.url}
                                    alt={inf.name || "Channel"}
                                    width={56}
                                    height={56}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-indigo-200/50 ring-offset-2">
                                  {inf.channel_id?.match(/\b\w/g)?.join("") || "?"}
                                </div>
                              )}
                            </td>

                            {/* Name */}
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900">
                                {inf.name?.replace(/_/g, " ") || "Unknown"}
                              </div>
                            </td>

                            {/* Platform */}
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold shadow-md ${inf.platform === "YouTube"
                                ? "bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200"
                                : "bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700 border border-blue-200"
                                }`}>
                                {inf.platform === "YouTube" ? (
                                  <FaYoutube className="mr-1.5" />
                                ) : (
                                  <FaTelegram className="mr-1.5" />
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
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-2 transition-all duration-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaGlobe className="text-sm" />
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
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 text-white text-sm font-bold rounded-lg hover:from-cyan-700 hover:via-indigo-700 hover:to-fuchsia-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                                >
                                  View Dashboard
                                </Link>
                                <button
                                  onClick={() => handleRemoveFavorite(inf.channel_id, inf.platform === "YouTube" ? "YOUTUBE" : "TELEGRAM")}
                                  className="p-2.5 rounded-lg hover:bg-red-50 transition-all duration-200 group"
                                  aria-label="Remove from favorites"
                                >
                                  <FaHeart className="text-red-500 text-xl group-hover:scale-125 transition-transform" />
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
                No favorites found
              </div>
            )
          ) : (
            // Coins Tab Content
            loading ? (
              <div className="text-center text-gray-500 py-8">
                Loading coins...
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : filteredCoins.length > 0 ? (
              <>
                {/* Coins Table View */}
                <div className="bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-md rounded-3xl shadow-2xl shadow-indigo-500/10 border-2 border-white/40 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Coin Icon</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Coin Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Symbol</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Current Price</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">24h Change</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-100/50">
                        {visibleInfluencers.map((coin, index) => (
                          <tr
                            key={coin.id}
                            className="transition-all duration-300 border-b border-indigo-100/50 bg-gradient-to-r from-indigo-50/20 to-fuchsia-50/20 hover:from-cyan-50/40 hover:via-indigo-50/40 hover:to-fuchsia-50/40 hover:shadow-lg cursor-pointer"
                          >
                            {/* Coin Image */}
                            <td className="px-6 py-4">
                              {coin.image ? (
                                <div className="w-14 h-14 rounded-full overflow-hidden shadow-lg ring-2 ring-indigo-200/50 ring-offset-2">
                                  <Image
                                    src={coin.image}
                                    alt={coin.name}
                                    width={56}
                                    height={56}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-indigo-200/50 ring-offset-2">
                                  {coin.symbol?.[0] || "?"}
                                </div>
                              )}
                            </td>

                            {/* Coin Name */}
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900">
                                {coin.name}
                              </div>
                            </td>

                            {/* Symbol */}
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-100 to-fuchsia-50 text-purple-700 border border-purple-200 shadow-md">
                                {coin.symbol}
                              </span>
                            </td>

                            {/* Current Price */}
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {coin.current_price > 0
                                  ? `$${coin.current_price.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: coin.current_price < 1 ? 8 : 2
                                  })}`
                                  : "N/A"
                                }
                              </div>
                            </td>

                            {/* 24h Change */}
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${coin.price_change_24h >= 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                                }`}>
                                {coin.price_change_24h >= 0 ? '+' : ''}{coin.price_change_24h.toFixed(2)}%
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-3">
                                <Link
                                  href={`/coins-list/${coin.source_id}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                  View Details
                                </Link>
                                <button
                                  onClick={() => handleRemoveCoinFavorite(coin.source_id)}
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

                {/* Pagination Controls for Coins */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center mt-8 space-y-4">
                    {/* Pagination Info */}
                    <div className="text-sm text-gray-700 text-center">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalInfluencers)} of {totalInfluencers} coins
                    </div>

                    {/* Mobile Pagination */}
                    <div className="flex sm:hidden items-center justify-center space-x-1 w-full">
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
                      <div className="flex items-center space-x-2 px-2">
                        <span className="text-xs text-gray-600">Page</span>
                        <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded text-xs font-medium">
                          {currentPage}
                        </span>
                        <span className="text-xs text-gray-600">of {totalPages}</span>
                      </div>
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

                    {/* Desktop Pagination */}
                    <div className="hidden sm:flex items-center space-x-1 md:space-x-2 flex-wrap justify-center">
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
                No favorite coins found
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}