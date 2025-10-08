"use client";
import { useState, useEffect } from "react";
import { FaEye } from "react-icons/fa";
import moment from "moment-timezone";

export default function YouTubeTelegramDataTable({ useLocalTime: propUseLocalTime = false }) {
    const [selectedPlatform, setSelectedPlatform] = useState("Combined");
    const [selectedCoinType, setSelectedCoinType] = useState("top_coins");
    const [combinedData, setCombinedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [nextUpdate, setNextUpdate] = useState(null);
    const useLocalTime = propUseLocalTime;

    // Fetch combined YouTube and Telegram data from API
    const fetchCombinedData = async () => {
        try {
            const response = await fetch(`/api/admin/strategyyoutubedata/ytandtg`);
            //https://mcmapi.showmyui.com:3035/api/admin/youtubedata/ytandtg
            const data = await response.json();
            setCombinedData(data);

            // Extract and set the last updated time from the API response
            if (data && data.resultsByTimeframe && data.resultsByTimeframe["6hrs"] && data.resultsByTimeframe["6hrs"].dateRange) {
                // Parse the "to" date string directly as UTC
                const toTimeStr = data.resultsByTimeframe["6hrs"].dateRange.to;
                const [datePart, timePart] = toTimeStr.split(' ');
                const [year, month, day] = datePart.split('-').map(Number);
                const [hours, minutes, seconds] = timePart.split(':').map(Number);

                // Create Date object using UTC values
                const lastUpdatedTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
                setLastUpdated(lastUpdatedTime);

                // Calculate next update time by adding 6 hours in UTC
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

    // Format date string to display string (for timeframe headers)
    const formatDateStringDisplay = (dateStr) => {
        if (!dateStr) return "N/A";

        // Parse the date string and create moment object
        const date = moment(dateStr).utc();
        let momentDate;
        let locationDisplay = '';

        if (useLocalTime) {
            // Use local time
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            momentDate = date.tz(userTimeZone);
            
            // Extract city name only
            const cityName = userTimeZone.split('/').pop().replace(/_/g, ' ');
            locationDisplay = ` (${cityName})`;
        } else {
            // Use UTC time
            momentDate = date.utc();
            locationDisplay = ' UTC';
        }

        return `${momentDate.format('ddd DD MMM hh:mm A')}${locationDisplay}`;
    };

    // Format date to display string for header display (UTC or local time)
    const formatDisplayDate = (date, showTimezone = true) => {
        if (!date) return "N/A";

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let dayName, day, month, year, hours, minutes, displayHours, ampm, timezone;

        if (useLocalTime) {
            // Use local time
            dayName = days[date.getDay()];
            day = date.getDate();
            month = months[date.getMonth()];
            year = date.getFullYear();
            hours = date.getHours();
            minutes = date.getMinutes();
            ampm = hours >= 12 ? 'PM' : 'AM';
            displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            
            // Get timezone abbreviation (e.g., IST, PST, EST)
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            if (userTimezone === 'Asia/Kolkata' || userTimezone === 'Asia/Calcutta') {
                timezone = 'IST';
            } else {
                const formatter = new Intl.DateTimeFormat('en', {
                    timeZoneName: 'short',
                    timeZone: userTimezone
                });
                const parts = formatter.formatToParts(date);
                let rawTimezone = parts.find(part => part.type === 'timeZoneName')?.value;
                
                // Replace GMT+XX:XX format with proper abbreviations
                if (rawTimezone && rawTimezone.includes('GMT+05:30')) {
                    timezone = 'IST';
                } else {
                    timezone = rawTimezone || userTimezone;
                }
            }
        } else {
            // Use UTC time
            dayName = days[date.getUTCDay()];
            day = date.getUTCDate();
            month = months[date.getUTCMonth()];
            year = date.getUTCFullYear();
            hours = date.getUTCHours();
            minutes = date.getUTCMinutes();
            ampm = hours >= 12 ? 'PM' : 'AM';
            displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            timezone = 'UTC';
        }

        const formattedHours = displayHours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const timezoneDisplay = showTimezone ? ` ${timezone}` : '';

        return `${dayName} ${day} ${month} ${year} ${formattedHours}:${formattedMinutes} ${ampm}${timezoneDisplay}`;
    };

    // Legacy function for backward compatibility
    const formatUTCDate = (date) => {
        return formatDisplayDate(date, true);
    };

    // Get data for specific timeframe and coin type
    const getTimeframeData = (timeframe, coinType) => {
        if (!combinedData || !combinedData.resultsByTimeframe || !combinedData.resultsByTimeframe[timeframe]) {
            return [];
        }

        const timeframeData = combinedData.resultsByTimeframe[timeframe];
        let coins = [];

        // Get all coins data
        if (timeframeData.all_coins) {
            coins = [...timeframeData.all_coins];
        }

        // If meme coins are available separately, add them
        if (timeframeData.mem_coins) {
            coins = [...coins, ...timeframeData.mem_coins];
        }

        // Filter by coin type
        if (coinType === "meme_coins") {
            coins = coins.filter(coin => coin.mem_coin === true);
        } else {
            coins = coins.filter(coin => coin.mem_coin !== true);
        }

        // Filter out coins with zero mentions for the selected platform
        if (selectedPlatform === "YouTube") {
            coins = coins.filter(coin => (coin.yt_total_mentions || 0) > 0);
        } else if (selectedPlatform === "Telegram") {
            coins = coins.filter(coin => (coin.tg_total_mentions || 0) > 0);
        } else {
            coins = coins.filter(coin => (coin.total_mentions || 0) > 0);
        }

        // Sort by total mentions in descending order
        coins.sort((a, b) => {
            const aMentions = selectedPlatform === "YouTube" ? (a.yt_total_mentions || 0) :
                selectedPlatform === "Telegram" ? (a.tg_total_mentions || 0) :
                    (a.total_mentions || 0);
            const bMentions = selectedPlatform === "YouTube" ? (b.yt_total_mentions || 0) :
                selectedPlatform === "Telegram" ? (b.tg_total_mentions || 0) :
                    (b.total_mentions || 0);
            return bMentions - aMentions;
        });

        return coins.slice(0, 10); // Show top 10
    };

    // Platform options
    const platformOptions = [
        { key: "Combined", label: "Combined" },
        { key: "YouTube", label: "YouTube" },
        { key: "Telegram", label: "Telegram" }
    ];

    // Coin type options
    const coinTypeOptions = [
        { key: "top_coins", label: "All Coins" },
        { key: "meme_coins", label: "Meme Coins" }
    ];

    // Get sentiment data based on selected platform
    const getSentimentData = (coin) => {
        if (selectedPlatform === "YouTube") {
            return {
                bullish: coin.yt_bullish_percent || 0,
                bearish: coin.yt_bearish_percent || 0,
                mentions: coin.yt_total_mentions || 0
            };
        } else if (selectedPlatform === "Telegram") {
            return {
                bullish: coin.tg_bullish_percent || 0,
                bearish: coin.tg_bearish_percent || 0,
                mentions: coin.tg_total_mentions || 0
            };
        } else {
            return {
                bullish: coin.bullish_percent || 0,
                bearish: coin.bearish_percent || 0,
                mentions: coin.total_mentions || 0
            };
        }
    };

    // Render individual table
    const renderTable = (timeframe, title) => {
        const coins = getTimeframeData(timeframe, selectedCoinType);

        // Get the from date for this timeframe
        const getFromDateForTimeframe = () => {
            if (combinedData && combinedData.resultsByTimeframe &&
                combinedData.resultsByTimeframe[timeframe] &&
                combinedData.resultsByTimeframe[timeframe].dateRange) {
                const fromTimeStr = combinedData.resultsByTimeframe[timeframe].dateRange.from;
                // Use the formatDateStringDisplay function to respect useLocalTime setting
                return formatDateStringDisplay(fromTimeStr);
            }
            return "N/A";
        };

        return (
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl p-6">
                <div className="text-center mb-4">
                    <h3 className="text-md font-bold text-white mb-2">{title}</h3>
                    <div className="text-xs text-white-400">
                        {getFromDateForTimeframe()}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-center py-2 px-2 text-white-300 font-semibold text-sm">Coin</th>
                                <th className="text-center py-2 px-2 text-white-300 font-semibold text-sm">Sentiment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coins.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="text-center py-8 text-gray-400">No data available</td>
                                </tr>
                            ) : (
                                coins.map((coin, index) => {
                                    const sentimentData = getSentimentData(coin);
                                    const isBullish = sentimentData.bullish >= sentimentData.bearish;
                                    const dominantPercentage = isBullish ? sentimentData.bullish : sentimentData.bearish;

                                    return (
                                        <tr key={index} className="border-b border-gray-800 hover:bg-gradient-to-br hover:from-purple-900/20 hover:to-blue-900/20 transition-all duration-300">
                                            <td className="py-3 px-2">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-bold text-white">
                                                        {coin.symbol?.toUpperCase()}
                                                    </div>
                                                    <div className="text-xs text-white-400">
                                                        {coin.coin_name}
                                                    </div>
                                                    <div className="text-xs text-white-500">
                                                        {sentimentData.mentions} Posts
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <div className="win-loss-container">
                                                    {/* Segmented Bar */}
                                                    <div className="segmented-bar-container">
                                                        <div className="segmented-bar-background">
                                                            <div className="segment segment-red" />
                                                            <div className="segment segment-yellow" />
                                                            <div className="segment segment-green" />
                                                        </div>

                                                        {/* Ball */}
                                                        <div
                                                            className="percentage-ball"
                                                            style={{ left: `${((dominantPercentage - 0) / (100 - 0)) * 86}px` }}
                                                        />
                                                    </div>

                                                    {/* Value Text */}
                                                    <div className={`font-semibold text-sm ${isBullish ? 'text-to-green-recomendations' : 'text-to-red-recomendations'}`}>
                                                        {dominantPercentage.toFixed(0)}% {isBullish ? 'Bullish' : 'Bearish'}
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
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-purple-900 to-blue-900 min-h-screen text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mx-auto mb-4"></div>
                    <div className="text-white text-lg font-semibold mb-2">Loading Data Table...</div>
                    <div className="text-purple-300 text-sm">Fetching YouTube & Telegram analytics</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mt-10">
                    <span className="text-white bg-clip-text text-transparent">
                        Trending Coins
                    </span>
                </h2>
            </div>

            {/* Channel and Coin Type Dropdowns */}
            <div className="flex justify-center">
                <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl p-6">
                    <div className="flex items-center gap-6">
                        {/* Channel Dropdown */}
                        <div className="flex items-center gap-3">
                            <label className="text-lg text-white-300 font-semibold">Channel:</label>
                            <select
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px]"
                            >
                                {platformOptions.map((option) => (
                                    <option key={option.key} value={option.key} className="bg-gray-800 text-gray-200">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Coin Type Dropdown */}
                        <div className="flex items-center gap-3">
                            <label className="text-lg text-white-300 font-semibold">Coins:</label>
                            <select
                                value={selectedCoinType}
                                onChange={(e) => setSelectedCoinType(e.target.value)}
                                className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px]"
                            >
                                {coinTypeOptions.map((option) => (
                                    <option key={option.key} value={option.key} className="bg-gray-800 text-gray-200">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Source Icons */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-white-300 font-medium">Source: </span>
                            <div className="flex items-center gap-2">
                                {selectedPlatform === "Combined" ? (
                                    <>
                                        {/* YouTube SVG Icon */}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                        <span className="text-sm text-white-300">YouTube</span>

                                        {/* Telegram SVG Icon */}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                        </svg>
                                        <span className="text-sm text-white-300">Telegram</span>
                                    </>
                                ) : selectedPlatform === "YouTube" ? (
                                    <>
                                        {/* YouTube SVG Icon */}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                        <span className="text-sm text-white-300">YouTube</span>
                                    </>
                                ) : selectedPlatform === "Telegram" ? (
                                    <>
                                        {/* Telegram SVG Icon */}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                        </svg>
                                        <span className="text-sm text-white-300">Telegram</span>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Four Tables in One Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Last 6 Hours */}
                {renderTable("6hrs", "Last 6 Hours")}

                {/* Last 24 Hours */}
                {renderTable("24hrs", "Last 24 Hours")}

                {/* Last 7 Days */}
                {renderTable("7days", "Last 7 Days")}

                {/* Last 30 Days */}
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