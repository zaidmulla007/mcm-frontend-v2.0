"use client";
import { useState, useEffect } from "react";
import moment from "moment-timezone";

export default function YouTubeTelegramDataTableStack({ useLocalTime: propUseLocalTime = false }) {
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

        // Parse the date string as UTC explicitly
        const date = moment.utc(dateStr);
        let momentDate;
        let locationDisplay = '';

        if (useLocalTime) {
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            momentDate = date.tz(userTimeZone);
            const cityName = userTimeZone.split('/').pop().replace(/_/g, ' ');
            locationDisplay = ` ${cityName}`;
        } else {
            momentDate = date;
            locationDisplay = ' UTC';
        }

        return `${momentDate.format('ddd DD MMM hh:mm A')}${locationDisplay}`;
    };

    const formatDate = (date) => {
        if (!date) return "N/A";

        const momentDate = moment(date);
        let formattedDate;
        let locationDisplay = '';

        if (useLocalTime) {
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const localDate = momentDate.tz(userTimeZone);
            const cityName = userTimeZone.split('/').pop().replace(/_/g, ' ');
            locationDisplay = ` ${cityName}`;
            formattedDate = localDate.format('ddd DD MMM hh:mm A');
        } else {
            formattedDate = momentDate.utc().format('ddd DD MMM hh:mm A');
            locationDisplay = ' UTC';
        }

        return `${formattedDate}${locationDisplay}`;
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
                const fromTimeStr = combinedData.resultsByTimeframe[timeframe].dateRange.from;
                return formatDateStringDisplay(fromTimeStr);
            }
            return "N/A";
        };

        return (
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                    <h3 className="text-xl font-bold text-white text-center mb-1">{title}</h3>
                    {/* <div className="text-xs text-white text-center">
                        {getFromDateForTimeframe()}
                    </div> */}
                </div>

                <div className="p-6 overflow-x-auto overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
                    <table className="w-full min-w-full table-fixed">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-center py-2 px-2 text-black font-semibold text-md w-1/2">Coin</th>
                                <th className="text-center py-2 px-2 text-black font-semibold text-md w-1/2">Outlook</th>
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

                                    // Calculate the percentage to display
                                    const shortTermPercentage = shortTermPosts > 0
                                        ? (shortTermBullish >= shortTermBearish ? shortTermBullish : shortTermBearish).toFixed(0)
                                        : 0;

                                    const longTermPercentage = longTermPosts > 0
                                        ? (longTermBullish >= longTermBearish ? longTermBullish : longTermBearish).toFixed(0)
                                        : 0;

                                    // Determine colors based on sentiment
                                    // Bullish = green, Bearish = red, No posts = gray
                                    const shortTermColor = shortTermPosts > 0
                                        ? (shortTermBullish >= shortTermBearish ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")
                                        : "bg-gray-100 text-gray-600";

                                    const longTermColor = longTermPosts > 0
                                        ? (longTermBullish >= longTermBearish ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")
                                        : "bg-gray-100 text-gray-600";

                                    return (
                                        <tr key={index} className="border-b border-gray-800">
                                            {/* Coin Column */}
                                            <td className="py-4 px-4 w-1/2">
                                                <div className="flex flex-col items-center text-center">
                                                    <img
                                                        src={coin.image_small || coin.image_thumb}
                                                        alt={coin.symbol}
                                                        className="w-14 h-14 rounded-full mb-2"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${coin.symbol}&background=ED8936&color=fff&size=56`;
                                                        }}
                                                    />
                                                    <div className="text-sm text-black font-bold mb-1">
                                                        {coin.symbol ? coin.symbol.charAt(0).toUpperCase() + coin.symbol.slice(1).toLowerCase() : ''}
                                                    </div>
                                                    <div className="text-xs text-black">
                                                        {sentimentData.mentions} posts
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Outlook Column - Stacked Indicators */}
                                            <td className="py-4 px-4 w-1/2">
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    {/* Short Term */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${shortTermColor}`}>
                                                            <span className="font-bold text-sm">{shortTermPercentage}%</span>
                                                        </div>
                                                        <span className="text-xs text-gray-600 mt-1">
                                                            ST:{shortTermPosts > 0 ? `${shortTermPosts} posts` : "0 posts"}
                                                        </span>
                                                    </div>

                                                    {/* Long Term */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${longTermColor}`}>
                                                            <span className="font-bold text-sm">{longTermPercentage}%</span>
                                                        </div>
                                                        <span className="text-xs text-gray-600 mt-1">
                                                            LT:{longTermPosts > 0 ? `${longTermPosts} posts` : "0 posts"}
                                                        </span>
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
                    <div className="flex justify-center items-center mb-2">
                        <button
                            onClick={() => toggleExpanded(timeframe)}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white font-semibold text-sm cursor-pointer rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
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
        <div className="space-y-2">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mt-0 text-black">
                    Trending Coins
                </h2>
                <p className="text-xl text-gray-600 mt-1">
                    {lastUpdated ? formatDate(lastUpdated) : "N/A"}
                </p>
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
        </div>
    );
}