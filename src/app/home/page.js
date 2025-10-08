"use client";

import { FaUsers, FaChartLine, FaBolt, FaShieldAlt } from "react-icons/fa";

export default function HomePage() {
  const stats = [
    {
      icon: <FaUsers className="text-blue-600" size={24} />,
      value: "2,847",
      label: "Active Influencers",
      bgColor: "bg-blue-100",
    },
    {
      icon: <FaChartLine className="text-green-600" size={24} />,
      value: "73.2%",
      label: "Avg Win Rate",
      bgColor: "bg-green-100",
    },
    {
      icon: <FaBolt className="text-purple-600" size={24} />,
      value: "18,492",
      label: "Calls Tracked",
      bgColor: "bg-purple-100",
    },
    {
      icon: <FaShieldAlt className="text-orange-600" size={24} />,
      value: "99.9%",
      label: "Uptime",
      bgColor: "bg-orange-100",
    },
  ];

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <div className={`flex items-center justify-center w-12 h-12 ${stat.bgColor} rounded-lg mx-auto mb-4`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1 text-center">{stat.value}</div>
              <div className="text-sm text-gray-600 text-center">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
