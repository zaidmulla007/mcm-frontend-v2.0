"use client";
import { useState, useEffect } from "react";
import moment from "moment-timezone";

export default function YouTubeTelegramDataTable({ useLocalTime: propUseLocalTime = false }) {
    const [selectedPlatform, setSelectedPlatform] = useState("Combined");
    const [selectedCoinType, setSelectedCoinType] = useState("top_coins");
    const [combinedData, setCombinedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [nextUpdate, setNextUpdate] = useState(null);
    const useLocalTime = propUseLocalTime;

    const [expandedTables, setExpandedTables] = useState({
        "6hrs": false,
        "24hrs": false,
        "7days": false,
        "30days": false
    });

    const fetchCombinedData = async () => {
        try {
            const response = await fetch(`/api/admin/strategyyoutubedata/ytandtg`);
            const data = await response.json();
            setCombinedData(data);

            if (data && data.resultsByTimeframe && data.resultsByTimeframe["6hrs"] && data.resultsByTimeframe["6hrs"].dateRange) {
                const toTimeStr = data.resultsByTimeframe["6hrs"].dateRange.to;
                const [datePart, timePart] = toTimeStr.split(' ');
                const [year, month, day] = datePart.split('-').map(Number);
                const [hours, minutes, seconds] = timePart.split(':').map(Number);

                const lastUpdatedTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
                setLastUpdated(lastUpdatedTime);

                const nextUpdateTime = new Date(lastUpdatedTime);
                nextUpdateTime.setUTCHours(nextUpdateTime.getUTCHours() + 6);
                setNextUpdate(nextUpdateTime);
            }

            console.log('API Response:', data);
        } catch (error) {
            console.error('Error fetching combined data:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await fetchCombinedData();
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        setExpandedTables({
            "6hrs": false,
            "24hrs": false,
            "7days": false,
            "30days": false
        });
    }, [selectedPlatform, selectedCoinType]);

    const formatDateStringDisplay = (dateStr) => {
        if (!dateStr) return "N/A";

        const date = moment(dateStr).utc();
        let momentDate;
        let locationDisplay = '';

        if (useLocalTime) {
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            momentDate = date.tz(userTimeZone);
            const cityName = userTimeZone.split('/').pop().replace(/_/g, ' ');
            locationDisplay = ` (${cityName})`;
        } else {
            momentDate = date.utc();
            locationDisplay = ' UTC';
        }

        return `${momentDate.format('ddd DD MMM hh:mm A')}${locationDisplay}`;
    };

    const getTimeframeData = (timeframe, coinType) => {
        if (!combinedData || !combinedData.resultsByTimeframe || !combinedData.resultsByTimeframe[timeframe]) {
            return [];
        }

        const timeframeData = combinedData.resultsByTimeframe[timeframe];
        let coins = [];

        if (timeframeData.all_coins) {
            coins = [...timeframeData.all_coins];
        }

        if (timeframeData.mem_coins) {
            coins = [...coins, ...timeframeData.mem_coins];
        }

        if (coinType === "meme_coins") {
            coins = coins.filter(coin => coin.mem_coin === true);
        } else {
            coins = coins.filter(coin => coin.mem_coin !== true);
        }

        if (selectedPlatform === "YouTube") {
            coins = coins.filter(coin => (coin.yt_total_mentions || 0) > 0);
        } else if (selectedPlatform === "Telegram") {
            coins = coins.filter(coin => (coin.tg_total_mentions || 0) > 0);
        } else {
            coins = coins.filter(coin => (coin.total_mentions || 0) > 0);
        }

        coins.sort((a, b) => {
            const aMentions = selectedPlatform === "YouTube" ? (a.yt_total_mentions || 0) :
                selectedPlatform === "Telegram" ? (a.tg_total_mentions || 0) :
                    (a.total_mentions || 0);
            const bMentions = selectedPlatform === "YouTube" ? (b.yt_total_mentions || 0) :
                selectedPlatform === "Telegram" ? (b.tg_total_mentions || 0) :
                    (b.total_mentions || 0);
            return bMentions - aMentions;
        });

        return coins;
    };

    const toggleExpanded = (timeframe) => {
        setExpandedTables(prev => ({
            ...prev,
            [timeframe]: !prev[timeframe]
        }));
    };

    const platformOptions = [
        { key: "Combined", label: "Combined" },
        { key: "YouTube", label: "YouTube" },
        { key: "Telegram", label: "Telegram" }
    ];

    const coinTypeOptions = [
        { key: "top_coins", label: "All Coins" },
        { key: "meme_coins", label: "Meme Coins" }
    ];

    const getSentimentData = (coin) => {
        if (selectedPlatform === "YouTube") {
            return {
                bullish: coin.yt_bullish_percent || 0,
                bearish: coin.yt_bearish_percent || 0,
                mentions: coin.yt_total_mentions || 0,
                bullish_short_term: coin.yt_bullish_short_term_percent || 0,
                bullish_long_term: coin.yt_bullish_long_term_percent || 0,
                bearish_short_term: coin.yt_bearish_short_term_percent || 0,
                bearish_long_term: coin.yt_bearish_long_term_percent || 0,
                bullish_short_term_count: coin.yt_bullish_short_term || 0,
                bullish_long_term_count: coin.yt_bullish_long_term || 0,
                bearish_short_term_count: coin.yt_bearish_short_term || 0,
                bearish_long_term_count: coin.yt_bearish_long_term || 0,
            };
        } else if (selectedPlatform === "Telegram") {
            return {
                bullish: coin.tg_bullish_percent || 0,
                bearish: coin.tg_bearish_percent || 0,
                mentions: coin.tg_total_mentions || 0,
                bullish_short_term: coin.tg_bullish_short_term_percent || 0,
                bullish_long_term: coin.tg_bullish_long_term_percent || 0,
                bearish_short_term: coin.tg_bearish_short_term_percent || 0,
                bearish_long_term: coin.tg_bearish_long_term_percent || 0,
                bullish_short_term_count: coin.tg_bullish_short_term || 0,
                bullish_long_term_count: coin.tg_bullish_long_term || 0,
                bearish_short_term_count: coin.tg_bearish_short_term || 0,
                bearish_long_term_count: coin.tg_bearish_long_term || 0,
            };
        } else {
            return {
                bullish: coin.bullish_percent || 0,
                bearish: coin.bearish_percent || 0,
                mentions: coin.total_mentions || 0,
                bullish_short_term: coin.yt_tg_bullish_short_term_percent || 0,
                bullish_long_term: coin.yt_tg_bullish_long_term_percent || 0,
                bearish_short_term: coin.yt_tg_bearish_short_term_percent || 0,
                bearish_long_term: coin.yt_tg_bearish_long_term_percent || 0,
                bullish_short_term_count: coin.yt_tg_bullish_short_term || 0,
                bullish_long_term_count: coin.yt_tg_bullish_long_term || 0,
                bearish_short_term_count: coin.yt_tg_bearish_short_term || 0,
                bearish_long_term_count: coin.yt_tg_bearish_long_term || 0,
            };
        }
    };

    const renderTable = (timeframe, title) => {
        const allCoins = getTimeframeData(timeframe, selectedCoinType).slice(0, 10);
        const isExpanded = expandedTables[timeframe];
        const coins = isExpanded ? allCoins : allCoins.slice(0, 5);
        const hasMore = allCoins.length > 5;

        const getFromDateForTimeframe = () => {
            if (combinedData && combinedData.resultsByTimeframe &&
                combinedData.resultsByTimeframe[timeframe] &&
                combinedData.resultsByTimeframe[timeframe].dateRange) {
                const fromTimeStr = combinedData.resultsByTimeframe[timeframe].dateRange.to;
                return formatDateStringDisplay(fromTimeStr);
            }
            return "N/A";
        };

        return (
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl p-6">
                <div className="text-center mb-4">
                    <h3 className="text-md font-bold text-black mb-2">{title}</h3>
                    <div className="text-xs text-black">
                        {getFromDateForTimeframe()}
                    </div>
                </div>

                <div className="overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                    <table className="w-full table-fixed">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-center py-2 px-2 text-black font-semibold text-md w-[45%]">Coin</th>
                                <th className="text-center py-2 px-2 text-black font-semibold text-md w-[55%]">Outlook</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coins.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="text-center py-8 text-black">No data available</td>
                                </tr>
                            ) : (
                                coins.map((coin, index) => {
                                    const sentimentData = getSentimentData(coin);

                                    const shortTermBullish = sentimentData.bullish_short_term;
                                    const shortTermBearish = sentimentData.bearish_short_term;
                                    const shortTermPosts = sentimentData.bullish_short_term_count + sentimentData.bearish_short_term_count;

                                    const longTermBullish = sentimentData.bullish_long_term;
                                    const longTermBearish = sentimentData.bearish_long_term;
                                    const longTermPosts = sentimentData.bullish_long_term_count + sentimentData.bearish_long_term_count;

                                    const shortTermBallPosition = shortTermBullish >= shortTermBearish ? shortTermBullish : (100 - shortTermBearish);
                                    const longTermBallPosition = longTermBullish >= longTermBearish ? longTermBullish : (100 - longTermBearish);

                                    return (
                                        <tr key={index} className="border-b border-gray-800 hover:bg-gradient-to-br hover:from-purple-900/20 hover:to-blue-900/20 transition-all duration-300">
                                            <td className="py-3 px-2 w-[45%]">
                                                <div className="flex flex-col items-center text-center space-y-1">
                                                    <img
                                                        src={coin.image_small || coin.image_thumb}
                                                        alt={coin.symbol}
                                                        className="w-12 h-12 rounded-full mb-1"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${coin.symbol}&background=ED8936&color=fff&size=48`;
                                                        }}
                                                    />
                                                    <div className="text-sm text-black font-bold">
                                                        {coin.symbol?.toUpperCase()}
                                                    </div>
                                                    <div className="text-xs text-black">
                                                        {coin.coin_name}
                                                    </div>
                                                    <div className="text-xs text-black font-medium">
                                                        {sentimentData.mentions} Posts
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 w-[55%]">
                                                <div className="space-y-3">
                                                    {/* Short Term */}
                                                    <div>
                                                        <div className="text-xs text-black font-medium mb-2 text-center">Short Term {shortTermPosts} Posts</div>
                                                        <div className="win-loss-container">
                                                            <div className="segmented-bar-container">
                                                                <div className="segmented-bar-background">
                                                                    <div className="segment segment-red" />
                                                                    <div className="segment segment-yellow" />
                                                                    <div className="segment segment-green" />
                                                                </div>
                                                                <div
                                                                    className="percentage-ball"
                                                                    style={{ left: `${(shortTermBallPosition / 100) * 100}%` }}
                                                                />
                                                            </div>
                                                            <div className={`font-semibold text-sm ${shortTermBullish >= shortTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                                                {(shortTermBullish >= shortTermBearish ? shortTermBullish : shortTermBearish).toFixed(0)}% {shortTermBullish >= shortTermBearish ? 'Bullish' : 'Bearish'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Long Term */}
                                                    <div>
                                                        <div className="text-xs text-black font-medium mb-2 text-center">Long Term {longTermPosts} Posts</div>
                                                        <div className="win-loss-container">
                                                            <div className="segmented-bar-container">
                                                                <div className="segmented-bar-background">
                                                                    <div className="segment segment-red" />
                                                                    <div className="segment segment-yellow" />
                                                                    <div className="segment segment-green" />
                                                                </div>
                                                                <div
                                                                    className="percentage-ball"
                                                                    style={{ left: `${(longTermBallPosition / 100) * 100}%` }}
                                                                />
                                                            </div>
                                                            <div className={`font-semibold text-sm ${longTermBullish >= longTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                                                {(longTermBullish >= longTermBearish ? longTermBullish : longTermBearish).toFixed(0)}% {longTermBullish >= longTermBearish ? 'Bullish' : 'Bearish'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {hasMore && (
                    <div className="text-center mt-4">
                        <button
                            onClick={() => toggleExpanded(timeframe)}
                            className="text-blue-700 hover:text-blue-800 font-semibold text-sm cursor-pointer underline"
                        >
                            {isExpanded ? "Show Less" : "Read More"}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                    <div className="text-gray-900 text-lg font-semibold mb-2">Loading Data Table...</div>
                    <div className="text-purple-600 text-sm">Fetching YouTube & Telegram analytics</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mt-10">
                    <span className="text-black">
                        Trending Coins
                    </span>
                </h2>
            </div>

            {/* Channel and Coin Type Dropdowns */}
            <div className="flex justify-center">
                <div className="bg-white rounded-2xl overflow-hidden shadow-2xl p-6">
                    <div className="flex items-center gap-6">
                        {/* Channel Dropdown */}
                        <div className="flex items-center gap-3">
                            <label className="text-lg text-black font-semibold">Channel:</label>
                            <select
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-gray-400 min-w-[150px]"
                            >
                                {platformOptions.map((option) => (
                                    <option key={option.key} value={option.key} className="bg-white text-black">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Coin Type Dropdown */}
                        <div className="flex items-center gap-3">
                            <label className="text-lg text-black font-semibold">Coins:</label>
                            <select
                                value={selectedCoinType}
                                onChange={(e) => setSelectedCoinType(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-gray-400 min-w-[150px]"
                            >
                                {coinTypeOptions.map((option) => (
                                    <option key={option.key} value={option.key} className="bg-white text-black">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Source Icons */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-black font-medium">Source: </span>
                            <div className="flex items-center gap-2">
                                {selectedPlatform === "Combined" ? (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-900">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                        <span className="text-sm text-black font-medium">YouTube</span>

                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-900">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                        </svg>
                                        <span className="text-sm text-black font-medium">Telegram</span>
                                    </>
                                ) : selectedPlatform === "YouTube" ? (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-900">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                        <span className="text-sm text-black font-medium">YouTube</span>
                                    </>
                                ) : selectedPlatform === "Telegram" ? (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-900">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                        </svg>
                                        <span className="text-sm text-black font-medium">Telegram</span>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Four Tables in One Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {renderTable("6hrs", "Last 6 Hours")}
                {renderTable("24hrs", "Last 24 Hours")}
                {renderTable("7days", "Last 7 Days")}
                {renderTable("30days", "Last 30 Days")}
            </div>

            {/* CSS Styles for Segmented Bars */}
            <style jsx>{`
                .win-loss-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .segmented-bar-container {
                    position: relative;
                    width: 100px;
                    height: 8px;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .segmented-bar-background {
                    display: flex;
                    width: 100%;
                    height: 100%;
                }

                .segment {
                    flex: 1;
                    height: 100%;
                }

                .segment-red {
                    background-color: #ef4444;
                }

                .segment-yellow {
                    background-color: #f59e0b;
                }

                .segment-green {
                    background-color: #10b981;
                }

                .percentage-ball {
                    position: absolute;
                    top: -2px;
                    width: 12px;
                    height: 12px;
                    background-color: white;
                    border: 2px solid #6b7280;
                    border-radius: 50%;
                    transform: translateX(-50%);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </div>
    );
}