"use client";

import { useState } from "react";
import { FaYoutube, FaCalendarAlt, FaSync, FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";
import YouTubeTelegramInfluencers from "../components/YouTubeTelegramInfluencers";

export default function RecentActivityTab() {
  // Hardcoded data for recent posts with updated comment format
  const [recentPosts] = useState([
    {
      id: 1,
      title: "Bitcoin Price Analysis - Key Levels to Watch",
      date: "2023-10-15",
      summary: "In this video, I analyze Bitcoin's current price action and identify key support and resistance levels. We're seeing consolidation around $28,000 with important support at $27,500. The RSI indicates neutral momentum, but volume patterns suggest accumulation. I discuss the impact of recent macroeconomic data and potential catalysts that could move BTC in either direction. The overall market structure remains bullish in the longer term, but we need to be cautious of short-term volatility. I also provide insights into Ethereum's performance relative to Bitcoin and what this means for the altcoin market.",
      recommendations: [
        { coin: "BTC", sentiment: "Mild Bullish", },
        { coin: "ETH", sentiment: "Neutral", }
      ],
      videoUrl: "https://www.youtube.com/watch?v=example1",
      outlook: "short term",
      comment: "Education : Clear educational content with minimal hype. Focuses on technical analysis fundamentals."
    },
    {
      id: 2,
      title: "Ethereum Upgrade Analysis - What It Means for Investors",
      date: "2023-10-12",
      summary: "This video covers the latest Ethereum upgrade and its implications for investors. I explain the technical improvements in the upgrade and how they could affect ETH's value proposition. The upgrade enhances scalability and reduces gas fees, which could drive increased adoption. I analyze on-chain metrics showing growing developer activity and rising transaction volumes. However, I also discuss potential risks including regulatory concerns and competition from other layer-1 solutions. The video provides a balanced view of both opportunities and challenges facing Ethereum in the current market environment.",
      recommendations: [
        { coin: "ETH", sentiment: "Strong Bullish", },
        { coin: "ARB", sentiment: "Mild Bullish", }
      ],
      videoUrl: "https://www.youtube.com/watch?v=example2",
      outlook: "medium term",
      comment: "Marketing : Balanced analysis with educational value. Some marketing elements present but well substantiated."
    },
    {
      id: 3,
      title: "Altcoin Season Alert - Coins Positioned for Growth",
      date: "2023-10-10",
      summary: "In this comprehensive analysis, I identify several altcoins that show strong potential for the upcoming market cycle. I focus on projects with solid fundamentals, active development, and growing user bases. The video covers sectors including DeFi, gaming, and infrastructure, with specific coins that have outperformed Bitcoin in recent weeks. I discuss the importance of risk management when investing in altcoins and provide strategies for portfolio allocation. The analysis includes technical patterns, on-chain metrics, and upcoming catalysts that could drive price appreciation.",
      recommendations: [
        { coin: "SOL", sentiment: "Strong Bullish", },
        { coin: "AVAX", sentiment: "Mild Bullish", },
        { coin: "LINK", sentiment: "Neutral", }
      ],
      videoUrl: "https://www.youtube.com/watch?v=example3",
      outlook: "long term",
      comment: "Education : Contains hype elements but balanced with educational content. Marketing tone present."
    },
    {
      id: 4,
      title: "Market Update - Fed Decision Impact on Crypto",
      date: "2023-10-08",
      summary: "This video analyzes the latest Federal Reserve decision and its impact on the cryptocurrency market. I explain how interest rate policies affect crypto valuations and investor sentiment. The recent pause in rate hikes has provided short-term relief for risk assets including Bitcoin. I discuss historical patterns showing how crypto has reacted to Fed policy changes and what we might expect in the coming months. The video also covers Bitcoin's correlation with traditional markets and whether we're seeing decoupling signals. I provide insights into how investors should position their portfolios given the current macroeconomic environment.",
      recommendations: [
        { coin: "BTC", sentiment: "Neutral", },
        { coin: "XRP", sentiment: "Mild Bearish", }
      ],
      videoUrl: "https://www.youtube.com/watch?v=example4",
      outlook: "short term",
      comment: "Education : Highly educational content with clear explanations. Minimal hype or marketing elements detected."
    },
    {
      id: 5,
      title: "Technical Analysis Masterclass - Chart Patterns That Work",
      date: "2023-10-05",
      summary: "In this educational video, I provide a masterclass on technical analysis focusing on chart patterns that have proven reliable in crypto markets. I cover patterns including head and shoulders, ascending triangles, and cup and handle formations. For each pattern, I explain the psychology behind it, how to identify it correctly, and how to set appropriate price targets. The video includes multiple examples from Bitcoin and major altcoins to illustrate these concepts in action. I emphasize the importance of combining technical analysis with proper risk management strategies and avoiding common pitfalls that many traders make when interpreting charts.",
      recommendations: [
        { coin: "BTC", sentiment: "Neutral", },
        { coin: "ADA", sentiment: "Mild Bullish", }
      ],
      videoUrl: "https://www.youtube.com/watch?v=example5",
      outlook: "medium term",
      comment: "Education : Purely educational content with excellent clarity. No hype or marketing elements detected."
    }
  ]);

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get sentiment color and icon
  const getSentimentInfo = (sentiment) => {
    switch (sentiment) {
      case "Strong Bullish":
        return {
          color: "bg-green-100 text-green-800",
          icon: <FaArrowUp className="text-green-600" />,
          arrow: "↑"
        };
      case "Mild Bullish":
        return {
          color: "bg-green-50 text-green-700",
          icon: <FaArrowUp className="text-green-500" />,
          arrow: "↗"
        };
      case "Neutral":
        return {
          color: "bg-blue-50 text-blue-700",
          icon: <FaMinus className="text-blue-500" />,
          arrow: "→"
        };
      case "Mild Bearish":
        return {
          color: "bg-red-50 text-red-700",
          icon: <FaArrowDown className="text-red-500" />,
          arrow: "↘"
        };
      case "Strong Bearish":
        return {
          color: "bg-red-100 text-red-800",
          icon: <FaArrowDown className="text-red-600" />,
          arrow: "↓"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: <FaMinus className="text-gray-500" />,
          arrow: "→"
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header with update info */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                Recent Activities
              </h2>
              <p className="text-gray-600 text-lg">Latest posts and analysis</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <FaSync className="text-white text-sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Last System Update</p>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleString("en-IN", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="space-y-8">
          {recentPosts.map((post) => (
            <div key={post.id} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group">
              {/* Post Header */}
              <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md">
                        Post {post.id}
                      </span>
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded-lg">
                        <FaCalendarAlt className="text-blue-500" />
                        <span className="font-medium">Date of Post: {formatDate(post.date)}</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <a
                        href={post.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-red-600 hover:text-red-700 transition-all duration-200 font-medium"
                      >
                        <FaYoutube />
                        Watch Video
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {post.recommendations.map((rec, index) => {
                      const sentimentInfo = getSentimentInfo(rec.sentiment);
                      return (
                        <span
                          key={index}
                          className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-md transition-all duration-200 hover:scale-105 ${sentimentInfo.color}`}
                        >
                          <span className="text-lg">{sentimentInfo.arrow}</span>
                          {rec.coin}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-8 space-y-8">
                {/* AI Summary Section */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h4 className="font-bold mb-4 text-xl">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                      ✨ AI Summary
                    </span>
                  </h4>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed text-lg">{post.summary}</p>
                  </div>
                </div>

                {/* Content Type Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-bold text-gray-800 mb-4 text-xl flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Content Type
                  </h4>
                  <div className="bg-white/70 rounded-lg p-4">
                    <p className="text-gray-700 font-medium">{post.comment}</p>
                  </div>
                </div>

                {/* Recommendations Section */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h4 className="font-bold text-gray-800 mb-6 text-xl flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Posts Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {post.recommendations.map((rec, index) => {
                      const sentimentInfo = getSentimentInfo(rec.sentiment);
                      return (
                        <div key={index} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105">
                          <div className="flex justify-between items-start mb-4">
                            <span className="font-bold text-2xl text-gray-800">{rec.coin}</span>
                            <span className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm ${sentimentInfo.color}`}>
                              {sentimentInfo.icon} 
                              <span>{rec.sentiment.replace('_', ' ')}</span>
                            </span>
                          </div>
                          <div className="mt-4">
                            <span className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-sm font-medium capitalize shadow-sm">
                              📈 {post.outlook} outlook
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
          </div>
        ))}
      </div>

      <YouTubeTelegramInfluencers/>

        {/* Update Info Footer */}
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 border border-indigo-100 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-2 text-xl flex items-center gap-3">
                <span className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></span>
                Data Updates
              </h3>
              <p className="text-gray-600 text-lg">Recent activity data is updated daily with the latest posts</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/50 shadow-md">
              <div className="flex items-center gap-2 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="font-semibold">Live Updates Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}