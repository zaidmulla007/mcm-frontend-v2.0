"use client";
import { useState, useEffect } from "react";
import moment from "moment-timezone";
import Link from "next/link";
// Custom timezone abbreviations mapping
const timeZoneAbbreviations = {
    // India
    "Asia/Kolkata": "IST",      // India Standard Time
    "Asia/Calcutta": "IST",     // India Standard Time (legacy)

    // Middle East
    "Asia/Dubai": "GST",        // Gulf Standard Time (UAE)
    "Asia/Riyadh": "AST",       // Arabia Standard Time (Saudi Arabia)
    "Asia/Qatar": "AST",        // Arabia Standard Time (Qatar)
    "Asia/Kuwait": "AST",       // Arabia Standard Time (Kuwait)
    "Asia/Bahrain": "AST",      // Arabia Standard Time (Bahrain)
    "Asia/Muscat": "GST",       // Gulf Standard Time (Oman)

    // Europe
    "Europe/London": "GMT",     // Greenwich Mean Time (UK)
    "Europe/Paris": "CET",      // Central European Time (France)
    "Europe/Berlin": "CET",     // Central European Time (Germany)
    "Europe/Rome": "CET",       // Central European Time (Italy)
    "Europe/Madrid": "CET",     // Central European Time (Spain)
    "Europe/Amsterdam": "CET",  // Central European Time (Netherlands)
    "Europe/Brussels": "CET",   // Central European Time (Belgium)
    "Europe/Vienna": "CET",     // Central European Time (Austria)
    "Europe/Zurich": "CET",     // Central European Time (Switzerland)
    "Europe/Stockholm": "CET",  // Central European Time (Sweden)
    "Europe/Oslo": "CET",       // Central European Time (Norway)
    "Europe/Copenhagen": "CET", // Central European Time (Denmark)
    "Europe/Helsinki": "EET",   // Eastern European Time (Finland)
    "Europe/Moscow": "MSK",     // Moscow Time (Russia)

    // Americas
    "America/New_York": "EST",  // Eastern Standard Time (USA East Coast)
    "America/Chicago": "CST",   // Central Standard Time (USA Central)
    "America/Denver": "MST",    // Mountain Standard Time (USA Mountain)
    "America/Los_Angeles": "PST", // Pacific Standard Time (USA West Coast)
    "America/Toronto": "EST",   // Eastern Standard Time (Canada)
    "America/Vancouver": "PST", // Pacific Standard Time (Canada)
    "America/Mexico_City": "CST", // Central Standard Time (Mexico)
    "America/Sao_Paulo": "BRT", // Brasilia Time (Brazil)
    "America/Argentina/Buenos_Aires": "ART", // Argentina Time

    // Asia Pacific
    "Asia/Tokyo": "JST",        // Japan Standard Time
    "Asia/Shanghai": "CST",     // China Standard Time
    "Asia/Hong_Kong": "HKT",    // Hong Kong Time
    "Asia/Singapore": "SGT",    // Singapore Time
    "Asia/Bangkok": "ICT",      // Indochina Time (Thailand)
    "Asia/Jakarta": "WIB",      // Western Indonesia Time
    "Asia/Manila": "PHT",       // Philippines Time
    "Asia/Seoul": "KST",        // Korea Standard Time
    "Asia/Taipei": "CST",       // China Standard Time (Taiwan)

    // Australia & New Zealand
    "Australia/Sydney": "AEDT", // Australian Eastern Daylight Time
    "Australia/Melbourne": "AEDT", // Australian Eastern Daylight Time
    "Australia/Perth": "AWST",  // Australian Western Standard Time
    "Pacific/Auckland": "NZDT", // New Zealand Daylight Time

    // Africa
    "Africa/Cairo": "EET",      // Eastern European Time (Egypt)
    "Africa/Johannesburg": "SAST", // South Africa Standard Time
    "Africa/Lagos": "WAT",      // West Africa Time (Nigeria)
    "Africa/Nairobi": "EAT",    // East Africa Time (Kenya)

    // Add more as needed
};

import { FaCalendarAlt, FaSync, FaArrowUp, FaArrowDown, FaMinus, FaEye, FaHeart, FaThumbsUp, FaChevronDown, FaChevronUp, FaStar, FaStarHalfAlt, FaChartLine, FaWallet, FaExchangeAlt, FaGraduationCap, FaLightbulb, FaShoppingCart, FaSearch, FaCertificate } from "react-icons/fa";
import { useTimezone } from "../contexts/TimezoneContext";

// Custom SVG Icons
const YouTubeIcon = ({ className }) => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"></path>
    </svg>
);

const TelegramIcon = ({ className }) => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z"></path>
    </svg>
);

export default function YouTubeTelegramInfluencers() {
    const { useLocalTime, formatDate } = useTimezone();
    const [selectedPlatform, setSelectedPlatform] = useState("Combined");
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [nextUpdate, setNextUpdate] = useState(() => {
        const next = new Date();
        next.setHours(next.getHours() + 4);
        return next;
    });
    const [expandedSummaries, setExpandedSummaries] = useState({});
    const [expandedCoins, setExpandedCoins] = useState({});
    const [expandedTitles, setExpandedTitles] = useState({});
    const [expandedMarketing, setExpandedMarketing] = useState({});
    const [hoveredPost, setHoveredPost] = useState(null);
    const [apiData, setApiData] = useState(null);


    // Toggle summary expansion
    const toggleSummary = (postId) => {
        setExpandedSummaries(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // Toggle coins expansion
    const toggleCoins = (postId) => {
        setExpandedCoins(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // Toggle title expansion
    const toggleTitle = (postId) => {
        setExpandedTitles(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // Toggle marketing content expansion
    const toggleMarketing = (postId) => {
        setExpandedMarketing(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    // Render stars based on score
    const renderStars = (score) => {
        const stars = [];
        const rating = score / 2; // Convert score to 5-star rating
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<FaStar key={i} className="text-yellow-400" />);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
            } else {
                stars.push(<FaStar key={i} className="text-gray-600" />);
            }
        }

        return (
            <div className="flex">
                {stars}
            </div>
        );
    };

    // Fetch data from API
    const fetchData = () => {
        setLoading(true);
        fetch('/api/admin/strategyyoutubedata/getlast6hrsytandtg')
            // http://37.27.120.45:5901/api/admin/strategyyoutubedata/getlast5ytandtg
            .then(response => response.json())
            .then(data => {
                setApiData(data);
                // Update times from API metadata if available
                if (data.metadata) {
                    setLastUpdated(new Date(data.metadata.lastUpdatedDate));
                    setNextUpdate(new Date(data.metadata.nextUpdateDate));
                } else {
                    // Fallback to current behavior
                    setLastUpdated(new Date());
                    const next = new Date();
                    next.setHours(next.getHours() + 4);
                    setNextUpdate(next);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });
    };

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, []);

    // Get combined data based on selected platform
    const getDisplayData = () => {
        if (!apiData) return [];

        let allPosts = [];

        if (selectedPlatform === "Combined") {
            // Use the combined array from the new API structure
            if (apiData.combined && Array.isArray(apiData.combined)) {
                apiData.combined.forEach(item => {
                    allPosts.push(transformPostData(item));
                });
            }
        } else if (selectedPlatform === "YouTube") {
            // Use the youtube array from the new API structure
            if (apiData.youtube && Array.isArray(apiData.youtube)) {
                apiData.youtube.forEach(item => {
                    allPosts.push(transformPostData(item));
                });
            }
        } else if (selectedPlatform === "Telegram") {
            // Use the telegram array from the new API structure
            if (apiData.telegram && Array.isArray(apiData.telegram)) {
                apiData.telegram.forEach(item => {
                    allPosts.push(transformPostData(item));
                });
            }
        }

        return allPosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    };

    // Helper function to transform post data regardless of type
    const transformPostData = (item) => {
        const isYoutube = item.type === "youtube";
        const isTelegram = item.type === "telegram";

        return {
            id: isYoutube ? item.youtube_oid : item.telegram_oid,
            channelID: item.channelID,
            title: isYoutube ? item.title : (item.message ? (item.message.substring(0, 50) + (item.message.length > 50 ? '...' : '')) : "No title"),
            date: item.publishedAt,
            publishedAt: item.publishedAt,
            rank: item.rank || 0,
            channel_name: isYoutube ? item.channel_name : item.channelID,
            summary: item.summary,
            content: isYoutube ? item.summary : (item.message || ""),
            timestamp: useLocalTime
                ? new Date(item.publishedAt).toLocaleString()
                : new Date(item.publishedAt).toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC',
            views: "N/A",
            likes: "N/A",
            videoUrl: isYoutube ? `https://www.youtube.com/watch?v=${item.videoID}` : null,
            telegramUrl: isTelegram ? `https://t.me/${item.channelID}/${item.messageID}` : null,
            outlook: "short term",
            comment: "Analysis from API",
            mentionedCoins: item.mentioned && Array.isArray(item.mentioned) ? item.mentioned : [],
            platform: isYoutube ? "YouTube" : "Telegram",
            influencer: {
                name: isYoutube ? item.channel_name : item.channelID,
                channel: isYoutube ? item.channel_name : item.channelID,
                avatar: `https://ui-avatars.com/api/?name=${isYoutube ? item.channel_name : item.channelID}&background=random`,
                subscribers: "N/A",
                platform: isYoutube ? "YouTube" : "Telegram"
            },
            // Add content scores
            viewOnCoins: item.viewOnCoins || 0,
            recommendationScore: item.recommendations || 0,
            riskManagement: item.riskManagement || 0,
            overallScore: item.overallScore || 0,
            exitStrategyScore: item.exitStrategyScore || 0,
            educationalPurpose: item.educationalPurpose || 0,
            actionableInsights: item.actionableInsights || 0,
            buyingPriceZone: item.buyingPriceZone || 0,
            clarityOfAnalysis: item.clarityOfAnalysis || 0,
            marketingContent: item.marketingContent,
        };
    };


    // Get sentiment color
    const getSentimentColor = (sentiment) => {
        if (sentiment.toLowerCase().includes("bullish")) return "text-green-400";
        if (sentiment.toLowerCase().includes("bearish")) return "text-red-400";
        return "text-blue-400"; // neutral
    };

    // Get column color - always blue-700 for all platforms
    const getColumnColor = (index) => {
        return "bg-white-700";
    };

    // Get score color
    const getScoreColor = (score) => {
        if (score >= 8) return "text-green-400";
        if (score >= 6) return "text-blue-400";
        if (score >= 4) return "text-yellow-400";
        return "text-red-400";
    };

    // Capitalize first letter of each word
    const capitalizeWords = (str) => {
        if (!str) return '';
        return str.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    // Format coin name - first letter capitalized, rest lowercase
    const formatCoinName = (name) => {
        if (!name) return '';
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };

    // Format sentiment - capitalize each word
    const formatSentiment = (sentiment) => {
        if (!sentiment) return 'N/A';
        return sentiment.replace('_', ' ').split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    // Format holding period - capitalize each word and remove hyphens
    const formatHoldingPeriod = (term) => {
        if (!term || term.toLowerCase() === 'no outlook') return 'Not Specified';
        return term.replace(/-/g, ' ').split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    // Format date to UTC or local time for header display
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

            // Get user's timezone and map to abbreviation
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            timezone = timeZoneAbbreviations[userTimeZone] || userTimeZone;
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

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-purple-900 to-blue-900 min-h-screen text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mx-auto mb-4"></div>
                    <div className="text-white text-lg font-semibold mb-2">Loading Latest Posts...</div>
                    <div className="text-purple-300 text-sm">Fetching YouTube & Telegram data</div>
                </div>
            </div>
        );
    }

    return (
        <div className="jsx-816192472cbeba0e flex justify-center">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mt-2">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Latest Posts
                    </h1>
                </div>

                {/* Platform Selection */}
                <div className="flex justify-center mb-8">
                    <div className="jsx-816192472cbeba0e bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl border  border border-purple-500/30 p-4 w-full max-w-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <label className="text-lg text-gray-300 font-semibold">Platform:</label>
                                <select
                                    value={selectedPlatform}
                                    onChange={(e) => setSelectedPlatform(e.target.value)}
                                    className="jsx-816192472cbeba0e bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px]"
                                >
                                    <option value="Combined" className="bg-gray-800">Combined</option>
                                    <option value="YouTube" className="bg-gray-800">YouTube</option>
                                    <option value="Telegram" className="bg-gray-800">Telegram</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-300 font-medium">Source: </span>
                                <div className="flex items-center gap-2">
                                    {selectedPlatform === "Combined" ? (
                                        <>
                                            <YouTubeIcon className="text-red-500" />
                                            <span className="text-sm text-gray-300">YouTube</span>
                                            <TelegramIcon className="text-blue-500" />
                                            <span className="text-sm text-gray-300">Telegram</span>
                                        </>
                                    ) : selectedPlatform === "YouTube" ? (
                                        <>
                                            <YouTubeIcon className="text-red-500" />
                                            <span className="text-sm text-gray-300">YouTube</span>
                                        </>
                                    ) : (
                                        <>
                                            <TelegramIcon className="text-blue-500" />
                                            <span className="text-sm text-gray-300">Telegram</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Posts */}
                <div className="flex gap-4 overflow-x-auto pb-6">
                    {getDisplayData().map((post, index) => (
                        <div
                            key={post.id}
                            className="w-80 flex-shrink-0 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl overflow-hidden border border-purple-500/30"
                        >
                            {/* Post Header with Platform Icon in Top Right */}
                            <div className="border-b border-gray-700">
                                <div
                                    className={`${getColumnColor(index)} text-white p-3 text-center text-sm font-bold flex justify-between items-center`}
                                >
                                    <span>POST {index + 1}</span>
                                    <div className="flex items-center">
                                        <span className="text-xs mr-2">{formatDate(post.date)}</span>
                                        {(selectedPlatform === "Combined") ? (
                                            post.platform === "YouTube" ? (
                                                <YouTubeIcon className="text-red-500" />
                                            ) : (
                                                <TelegramIcon className="text-blue-500" />
                                            )
                                        ) : selectedPlatform === "YouTube" ? (
                                            <YouTubeIcon className="text-red-500" />
                                        ) : (
                                            <TelegramIcon className="text-blue-500" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Post Header */}
                            <div className="p-3 border-b border-gray-700">
                                {/* Influencer Name Link */}
                                <div className="text-sm font-bold text-white-400 mb-2">
                                    Name :
                                    <a
                                        href={
                                            post.platform === "YouTube"
                                                ? `/influencers/${post.channelID}`
                                                : `/telegram-influencer/${post.channelID}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-1 text-white-400 hover:text-white hover:underline cursor-pointer transition-colors duration-200"
                                    >
                                        {post.channel_name}
                                    </a>
                                </div>

                                {/* Rank Link (simple) */}
                                <div className="text-sm font-bold text-white-400 mb-2 flex items-center gap-2">
                                    Rank 
                                    <span className="sr-only">Rank (180 days / Overall)</span>
                                    <button
                                        type="button"
                                        title="180 days / Overall"
                                        className="inline-flex items-center gap-2 focus:outline-none"
                                        aria-label="Rank info: 180 days / Overall"
                                    >
                                        {/* Eye icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-7.5 9.5-7.5S21.5 12 21.5 12s-3.5 7.5-9.5 7.5S2.5 12 2.5 12z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </button> : 
                                    <a
                                        href={post.platform === "YouTube" ? `/influencers/${post.channelID}` : `/telegram-influencer/${post.channelID}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-1 text-white-400 hover:text-white hover:underline cursor-pointer transition-colors duration-200"
                                    >
                                        {post.rank}
                                    </a>
                                </div>


                                {/* Post Title Link */}
                                <div className="min-h-[40px] mb-2">
                                    <a
                                        href={
                                            post.platform === "YouTube"
                                                ? `/influencers/${post.channelID}?tab=recentActivities`
                                                : `/telegram-influencer/${post.channelID}?tab=recentActivities`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-white-400 hover:text-white hover:underline cursor-pointer transition-colors duration-200"
                                    >
                                        <div className={`text-sm font-medium ${expandedTitles[post.id] ? '' : 'line-clamp-2'}`} title={post.title}>
                                            {post.title}
                                        </div>
                                    </a>
                                </div>

                                <div className="h-6 mb-2">
                                    {post.title.length > 80 && (
                                        <button
                                            onClick={() => toggleTitle(post.id)}
                                            className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                                        >
                                            {expandedTitles[post.id] ? '.....' : '......'}
                                        </button>
                                    )}
                                </div>
                                <div className="text-xs h-6">
                                    <a
                                        href={post.videoUrl || post.telegramUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-1 ${post.platform === "YouTube" ? "text-red-400 hover:text-red-500" : "text-blue-400 hover:text-blue-500"}`}
                                    >
                                        {post.platform === "YouTube" ? "Watch Video" : "View Post"}
                                    </a>
                                </div>
                            </div>
                            {/* MCM Scoring */}
                            <div className="p-3 border-b border-gray-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-xs text-gray-300">MCM Scoring</span>
                                </div>
                                <ul className="text-xs space-y-2">
                                    <li className="flex items-center justify-between">
                                        <span className="text-gray-300">Overall</span>
                                        {renderStars(post.overallScore)}
                                    </li>
                                    <li className="flex items-center justify-between">
                                        <span className="text-gray-300">Educational</span>
                                        {renderStars(post.educationalPurpose)}
                                    </li>
                                    <li className="flex items-center justify-between">
                                        <span className="text-gray-300">Actionable</span>
                                        {renderStars(post.actionableInsights)}
                                    </li>
                                    <li className="flex flex-col">
                                        <span className="text-gray-300 mb-2">Marketing Content</span>
                                        <div className={`text-xs text-gray-400 ${expandedMarketing[post.id] ? 'leading-tight' : 'truncate overflow-hidden whitespace-nowrap'}`}>
                                            {typeof post.marketingContent === "string"
                                                ? expandedMarketing[post.id]
                                                    ? post.marketingContent
                                                        .split(" ")
                                                        .map((word, i) =>
                                                            i < 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word
                                                        )
                                                        .join(" ")
                                                    : post.marketingContent
                                                        .split(" ")
                                                        .map((word, i) =>
                                                            i < 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word
                                                        )
                                                        .join(" ")
                                                : "N/A"}
                                        </div>
                                        <div className="h-6 mt-2">
                                            {typeof post.marketingContent === "string" &&
                                                post.marketingContent.length > 50 && (
                                                    <button
                                                        onClick={() => toggleMarketing(post.id)}
                                                        className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer self-start"
                                                    >
                                                        {expandedMarketing[post.id] ? "Read Less" : "Read More"}
                                                    </button>
                                                )}
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* Post Summary */}
                            <div className="p-3 border-b border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-xs text-gray-300">Post Summary</span>
                                    <button
                                        onClick={() => toggleSummary(post.id)}
                                        className="text-lg text-blue-400 hover:text-blue-300 cursor-pointer font-bold"
                                    >
                                        {expandedSummaries[post.id] ? '−' : '+'}
                                    </button>
                                </div>

                                <div className="min-h-[96px] mb-2">
                                    <div
                                        className={`text-xs text-gray-300 leading-tight transition-all duration-300 ${expandedSummaries[post.id] ? '' : 'line-clamp-4'
                                            }`}
                                    >
                                        {post.summary || "No summary available"}
                                    </div>

                                    {/* Read more / Read less */}
                                    {post.summary && (
                                        <button
                                            onClick={() => toggleSummary(post.id)}
                                            className="mt-1 text-blue-400 hover:text-blue-300 text-xs font-semibold"
                                        >
                                            {expandedSummaries[post.id] ? 'Read less' : 'Read more'}
                                        </button>
                                    )}
                                </div>
                            </div>



                            {/* Coins Analysis */}
                            <div
                                className="p-3 relative"
                                onMouseEnter={() => setHoveredPost(post.id)}
                                onMouseLeave={() => setHoveredPost(null)}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-xs text-gray-300">Coins Analysis</span>
                                </div>

                                {/* Coins table */}
                                <div className="flex justify-center">
                                    <div className="overflow-x-auto w-full">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-gray-600">
                                                    <th className="text-center text-gray-300 pb-1 pr-2">Name</th>
                                                    <th className="text-center text-gray-300 pb-1 pr-2">Sentiment</th>
                                                    <th className="text-center text-gray-300 pb-1">Holding Period</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const coins = expandedCoins[post.id]
                                                        ? post.mentionedCoins
                                                        : post.mentionedCoins.slice(0, 5);

                                                    return coins.map((coin, i) => {

                                                        return (
                                                            <tr key={i} className="border-b border-gray-700/50">
                                                                <td className="py-1 pr-2 text-center">
                                                                    {coin ? (
                                                                        <span className="text-white" title={coin.symbol}>
                                                                            {formatCoinName(coin.name || coin.symbol)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-transparent">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-1 pr-2 text-center">
                                                                    {coin ? (
                                                                        <span className={getSentimentColor(coin.sentiment)}>
                                                                            {formatSentiment(coin.sentiment)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-transparent">-</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-1 text-center">
                                                                    {coin ? (
                                                                        <span className="text-gray-300">
                                                                            {formatHoldingPeriod(coin.outlook)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-transparent">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="h-6 mt-2">
                                    {post.mentionedCoins && post.mentionedCoins.length > 5 && (
                                        <button
                                            onClick={() => toggleCoins(post.id)}
                                            className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                                        >
                                            {expandedCoins[post.id]
                                                ? 'Read Less'
                                                : 'Read More'
                                            }
                                        </button>
                                    )}
                                </div>

                                {/* Hover Tooltip */}
                                {hoveredPost === post.id && (
                                    <div className="absolute top-0 left-full ml-2 z-50 bg-gray-800 text-white p-4 rounded-lg shadow-xl border border-gray-700 max-w-md">
                                        <div className="text-xs">
                                            <div className="font-bold mb-2 text-blue-400">Complete Post Analysis</div>

                                            <div className="mb-3">
                                                <span className="font-semibold text-blue-400">All Recommendations ({post.mentionedCoins.length}):</span>
                                                <div className="mt-1 max-h-32 overflow-y-auto">
                                                    {post.mentionedCoins.map((coin, i) => (
                                                        <div key={i} className={`${getSentimentColor(coin.sentiment)} mb-1 flex items-start`}>
                                                            <span className="mr-1">•</span>
                                                            <span>{formatCoinName(coin.name || coin.symbol)}: {formatSentiment(coin.sentiment)}, {formatHoldingPeriod(coin.outlook)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="flex items-start">
                                                    <span className="mr-1 text-gray-400">•</span>
                                                    <span><span className="text-gray-400">Actionable:</span> <span className={getScoreColor(post.actionableInsights)}>{post.actionableInsights}/10</span></span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="mr-1 text-gray-400">•</span>
                                                    <span><span className="text-gray-400">Buying Zone:</span> <span className={getScoreColor(post.buyingPriceZone)}>{post.buyingPriceZone}/10</span></span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="mr-1 text-gray-400">•</span>
                                                    <span><span className="text-gray-400">Clarity:</span> <span className={getScoreColor(post.clarityOfAnalysis)}>{post.clarityOfAnalysis}/10</span></span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="mr-1 text-gray-400">•</span>
                                                    <span><span className="text-gray-400">Credibility:</span> <span className={getScoreColor(post.credibilityScore)}>{post.credibilityScore}/10</span></span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="mr-1 text-gray-400">•</span>
                                                    <span><span className="text-gray-400">Educational:</span> <span className={getScoreColor(post.educationalPurpose)}>{post.educationalPurpose}/10</span></span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="mr-1 text-gray-400">•</span>
                                                    <span><span className="text-gray-400">Exit Strategy:</span> <span className={getScoreColor(post.exitStrategyScore)}>{post.exitStrategyScore}/10</span></span>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-2 border-t border-gray-700">
                                                <div className="text-gray-400 text-xs flex items-start">
                                                    <span className="mr-1">•</span>
                                                    <span><span className="font-semibold">Outlook:</span> {post.outlook}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}