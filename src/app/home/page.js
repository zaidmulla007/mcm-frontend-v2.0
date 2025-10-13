"use client";

import { FaChartLine } from "react-icons/fa";
import YoutubeTelegramDataTableGuage from "../components/YoutubeTelegramDataTableGuage";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Smart Analytics for
            </span>
            <span className="text-gray-900"> Influencer ROI Mastery</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Only platform tracking both overall and high-risk ROI by influencer, asset type, and
            time period. All data independently verified and updated daily for maximum accuracy.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              View ROI Analytics
            </button>
            <button className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border border-gray-200">
              Start Tracking ROI
            </button>
          </div>
        </div>

        {/* Stats Cards - Original 4 boxes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-6 h-6 text-blue-600" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1 text-center">2,847</div>
            <div className="text-sm text-gray-600 text-center">Active Influencers</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up w-6 h-6 text-green-600" aria-hidden="true">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1 text-center">73.2%</div>
            <div className="text-sm text-gray-600 text-center">Avg Win Rate</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-6 h-6 text-purple-600" aria-hidden="true">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1 text-center">18,492</div>
            <div className="text-sm text-gray-600 text-center">Calls Tracked</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield w-6 h-6 text-orange-600" aria-hidden="true">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1 text-center">99.9%</div>
            <div className="text-sm text-gray-600 text-center">Uptime</div>
          </div>
        </div>

        {/* Section Title and Description */}
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Advanced ROI Flash Card Analytics
          </h2>
          <p className="text-lg text-gray-600">
            Track real returns, spot moonshot outliers, and avoid the illusion of alpha with our comprehensive analytics dashboard.
          </p>
        </div>

        {/* Three Analytics Cards in One Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaChartLine className="text-white" size={20} />
                <h2 className="text-base font-bold text-white">Advanced ROI Analytics</h2>
              </div>
              <button className="text-white text-xs hover:text-gray-200 font-semibold">View Full →</button>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute -top-1 -left-1 bg-yellow-400 text-black font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center">#1</span>
                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="CryptoWhale" className="w-12 h-12 rounded-full border-2 border-white object-cover" />
                </div>
                <div className="text-white">
                  <h3 className="text-sm font-bold">CryptoWhale</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">Twitter • 2.3M</span>
                    <span className="bg-green-400 text-black px-2 py-0.5 rounded-full text-xs font-semibold">Bullish</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-blue-50 rounded-xl p-3 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-blue-900 font-bold text-sm">Overall ROI</h3>
                  <span className="text-blue-600 text-lg">↗</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">+284.7%</div>
                <div className="text-blue-700 text-xs">Win Rate: 89.2%</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-purple-900 font-bold text-sm">Moonshots</h3>
                  <span className="text-purple-600 text-lg">⚡</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">+567.2%</div>
                <div className="text-orange-600 text-xs font-semibold">Medium Risk</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-900 font-bold text-xs">7-Day Performance</h3>
                  <button className="text-blue-600 text-xs">🔗 Expand</button>
                </div>
                <div className="flex items-end justify-between gap-1 h-16">
                  {[40, 30, 45, 60, 55, 70, 80].map((height, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-600">Day 1</span>
                  <span className="text-xs text-gray-600">Day 7</span>
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-700 font-semibold text-xs">Total Calls</h3>
                    <div className="text-xl font-bold text-gray-900">247</div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-gray-700 font-semibold text-xs">Current Streak</h3>
                    <div className="text-base font-bold">
                      <span className="text-green-600">12W</span> | <span className="text-red-600">2L</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaChartLine className="text-white" size={20} />
                <h2 className="text-base font-bold text-white">Advanced ROI Analytics</h2>
              </div>
              <button className="text-white text-xs hover:text-gray-200 font-semibold">View Full →</button>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute -top-1 -left-1 bg-yellow-400 text-black font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center">#2</span>
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" alt="BitMaster" className="w-12 h-12 rounded-full border-2 border-white object-cover" />
                </div>
                <div className="text-white">
                  <h3 className="text-sm font-bold">BitMaster</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">Twitter • 1.8M</span>
                    <span className="bg-green-400 text-black px-2 py-0.5 rounded-full text-xs font-semibold">Bullish</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-blue-50 rounded-xl p-3 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-blue-900 font-bold text-sm">Overall ROI</h3>
                  <span className="text-blue-600 text-lg">↗</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">+195.4%</div>
                <div className="text-blue-700 text-xs">Win Rate: 82.5%</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-purple-900 font-bold text-sm">Moonshots</h3>
                  <span className="text-purple-600 text-lg">⚡</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">+432.1%</div>
                <div className="text-orange-600 text-xs font-semibold">Medium Risk</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-900 font-bold text-xs">7-Day Performance</h3>
                  <button className="text-blue-600 text-xs">🔗 Expand</button>
                </div>
                <div className="flex items-end justify-between gap-1 h-16">
                  {[35, 45, 40, 55, 65, 60, 75].map((height, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-600">Day 1</span>
                  <span className="text-xs text-gray-600">Day 7</span>
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-700 font-semibold text-xs">Total Calls</h3>
                    <div className="text-xl font-bold text-gray-900">189</div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-gray-700 font-semibold text-xs">Current Streak</h3>
                    <div className="text-base font-bold">
                      <span className="text-green-600">9W</span> | <span className="text-red-600">3L</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaChartLine className="text-white" size={20} />
                <h2 className="text-base font-bold text-white">Advanced ROI Analytics</h2>
              </div>
              <button className="text-white text-xs hover:text-gray-200 font-semibold">View Full →</button>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute -top-1 -left-1 bg-yellow-400 text-black font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center">#3</span>
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" alt="CoinGuru" className="w-12 h-12 rounded-full border-2 border-white object-cover" />
                </div>
                <div className="text-white">
                  <h3 className="text-sm font-bold">CoinGuru</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">Twitter • 1.5M</span>
                    <span className="bg-red-400 text-black px-2 py-0.5 rounded-full text-xs font-semibold">Bearish</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-blue-50 rounded-xl p-3 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-blue-900 font-bold text-sm">Overall ROI</h3>
                  <span className="text-blue-600 text-lg">↗</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">+156.8%</div>
                <div className="text-blue-700 text-xs">Win Rate: 76.3%</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-purple-900 font-bold text-sm">Moonshots</h3>
                  <span className="text-purple-600 text-lg">⚡</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">+389.5%</div>
                <div className="text-orange-600 text-xs font-semibold">High Risk</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-900 font-bold text-xs">7-Day Performance</h3>
                  <button className="text-blue-600 text-xs">🔗 Expand</button>
                </div>
                <div className="flex items-end justify-between gap-1 h-16">
                  {[50, 40, 35, 45, 50, 55, 65].map((height, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-600">Day 1</span>
                  <span className="text-xs text-gray-600">Day 7</span>
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-700 font-semibold text-xs">Total Calls</h3>
                    <div className="text-xl font-bold text-gray-900">165</div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-gray-700 font-semibold text-xs">Current Streak</h3>
                    <div className="text-base font-bold">
                      <span className="text-green-600">7W</span> | <span className="text-red-600">1L</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* YouTube Telegram Data Table Guage Component */}
        <div className="mt-16">
          <YoutubeTelegramDataTableGuage />
        </div>
      </div>
    </div>
  );
}
