"use client";
import { useState, useEffect } from "react";
import YoutubeTelegramDataTableLight from "../components/YoutubeTelegramDataTableLight";
import YouTubeTelegramInfluencers from "../components/YouTubeTelegramInfluencers";


export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMentions, setShowMentions] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 15 coins with hardcoded data
  const coinsData = [
    { symbol: "BTC", name: "Bitcoin", price: "$67,234.50" },
    { symbol: "ETH", name: "Ethereum", price: "$3,456.78" },
    { symbol: "BNB", name: "Binance Coin", price: "$589.23" },
    { symbol: "XRP", name: "XRP", price: "$0.6234" },
    { symbol: "SOL", name: "Solana", price: "$145.67" },
    { symbol: "ADA", name: "Cardano", price: "$0.4567" },
    { symbol: "DOGE", name: "Dogecoin", price: "$0.1234" },
    { symbol: "AVAX", name: "Avalanche", price: "$34.56" },
    { symbol: "DOT", name: "Polkadot", price: "$7.89" },
    { symbol: "LINK", name: "Chainlink", price: "$14.23" },
    { symbol: "MATIC", name: "Polygon", price: "$0.8901" },
    { symbol: "UNI", name: "Uniswap", price: "$6.78" },
    { symbol: "LTC", name: "Litecoin", price: "$89.45" },
    { symbol: "ALGO", name: "Algorand", price: "$0.1987" },
    { symbol: "VET", name: "VeChain", price: "$0.0456" }
  ];

  // Table data
  const tableData = [
    { totalPost: 145, youtube: 89, telegram: 56, total: 145 },
    { totalPost: 123, youtube: 67, telegram: 56, total: 123 },
    { totalPost: 98, youtube: 45, telegram: 53, total: 98 },
    { totalPost: 87, youtube: 34, telegram: 53, total: 87 }
  ];

  // Calculate totals for the overall row
  const calculateTotals = () => {
    const totals = tableData.reduce((acc, row) => ({
      totalPost: acc.totalPost + row.totalPost,
      youtube: acc.youtube + row.youtube,
      telegram: acc.telegram + row.telegram,
      total: acc.total + row.total
    }), { totalPost: 0, youtube: 0, telegram: 0, total: 0 });
    return totals;
  };

  const overallTotals = calculateTotals();

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 text-gray-800 font-sans pb-16 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-lavender-100/20"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-lavender-200/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-purple-100/10 to-transparent rounded-full"></div>

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto pt-16 pb-8 px-8 flex flex-col items-center gap-6">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
            Filtering The Noise!
          </h1>
        </section>

        {/* Live Price Section */}
        <section className="max-w-6xl mx-auto px-8 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-purple-200 shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg">
                  Live Prices
                </div>
              </div>
              <div className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 overflow-hidden min-h-[80px] flex items-center shadow-inner">
                <div className="animate-scroll whitespace-nowrap w-full">
                  <div className="inline-flex space-x-8">
                    {[...coinsData, ...coinsData].map((coin, index) => (
                      <div key={index} className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {coin.symbol}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="font-bold text-lg text-green-600">
                          {coin.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Influencer Posts Section */}
        <section className="max-w-7xl mx-auto px-8">
          <YouTubeTelegramInfluencers />
        </section>

        {/* Trending Coins Section */}
        <section className="max-w-7xl mx-auto px-8">
          <YoutubeTelegramDataTableLight />
        </section>
      </div>
      {/* Overall Analytics Summary */}
      <section className="max-w-6xl mx-auto px-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-purple-200 shadow-2xl p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="text-3xl">📈</span>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Overall Analytics Dashboard
              </h3>
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive real-time cryptocurrency market insights powered by advanced social media analytics.
              Track influencer sentiment, engagement patterns, and market movements across YouTube and Telegram platforms
              to make informed investment decisions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-2xl border border-purple-300 shadow-lg">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-bold text-purple-700 mb-2">Smart Filtering</h4>
                <p className="text-sm text-gray-600">Advanced algorithms filter market noise for actionable insights</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-2xl border border-blue-300 shadow-lg">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-bold text-blue-700 mb-2">Real-time Data</h4>
                <p className="text-sm text-gray-600">Live price feeds and instant social media sentiment analysis</p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-2xl border border-green-300 shadow-lg">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-bold text-green-700 mb-2">Multi-Platform</h4>
                <p className="text-sm text-gray-600">Comprehensive coverage across YouTube and Telegram channels</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}