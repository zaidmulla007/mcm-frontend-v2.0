"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { useCoinsLivePrice } from "@/hooks/useCoinsLivePrice";

export default function PostsPage() {
  const router = useRouter();
  const [postsData, setPostsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coinSymbols, setCoinSymbols] = useState([]);

  // Use live price hook for coins mentioned in posts
  const { coinsLiveData, isConnected } = useCoinsLivePrice(coinSymbols);

  // Create a live prices map that updates when coinsLiveData changes
  const livePricesMap = useMemo(() => {
    const pricesMap = {};
    coinsLiveData.forEach(coin => {
      pricesMap[coin.symbol.toUpperCase()] = coin.price;
    });
    return pricesMap;
  }, [coinsLiveData]);

  const livePriceChangesMap = useMemo(() => {
    const changesMap = {};
    coinsLiveData.forEach(coin => {
      changesMap[coin.symbol.toUpperCase()] = coin.priceChange24h;
    });
    return changesMap;
  }, [coinsLiveData]);

  // Fetch posts data from API
  useEffect(() => {
    const fetchPostsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/admin/strategyyoutubedata/last-posts');
        const data = await response.json();

        if (data.success) {
          setPostsData(data);
        } else {
          setError("Failed to fetch posts data");
        }
      } catch (err) {
        setError("Failed to fetch posts data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPostsData();
  }, []);

  // Helper function to get live price
  const getLivePrice = useCallback((symbol) => {
    if (!symbol) return "N/A";
    const upperSymbol = symbol.toUpperCase();
    const livePrice = livePricesMap[upperSymbol];
    if (livePrice && livePrice !== "-") {
      return typeof livePrice === 'number' ? livePrice : parseFloat(livePrice);
    }
    return "N/A";
  }, [livePricesMap]);

  const getLivePriceChange = useCallback((symbol) => {
    if (!symbol) return null;
    const upperSymbol = symbol.toUpperCase();
    const priceChange = livePriceChangesMap[upperSymbol];
    return priceChange || null;
  }, [livePriceChangesMap]);

  // Get posts with memoization
  const posts = useMemo(() => {
    if (!postsData || !postsData.results) return [];
    return postsData.results;
  }, [postsData]);

  // Update coinSymbols when posts change (collect all unique coin symbols)
  useEffect(() => {
    const symbols = new Set();
    posts.forEach(post => {
      if (post.mentioned && Array.isArray(post.mentioned)) {
        post.mentioned.forEach(coin => {
          if (coin.symbol) {
            symbols.add(coin.symbol);
          }
        });
      }
    });
    setCoinSymbols(Array.from(symbols));
  }, [posts]);

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  // Helper function to get sentiment color
  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'text-gray-500';
    const lower = sentiment.toLowerCase();
    if (lower.includes('bullish')) return 'text-green-600';
    if (lower.includes('bearish')) return 'text-red-600';
    return 'text-gray-500';
  };

  // Helper function to get sentiment icon
  const getSentimentIcon = (sentiment) => {
    if (!sentiment) return null;
    const lower = sentiment.toLowerCase();
    if (lower.includes('bullish')) return <FaArrowUp className="inline text-xs" />;
    if (lower.includes('bearish')) return <FaArrowDown className="inline text-xs" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans mt-5">
      <main className="mx-auto px-4 pb-8">
        <div className="min-w-0">
          {/* Posts Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* View Mode Toggle Buttons */}
            <div className="flex justify-center items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/influencer-search")}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Influencers
                </button>
                <button
                  onClick={() => router.push("/coins")}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Coins
                </button>
                <button
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                >
                  Publish Posts
                </button>
              </div>
            </div>

            {/* Metadata */}
            {postsData && postsData.metadata && (
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-6 text-xs text-black">
                  <span>
                    <strong>Last Updated:</strong> {formatDate(postsData.metadata.lastUpdatedDate)} at {formatTime(postsData.metadata.lastUpdatedTime)}
                  </span>
                  <span>
                    <strong>Next Update:</strong> {formatDate(postsData.metadata.nextUpdateDate)} at {formatTime(postsData.metadata.nextUpdateTime)}
                  </span>
                  <span>
                    <strong>Total Posts:</strong> {postsData.count}
                  </span>
                </div>
              </div>
            )}

            {/* Posts List */}
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="px-6 py-12 text-center text-red-600">
                  {error}
                </div>
              ) : posts.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  No posts available
                </div>
              ) : (
                posts.map((post, index) => (
                  <div key={`${post.type}-${post.messageID || post.telegram_oid}-${index}`} className="p-4 hover:bg-gray-50">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${post.type === 'telegram' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {post.type.toUpperCase()}
                        </span>
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                          {post.type === 'youtube' ? post.channel_name : post.channelID}
                        </a>
                        <span className="text-xs text-black">
                          {formatDate(post.date)} at {formatTime(post.time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-black">
                          Rank {post.rank}
                        </span>
                        <span className="text-xs font-semibold text-black">
                          Score: {post.final_score?.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    {/* Summary */}
                    {post.summary && (
                      <div className="mb-3">
                        <p className="text-sm text-black leading-relaxed">
                          {post.summary}
                        </p>
                      </div>
                    )}

                    {/* Mentioned Coins */}
                    {post.mentioned && post.mentioned.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {post.mentioned.map((coin, coinIdx) => {
                            const currentPrice = getLivePrice(coin.symbol);
                            const priceChangePercent = getLivePriceChange(coin.symbol);

                            return (
                              <div
                                key={`${coin.symbol}-${coinIdx}`}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                              >
                                {coin.image_thumb && (
                                  <img
                                    src={coin.image_thumb}
                                    alt={coin.symbol}
                                    className="w-6 h-6 rounded-full"
                                  />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-black">{coin.symbol}</span>
                                    <span className={`text-xs font-semibold ${getSentimentColor(coin.sentiment)}`}>
                                      {getSentimentIcon(coin.sentiment)} {coin.sentiment}
                                    </span>
                                    {coin.outlook && (
                                      <span className="text-xs text-black">({coin.outlook})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-semibold text-blue-600">
                                      {(() => {
                                        if (currentPrice === 'N/A') return 'N/A';
                                        const value = typeof currentPrice === 'number' ? currentPrice : parseFloat(currentPrice);
                                        if (isNaN(value)) return 'N/A';

                                        if (Math.abs(value) >= 1000) {
                                          return `$${Math.round(value).toLocaleString('en-US')}`;
                                        }

                                        return `$${value.toLocaleString('en-US', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 8
                                        })}`;
                                      })()}
                                    </span>
                                    {priceChangePercent !== null && (
                                      <span className={`text-xs font-semibold ${parseFloat(priceChangePercent) > 0
                                          ? 'text-green-600'
                                          : parseFloat(priceChangePercent) < 0
                                            ? 'text-red-600'
                                            : 'text-black'
                                        }`}>
                                        ({parseFloat(priceChangePercent) > 0 ? '+' : ''}{priceChangePercent}%)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Scores */}
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="text-black">
                        View on Coins: {post.viewOnCoins}/5
                      </span>
                      <span className="text-black">
                        Recommendations:{post.recommendations}/10
                      </span>
                      <span className="text-black">
                        Risk Management: {post.riskManagement}/10
                      </span>
                      <span className="text-black">
                        Overall: {post.overallScore}/10
                      </span>
                      <span className="text-black">
                        Exit Strategy: {post.exitStrategyScore}/10
                      </span>
                      <span className="text-black">
                        Educational: {post.educationalPurpose}/10
                      </span>
                      <span className="text-black">
                        Actionable: {post.actionableInsights}/10
                      </span>
                      <span className="text-black">
                        Clarity: {post.clarityOfAnalysis}/10
                      </span>
                      <span className="text-black">
                        Credibility: {post.credibilityScore}/10
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
