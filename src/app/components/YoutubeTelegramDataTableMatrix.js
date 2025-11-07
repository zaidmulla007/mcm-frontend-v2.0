"use client";
import { useState, useEffect } from "react";
import moment from "moment-timezone";

export default function YouTubeTelegramDataTableMatrix({ useLocalTime: propUseLocalTime = false }) {
    const [selectedPlatform, setSelectedPlatform] = useState("Combined");
    const [selectedCoinType, setSelectedCoinType] = useState("top_coins");
    const [combinedData, setCombinedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [nextUpdate, setNextUpdate] = useState(null);
    const useLocalTime = propUseLocalTime;

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

    const renderMatrixTable = () => {
        // Get data from all timeframes
        const timeframes = ["6hrs", "24hrs", "7days", "30days"];
        const allCoinsData = {};
        
        // Collect all unique coins across all timeframes
        timeframes.forEach(timeframe => {
            const coins = getTimeframeData(timeframe, selectedCoinType).slice(0, 10);
            coins.forEach(coin => {
                if (!allCoinsData[coin.symbol]) {
                    allCoinsData[coin.symbol] = {
                        symbol: coin.symbol,
                        image_small: coin.image_small || coin.image_thumb,
                        timeframes: {}
                    };
                }
                allCoinsData[coin.symbol].timeframes[timeframe] = coin;
            });
        });

        // Convert to array and sort by total mentions across all timeframes
        const sortedCoins = Object.values(allCoinsData).sort((a, b) => {
            const aTotalMentions = timeframes.reduce((sum, tf) => {
                if (!a.timeframes[tf]) return sum;
                const sentimentData = getSentimentData(a.timeframes[tf]);
                return sum + sentimentData.mentions;
            }, 0);
            
            const bTotalMentions = timeframes.reduce((sum, tf) => {
                if (!b.timeframes[tf]) return sum;
                const sentimentData = getSentimentData(b.timeframes[tf]);
                return sum + sentimentData.mentions;
            }, 0);
            
            return bTotalMentions - aTotalMentions;
        }).slice(0, 10); // Limit to top 10 coins

        // Helper function to render timeframe data
        const renderTimeframeData = (coinData, timeframe) => {
            if (!coinData.timeframes[timeframe]) {
                return (
                    <>
                        <td className="py-1.5 px-0.5 text-center border-r border-gray-100 bg-gray-50">
                            <div className="text-gray-300 text-sm font-medium">—</div>
                        </td>
                        <td className="py-1.5 px-0.5 text-center border-r border-gray-100 bg-gray-50">
                            <div className="text-gray-300 text-sm font-medium">—</div>
                        </td>
                        <td className="py-1.5 px-0.5 text-center border-r border-gray-100 bg-gray-50">
                            <div className="text-gray-300 text-sm font-medium">—</div>
                        </td>
                        <td className="py-1.5 px-0.5 text-center border-r border-gray-100 bg-gray-50">
                            <div className="text-gray-300 text-sm font-medium">—</div>
                        </td>
                        <td className="py-1.5 px-0.5 text-center border-r-2 border-white bg-yellow-50">
                            <div className="text-gray-300 text-sm font-medium">—</div>
                        </td>
                    </>
                );
            }

            const sentimentData = getSentimentData(coinData.timeframes[timeframe]);
            
            const shortTermBullish = sentimentData.bullish_short_term;
            const shortTermBearish = sentimentData.bearish_short_term;
            const shortTermPosts = sentimentData.bullish_short_term_count + sentimentData.bearish_short_term_count;

            const longTermBullish = sentimentData.bullish_long_term;
            const longTermBearish = sentimentData.bearish_long_term;
            const longTermPosts = sentimentData.bullish_long_term_count + sentimentData.bearish_long_term_count;

            const totalPosts = sentimentData.mentions;

            // Calculate the percentage to display
            const shortTermPercentage = shortTermPosts > 0
                ? (shortTermBullish >= shortTermBearish ? shortTermBullish : shortTermBearish).toFixed(0)
                : 0;

            const longTermPercentage = longTermPosts > 0
                ? (longTermBullish >= longTermBearish ? longTermBullish : longTermBearish).toFixed(0)
                : 0;

            // Determine colors based on sentiment
            const shortTermColor = shortTermPosts > 0
                ? (shortTermBullish >= shortTermBearish ? "text-green-600" : "text-red-600")
                : "text-gray-600";

            const longTermColor = longTermPosts > 0
                ? (longTermBullish >= longTermBearish ? "text-green-600" : "text-red-600")
                : "text-gray-600";

            return (
                <>
                    {/* Short Term Percentage */}
                    <td className="py-1.5 px-0.5 text-center border-r border-gray-100">
                        <div className={`font-bold text-sm ${shortTermColor}`}>
                            {shortTermPercentage}%
                        </div>
                    </td>
                    {/* Long Term Percentage */}
                    <td className="py-1.5 px-0.5 text-center border-r border-gray-100">
                        <div className={`font-bold text-sm ${longTermColor}`}>
                            {longTermPercentage}%
                        </div>
                    </td>
                    {/* Short Term Posts */}
                    <td className="py-1.5 px-0.5 text-center border-r border-gray-100">
                        <div className="text-sm text-gray-700 font-medium">
                            {shortTermPosts}
                        </div>
                    </td>
                    {/* Long Term Posts */}
                    <td className="py-1.5 px-0.5 text-center border-r border-gray-100">
                        <div className="text-sm text-gray-700 font-medium">
                            {longTermPosts}
                        </div>
                    </td>
                    {/* Total Posts */}
                    <td className="py-1.5 px-0.5 text-center bg-yellow-50 border-r-2 border-white">
                        <div className="text-sm font-bold text-gray-900">
                            {totalPosts}
                        </div>
                    </td>
                </>
            );
        };

        return (
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4">
                    <h3 className="text-xl font-bold text-white text-center tracking-wide">
                        Matrix View - All Timeframes
                    </h3>
                    <p className="text-center text-blue-100 text-xs mt-1">Comprehensive sentiment analysis across all time periods</p>
                </div>

                <div className="p-3">
                    <table className="w-full border-collapse table-fixed">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
                                <th className="text-center py-1.5 px-0.5 text-gray-800 font-bold text-[8px] border-r-2 border-white bg-gray-100 w-16" rowSpan="2">
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                        </svg>
                                        <span className="text-[8px]">Coin</span>
                                    </div>
                                </th>
                                <th className="text-center py-1.5 px-0.5 text-white font-bold text-xs bg-gradient-to-r from-blue-500 to-blue-600 border-x border-white" colSpan="5">
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                        </svg>
                                        <span>6hrs</span>
                                    </div>
                                </th>
                                <th className="text-center py-1.5 px-0.5 text-white font-bold text-xs bg-gradient-to-r from-purple-500 to-purple-600 border-x border-white" colSpan="5">
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                        </svg>
                                        <span>24hrs</span>
                                    </div>
                                </th>
                                <th className="text-center py-1.5 px-0.5 text-white font-bold text-xs bg-gradient-to-r from-indigo-500 to-indigo-600 border-x border-white" colSpan="5">
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                                        </svg>
                                        <span>7d</span>
                                    </div>
                                </th>
                                <th className="text-center py-1.5 px-0.5 text-white font-bold text-xs bg-gradient-to-r from-pink-500 to-pink-600 border-x border-white" colSpan="5">
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                                        </svg>
                                        <span>30d</span>
                                    </div>
                                </th>
                            </tr>
                            <tr className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
                                <th className="text-center py-1 px-0.5 text-blue-700 font-semibold text-[7px] bg-blue-50 border-r border-gray-200">ST%</th>
                                <th className="text-center py-1 px-0.5 text-blue-700 font-semibold text-[7px] bg-blue-50 border-r border-gray-200">LT%</th>
                                <th className="text-center py-1 px-0.5 text-gray-700 font-medium text-[7px] bg-gray-50 border-r border-gray-200">STP</th>
                                <th className="text-center py-1 px-0.5 text-gray-700 font-medium text-[7px] bg-gray-50 border-r border-gray-200">LTP</th>
                                <th className="text-center py-1 px-0.5 text-gray-800 font-bold text-[7px] bg-yellow-50 border-r-2 border-white">Total</th>

                                <th className="text-center py-1 px-0.5 text-purple-700 font-semibold text-[7px] bg-purple-50 border-r border-gray-200">ST%</th>
                                <th className="text-center py-1 px-0.5 text-purple-700 font-semibold text-[7px] bg-purple-50 border-r border-gray-200">LT%</th>
                                <th className="text-center py-1 px-0.5 text-gray-700 font-medium text-[7px] bg-gray-50 border-r border-gray-200">STP</th>
                                <th className="text-center py-1 px-0.5 text-gray-700 font-medium text-[7px] bg-gray-50 border-r border-gray-200">LTP</th>
                                <th className="text-center py-1 px-0.5 text-gray-800 font-bold text-[7px] bg-yellow-50 border-r-2 border-white">Total</th>

                                <th className="text-center py-1 px-0.5 text-indigo-700 font-semibold text-[7px] bg-indigo-50 border-r border-gray-200">ST%</th>
                                <th className="text-center py-1 px-0.5 text-indigo-700 font-semibold text-[7px] bg-indigo-50 border-r border-gray-200">LT%</th>
                                <th className="text-center py-1 px-0.5 text-gray-700 font-medium text-[7px] bg-gray-50 border-r border-gray-200">STP</th>
                                <th className="text-center py-1 px-0.5 text-gray-700 font-medium text-[7px] bg-gray-50 border-r border-gray-200">LTP</th>
                                <th className="text-center py-1 px-0.5 text-gray-800 font-bold text-[7px] bg-yellow-50 border-r-2 border-white">Total</th>

                                <th className="text-center py-1 px-0.5 text-pink-700 font-semibold text-[7px] bg-pink-50 border-r border-gray-200">ST%</th>
                                <th className="text-center py-1 px-0.5 text-pink-700 font-semibold text-[7px] bg-pink-50 border-r border-gray-200">LT%</th>
                                <th className="text-center py-1 px-0.5 text-gray-700 font-medium text-[7px] bg-gray-50 border-r border-gray-200">STP</th>
                                <th className="text-center py-1 px-0.5 text-gray-700 font-medium text-[7px] bg-gray-50 border-r border-gray-200">LTP</th>
                                <th className="text-center py-1 px-0.5 text-gray-800 font-bold text-[7px] bg-yellow-50">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCoins.length === 0 ? (
                                <tr>
                                    <td colSpan="21" className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                            </svg>
                                            <p className="text-gray-500 text-lg font-medium">No data available</p>
                                            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedCoins.map((coinData, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                                        {/* Coin Column */}
                                        <td className="py-1.5 px-0.5 bg-white border-r-2 border-gray-100">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <div className="relative">
                                                    <img
                                                        src={coinData.image_small}
                                                        alt={coinData.symbol}
                                                        className="w-6 h-6 rounded-full ring-1 ring-gray-200 shadow-sm"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${coinData.symbol}&background=ED8936&color=fff&size=24`;
                                                        }}
                                                    />
                                                    <div className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[7px] font-bold rounded-full w-3 h-3 flex items-center justify-center shadow">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-900 font-bold tracking-wide truncate max-w-full">
                                                    {coinData.symbol ? coinData.symbol.charAt(0).toUpperCase() + coinData.symbol.slice(1).toLowerCase() : ''}
                                                </div>
                                            </div>
                                        </td>

                                        {/* 6 Hours Data */}
                                        {renderTimeframeData(coinData, "6hrs")}

                                        {/* 24 Hours Data */}
                                        {renderTimeframeData(coinData, "24hrs")}

                                        {/* 7 Days Data */}
                                        {renderTimeframeData(coinData, "7days")}

                                        {/* 30 Days Data */}
                                        {renderTimeframeData(coinData, "30days")}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen flex items-center justify-center p-4">
                <div className="text-center bg-white rounded-2xl shadow-2xl p-12 max-w-md">
                    <div className="relative mb-6">
                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-gray-900 text-xl font-bold mb-2">Loading Matrix View</div>
                    <div className="text-purple-600 text-sm font-medium mb-3">Fetching YouTube & Telegram analytics</div>
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                        <div className="animate-pulse">Analyzing sentiment data</div>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                    </div>
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
            
            {/* Matrix Table */}
            <div className="flex justify-center">
                {renderMatrixTable()}
            </div>
        </div>
    );
}