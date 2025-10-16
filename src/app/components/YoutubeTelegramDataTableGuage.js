"use client";
import { useState, useEffect, useRef } from "react";
import { FaEye } from "react-icons/fa";
import moment from "moment-timezone";

// Gradient Doughnut Gauge Component (Full Circle)
const GradientDoughnutGauge = ({ shortValue, longValue, size = 28, label = null }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const outerRadius = size * 1.0;
        const innerRadius = size * 0.69;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate percentages
        const total = shortValue + longValue;
        const shortPercent = total > 0 ? (shortValue / total) * 100 : 0;
        const longPercent = total > 0 ? (longValue / total) * 100 : 0;

        // Define solid colors for bullish (green) and bearish (red)
        const shortColor = '#00a63e'; // Solid green for bullish
        const longColor = '#ff2121'; // Solid red for bearish
        const emptyColor = '#9E9E9E'; // Gray for 0/0

        // Calculate angles
        const startAngle = -Math.PI / 2; // Start from top (12 o'clock)
        const segments = 20;

        // If both values are 0, draw a full gray circle
        if (total === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
            ctx.arc(centerX, centerY, innerRadius, 2 * Math.PI, 0, true);
            ctx.closePath();
            ctx.fillStyle = emptyColor;
            ctx.fill();
        } else {
            // Draw bullish segment (solid green)
            const shortAngle = (shortPercent / 100) * 2 * Math.PI;

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + shortAngle);
            ctx.arc(centerX, centerY, innerRadius, startAngle + shortAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = shortColor;
            ctx.fill();

            // Draw bearish segment (solid red)
            const longStartAngle = startAngle + shortAngle;
            const longAngle = (longPercent / 100) * 2 * Math.PI;

            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, longStartAngle, longStartAngle + longAngle);
            ctx.arc(centerX, centerY, innerRadius, longStartAngle + longAngle, longStartAngle, true);
            ctx.closePath();
            ctx.fillStyle = longColor;
            ctx.fill();
        }

        // Draw center text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (label) {
            // Font sizes - larger for single percentage
            const numberFontSize = size * 0.45;

            // Display percentages with color
            const shortPercentDisplay = Math.round(shortPercent);
            const longPercentDisplay = Math.round(longPercent);

            // If both are 0, display in gray
            if (total === 0) {
                ctx.fillStyle = '#9E9E9E'; // Gray for 0/0
                ctx.font = `bold ${numberFontSize}px Arial, sans-serif`;
                ctx.fillText('0%', centerX, centerY);
            }
            // Determine which percentage is greater and display only that
            else if (shortPercentDisplay >= longPercentDisplay) {
                // Draw bullish percentage in green
                ctx.fillStyle = '#00a63e'; // Green for bullish
                ctx.font = `bold ${numberFontSize}px Arial, sans-serif`;
                ctx.fillText(`${shortPercentDisplay}%`, centerX, centerY);
            } else {
                // Draw bearish percentage in red
                ctx.fillStyle = '#ff2121'; // Red for bearish
                ctx.font = `bold ${numberFontSize}px Arial, sans-serif`;
                ctx.fillText(`${longPercentDisplay}%`, centerX, centerY);
            }
        } else {
            // Draw values with separator
            const totalDigits = shortValue.toString().length + longValue.toString().length;
            let fontSize, spacing;

            if (totalDigits >= 8) {
                fontSize = size * 0.15;
                spacing = size * 0.18;
            } else if (totalDigits >= 6) {
                fontSize = size * 0.18;
                spacing = size * 0.20;
            } else if (totalDigits >= 5) {
                fontSize = size * 0.22;
                spacing = size * 0.22;
            } else if (totalDigits >= 4) {
                fontSize = size * 0.28;
                spacing = size * 0.24;
            } else if (totalDigits >= 3) {
                fontSize = size * 0.32;
                spacing = size * 0.26;
            } else {
                fontSize = size * 0.38;
                spacing = size * 0.28;
            }

            ctx.fillStyle = '#666';
            ctx.font = `bold ${fontSize}px Arial`;

            // Draw short value
            ctx.fillText(`${shortValue}`, centerX - spacing, centerY);

            // Draw separator
            ctx.fillStyle = '#999';
            ctx.font = `bold ${fontSize * 0.9}px Arial`;
            ctx.fillText('|', centerX, centerY);

            // Draw long value
            ctx.fillStyle = '#666';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillText(`${longValue}`, centerX + spacing, centerY);
        }

    }, [shortValue, longValue, size, label]);

    const interpolateColor = (colors, ratio) => {
        if (ratio <= 0) return colors[colors.length - 1];
        if (ratio >= 1) return colors[0];

        const scaledRatio = ratio * (colors.length - 1);
        const index = Math.floor(scaledRatio);
        const localRatio = scaledRatio - index;

        if (index >= colors.length - 1) return colors[colors.length - 1];

        const color1 = hexToRgb(colors[index]);
        const color2 = hexToRgb(colors[index + 1]);

        const r = Math.round(color1.r + (color2.r - color1.r) * localRatio);
        const g = Math.round(color1.g + (color2.g - color1.g) * localRatio);
        const b = Math.round(color1.b + (color2.b - color1.b) * localRatio);

        return `rgb(${r}, ${g}, ${b})`;
    };

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    return (
        <div style={{ width: size * 2, height: size * 2, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas
                ref={canvasRef}
                width={size * 2}
                height={size * 2}
            />
        </div>
    );
};

export default function YoutubeTelegramDataTableGuage({ useLocalTime: propUseLocalTime = false }) {
    const [selectedPlatform, setSelectedPlatform] = useState("Combined");
    const [selectedCoinType, setSelectedCoinType] = useState("top_coins");
    const [combinedData, setCombinedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [nextUpdate, setNextUpdate] = useState(null);
    const useLocalTime = propUseLocalTime;

    // State to track expanded/collapsed state for each timeframe
    const [expandedTables, setExpandedTables] = useState({
        "6hrs": false,
        "24hrs": false,
        "7days": false,
        "30days": false
    });

    // State to track selected term for each timeframe
    const [selectedTerms, setSelectedTerms] = useState({
        "6hrs": "short_term",
        "24hrs": "short_term",
        "7days": "short_term",
        "30days": "short_term"
    });

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

    // Reset expanded state when platform or coin type changes
    useEffect(() => {
        setExpandedTables({
            "6hrs": false,
            "24hrs": false,
            "7days": false,
            "30days": false
        });
    }, [selectedPlatform, selectedCoinType]);

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

        return coins; // Return all coins
    };

    // Toggle expand/collapse for a specific timeframe
    const toggleExpanded = (timeframe) => {
        setExpandedTables(prev => ({
            ...prev,
            [timeframe]: !prev[timeframe]
        }));
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
                mentions: coin.yt_total_mentions || 0,
                bullishCount: coin.yt_bullish_count || 0,
                bearishCount: coin.yt_bearish_count || 0,
                bullishShortTerm: coin.yt_bullish_short_term || 0,
                bullishMidTerm: coin.yt_bullish_mid_term || 0,
                bullishLongTerm: coin.yt_bullish_long_term || 0,
                bearishShortTerm: coin.yt_bearish_short_term || 0,
                bearishMidTerm: coin.yt_bearish_mid_term || 0,
                bearishLongTerm: coin.yt_bearish_long_term || 0
            };
        } else if (selectedPlatform === "Telegram") {
            return {
                bullish: coin.tg_bullish_percent || 0,
                bearish: coin.tg_bearish_percent || 0,
                mentions: coin.tg_total_mentions || 0,
                bullishCount: coin.tg_bullish_count || 0,
                bearishCount: coin.tg_bearish_count || 0,
                bullishShortTerm: coin.tg_bullish_short_term || 0,
                bullishMidTerm: coin.tg_bullish_mid_term || 0,
                bullishLongTerm: coin.tg_bullish_long_term || 0,
                bearishShortTerm: coin.tg_bearish_short_term || 0,
                bearishMidTerm: coin.tg_bearish_mid_term || 0,
                bearishLongTerm: coin.tg_bearish_long_term || 0
            };
        } else {
            return {
                bullish: coin.bullish_percent || 0,
                bearish: coin.bearish_percent || 0,
                mentions: coin.total_mentions || 0,
                bullishCount: coin.bullish_count || 0,
                bearishCount: coin.bearish_count || 0,
                bullishShortTerm: coin.yt_tg_bullish_short_term || 0,
                bullishMidTerm: coin.yt_tg_bullish_mid_term || 0,
                bullishLongTerm: coin.yt_tg_bullish_long_term || 0,
                bearishShortTerm: coin.yt_tg_bearish_short_term || 0,
                bearishMidTerm: coin.yt_tg_bearish_mid_term || 0,
                bearishLongTerm: coin.yt_tg_bearish_long_term || 0
            };
        }
    };


    // Render individual table
    const renderTable = (timeframe, title) => {
        const allCoins = getTimeframeData(timeframe, selectedCoinType).slice(0, 10); // Limit to max 10 records
        const isExpanded = expandedTables[timeframe];
        const coins = isExpanded ? allCoins : allCoins.slice(0, 5);
        const hasMore = allCoins.length > 5;
        const selectedTerm = selectedTerms[timeframe] || "short_term";

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
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl p-6">
                <div className="text-center mb-4 relative">
                    <h3 className="text-md font-bold text-black mb-2">{title}</h3>
                    <div className="text-xs text-black">
                        {getFromDateForTimeframe()}
                    </div>
                    {/* Expand/Collapse Button */}
                    {hasMore && (
                        <button
                            onClick={() => toggleExpanded(timeframe)}
                            className="absolute top-0 right-0 text-lg text-blue-700 hover:text-blue-800 cursor-pointer font-bold"
                            title={isExpanded ? "Show less" : "Show more"}
                        >
                            {isExpanded ? "−" : "+"}
                        </button>
                    )}
                </div>

                <div>
                    <table className="w-full table-fixed">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-left py-2 px-2 text-black font-semibold text-xs w-[25%]">Coin</th>
                                <th className="text-center py-2 px-2 text-black font-semibold text-xs w-[75%]">Sentiment</th>
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

                                    const shortTermTotal = sentimentData.bullishShortTerm + sentimentData.bearishShortTerm;
                                    const longTermTotal = sentimentData.bullishLongTerm + sentimentData.bearishLongTerm;

                                    return (
                                        <tr key={index} className="border-b border-gray-200 hover:bg-gradient-to-br hover:from-purple-900/10 hover:to-blue-900/10 transition-all duration-300">
                                            <td colSpan="2" className="py-3 px-2">
                                                {/* New 3-column layout matching buy.png */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    {/* Left Column - Coin Info */}
                                                    <div className="space-y-0.5">
                                                        <div className="text-[11px] font-bold text-black break-words">
                                                            {coin.symbol?.toUpperCase()}
                                                        </div>
                                                        <div className="text-[8px] font-bold text-black">
                                                            Outlook
                                                        </div>
                                                        <div className="text-[8px] font-bold text-black">
                                                            {sentimentData.mentions} POSTS
                                                        </div>
                                                        <div className="text-xs text-black">
                                                            Sentiment
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00a63e' }}></div>
                                                            <div className="text-xs" style={{ color: '#00a63e' }}>
                                                                Bullish
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff2121' }}></div>
                                                            <div className="text-xs" style={{ color: '#ff2121' }}>
                                                                Bearish
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Center Column - SHORT TERM */}
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="text-[8px] font-bold text-black">
                                                            SHORT TERM
                                                        </div>
                                                        <div className="text-[8px] font-bold text-black">
                                                            {shortTermTotal} POSTS
                                                        </div>
                                                        <GradientDoughnutGauge
                                                            shortValue={sentimentData.bullishShortTerm}
                                                            longValue={sentimentData.bearishShortTerm}
                                                            size={38}
                                                            label="BULL | BEAR"
                                                        />
                                                    </div>

                                                    {/* Right Column - LONG TERM */}
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="text-[8px] font-bold text-black">
                                                            LONG TERM
                                                        </div>
                                                        <div className="text-[8px] font-bold text-black">
                                                            {longTermTotal} POSTS
                                                        </div>
                                                        <GradientDoughnutGauge
                                                            shortValue={sentimentData.bullishLongTerm}
                                                            longValue={sentimentData.bearishLongTerm}
                                                            size={38}
                                                            label="BULL | BEAR"
                                                        />
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
            <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
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
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl p-6">
                    <div className="flex items-center gap-6">
                        {/* Channel Dropdown */}
                        <div className="flex items-center gap-3">
                            <label className="text-lg text-black font-semibold">Channel:</label>
                            <select
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
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
                                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
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
                                        {/* YouTube SVG Icon */}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-900">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                        <span className="text-sm text-black font-medium">YouTube</span>

                                        {/* Telegram SVG Icon */}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-900">
                                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                        </svg>
                                        <span className="text-sm text-black font-medium">Telegram</span>
                                    </>
                                ) : selectedPlatform === "YouTube" ? (
                                    <>
                                        {/* YouTube SVG Icon */}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-900">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                        <span className="text-sm text-black font-medium">YouTube</span>
                                    </>
                                ) : selectedPlatform === "Telegram" ? (
                                    <>
                                        {/* Telegram SVG Icon */}
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
