"use client";

import YoutubeTelegramDataTableGuage from "../components/YoutubeTelegramDataTableGuage";
import InfluencerFlashCard from "../components/InfluencerFlashCard";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [influencerData, setInfluencerData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    setIsLoggedIn(!!accessToken);
    fetchInfluencerData();
  }, []);

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

      // Step 3: Fetch detailed channel data (both full data and specific fields)
      const detailedDataPromises = [];
      const moonshotDataPromises = [];

      if (youtube1hChannelId) {
        detailedDataPromises.push(
          fetch(`/api/admin/influenceryoutubedata/channel/${youtube1hChannelId}`).then(res => res.json())
        );
        moonshotDataPromises.push(
          fetch(`/api/youtube-specific-fields?channel_id=${youtube1hChannelId}&fields=score.moonshots.yearly&fields=score.moonshots.overall`).then(res => res.json())
        );
      }

      if (youtube24hChannelId) {
        detailedDataPromises.push(
          fetch(`/api/admin/influenceryoutubedata/channel/${youtube24hChannelId}`).then(res => res.json())
        );
        moonshotDataPromises.push(
          fetch(`/api/youtube-specific-fields?channel_id=${youtube24hChannelId}&fields=score.moonshots.yearly&fields=score.moonshots.overall`).then(res => res.json())
        );
      }

      if (telegram7dChannelId) {
        detailedDataPromises.push(
          fetch(`/api/admin/influencertelegramdata/channel/${telegram7dChannelId}`).then(res => res.json())
        );
        moonshotDataPromises.push(
          fetch(`/api/telegram-specific-fields?channel_id=${telegram7dChannelId}&fields=score.moonshots.yearly&fields=score.moonshots.overall`).then(res => res.json())
        );
      }

      const [detailedData, moonshotData] = await Promise.all([
        Promise.all(detailedDataPromises),
        Promise.all(moonshotDataPromises)
      ]);

      console.log('Detailed Influencer Data (raw):', detailedData);
      console.log('Moonshot Data (raw):', moonshotData);

      // Extract results from API response and merge with moonshot data
      const extractedData = detailedData.map((response, index) => {
        let channelData;
        if (response?.success && response?.results) {
          channelData = response.results;
        } else {
          channelData = response;
        }

        // Merge moonshot data if available
        if (moonshotData[index]?.success && moonshotData[index]?.results?.[0]) {
          const moonshotInfo = moonshotData[index].results[0];
          channelData.moonshotData = {
            yearly: moonshotInfo['score.moonshots.yearly'],
            overall: moonshotInfo['score.moonshots.overall']
          };
        }

        return channelData;
      }).filter(Boolean);

      console.log('Extracted Influencer Data with Moonshot:', extractedData);
      setInfluencerData(extractedData);
    } catch (error) {
      console.error('Error fetching influencer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaderboardClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push('/login?signup=true');
    }
  };

  const handleViewFullClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push('/login?signup=true');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Backtested. Verified. Trusted.
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            World&apos;s only trust engine to navigate crypto investors through the noise of social media.
          </h2>
          <div className="text-base md:text-lg text-gray-700 max-w-4xl mx-auto mb-8 space-y-4">
            <p>
              <strong>Social Media moves markets</strong>, we create accountability by turning social buzz into measurable trust.
            </p>
            <p>
              We back test every recommendation to give a real trust rating, ROI & win rate of individual social media influencers.
            </p>
            <p className="text-base md:text-lg text-gray-700 max-w-4xl mx-auto mb-8 space-y-4">
              With Transparent methodology and audit trail
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="/login?signup=true" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Start Free Trial
            </a>
            <Link
              href="/influencers"
              onClick={handleLeaderboardClick}
              className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border border-gray-200 cursor-pointer"
            >
              Live Leaderboard
            </Link>
          </div>
        </div>

        {/* Stats Cards - 4 square tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-6 h-6 text-blue-600" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1 text-center">100</div>
            <div className="text-sm text-gray-600 text-center font-semibold">Total Influencers</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-6 h-6 text-purple-600" aria-hidden="true">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1 text-center">18,492</div>
            <div className="text-sm text-gray-600 text-center font-semibold">Calls Tracked & Tested</div>
            <div className="text-xs text-gray-500 text-center mt-1">(+3 years)</div>
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
            <div className="text-sm text-gray-600 text-center font-semibold">Youtube, Telegram, Twitter(Coming Soon)</div>
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
            <div className="text-3xl font-bold text-gray-900 mb-1 text-center">17,000</div>
            <div className="text-sm text-gray-600 text-center font-semibold">Coins Covered</div>
          </div>
        </div>

        {/* Section Title and Description */}
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            View Top Crypto Influencers
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Trust is the real Alpha. Track ROI, win rate and trust scores with our comprehensive analytics and Influencer dashboard
          </p>
        </div>

        {/* Influencer Flash Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading influencer data...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {influencerData.length > 0 ? (
              influencerData.map((influencer, index) => (
                <InfluencerFlashCard
                  key={index}
                  data={influencer}
                  rank={index + 1}
                  isLoggedIn={isLoggedIn}
                  onViewFull={handleViewFullClick}
                />
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-600">No influencer data available</div>
            )}
          </div>
        )}

        {/* YouTube Telegram Data Table Guage Component */}
        <div className="mt-16">
          <YoutubeTelegramDataTableGuage />
        </div>
      </div>
    </div>
  );
}
