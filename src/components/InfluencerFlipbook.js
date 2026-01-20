"use client";
import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";
import { FaStar, FaStarHalfAlt, FaChevronLeft, FaChevronRight, FaEye, FaYoutube, FaTelegramPlane } from "react-icons/fa";
import { getDynamicTimeframeOptions } from "../../utils/dateFilterUtils";

// Helper function to format numbers
const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    const absNum = Math.abs(num);
    if (absNum >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (absNum >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

// Left Panel Component - Filters, Profile Image, Rank, Name, Subscribers
const LeftPanel = ({ influencer, selectedPlatform, setSelectedPlatform, selectedTimeframe, setSelectedTimeframe, timeframeOptions }) => {
    const handleNavigate = () => {
        const url = influencer.platform === "YouTube"
            ? `/influencers/${influencer.id}`
            : `/telegram-influencer/${influencer.id}`;
        window.location.href = url;
    };

    return (
        <div className="h-full w-full bg-gradient-to-br from-blue-50 via-purple-50 to-white flex flex-col p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#3b82f6_25%,transparent_25%,transparent_75%,#3b82f6_75%,#3b82f6),linear-gradient(45deg,#3b82f6_25%,transparent_25%,transparent_75%,#3b82f6_75%,#3b82f6)] bg-[length:20px_20px] bg-[0_0,10px_10px]"></div>
            </div>

            {/* Content - Scrollable */}
            <div className="relative flex-1 flex flex-col items-center overflow-y-auto custom-scrollbar min-h-0">
                {/* Filters Section - Above Profile Image */}
                <div className="w-full mb-3 space-y-2">
                    {/* Source Filter */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 text-center">Source</label>
                        <select
                            value={selectedPlatform}
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                            className="w-full bg-white border-2 border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all cursor-pointer shadow-sm"
                        >
                            <option value="youtube">YouTube</option>
                            <option value="telegram">Telegram</option>
                        </select>
                    </div>

                    {/* Holding Period Filter */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 text-center">Holding Period</label>
                        <select
                            value={selectedTimeframe}
                            onChange={(e) => setSelectedTimeframe(e.target.value)}
                            className="w-full bg-white border-2 border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all cursor-pointer shadow-sm"
                        >
                            {timeframeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Profile Image */}
                <div className="relative mb-2 group cursor-pointer" onClick={handleNavigate}>
                    {/* Gradient Ring on Hover */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/80 transition-all group-hover:ring-0">
                        {influencer.channel_thumbnails?.high?.url ? (
                            <Image
                                src={influencer.channel_thumbnails.high.url}
                                alt={influencer.name || "Influencer"}
                                width={112}
                                height={112}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}

                        {/* Fallback Avatar */}
                        <div
                            className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-400 to-indigo-500 flex items-center justify-center"
                            style={{ display: influencer.channel_thumbnails?.high?.url ? 'none' : 'flex' }}
                        >
                            <span className="text-white text-3xl font-bold">
                                {influencer.name?.match(/\b\w/g)?.join("").toUpperCase() || "?"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Influencer Name */}
                <h2 className="text-sm md:text-base font-bold text-gray-800 text-center mb-1 px-2 line-clamp-2">
                    {influencer.name?.replace(/_/g, " ") || "Unknown"}
                </h2>

                {/* Platform Badge */}
                <div className="inline-flex items-center gap-2 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-md mb-2">
                    {influencer.platform === "YouTube" ? (
                        <FaYoutube className="text-red-600 text-xs" />
                    ) : (
                        <FaTelegramPlane className="text-blue-500 text-xs" />
                    )}
                    <span className="font-bold text-[10px] text-gray-700">{influencer.platform}</span>
                </div>

                {/* Last Post Card */}
                <div className="w-full max-w-[180px] bg-white rounded-lg p-2 shadow-md border border-blue-100 mb-2">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-gray-600 font-medium">Last Post</span>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-800">
                                {influencer.last_post_date_string || '--'}
                            </span>
                            <span className="text-[10px] font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {influencer.last_post_time || '--'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Posts History */}
                <div className="w-full max-w-[180px] bg-white/60 rounded-lg p-2 shadow-md border border-blue-100 mb-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase text-gray-600 px-1">Posts History</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        <div className="bg-white rounded-md p-1 border border-blue-50 text-center shadow-sm">
                            <div className="text-[7px] text-gray-500 font-medium mb-0">2025</div>
                            <div className="text-[10px] font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">142</div>
                        </div>
                        <div className="bg-white rounded-md p-1 border border-blue-50 text-center shadow-sm">
                            <div className="text-[7px] text-gray-500 font-medium mb-0">2024</div>
                            <div className="text-[10px] font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">385</div>
                        </div>
                        <div className="bg-white rounded-md p-1 border border-blue-50 text-center shadow-sm">
                            <div className="text-[7px] text-gray-500 font-medium mb-0">2023</div>
                            <div className="text-[10px] font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">210</div>
                        </div>
                    </div>
                </div>

                {/* Subscribers Card */}
                <div className="w-full max-w-[180px] bg-white rounded-lg p-2 shadow-md border border-blue-100">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-600 font-medium">Subscribers</span>
                        <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {formatNumber(influencer.subs)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Decorative Bottom Line */}
            <div className="mt-auto text-center pt-2">
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto opacity-50"></div>
            </div>
        </div>
    );
};

// Middle Panel Component - MCM Ranking & Key Metrics
const MiddlePanel = ({ influencer }) => {
    const starRatingYearly = influencer.star_rating_yearly || {};
    const currentDate = new Date();
    const currentRealYear = currentDate.getFullYear();
    const currentRealMonth = currentDate.getMonth();

    const years = Object.keys(starRatingYearly)
        .map(year => parseInt(year))
        .filter(year => {
            if (year < 2022) return false;
            if (year > currentRealYear) return false;
            if (year === currentRealYear && currentRealMonth < 3) return false;
            return true;
        })
        .sort((a, b) => a - b);

    const scatterData = [];
    years.forEach((year) => {
        const yearData = starRatingYearly[year];
        if (yearData && yearData.current_rating) {
            scatterData.push({
                year: year,
                yearLabel: year,
                rating: yearData.current_rating,
                finalScore: yearData.current_final_score
            });
        }
    });

    // Get AI scoring data for all years
    const getAllYearsAIScoring = () => {
        if (!influencer?.ai_scoring_yearly) return [];

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const shouldShowCurrentYear = currentMonth >= 3;

        const years = Object.keys(influencer.ai_scoring_yearly)
            .map(y => parseInt(y))
            .filter(y => {
                if (y < 2022) return false;
                if (y > currentYear) return false;
                if (y === currentYear && !shouldShowCurrentYear) return false;
                return true;
            })
            .sort((a, b) => b - a);

        return years.map(year => ({
            year,
            data: influencer.ai_scoring_yearly[year]
        }));
    };

    const yearsAIData = getAllYearsAIScoring();

    const metrics = [
        {
            key: 'overall_score',
            label: 'Overall Score',
            field: 'avg_overall_score',
            color: '#1e3a8a',
            definition: 'Combined score reflecting overall quality across all metrics.'
        },
        {
            key: 'credibility_score',
            label: 'Credibility Score',
            field: 'avg_credibility_score',
            color: '#1d4ed8',
            definition: 'Trustworthiness and accuracy of the content.'
        },
        {
            key: 'risk_management',
            label: 'Risk Management',
            field: 'avg_risk_management',
            color: '#3b82f6',
            definition: 'How well risk strategies are addressed.'
        },
        {
            key: 'actionable_insights',
            label: 'Actionable Insights',
            field: 'avg_actionable_insights',
            color: '#93c5fd',
            definition: 'Presence and quality of actionable insights.'
        }
    ];

    return (
        <div className="h-full w-full bg-white flex flex-col p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-white"></div>

            <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex-shrink-0 mb-2">
                    <h3 className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        Influencer Overview
                    </h3>
                    <div className="w-10 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar min-h-0">
                    {/* MCM Ranking Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50/50 rounded-lg p-2 shadow-sm border border-blue-100/50">
                        <h4 className="text-[10px] font-bold text-gray-800 mb-1 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></span>
                            MCM Ranking
                        </h4>
                        {scatterData.length > 0 ? (
                            <div className="flex justify-center items-end gap-3 h-24">
                                {scatterData.map((point, idx) => {
                                    const fullStars = Math.floor(point.rating);
                                    const hasHalfStar = point.rating % 1 >= 0.5;
                                    const totalStars = 5;
                                    const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

                                    return (
                                        <div
                                            key={idx}
                                            className="flex flex-col items-center gap-1 group"
                                            title={`Year: ${point.yearLabel}, Rating: ${point.rating.toFixed(1)}`}
                                        >
                                            <div className="flex flex-col-reverse gap-0.5 transition-transform group-hover:-translate-y-1 duration-300">
                                                {[...Array(fullStars)].map((_, i) => (
                                                    <FaStar key={`full-${i}`} className="text-yellow-500 w-2.5 h-2.5 drop-shadow-sm" />
                                                ))}
                                                {hasHalfStar && (
                                                    <FaStarHalfAlt key="half" className="text-yellow-500 w-2.5 h-2.5 drop-shadow-sm" />
                                                )}
                                                {[...Array(emptyStars)].map((_, i) => (
                                                    <FaStar key={`empty-${i}`} className="text-gray-200 w-2.5 h-2.5" />
                                                ))}
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-600 group-hover:text-blue-600 transition-colors">{point.yearLabel}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-24 text-gray-400 text-[10px]">No rating data</div>
                        )}
                    </div>

                    {/* AI Scoring Section */}
                    <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-gray-800 flex items-center gap-1 px-1">
                            <span className="w-1 h-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"></span>
                            AI Scoring
                        </h4>
                        {metrics.map((metric) => (
                            <div key={metric.key} className="bg-white/60 rounded-lg p-1.5 border border-blue-100/50 overflow-visible mb-1.5 last:mb-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-bold uppercase text-gray-800">{metric.label}</span>
                                    <div className="relative group/tooltip">
                                        <FaEye className="w-2 h-2 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors" />
                                        <div className="absolute bottom-full mb-1 right-0 hidden group-hover/tooltip:block w-36 bg-gray-800 text-white text-[8px] rounded px-2 py-1 shadow-lg" style={{ zIndex: 9999 }}>
                                            {metric.definition}
                                            <div className="absolute top-full -mt-1 right-0 border-4 border-transparent border-t-gray-800"></div>
                                        </div>
                                    </div>
                                </div>

                                {yearsAIData.length > 0 ? (
                                    <div className="space-y-1">
                                        {/* Segmented Bars for All Years */}
                                        {[...yearsAIData].reverse().map((yearData) => {
                                            const scoreValue = yearData.data?.[metric.field] || 0;
                                            const ballPosition = (scoreValue / 10) * 100;
                                            const isGoodScore = scoreValue >= 5;

                                            return (
                                                <div key={yearData.year} className="flex items-center gap-1">
                                                    <span className="text-[8px] font-bold text-gray-600 w-8">{yearData.year}</span>
                                                    <div className="flex-1 flex items-center gap-1">
                                                        <div className="segmented-bar-container flex-1" style={{ height: '6px', position: 'relative' }}>
                                                            <div className="segmented-bar-background" style={{
                                                                display: 'flex',
                                                                width: '100%',
                                                                height: '100%',
                                                                borderRadius: '3px',
                                                                overflow: 'hidden',
                                                                background: 'linear-gradient(to right, #FF2121, #FF8C00, #FFD700, #ADFF2F, #00FF15)'
                                                            }}>
                                                            </div>
                                                            <div
                                                                className="percentage-ball"
                                                                style={{
                                                                    position: 'absolute',
                                                                    left: `${Math.min(Math.max(ballPosition, 6), 94)}%`,
                                                                    top: '50%',
                                                                    transform: 'translateY(-50%)',
                                                                    width: '10px',
                                                                    height: '10px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: isGoodScore ? '#00ff15' : '#ff2121',
                                                                    border: `2px solid ${isGoodScore ? '#00cc11' : '#cc1a1a'}`,
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                                                }}
                                                            />
                                                        </div>
                                                        <span className={`text-[8px] font-bold w-8 text-right ${isGoodScore ? 'text-green-700' : 'text-red-700'}`}>
                                                            {scoreValue.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 text-[8px] py-3">No data available</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Right Panel Component - ROI & Win Rate Analysis
const RightPanel = ({ influencer }) => {
    const getAllYearsData = () => {
        if (!influencer?.score_yearly_timeframes) return [];

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const shouldShowCurrentYear = currentMonth >= 3;

        const years = Object.keys(influencer.score_yearly_timeframes)
            .map(y => parseInt(y))
            .filter(y => {
                if (y < 2022) return false;
                if (y > currentYear) return false;
                if (y === currentYear && !shouldShowCurrentYear) return false;
                return true;
            })
            .sort((a, b) => b - a);

        return years.map(year => ({
            year,
            data: influencer.score_yearly_timeframes[year]
        }));
    };

    const yearsData = getAllYearsData();

    const timeframes = [
        { key: '1_hour', label: '1hr' },
        { key: '7_days', label: '7d' },
        { key: '60_days', label: '60d' },
        { key: '180_days', label: '180d' },
        { key: '1_year', label: '1y' },
    ];

    const formatROI = (value) => {
        if (value === undefined || value === null || value === 0) return '--';
        const formatted = value.toFixed(1);
        return value > 0 ? `+${formatted}` : `${formatted}`;
    };

    const formatWinRate = (value) => {
        if (value === undefined || value === null || value === 0) return '--';
        return `${Math.round(value)}%`;
    };

    const getROIColor = (value) => {
        if (value === undefined || value === null || value === 0) return 'text-gray-400';
        return value > 0 ? 'text-green-600' : 'text-red-500';
    };

    const getWinRateColor = (value) => {
        if (value === undefined || value === null || value === 0) return 'text-gray-400';
        if (value >= 60) return 'text-green-600';
        if (value >= 50) return 'text-blue-600';
        return 'text-orange-500';
    };

    return (
        <div className="h-full w-full bg-white flex flex-col p-3 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,#8b5cf6_25%,transparent_25%,transparent_75%,#8b5cf6_75%,#8b5cf6),linear-gradient(45deg,#8b5cf6_25%,transparent_25%,transparent_75%,#8b5cf6_75%,#8b5cf6)] bg-[length:20px_20px] bg-[0_0,10px_10px]"></div>
            </div>

            <div className="relative flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex-shrink-0 mb-2">
                    <h3 className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">
                        Performance
                    </h3>
                    <div className="w-10 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-auto pr-1 space-y-4 custom-scrollbar min-h-0 py-1">
                    {/* ROI Table */}
                    <div className="bg-white/60 rounded-lg border border-purple-100/50 overflow-hidden shadow-sm">
                        <div className="bg-purple-50/50 px-2 py-1.5 border-b border-purple-100 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-green-500"></span>
                            <h4 className="text-[10px] font-bold text-gray-800">ROI Performance</h4>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse min-w-[180px]">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-2 px-1 text-[8px] font-bold text-gray-500 border-b border-gray-100 text-left pl-2">Year</th>
                                        {timeframes.map((tf) => (
                                            <th key={tf.key} className="py-2 px-1 text-[8px] font-bold text-gray-500 border-b border-gray-100 whitespace-nowrap">
                                                {tf.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {yearsData.length > 0 ? (
                                        yearsData.map(({ year, data }) => (
                                            <tr key={`${year}-roi`} className="border-b border-gray-50 last:border-0 hover:bg-purple-50/30 transition-colors">
                                                <td className="py-2 px-1 text-[8px] font-bold text-gray-600 text-left pl-2">{year}</td>
                                                {timeframes.map((tf) => {
                                                    const roi = data?.[tf.key]?.prob_weighted_returns;
                                                    return (
                                                        <td key={tf.key} className={`py-2 px-1 text-[8px] font-bold whitespace-nowrap ${getROIColor(roi)}`}>
                                                            {formatROI(roi)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={timeframes.length + 1} className="p-3 text-center text-[8px] text-gray-400">
                                                No ROI data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Win Rate Table */}
                    <div className="bg-white/60 rounded-lg border border-blue-100/50 overflow-hidden shadow-sm">
                        <div className="bg-blue-50/50 px-2 py-1.5 border-b border-blue-100 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                            <h4 className="text-[10px] font-bold text-gray-800">Win Rates</h4>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse min-w-[180px]">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-2 px-1 text-[8px] font-bold text-gray-500 border-b border-gray-100 text-left pl-2">Year</th>
                                        {timeframes.map((tf) => (
                                            <th key={tf.key} className="py-2 px-1 text-[8px] font-bold text-gray-500 border-b border-gray-100 whitespace-nowrap">
                                                {tf.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {yearsData.length > 0 ? (
                                        yearsData.map(({ year, data }) => (
                                            <tr key={`${year}-win`} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                                                <td className="py-2 px-1 text-[8px] font-bold text-gray-600 text-left pl-2">{year}</td>
                                                {timeframes.map((tf) => {
                                                    const winRate = data?.[tf.key]?.win_percentage;
                                                    return (
                                                        <td key={tf.key} className={`py-2 px-1 text-[8px] font-bold whitespace-nowrap ${getWinRateColor(winRate)}`}>
                                                            {formatWinRate(winRate)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={timeframes.length + 1} className="p-3 text-center text-[8px] text-gray-400">
                                                No Win Rate data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Table of Contents - Left Panel
const TOCLeftPanel = ({ influencers, selectedIndex, onSelect }) => {
    return (
        <div className="h-full w-full bg-white/95 backdrop-blur-sm flex flex-col p-3 md:p-4 relative border-r border-gray-100">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute -top-[100px] -left-[100px] w-[300px] h-[300px] bg-blue-100/50 rounded-full blur-3xl"></div>
            </div>

            <div className="relative flex flex-col z-10 h-full min-h-0">
                <div className="flex-shrink-0 mb-3">
                    <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        Influencers
                    </h2>
                    <div className="w-10 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar min-h-0">
                    {influencers.length > 0 ? influencers.map((inf, idx) => (
                        <div
                            key={inf.id}
                            onClick={() => onSelect(idx)}
                            className={`group flex items-center gap-2 p-1.5 rounded-lg hover:bg-white hover:shadow-md border transition-all cursor-pointer ${selectedIndex === idx
                                ? 'bg-white shadow-md border-blue-200 ring-1 ring-blue-100'
                                : 'bg-slate-50/50 border-transparent hover:border-blue-100'
                                }`}
                        >
                            <div className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs shadow-md transition-transform flex-shrink-0 ${selectedIndex === idx ? 'scale-110 ring-2 ring-blue-400' : 'group-hover:scale-110'}`}>
                                {inf.platform === "YouTube" && inf.channel_thumbnails?.high?.url ? (
                                    <Image
                                        src={inf.channel_thumbnails.high.url}
                                        alt={inf.name || ""}
                                        width={28}
                                        height={28}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                                        {inf.name?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`font-bold text-[10px] truncate transition-colors ${selectedIndex === idx ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-600'
                                    }`}>
                                    {inf.name}
                                </div>
                                <div className="text-[8px] text-gray-500 truncate">
                                    {inf.platform} • <span className="text-blue-500 font-medium">{formatNumber(inf.subs)} subs</span>
                                </div>
                            </div>
                            {selectedIndex === idx && (
                                <div className="w-1 h-1 rounded-full bg-blue-500 mr-1"></div>
                            )}
                        </div>
                    )) : (
                        <div className="text-center text-gray-400 text-xs py-8">No influencers</div>
                    )}
                </div>

                <div className="mt-2 flex flex-col items-center flex-shrink-0">
                    <span className="text-[8px] text-gray-400">Total: {influencers.length} influencers</span>
                </div>
            </div>
        </div>
    );
};

// Main Flipbook Component
const FourFoldFlipbook = ({ influencers, selectedPlatform, setSelectedPlatform, selectedTimeframe, setSelectedTimeframe, timeframeOptions }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);
    const [flipDirection, setFlipDirection] = useState(null);

    const currentInfluencer = influencers[selectedIndex] || null;

    const goNext = () => {
        if (selectedIndex < influencers.length - 1 && !isFlipping) {
            setFlipDirection('next');
            setIsFlipping(true);
            setTimeout(() => {
                setSelectedIndex(prev => prev + 1);
                setIsFlipping(false);
                setFlipDirection(null);
            }, 600);
        }
    };

    const goPrev = () => {
        if (selectedIndex > 0 && !isFlipping) {
            setFlipDirection('prev');
            setIsFlipping(true);
            setTimeout(() => {
                setSelectedIndex(prev => prev - 1);
                setIsFlipping(false);
                setFlipDirection(null);
            }, 600);
        }
    };

    const handleSelect = (index) => {
        if (index !== selectedIndex && !isFlipping) {
            setFlipDirection(index > selectedIndex ? 'next' : 'prev');
            setIsFlipping(true);
            setTimeout(() => {
                setSelectedIndex(index);
                setIsFlipping(false);
                setFlipDirection(null);
            }, 600);
        }
    };

    // Reset selected index when influencers change
    useEffect(() => {
        setSelectedIndex(0);
    }, [influencers]);

    if (!influencers || influencers.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-xl font-semibold text-gray-700">No influencers found</p>
                <p className="text-gray-600 mt-2">Try adjusting your filter criteria</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Book Container - Four-Fold Layout */}
            <div className="relative" style={{ perspective: '2000px' }}>
                <div className="flex gap-1 md:gap-1.5 justify-center" style={{ transformStyle: 'preserve-3d' }}>

                    {/* Panel 1: Influencers List */}
                    <div
                        className="w-[180px] md:w-[220px] h-[420px] md:h-[480px] rounded-l-xl overflow-hidden shadow-2xl bg-white"
                        style={{
                            boxShadow: '-6px 0 25px rgba(0,0,0,0.12), 0 8px 30px rgba(0,0,0,0.15)'
                        }}
                    >
                        <TOCLeftPanel
                            influencers={influencers}
                            selectedIndex={selectedIndex}
                            onSelect={handleSelect}
                        />
                    </div>

                    {/* Panel 2: Left Panel (Filters + Profile) */}
                    <div
                        className={`w-[180px] md:w-[220px] h-[420px] md:h-[480px] overflow-hidden shadow-2xl transition-all duration-600 ease-in-out ${isFlipping ? 'opacity-80 scale-[0.98]' : 'opacity-100 scale-100'}`}
                        style={{
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                        }}
                    >
                        <LeftPanel
                            influencer={currentInfluencer}
                            selectedPlatform={selectedPlatform}
                            setSelectedPlatform={setSelectedPlatform}
                            selectedTimeframe={selectedTimeframe}
                            setSelectedTimeframe={setSelectedTimeframe}
                            timeframeOptions={timeframeOptions}
                        />
                    </div>

                    {/* Panel 3: Middle Panel (Performance) */}
                    <div
                        className={`w-[180px] md:w-[220px] h-[420px] md:h-[480px] overflow-hidden shadow-2xl transition-all duration-600 ease-in-out ${isFlipping ? 'opacity-80 scale-[0.98]' : 'opacity-100 scale-100'}`}
                        style={{
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
                        }}
                    >
                        <MiddlePanel influencer={currentInfluencer} />
                    </div>

                    {/* Panel 4: Right Panel (ROI & Win Rate Analysis) */}
                    <div
                        className={`w-[180px] md:w-[220px] h-[420px] md:h-[480px] rounded-r-xl overflow-hidden shadow-2xl transition-all duration-600 ease-in-out ${isFlipping ? 'opacity-80 scale-[0.98]' : 'opacity-100 scale-100'}`}
                        style={{
                            boxShadow: '6px 0 25px rgba(0,0,0,0.12), 0 8px 30px rgba(0,0,0,0.15)'
                        }}
                    >
                        <RightPanel influencer={currentInfluencer} />
                    </div>

                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
                <button
                    onClick={goPrev}
                    disabled={selectedIndex === 0 || isFlipping}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all ${selectedIndex === 0 || isFlipping
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg transform hover:scale-105'
                        }`}
                >
                    <FaChevronLeft className="w-3 h-3" />
                    <span className="hidden sm:inline">Prev</span>
                </button>

                <div className="text-center px-3">
                    <div className="text-sm font-semibold text-gray-800">
                        {selectedIndex + 1} / {influencers.length}
                    </div>
                </div>

                <button
                    onClick={goNext}
                    disabled={selectedIndex >= influencers.length - 1 || isFlipping}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all ${selectedIndex >= influencers.length - 1 || isFlipping
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg transform hover:scale-105'
                        }`}
                >
                    <span className="hidden sm:inline">Next</span>
                    <FaChevronRight className="w-3 h-3" />
                </button>
            </div>

            {/* Quick Navigation - Influencer Thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full px-4 py-2 custom-scrollbar">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const container = document.getElementById('flipbook-thumbnail-container');
                            if (container) container.scrollBy({ left: -150, behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded-full bg-white shadow-md border hover:bg-gray-50 text-gray-600 transition-all z-10"
                    >
                        <FaChevronLeft className="w-2.5 h-2.5" />
                    </button>

                    <div
                        id="flipbook-thumbnail-container"
                        className="flex items-center gap-1.5 overflow-x-auto max-w-[250px] sm:max-w-[350px] md:max-w-[500px] scrollbar-hide scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {influencers.map((inf, idx) => (
                            <button
                                key={inf.id}
                                onClick={() => handleSelect(idx)}
                                className={`flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${idx === selectedIndex
                                    ? 'border-blue-500 ring-2 ring-blue-300 scale-110'
                                    : 'border-gray-300 hover:border-blue-400'
                                    }`}
                                title={inf.name}
                            >
                                {inf.platform === "YouTube" && inf.channel_thumbnails?.high?.url ? (
                                    <Image
                                        src={inf.channel_thumbnails.high.url}
                                        alt={inf.name || ""}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                                        {inf.name?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            const container = document.getElementById('flipbook-thumbnail-container');
                            if (container) container.scrollBy({ left: 150, behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded-full bg-white shadow-md border hover:bg-gray-50 text-gray-600 transition-all z-10"
                    >
                        <FaChevronRight className="w-2.5 h-2.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Export Component
export default function InfluencerFlipbook() {
    const [selectedPlatform, setSelectedPlatform] = useState("youtube");
    const [youtubeInfluencers, setYoutubeInfluencers] = useState([]);
    const [telegramInfluencers, setTelegramInfluencers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter states - only Source and Holding Period
    const [selectedTimeframe, setSelectedTimeframe] = useState("180_days");

    // Default year for API
    const selectedYear = useMemo(() => {
        const d = new Date();
        if (d.getMonth() < 3) {
            return (d.getFullYear() - 1).toString();
        }
        return d.getFullYear().toString();
    }, []);

    // API parameters
    const apiParams = useMemo(() => ({
        rating: "3",
        timeframe: selectedTimeframe,
        year: selectedYear
    }), [selectedTimeframe, selectedYear]);

    // Fetch data functions
    const fetchYouTubeData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(apiParams);
            const res = await fetch(`/api/youtube-data?${params.toString()}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.results)) {
                const sortedResults = [...data.results].sort((a, b) => {
                    const rankA = a.rank || 999999;
                    const rankB = b.rank || 999999;
                    return rankA - rankB;
                });
                setYoutubeInfluencers(sortedResults);
            } else {
                setYoutubeInfluencers([]);
            }
        } catch (err) {
            console.error("Failed to fetch YouTube data:", err);
            setYoutubeInfluencers([]);
        } finally {
            setLoading(false);
        }
    }, [apiParams]);

    const fetchTelegramData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(apiParams);
            const res = await fetch(`/api/telegram-data?${params.toString()}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.results)) {
                const sortedResults = [...data.results].sort((a, b) => {
                    const rankA = a.rank || 999999;
                    const rankB = b.rank || 999999;
                    return rankA - rankB;
                });
                setTelegramInfluencers(sortedResults);
            } else {
                setTelegramInfluencers([]);
            }
        } catch (err) {
            console.error("Failed to fetch Telegram data:", err);
            setTelegramInfluencers([]);
        } finally {
            setLoading(false);
        }
    }, [apiParams]);

    useEffect(() => {
        if (selectedPlatform === "youtube") {
            fetchYouTubeData();
        } else if (selectedPlatform === "telegram") {
            fetchTelegramData();
        }
    }, [selectedPlatform, fetchYouTubeData, fetchTelegramData]);

    // Get filtered influencers
    const getFilteredInfluencers = () => {
        let influencers;

        if (selectedPlatform === "youtube") {
            influencers = youtubeInfluencers.map((ch) => ({
                id: ch.channel_id,
                name: ch.influencer_name,
                platform: "YouTube",
                subs: ch.subs,
                rank: ch.rank,
                channel_thumbnails: ch.channel_thumbnails,
                prob_weighted_returns: ch.prob_weighted_returns || 0,
                win_percentage: ch.win_percentage || 0,
                price_counts: ch.price_counts || 0,
                ai_overall_score: ch.ai_overall_score || 0,
                final_score: ch.final_score || 0,
                current_rating: ch.current_rating || 0,
                gemini_summary: ch.gemini_summary || '',
                star_rating_yearly: ch.star_rating_yearly || {},
                score_yearly_timeframes: ch.score_yearly_timeframes || {},
                ai_scoring_yearly: ch.ai_scoring_yearly || {},
                last_post_date: ch.last_post_date || '',
                last_post_date_string: ch.last_post_date_string || '',
                last_post_time: ch.last_post_time || '',
            }));
        } else if (selectedPlatform === "telegram") {
            influencers = telegramInfluencers.map((tg) => ({
                id: tg.channel_id || tg.id,
                name: tg.influencer_name && tg.influencer_name !== "N/A" ? tg.influencer_name : (tg.channel_id || "Unknown Channel"),
                platform: "Telegram",
                subs: tg.subscribers || tg.subs || 0,
                rank: tg.rank,
                channel_thumbnails: tg.channel_thumbnails,
                prob_weighted_returns: tg.prob_weighted_returns || 0,
                win_percentage: tg.win_percentage || 0,
                price_counts: tg.price_counts || 0,
                ai_overall_score: tg.ai_overall_score || 0,
                final_score: tg.final_score || 0,
                current_rating: tg.current_rating || 0,
                gemini_summary: tg.gemini_summary || '',
                star_rating_yearly: tg.star_rating_yearly || {},
                score_yearly_timeframes: tg.score_yearly_timeframes || {},
                ai_scoring_yearly: tg.ai_scoring_yearly || {},
                last_post_date: tg.last_post_date || '',
                last_post_date_string: tg.last_post_date_string || '',
                last_post_time: tg.last_post_time || '',
            }));
        } else {
            influencers = [];
        }

        return influencers;
    };

    const filteredInfluencers = getFilteredInfluencers();
    const timeframeOptions = getDynamicTimeframeOptions(selectedYear);

    return (
        <div className="py-6">
            {/* Custom Animations */}
            <style jsx global>{`
        @keyframes flip-in-left {
          0% { transform: rotateY(-90deg); opacity: 0; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
        @keyframes flip-out-left {
          0% { transform: rotateY(0deg); opacity: 1; }
          100% { transform: rotateY(-90deg); opacity: 0; }
        }
        @keyframes flip-in-right {
          0% { transform: rotateY(90deg); opacity: 0; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
        @keyframes flip-out-right {
          0% { transform: rotateY(0deg); opacity: 1; }
          100% { transform: rotateY(90deg); opacity: 0; }
        }
        .animate-flip-in-left { animation: flip-in-left 0.6s ease-in-out; }
        .animate-flip-out-left { animation: flip-out-left 0.6s ease-in-out; }
        .animate-flip-in-right { animation: flip-in-right 0.6s ease-in-out; }
        .animate-flip-out-right { animation: flip-out-right 0.6s ease-in-out; }
        .duration-600 { transition-duration: 600ms; }

        /* Custom Scrollbar for Influencers List */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>

            {/* Flipbook Container */}
            <div className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-[500px]">
                        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-500 border-t-4 border-t-purple-500"></div>
                    </div>
                ) : (
                    <FourFoldFlipbook
                        influencers={filteredInfluencers}
                        selectedPlatform={selectedPlatform}
                        setSelectedPlatform={setSelectedPlatform}
                        selectedTimeframe={selectedTimeframe}
                        setSelectedTimeframe={setSelectedTimeframe}
                        timeframeOptions={timeframeOptions}
                    />
                )}
            </div>
        </div>
    );
}
