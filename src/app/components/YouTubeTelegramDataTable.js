"use client";
import { useState, useEffect } from "react";
import moment from "moment-timezone";
import { FaBell } from "react-icons/fa";

export default function YouTubeTelegramDataTable({ useLocalTime: propUseLocalTime = false }) {
    const [selectedPlatform, setSelectedPlatform] = useState("Combined");
    const [selectedCoinType, setSelectedCoinType] = useState("top_coins");
    const [combinedData, setCombinedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [nextUpdate, setNextUpdate] = useState(null);
    const [binancePriceData, setBinancePriceData] = useState({});
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

    // Fetch initial Binance 24hr price data and setup WebSocket for live updates
    useEffect(() => {
        let isMounted = true;
        let ws = null;

        // Fetch initial data via REST API
        const fetchBinancePriceData = async () => {
            try {
                const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
                const data = await response.json();

                if (!isMounted) return;

                // Create a map of symbol to priceChangePercent (only USDT pairs)
                const priceMap = {};
                data.forEach(ticker => {
                    if (ticker.symbol.endsWith('USDT')) {
                        const symbol = ticker.symbol.replace('USDT', '').toLowerCase();
                        priceMap[symbol] = parseFloat(ticker.priceChangePercent);
                    }
                });

                setBinancePriceData(priceMap);
            } catch (error) {
                console.error('Error fetching Binance price data:', error);
            }
        };

        // Setup WebSocket connection for live 24hr ticker updates
        const setupWebSocket = () => {
            ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

            ws.onopen = () => {
                console.log('Binance WebSocket connected for 24hr ticker');
            };

            ws.onmessage = (event) => {
                if (!isMounted) return;

                try {
                    const data = JSON.parse(event.data);

                    // Update price data with live values
                    setBinancePriceData(prevData => {
                        const newData = { ...prevData };
                        data.forEach(ticker => {
                            if (ticker.s && ticker.s.endsWith('USDT')) {
                                const symbol = ticker.s.replace('USDT', '').toLowerCase();
                                // P = 24hr price change percent
                                newData[symbol] = parseFloat(ticker.P);
                            }
                        });
                        return newData;
                    });
                } catch (error) {
                    console.error('Error parsing WebSocket data:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('Binance WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('Binance WebSocket disconnected');
                // Reconnect after 5 seconds if component is still mounted
                if (isMounted) {
                    setTimeout(() => {
                        if (isMounted) {
                            setupWebSocket();
                        }
                    }, 5000);
                }
            };
        };

        // Fetch initial data then setup WebSocket
        fetchBinancePriceData().then(() => {
            if (isMounted) {
                setupWebSocket();
            }
        });

        return () => {
            isMounted = false;
            if (ws) {
                ws.close();
            }
        };
    }, []);

    // Helper function to get price change for a coin symbol (24hr from Binance)
    const getPriceChangePercent = (symbol) => {
        if (!symbol) return null;
        const lowerSymbol = symbol.toLowerCase();
        return binancePriceData[lowerSymbol] ?? null;
    };

    // Helper function to get price change from coin's percentage_change data for specific timeframe
    const getCoinPriceChange = (coin, timeframe) => {
        if (!coin?.percentage_change) return null;

        // Map timeframe to the key in percentage_change object
        const timeframeMap = {
            '6hrs': '6hr',
            '24hrs': '24hr',
            '7days': '7days',
            '30days': '30days'
        };

        const key = timeframeMap[timeframe];
        if (!key) return null;

        return coin.percentage_change[key]?.change ?? null;
    };

    // Get the threshold for each timeframe
    const getThreshold = (timeframe) => {
        switch (timeframe) {
            case '6hrs':
                return 5; // ±5% for 6 hours
            case '24hrs':
                return 15; // ±15% for 24 hours
            case '7days':
                return 25; // ±25% for 7 days
            case '30days':
                return 50; // ±50% for 30 days
            default:
                return 15;
        }
    };


     // Get the threshold for each timeframe
    // const getThreshold = (timeframe) => {
    //     switch (timeframe) {
    //         case '6hrs':
    //             return 0; // ±5% for 6 hours
    //         case '24hrs':
    //             return 0; // ±15% for 24 hours
    //         case '7days':
    //             return 0; // ±25% for 7 days
    //         case '30days':
    //             return 0; // ±50% for 30 days
    //         default:
    //             return 0;
    //     }
    // };

    // Check if price change exceeds threshold based on timeframe
    const hasPriceAlertForTimeframe = (coin, timeframe) => {
        // Bell should only show for 24hrs timeframe
        if (timeframe !== '24hrs') {
            return false;
        }

        // Use Binance 24hr live data for 24hrs
        const priceChange = getPriceChangePercent(coin?.symbol);

        if (priceChange === null) return false;

        // Show bell for 24 hours when:
        // 1. Price change is ±50%
        // 2. OR if coin's market_cap_rank <= 10 and price change is ±15%
        const marketCapRank = coin?.market_cap_rank;

        if (Math.abs(priceChange) >= 50) {
            return true;
        }

        if (marketCapRank && marketCapRank <= 10 && Math.abs(priceChange) >= 15) {
            return true;
        }

        return false;
    };

    // Get price change value for display based on timeframe
    const getPriceChangeForTimeframe = (coin, timeframe) => {
        if (timeframe === '24hrs') {
            // Use Binance 24hr live data for 24hrs
            return getPriceChangePercent(coin?.symbol);
        } else {
            // Use coin's percentage_change data for 6hrs, 7days, and 30days
            return getCoinPriceChange(coin, timeframe);
        }
    };

    // Get timeframe label for tooltip display
    const getTimeframeLabel = (timeframe) => {
        switch (timeframe) {
            case '6hrs':
                return '6H';
            case '24hrs':
                return '24H';
            case '7days':
                return '7 Day';
            case '30days':
                return '30 Day';
            default:
                return '24H';
        }
    };

    // Legacy function for backwards compatibility (uses 24hr threshold)
    const hasPriceAlert = (symbol) => {
        const priceChange = getPriceChangePercent(symbol);
        if (priceChange === null) return false;
        return Math.abs(priceChange) >= 15;
    };

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

        // Check if any coin in this timeframe has a price alert
        const hasAnyPriceAlert = timeframe === '24hrs' && allCoins.some(coin => hasPriceAlertForTimeframe(coin, timeframe));

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
                    <h3 className="text-xl font-bold text-white text-center mb-1 flex items-center justify-center gap-2">
                        {title}
                        {hasAnyPriceAlert && (
                            <FaBell className="text-yellow-300 text-lg animate-pulse" />
                        )}
                    </h3>
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

                                    const shortTermBallPosition = shortTermBullish >= shortTermBearish ? shortTermBullish : (100 - shortTermBearish);
                                    const longTermBallPosition = longTermBullish >= longTermBearish ? longTermBullish : (100 - longTermBearish);

                                    // Get price change and alert status based on timeframe
                                    const priceChangePercent = getPriceChangeForTimeframe(coin, timeframe);
                                    const showPriceAlert = hasPriceAlertForTimeframe(coin, timeframe);
                                    const threshold = getThreshold(timeframe);

                                    return (
                                        <tr key={index} className="border-b border-gray-800">
                                            {/* Coin Column */}
                                            <td className="py-4 px-4 w-1/2">
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="relative">
                                                        <img
                                                            src={coin.image_small || coin.image_thumb}
                                                            alt={coin.symbol}
                                                            className="w-14 h-14 rounded-full mb-2"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = `https://ui-avatars.com/api/?name=${coin.symbol}&background=ED8936&color=fff&size=56`;
                                                            }}
                                                        />
                                                        {/* Bell icon for coins exceeding price change threshold */}
                                                        {showPriceAlert && (
                                                            <div className="absolute -top-1 -right-1 group cursor-pointer z-[9999]">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${priceChangePercent > 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}>
                                                                    <FaBell className="text-white text-[15px]" />
                                                                </div>
                                                                {/* Tooltip on hover - positioned below the bell */}
                                                                <div className="invisible group-hover:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                                                    {getTimeframeLabel(timeframe)} Price Change: <span className={priceChangePercent > 0 ? 'text-green-400' : 'text-red-400'}>{priceChangePercent > 0 ? '+' : ''}{priceChangePercent?.toFixed(2)}%</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-black font-bold mb-1">
                                                        {coin.symbol ? coin.symbol.charAt(0).toUpperCase() + coin.symbol.slice(1).toLowerCase() : ''}
                                                        {/* Display 24hrs price change only */}
                                                        {timeframe === '24hrs' && priceChangePercent !== null && (
                                                            <span className="ml-1 text-gray-600">
                                                                ({Math.abs(priceChangePercent)?.toFixed(2)}%)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-black">
                                                        {sentimentData.mentions} posts
                                                    </div>
                                                    {/* Price change display - COMMENTED OUT - 24hrs uses live Binance data, others use coin's percentage_change */}
                                                    {/* {priceChangePercent !== null && (
                                                        <div className={`text-xs font-semibold mt-1 ${priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent?.toFixed(2)}%
                                                        </div>
                                                    )} */}
                                                </div>
                                            </td>

                                            {/* Outlook Column */}
                                            <td className="py-4 px-4 w-1/2">
                                                <div className="space-y-3">
                                                    {/* Short Term */}
                                                    <div>
                                                        <div className="mb-1 text-xs whitespace-nowrap">
                                                            <span className="text-black">Short Term:{shortTermPosts} posts</span>
                                                        </div>
                                                        {shortTermPosts === 0 ? (
                                                            <>
                                                                <div className="segmented-bar-container mb-1">
                                                                    <div style={{ display: 'flex', width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                                                                        <div style={{ backgroundColor: '#9ca3af', flex: 1, height: '100%' }} />
                                                                        <div style={{ backgroundColor: '#6b7280', flex: 1, height: '100%' }} />
                                                                        <div style={{ backgroundColor: '#4b5563', flex: 1, height: '100%' }} />
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-center text-gray-500">
                                                                    Not Applicable
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="segmented-bar-container mb-1">
                                                                    <div className="segmented-bar-background">
                                                                        <div className="segment segment-red" />
                                                                        <div className="segment segment-yellow" />
                                                                        <div className="segment segment-green" />
                                                                    </div>
                                                                    <div
                                                                        className="percentage-ball"
                                                                        style={{
                                                                            left: `${Math.min(Math.max(shortTermBallPosition, 6), 94)}%`,
                                                                            backgroundColor: shortTermBullish >= shortTermBearish ? '#00ff15' : '#ff2121',
                                                                            borderColor: shortTermBullish >= shortTermBearish ? '#00cc11' : '#cc1a1a'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className={`text-xs text-center ${shortTermBullish >= shortTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                                                    {(shortTermBullish >= shortTermBearish ? shortTermBullish : shortTermBearish).toFixed(0)}% {shortTermBullish >= shortTermBearish ? 'Bullish' : 'Bearish'}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Long Term */}
                                                    <div>
                                                        <div className="mb-1 text-xs whitespace-nowrap">
                                                            <span className="text-black">Long Term:{longTermPosts} posts</span>
                                                        </div>
                                                        {longTermPosts === 0 ? (
                                                            <>
                                                                <div className="segmented-bar-container mb-1">
                                                                    <div style={{ display: 'flex', width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                                                                        <div style={{ backgroundColor: '#9ca3af', flex: 1, height: '100%' }} />
                                                                        <div style={{ backgroundColor: '#6b7280', flex: 1, height: '100%' }} />
                                                                        <div style={{ backgroundColor: '#4b5563', flex: 1, height: '100%' }} />
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-center text-gray-500">
                                                                    Not Applicable
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="segmented-bar-container mb-1">
                                                                    <div className="segmented-bar-background">
                                                                        <div className="segment segment-red" />
                                                                        <div className="segment segment-yellow" />
                                                                        <div className="segment segment-green" />
                                                                    </div>
                                                                    <div
                                                                        className="percentage-ball"
                                                                        style={{
                                                                            left: `${Math.min(Math.max(longTermBallPosition, 6), 94)}%`,
                                                                            backgroundColor: longTermBullish >= longTermBearish ? '#00ff15' : '#ff2121',
                                                                            borderColor: longTermBullish >= longTermBearish ? '#00cc11' : '#cc1a1a'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className={`text-xs text-center ${longTermBullish >= longTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                                                    {(longTermBullish >= longTermBearish ? longTermBullish : longTermBearish).toFixed(0)}% {longTermBullish >= longTermBearish ? 'Bullish' : 'Bearish'}
                                                                </div>
                                                            </>
                                                        )}
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

                {/* <div
                    className="p-6 overflow-x-auto overflow-y-auto"
                    style={{ scrollbarGutter: "stable" }}
                >
                    <table className="w-full min-w-full table-fixed">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-center py-2 px-2 text-black font-semibold text-md w-1/2">
                                    Coin
                                </th>
                                <th className="text-center py-2 px-2 text-black font-semibold text-md w-1/2">
                                    Outlook
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {coins.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="text-center py-8 text-black">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                coins.map((coin, index) => {
                                    const sentimentData = getSentimentData(coin);

                                    const shortTermBullish = sentimentData.bullish_short_term;
                                    const shortTermBearish = sentimentData.bearish_short_term;
                                    const shortTermPosts =
                                        sentimentData.bullish_short_term_count +
                                        sentimentData.bearish_short_term_count;

                                    const longTermBullish = sentimentData.bullish_long_term;
                                    const longTermBearish = sentimentData.bearish_long_term;
                                    const longTermPosts =
                                        sentimentData.bullish_long_term_count +
                                        sentimentData.bearish_long_term_count;

                                    const shortTermBallPosition =
                                        shortTermBullish >= shortTermBearish
                                            ? shortTermBullish
                                            : 100 - shortTermBearish;
                                    const longTermBallPosition =
                                        longTermBullish >= longTermBearish
                                            ? longTermBullish
                                            : 100 - longTermBearish;
                                    const isShortTermBullish = shortTermBullish >= shortTermBearish;
                                    const isLongTermBullish = longTermBullish >= longTermBearish;
                                    return (
                                        <tr
                                            key={index}
                                            className="border-b border-gray-800  "
                                        >
                                            <td colSpan="2" className="py-4  ">
                                                <div className="flex items-center gap-6">
                                                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 flex flex-col items-center text-center min-w-[80px] py-2 px-4 rounded-lg">
                                                        <img
                                                            src={coin.image_small || coin.image_thumb}
                                                            alt={coin.symbol}
                                                            className="w-14 h-14 rounded-full mb-2"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = `https://ui-avatars.com/api/?name=${coin.symbol}&background=ED8936&color=fff&size=56`;
                                                            }}
                                                        />
                                                        <div className="text-sm text-white font-bold mb-1">
                                                            {coin.symbol?.toUpperCase()}
                                                        </div>
                                                        <div className="text-xs text-white">
                                                            {sentimentData.mentions} posts
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-3">
                                                        <div>
                                                            <div className="mb-1 text-xs whitespace-nowrap flex flex-row justify-between items-stretch">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isShortTermBullish
                                                                                ? "bg-emerald-100 text-emerald-700"
                                                                                : "bg-rose-100 text-rose-700"
                                                                            }`}
                                                                    >
                                                                        {isShortTermBullish ? "↗ Bullish" : "↘ Bearish"}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[8px] text-gray-500  text-center self-center justify-self-center">
                                                                    Short Term
                                                                </div>
                                                                <div className="text-[8px] text-black  text-center self-center justify-self-center">
                                                                    {shortTermPosts} posts
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-row justify-start items-center">
                                                                <div className="segmented-bar-container mb-1 min-w-[9vw]">
                                                                    <div className="segmented-bar-background">
                                                                        <div className="segment segment-red" />
                                                                        <div className="segment segment-yellow" />
                                                                        <div className="segment segment-green" />
                                                                    </div>
                                                                    <div
                                                                        className="percentage-ball"
                                                                        style={{
                                                                            left: `${(longTermBallPosition / 100) * 100}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div
                                                                    className={`font-semibold text-xs text-center ${shortTermBullish >= shortTermBearish
                                                                        ? "text-green-700"
                                                                        : "text-red-700"
                                                                        } ml-1`}
                                                                >
                                                                    {(longTermBullish >= longTermBearish
                                                                        ? longTermBullish
                                                                        : longTermBearish
                                                                    ).toFixed(0)}
                                                                    %
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="flex flex-row justify-start items-center">
                                                                <div className="segmented-bar-container mb-1 min-w-[9vw]">
                                                                    <div className="segmented-bar-background">
                                                                        <div className="segment segment-red" />
                                                                        <div className="segment segment-yellow" />
                                                                        <div className="segment segment-green" />
                                                                    </div>
                                                                    <div
                                                                        className="percentage-ball"
                                                                        style={{
                                                                            left: `${(longTermBallPosition / 100) * 100}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div
                                                                    className={`font-semibold text-xs text-center ${shortTermBullish >= shortTermBearish
                                                                        ? "text-green-700"
                                                                        : "text-red-700"
                                                                        } ml-1`}
                                                                >
                                                                    {(longTermBullish >= longTermBearish
                                                                        ? longTermBullish
                                                                        : longTermBearish
                                                                    ).toFixed(0)}
                                                                    %
                                                                </div>
                                                            </div>
                                                            <div className="mt-1 text-xs whitespace-nowrap flex flex-row justify-between items-stretch">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isLongTermBullish
                                                                                ? "bg-emerald-100 text-emerald-700"
                                                                                : "bg-rose-100 text-rose-700"
                                                                            }`}
                                                                    >
                                                                        {isLongTermBullish ? "↗ Bullish" : "↘ Bearish"}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[8px] text-gray-500  text-center self-center justify-self-center">
                                                                    Long Term
                                                                </div>
                                                                <div className="text-[8px] text-black text-center self-center justify-self-center">
                                                                    {longTermPosts} posts
                                                                </div>
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

                {/* <div className="p-6 overflow-x-auto overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
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

                                    const shortTermBallPosition = shortTermBullish >= shortTermBearish ? shortTermBullish : (100 - shortTermBearish);
                                    const longTermBallPosition = longTermBullish >= longTermBearish ? longTermBullish : (100 - longTermBearish);

                                    return (
                                        <tr key={index} className="border-b border-gray-800">
                                            <td colSpan="2" className="py-4 px-4 ">
                                                <div className="flex items-start gap-6">
                                                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 flex flex-col items-center text-center min-w-[60px]">
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
                                                    <div className="flex-1 space-y-3">
                                                        <div>

                                                            <div className="mt-2 text-xs whitespace-nowrap flex flex-row justify-between items-stretch">
                                                                <div className={`font-semibold text-xs text-center ${shortTermBullish >= shortTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                                                    {shortTermBullish >= shortTermBearish ? 'Bullish' : 'Bearish'}
                                                                    [ <span className="text-[10px] text-gray-500">Short Term</span>]
                                                                </div>
                                                                <div className="text-[10px] text-black">{shortTermPosts} posts</div>
                                                            </div>
                                                            <div className="flex flex-row justify-start items-center">
                                                                <div className="segmented-bar-container mb-1 w-max">
                                                                    <div className="segmented-bar-background">
                                                                        <div className="segment segment-red" />
                                                                        <div className="segment segment-yellow" />
                                                                        <div className="segment segment-green" />
                                                                    </div>
                                                                    <div
                                                                        className="percentage-ball"
                                                                        style={{ left: `${(shortTermBallPosition / 100) * 100}%` }}
                                                                    />
                                                                    <div className={`font-semibold text-xs text-center ${shortTermBullish >= shortTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                                                        {(longTermBullish >= longTermBearish ? longTermBullish : longTermBearish).toFixed(0)}%
                                                                    </div>
                                                                </div>

                                                            </div>
                                                            <div className="mb-1 text-xs whitespace-nowrap flex flex-row justify-center items-center">
                                                                <div className="text-[10px] text-gray-500">Short Term</div>
                                                            </div>

                                                        </div>
                                                        <div>
                                                            <div className="flex flex-row justify-start items-center">
                                                                <div className="segmented-bar-container mb-1 min-w-[10vw]">
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
                                                                <div className={`font-semibold text-xs text-center ${shortTermBullish >= shortTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                                                    {(longTermBullish >= longTermBearish ? longTermBullish : longTermBearish).toFixed(0)}%
                                                                </div>

                                                            </div>
                                                            <div className="mt-2 text-xs whitespace-nowrap flex flex-row justify-between items-stretch">
                                                                <div className={`font-semibold text-xs text-center ${longTermBullish >= longTermBearish ? 'text-green-700' : 'text-red-700'}`}>
                                                                    {longTermBullish >= longTermBearish ? 'Bullish' : 'Bearish'}
                                                                    [ <span className="text-[10px] text-gray-500">Long Term</span>]
                                                                </div>
                                                                <div className="text-[10px] text-black">{longTermPosts} posts</div>
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
                </div> */}

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

                .segmented-bar-background-gray {
                    display: block;
                    width: 100px;
                    height: 8px;
                    background: linear-gradient(to right, #9ca3af 0%, #6b7280 33%, #4b5563 66%, #374151 100%) !important;
                    border-radius: 4px;
                    position: relative;
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

                .segment-gray-light {
                    background-color: #9ca3af !important;
                }

                .segment-gray-medium {
                    background-color: #6b7280 !important;
                }

                .segment-gray-dark {
                    background-color: #4b5563 !important;
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
                    left: clamp(6px, var(--ball-position), calc(100% - 6px)) !important;
                }

                .percentage-ball-gray {
                    position: absolute;
                    top: -2px;
                    width: 12px;
                    height: 12px;
                    background-color: #e5e7eb;
                    border: 2px solid #9ca3af;
                    border-radius: 50%;
                    transform: translateX(-50%);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </div>
    );
}