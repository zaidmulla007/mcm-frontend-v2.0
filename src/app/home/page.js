"use client";

import YoutubeTelegramDataTableGuage from "../components/YoutubeTelegramDataTableGuage";
import InfluencerFlashCard from "../components/InfluencerFlashCard";
import TestimonialsSection from "../components/TestimonialsSection";
import YouTubeTelegramDataTable from "../components/YouTubeTelegramDataTable";
import YouTubeTelegramDataTableStack from "../components/YoutubeTelegramDataTableStack";
import YouTubeTelegramDataTableMatrix from "../components/YoutubeTelegramDataTableMatrix";
import YouTubeTelegramDataTableChips from "../components/YoutubeTelegramDataTableChips";
import YouTubeTelegramDataSparklines from "../components/YouTubeTelegramDataTableSparklines";
import CTASection from "../components/CTASection";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useAnimationControls } from "framer-motion";
import { useTop10LivePrice } from "../livePriceTop10";
import { useTimezone } from "../contexts/TimezoneContext";

export default function HomePage() {
  const router = useRouter();
  const { top10Data, isConnected } = useTop10LivePrice();
  const { useLocalTime } = useTimezone();
  const scrollingData = [...top10Data, ...top10Data];
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [influencerData, setInfluencerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countsData, setCountsData] = useState(null);
  const [countsLoading, setCountsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimationControls();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    setIsLoggedIn(!!accessToken);
    fetchInfluencerData();
    fetchCountsData();
  }, []);

  const fetchCountsData = async () => {
    try {
      setCountsLoading(true);
      const response = await fetch('/api/landing-counts');
      const result = await response.json();

      if (result.success && result.data) {
        setCountsData({
          totalInfluencers: result.data.totalInfluencers,
          callsTrackedTested: result.data.callsTrackedTested,
          coinsCovered: result.data.coinsCovered
        });
      }
    } catch (error) {
      console.error('Error fetching counts data:', error);
    } finally {
      setCountsLoading(false);
    }
  };

  const fetchInfluencerData = async () => {
    try {
      setLoading(true);

      // Step 1: Get rank 1 influencers from each API
      const [youtube1hRank, youtube24hRank, telegram7dRank] = await Promise.all([
        fetch('/api/youtube-data?sentiment=all&timeframe=1_hour&type=overall&year=all&quarter=all').then(res => res.json()),
        fetch('/api/youtube-data?sentiment=all&timeframe=24_hours&type=overall&year=all&quarter=all').then(res => res.json()),
        fetch('/api/telegram-data?sentiment=all&timeframe=7_days&type=overall&year=all&quarter=all').then(res => res.json())
      ]);

      // Step 2: Extract channel IDs from rank 1 results
      const youtube1hChannelId = youtube1hRank.results?.[0]?.channel_id;
      const youtube24hChannelId = youtube24hRank.results?.[0]?.channel_id;
      const telegram7dChannelId = telegram7dRank.results?.[0]?.channel_id;

      // Step 3: Collect all YouTube and Telegram channel IDs
      const youtubeChannelIds = [youtube1hChannelId, youtube24hChannelId].filter(Boolean);
      const telegramChannelIds = [telegram7dChannelId].filter(Boolean);

      // Step 4: Fetch data using batch APIs (influencer data + moonshot data + star rating)
      const fetchPromises = [];

      if (youtubeChannelIds.length > 0) {
        fetchPromises.push(
          fetch(`/api/admin/influenceryoutubedata/specificFieldsInfluencers?channel_id=${youtubeChannelIds.join(',')}&fields=Yearly,subscriber_count,channel_thumbnails`)
            .then(res => res.json())
        );

        // Batch API call for YouTube moonshots and star ratings
        fetchPromises.push(
          fetch(`/api/admin/rankingsyoutubedata/specificFieldRankings?channel_id=${youtubeChannelIds.join(',')}&fields=score.moonshots.yearly,star_rating`)
            .then(res => res.json())
        );
      }

      if (telegramChannelIds.length > 0) {
        fetchPromises.push(
          fetch(`/api/admin/influencertelegramdata/specificFieldsInfluencers?channel_id=${telegramChannelIds.join(',')}&fields=Yearly,subscriber_count`)
            .then(res => res.json())
        );

        // Batch API call for Telegram moonshots and star ratings
        fetchPromises.push(
          fetch(`/api/admin/rankingstelegramdata/specificFieldRankings?channel_id=${telegramChannelIds.join(',')}&fields=score.moonshots.yearly,star_rating`)
            .then(res => res.json())
        );
      }

      const results = await Promise.all(fetchPromises);

      // Step 5: Process and combine results
      const extractedData = [];
      let resultIndex = 0;

      // Process YouTube data
      if (youtubeChannelIds.length > 0) {
        const youtubeData = results[resultIndex];
        resultIndex += 1;

        // Get rankings data (moonshots + star rating) for YouTube channels
        const youtubeRankingsData = results[resultIndex];
        resultIndex += 1;

        if (youtubeData?.success && youtubeData?.results) {
          youtubeChannelIds.forEach((channelId) => {
            const channelData = youtubeData.results.find(r => r.channel_id === channelId);
            if (channelData) {
              // Merge rankings data (moonshots + star rating) if available
              if (youtubeRankingsData?.success && youtubeRankingsData?.results) {
                const rankingsInfo = youtubeRankingsData.results.find(r => r.channel_id === channelId);
                if (rankingsInfo) {
                  channelData.moonshotData = rankingsInfo['score.moonshots.yearly'];
                  channelData.star_rating = rankingsInfo.star_rating;
                }
              }
              extractedData.push(channelData);
            }
          });
        }
      }

      // Process Telegram data
      if (telegramChannelIds.length > 0) {
        const telegramData = results[resultIndex];
        resultIndex += 1;

        // Get rankings data (moonshots + star rating) for Telegram channels
        const telegramRankingsData = results[resultIndex];
        resultIndex += 1;

        if (telegramData?.success && telegramData?.results) {
          telegramChannelIds.forEach((channelId) => {
            const channelData = telegramData.results.find(r => r.channel_id === channelId);
            if (channelData) {
              // Merge rankings data (moonshots + star rating) if available
              if (telegramRankingsData?.success && telegramRankingsData?.results) {
                const rankingsInfo = telegramRankingsData.results.find(r => r.channel_id === channelId);
                if (rankingsInfo) {
                  channelData.moonshotData = rankingsInfo['score.moonshots.yearly'];
                  channelData.star_rating = rankingsInfo.star_rating;
                }
              }
              extractedData.push(channelData);
            }
          });
        }
      }

      setInfluencerData(extractedData);
    } catch (error) {
      console.error('Error fetching influencer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push('/login?signup=true');
    }
  };

  // Get the width of one loop of scrolling data
  const getLoopWidth = () => {
    if (!scrollContainerRef.current) return 0;
    const firstItem = scrollContainerRef.current.querySelector('.price-item');
    if (!firstItem) return 0;
    return firstItem.offsetWidth * scrollingData.length;
  };

  // Handle mouse wheel scroll with infinite loop
  const handleWheel = (e) => {
    e.preventDefault();
    const currentX = x.get();
    const newX = currentX - e.deltaY;
    const loopWidth = getLoopWidth();

    // Wrap around for infinite scroll
    if (newX < -loopWidth) {
      x.set(newX + loopWidth);
    } else if (newX > 0) {
      x.set(newX - loopWidth);
    } else {
      x.set(newX);
    }
  };

  // Handle drag
  const handleDrag = (event, info) => {
    const loopWidth = getLoopWidth();
    const currentX = x.get();

    // Wrap around during drag
    if (currentX < -loopWidth) {
      x.set(currentX + loopWidth);
    } else if (currentX > 0) {
      x.set(currentX - loopWidth);
    }
  };

  // Auto-scroll animation
  useEffect(() => {
    if (isPaused || isDragging) {
      controls.stop();
      return;
    }

    const loopWidth = getLoopWidth();
    if (loopWidth === 0) return;

    const animate = async () => {
      const currentX = x.get();
      await controls.start({
        x: currentX - loopWidth,
        transition: {
          duration: 60,
          ease: "linear",
        },
      });
      x.set(0);
      animate();
    };

    animate();

    return () => controls.stop();
  }, [isPaused, isDragging, scrollingData, controls, x]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Backtested. Verified. Trusted.
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl lg:text-2xl font-bold text-gray-900 mb-6 md:whitespace-nowrap">World&apos;s only Platform to navigate crypto investors through the noise of social media</h2>
          <div className="text-base md:text-lg text-gray-700 mx-auto mb-8 space-y-4">
            <p className="md:whitespace-nowrap">
              <strong>Social Media moves markets</strong>, we create accountability by turning social buzz into measurable trust
            </p>
            <p className="md:whitespace-nowrap">
              We backtest every recommendation to give a trust rating, ROI & win rate of individual social media influencers
            </p>
            <p className="md:whitespace-nowrap">
              With Transparent methodology and audit trail
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="/login?signup=true" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold text-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Start Free Trial
            </a>
          </div>
        </div>

        {/* Stats Cards - 4 square tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mx-auto mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-6 h-6 text-blue-600" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1 text-center">
              {countsLoading ? 'Loading...' : `${countsData?.totalInfluencers || 0}+`}
            </div>
            <div className="text-sm text-gray-600 text-center font-semibold">Total Influencers</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-6 h-6 text-purple-600" aria-hidden="true">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1 text-center">
              {countsLoading ? 'Loading...' : `${countsData?.callsTrackedTested?.toLocaleString('en-US') || 0}+`}
            </div>
            <div className="text-sm text-gray-600 text-center font-semibold">Calls Tracked & Tested</div>
            <div className="text-sm text-gray-600 text-center font-semibold">for 3+ years</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-radio w-6 h-6 text-green-600" aria-hidden="true">
                <circle cx="12" cy="12" r="2"></circle>
                <path d="M4.93 19.07a10 10 0 0 1 0-14.14"></path>
                <path d="M7.76 16.24a6 6 0 0 1 0-8.49"></path>
                <path d="M16.24 7.76a6 6 0 0 1 0 8.49"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1 text-center">Live Tracking</div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              {/* YouTube Icon */}
              <svg className="w-5 h-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span className="text-md font-bold">•</span>
              {/* Telegram Icon */}
              <svg className="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              <span className="text-md font-bold">•</span>
              {/* Twitter Icon (Coming Soon - Grayed out) */}
              <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-xs text-gray-500">(Coming Soon)</span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coins w-6 h-6 text-orange-600" aria-hidden="true">
                <circle cx="8" cy="8" r="6"></circle>
                <path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path>
                <path d="M7 6h1v4"></path>
                <path d="m16.71 13.88.7.71-2.82 2.82"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1 text-center">
              {countsLoading ? 'Loading...' : `${countsData?.coinsCovered?.toLocaleString('en-US') || 0}+`}
            </div>
            <div className="text-sm text-gray-600 text-center font-semibold">Coins Covered</div>
          </div>
        </div>

        {/* Section Title and Description */}
        <div className="text-center mb-12 mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            View Top Crypto Influencers
          </h2>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const userData = localStorage.getItem('userData');
              if (userData) {
                window.location.href = '/influencer-search';
              } else {
                window.location.href = '/login?signup=true';
              }
            }}
            className="inline-block bg-green-500 text-white px-8 py-3 rounded-lg font-semibold text-2xl md:text-3xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 mb-6"
          >
            Live Leaderboard
          </button>

          <p className="text-md text-gray-600 leading-relaxed">
            Trust is the real Alpha. Track ROI, win rate, and trust scores with our
            comprehensive analytics and Influencer dashboard.
          </p>
        </div>

        {/* Influencer Flash Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading influencer data...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-auto">
            {influencerData.length > 0 ? (
              influencerData.map((influencer, index) => {
                // Define rank labels for each card
                const rankLabels = ['Rank #1hr', 'Rank #24hrs', 'Rank #7days'];
                const channelId = influencer?.id || influencer?.channel_id || influencer?.channelId || `influencer-${index}`;
                return (
                  <InfluencerFlashCard
                    key={channelId}
                    data={influencer}
                    rank={index + 1}
                    rankLabel={rankLabels[index]}
                    isLoggedIn={isLoggedIn}
                    onViewFull={handleViewFullClick}
                  />
                );
              })
            ) : (
              <div className="col-span-3 text-center text-gray-600">No influencer data available</div>
            )}
          </div>
        )}

        {/* YouTube Telegram Data Table Guage Component */}
        <div className="mt-16">
          <YouTubeTelegramDataTable useLocalTime={useLocalTime} />
        </div>

        <div className="mt-16">
          <YouTubeTelegramDataTableStack useLocalTime={useLocalTime} />
        </div>
        <div className="mt-16">
          <YouTubeTelegramDataSparklines useLocalTime={useLocalTime} />
        </div>
        <div className="mt-16">
          <YouTubeTelegramDataTableChips useLocalTime={useLocalTime} />
        </div>
        <div className="mt-16">
          <YouTubeTelegramDataTableMatrix useLocalTime={useLocalTime} />
        </div>

        {/* Influencer Flash News Text */}
        <h2 className="text-center text-gray-900 text-2xl font-bold mb-0 mt-10">
          Live Prices <span className="text-gray-600 text-sm">(Source Binance)</span>

        </h2>
        <h2 className="text-center text-gray-900 text-2xl font-bold mb-3 mt-0">
          <span className="text-gray-600 text-sm">(Price change percentage in last 24 hours)</span>
        </h2>

        {/* Influencer News Scroller Container */}
        <div
          ref={scrollContainerRef}
          className="relative h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl border border-blue-200 overflow-hidden shadow-2xl mb-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onWheel={handleWheel}
        >
          {/* Continuous Left-to-Right Scrolling News */}
          <div className="absolute inset-0 flex items-center">
            <motion.div
              drag="x"
              dragConstraints={false}
              dragElastic={0}
              dragMomentum={false}
              onDrag={handleDrag}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              style={{ x }}
              animate={controls}
              className="flex whitespace-nowrap cursor-grab active:cursor-grabbing"
            >
              {[...scrollingData, ...scrollingData, ...scrollingData, ...scrollingData].map((item, index) => (
                <div
                  key={item.symbol + index}
                  className="price-item flex items-center gap-3 px-5 py-3 mx-4 flex-shrink-0"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-purple-600 font-bold text-xs uppercase truncate">
                      {item.symbol}
                    </span>
                    <span className="text-gray-600 text-xs capitalize truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-gray-900 font-bold text-sm whitespace-nowrap">
                      ${typeof item.price === 'number' ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price}
                    </span>
                    <span className={`text-xs font-semibold whitespace-nowrap ${typeof item.priceChange24h === 'number'
                      ? item.priceChange24h >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                      : 'text-gray-500'
                      }`}>
                      {typeof item.priceChange24h === 'number'
                        ? `${item.priceChange24h >= 0 ? '+' : ''}${item.priceChange24h.toFixed(2)}%`
                        : '0.00%'}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Gradient Overlay Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-blue-100 to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-purple-100 to-transparent pointer-events-none"></div>
        </div>

        {/* Testimonials Section */}
        <div className="mt-16">
          <TestimonialsSection />
        </div>

        {/* CTA Section */}
        <div className="mt-16">
          <CTASection />
        </div>
      </div>
    </div>
  );
}
