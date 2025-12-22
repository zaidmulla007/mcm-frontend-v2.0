"use client";
import React from "react";
import { FaArrowUp, FaArrowDown, FaChartLine } from "react-icons/fa";

// Dummy data for coins
const dummyCoins = [
    {
        id: 1,
        symbol: "BTC",
        name: "Bitcoin",
        image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
        shortTermBullish: 67,
        shortTermBearish: 33,
        shortTermPosts: 15,
        longTermBullish: 89,
        longTermBearish: 11,
        longTermPosts: 224,
    },
    {
        id: 2,
        symbol: "ETH",
        name: "Ethereum",
        image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
        shortTermBullish: 76,
        shortTermBearish: 24,
        shortTermPosts: 21,
        longTermBullish: 84,
        longTermBearish: 16,
        longTermPosts: 962,
    },
];

export default function OptionsForTrendingCoins() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    Sentiment Display UI Options
                </h1>
                <p className="text-center text-gray-600 mb-12">
                    Compare different UI options for displaying bullish/bearish sentiment data
                </p>

                {dummyCoins.map((coin) => (
                    <div key={coin.id} className="mb-16">
                        {/* Coin Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <img src={coin.image} alt={coin.symbol} className="w-12 h-12 rounded-full" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{coin.symbol}</h2>
                                <p className="text-sm text-gray-600">{coin.name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* OPTION 1: Progress Bar with Percentage */}
                            <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-200/50">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                    Option 1: Progress Bar with Percentage
                                </h3>

                                {/* Short Term */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Short Term</span>
                                        <span className="text-xs text-gray-500">{coin.shortTermPosts} posts</span>
                                    </div>
                                    <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-start px-3"
                                            style={{ width: `${coin.shortTermBearish}%` }}
                                        >
                                            <span className="text-xs font-bold text-white">{coin.shortTermBearish}%</span>
                                        </div>
                                        <div
                                            className="absolute right-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-end px-3"
                                            style={{ width: `${coin.shortTermBullish}%` }}
                                        >
                                            <span className="text-xs font-bold text-white">{coin.shortTermBullish}%</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-1 text-xs">
                                        <span className="text-red-600 font-semibold">Bearish</span>
                                        <span className="text-green-600 font-semibold">Bullish</span>
                                    </div>
                                </div>

                                {/* Long Term */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Long Term</span>
                                        <span className="text-xs text-gray-500">{coin.longTermPosts} posts</span>
                                    </div>
                                    <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-start px-3"
                                            style={{ width: `${coin.longTermBearish}%` }}
                                        >
                                            <span className="text-xs font-bold text-white">{coin.longTermBearish}%</span>
                                        </div>
                                        <div
                                            className="absolute right-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-end px-3"
                                            style={{ width: `${coin.longTermBullish}%` }}
                                        >
                                            <span className="text-xs font-bold text-white">{coin.longTermBullish}%</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-1 text-xs">
                                        <span className="text-red-600 font-semibold">Bearish</span>
                                        <span className="text-green-600 font-semibold">Bullish</span>
                                    </div>
                                </div>
                            </div>

                            {/* OPTION 2: Circular Progress (Gauge) */}
                            <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-200/50">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                    Option 2: Circular Gauge
                                </h3>

                                <div className="flex justify-around">
                                    {/* Short Term Gauge */}
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Short Term</p>
                                        <div className="relative w-32 h-32">
                                            <svg className="transform -rotate-90" width="128" height="128">
                                                {/* Background circle */}
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r="56"
                                                    fill="none"
                                                    stroke="#e5e7eb"
                                                    strokeWidth="12"
                                                />
                                                {/* Progress circle */}
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r="56"
                                                    fill="none"
                                                    stroke={coin.shortTermBullish >= coin.shortTermBearish ? "#10b981" : "#ef4444"}
                                                    strokeWidth="12"
                                                    strokeDasharray={`${(coin.shortTermBullish >= coin.shortTermBearish ? coin.shortTermBullish : coin.shortTermBearish) * 3.51} 351`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-2xl font-bold ${coin.shortTermBullish >= coin.shortTermBearish ? 'text-green-600' : 'text-red-600'}`}>
                                                    {coin.shortTermBullish >= coin.shortTermBearish ? coin.shortTermBullish : coin.shortTermBearish}%
                                                </span>
                                                <span className="text-xs text-gray-500">{coin.shortTermPosts} posts</span>
                                            </div>
                                        </div>
                                        <p className={`text-sm font-semibold mt-2 ${coin.shortTermBullish >= coin.shortTermBearish ? 'text-green-600' : 'text-red-600'}`}>
                                            {coin.shortTermBullish >= coin.shortTermBearish ? 'Bullish' : 'Bearish'}
                                        </p>
                                    </div>

                                    {/* Long Term Gauge */}
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Long Term</p>
                                        <div className="relative w-32 h-32">
                                            <svg className="transform -rotate-90" width="128" height="128">
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r="56"
                                                    fill="none"
                                                    stroke="#e5e7eb"
                                                    strokeWidth="12"
                                                />
                                                <circle
                                                    cx="64"
                                                    cy="64"
                                                    r="56"
                                                    fill="none"
                                                    stroke={coin.longTermBullish >= coin.longTermBearish ? "#10b981" : "#ef4444"}
                                                    strokeWidth="12"
                                                    strokeDasharray={`${(coin.longTermBullish >= coin.longTermBearish ? coin.longTermBullish : coin.longTermBearish) * 3.51} 351`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-2xl font-bold ${coin.longTermBullish >= coin.longTermBearish ? 'text-green-600' : 'text-red-600'}`}>
                                                    {coin.longTermBullish >= coin.longTermBearish ? coin.longTermBullish : coin.longTermBearish}%
                                                </span>
                                                <span className="text-xs text-gray-500">{coin.longTermPosts} posts</span>
                                            </div>
                                        </div>
                                        <p className={`text-sm font-semibold mt-2 ${coin.longTermBullish >= coin.longTermBearish ? 'text-green-600' : 'text-red-600'}`}>
                                            {coin.longTermBullish >= coin.longTermBearish ? 'Bullish' : 'Bearish'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* OPTION 3: Card-Based Layout with Icons */}
                            <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-200/50">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                    Option 3: Card-Based with Icons
                                </h3>

                                {/* Short Term */}
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Short Term ({coin.shortTermPosts} posts)</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaArrowUp className="text-green-600" />
                                                <span className="text-sm font-semibold text-green-700">Bullish</span>
                                            </div>
                                            <p className="text-3xl font-bold text-green-600">{coin.shortTermBullish}%</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaArrowDown className="text-red-600" />
                                                <span className="text-sm font-semibold text-red-700">Bearish</span>
                                            </div>
                                            <p className="text-3xl font-bold text-red-600">{coin.shortTermBearish}%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Long Term */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Long Term ({coin.longTermPosts} posts)</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaArrowUp className="text-green-600" />
                                                <span className="text-sm font-semibold text-green-700">Bullish</span>
                                            </div>
                                            <p className="text-3xl font-bold text-green-600">{coin.longTermBullish}%</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-2 border-red-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaArrowDown className="text-red-600" />
                                                <span className="text-sm font-semibold text-red-700">Bearish</span>
                                            </div>
                                            <p className="text-3xl font-bold text-red-600">{coin.longTermBearish}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* OPTION 4: Simple Badge/Pill Display */}
                            <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-200/50">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                    Option 4: Simple Badge/Pill
                                </h3>

                                {/* Short Term */}
                                <div className="mb-6">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Short Term</p>
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold shadow-lg ${coin.shortTermBullish >= coin.shortTermBearish
                                                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                                    : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                                }`}
                                        >
                                            {coin.shortTermBullish >= coin.shortTermBearish ? (
                                                <FaArrowUp className="text-xl" />
                                            ) : (
                                                <FaArrowDown className="text-xl" />
                                            )}
                                            {coin.shortTermBullish >= coin.shortTermBearish ? coin.shortTermBullish : coin.shortTermBearish}%{" "}
                                            {coin.shortTermBullish >= coin.shortTermBearish ? "Bullish" : "Bearish"}
                                        </span>
                                        <span className="text-sm text-gray-500">{coin.shortTermPosts} posts</span>
                                    </div>
                                </div>

                                {/* Long Term */}
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-3">Long Term</p>
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold shadow-lg ${coin.longTermBullish >= coin.longTermBearish
                                                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                                    : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                                }`}
                                        >
                                            {coin.longTermBullish >= coin.longTermBearish ? (
                                                <FaArrowUp className="text-xl" />
                                            ) : (
                                                <FaArrowDown className="text-xl" />
                                            )}
                                            {coin.longTermBullish >= coin.longTermBearish ? coin.longTermBullish : coin.longTermBearish}%{" "}
                                            {coin.longTermBullish >= coin.longTermBearish ? "Bullish" : "Bearish"}
                                        </span>
                                        <span className="text-sm text-gray-500">{coin.longTermPosts} posts</span>
                                    </div>
                                </div>
                            </div>

                            {/* OPTION 5: Stacked Bar (like GitHub) */}
                            <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-200/50">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                    Option 5: Stacked Bar (Clean)
                                </h3>

                                {/* Short Term */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Short Term</span>
                                        <span className="text-xs text-gray-500">{coin.shortTermPosts} posts</span>
                                    </div>
                                    <div className="flex h-6 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center transition-all"
                                            style={{ width: `${coin.shortTermBearish}%` }}
                                        >
                                            {coin.shortTermBearish > 15 && (
                                                <span className="text-xs font-bold text-white">{coin.shortTermBearish}%</span>
                                            )}
                                        </div>
                                        <div
                                            className="bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center transition-all"
                                            style={{ width: `${coin.shortTermBullish}%` }}
                                        >
                                            {coin.shortTermBullish > 15 && (
                                                <span className="text-xs font-bold text-white">{coin.shortTermBullish}%</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-xs text-red-600 font-semibold">← {coin.shortTermBearish}% Bearish</span>
                                        <span className="text-xs text-green-600 font-semibold">Bullish {coin.shortTermBullish}% →</span>
                                    </div>
                                </div>

                                {/* Long Term */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Long Term</span>
                                        <span className="text-xs text-gray-500">{coin.longTermPosts} posts</span>
                                    </div>
                                    <div className="flex h-6 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center transition-all"
                                            style={{ width: `${coin.longTermBearish}%` }}
                                        >
                                            {coin.longTermBearish > 15 && (
                                                <span className="text-xs font-bold text-white">{coin.longTermBearish}%</span>
                                            )}
                                        </div>
                                        <div
                                            className="bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center transition-all"
                                            style={{ width: `${coin.longTermBullish}%` }}
                                        >
                                            {coin.longTermBullish > 15 && (
                                                <span className="text-xs font-bold text-white">{coin.longTermBullish}%</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-xs text-red-600 font-semibold">← {coin.longTermBearish}% Bearish</span>
                                        <span className="text-xs text-green-600 font-semibold">Bullish {coin.longTermBullish}% →</span>
                                    </div>
                                </div>
                            </div>

                            {/* OPTION 6: Emoji/Icon + Text (Ultra Minimal) */}
                            <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-200/50">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                                    Option 6: Minimal Text + Icon
                                </h3>

                                <div className="space-y-6">
                                    {/* Short Term */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-3">Short Term</p>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                {coin.shortTermBullish >= coin.shortTermBearish ? (
                                                    <>
                                                        <span className="text-4xl">📈</span>
                                                        <div>
                                                            <p className="text-2xl font-bold text-green-600">{coin.shortTermBullish}%</p>
                                                            <p className="text-sm text-green-700 font-semibold">Bullish</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-4xl">📉</span>
                                                        <div>
                                                            <p className="text-2xl font-bold text-red-600">{coin.shortTermBearish}%</p>
                                                            <p className="text-sm text-red-700 font-semibold">Bearish</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500">{coin.shortTermPosts} posts</span>
                                        </div>
                                    </div>

                                    {/* Long Term */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-3">Long Term</p>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                {coin.longTermBullish >= coin.longTermBearish ? (
                                                    <>
                                                        <span className="text-4xl">📈</span>
                                                        <div>
                                                            <p className="text-2xl font-bold text-green-600">{coin.longTermBullish}%</p>
                                                            <p className="text-sm text-green-700 font-semibold">Bullish</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-4xl">📉</span>
                                                        <div>
                                                            <p className="text-2xl font-bold text-red-600">{coin.longTermBearish}%</p>
                                                            <p className="text-sm text-red-700 font-semibold">Bearish</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500">{coin.longTermPosts} posts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {coin.id < dummyCoins.length && (
                            <div className="mt-12 border-b-2 border-gray-300"></div>
                        )}
                    </div>
                ))}

                {/* Footer with recommendations */}
                <div className="mt-12 bg-white rounded-xl p-8 shadow-lg border border-indigo-200/50">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Recommendations:</h3>
                    <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold">•</span>
                            <span><strong>Option 1 (Progress Bar):</strong> Best for showing split between bullish/bearish clearly</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold">•</span>
                            <span><strong>Option 2 (Circular Gauge):</strong> Most compact, great for dashboards</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold">•</span>
                            <span><strong>Option 3 (Card-Based):</strong> Most detailed, best for detailed analysis</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold">•</span>
                            <span><strong>Option 4 (Badge/Pill):</strong> Most prominent, emphasizes dominant sentiment</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold">•</span>
                            <span><strong>Option 5 (Stacked Bar):</strong> Cleanest, best balance of info and simplicity ⭐ RECOMMENDED</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold">•</span>
                            <span><strong>Option 6 (Minimal):</strong> Most space-efficient, easiest to scan</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
