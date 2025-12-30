"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import moment from "moment-timezone";
import { FaBell, FaYoutube, FaTelegramPlane, FaInfoCircle, FaCertificate } from "react-icons/fa";
import { motion } from "framer-motion";
import { useTop10LivePrice } from "../livePriceTop10";

export default function YouTubeTelegramDataTable({ useLocalTime: propUseLocalTime = false }) {
    const router = useRouter();
    const { top10Data, isConnected } = useTop10LivePrice();
    const scrollingData = [...top10Data, ...top10Data];
    const [selectedPlatform, setSelectedPlatform] = useState("Combined");
    const [selectedCoinType, setSelectedCoinType] = useState("top_coins");
    const [selectedTimeframe, setSelectedTimeframe] = useState("2hrs");
    const [combinedData, setCombinedData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [nextUpdate, setNextUpdate] = useState(null);
    const [binancePriceData, setBinancePriceData] = useState({});
    const [binanceLivePrice, setBinanceLivePrice] = useState({});
    const useLocalTime = propUseLocalTime;

    const [expandedTables, setExpandedTables] = useState({
        "6hrs": false,
        "24hrs": false,
        "7days": false,
        "30days": false
    });

    const TelegramIcon = ({ className }) => (
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z"></path>
        </svg>
    );
    const [influencerModal, setInfluencerModal] = useState({
        isOpen: false,
        type: '',
        influencers: {},
        position: { x: 0, y: 0 }
    });

    const [isMouseOverModal, setIsMouseOverModal] = useState(false);





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

    // Close modal on scroll only if mouse is not over the modal
    useEffect(() => {
        const handleScroll = () => {
            if (influencerModal.isOpen && !isMouseOverModal) {
                setInfluencerModal({ isOpen: false, type: '', influencers: {}, position: { x: 0, y: 0 } });
            }
        };

        window.addEventListener('scroll', handleScroll, true);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [influencerModal.isOpen, isMouseOverModal]);

    // Reset mouse over state when modal closes
    useEffect(() => {
        if (!influencerModal.isOpen) {
            setIsMouseOverModal(false);
        }
    }, [influencerModal.isOpen]);


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

                // Create a map of symbol to priceChangePercent and lastPrice (only USDT pairs)
                const priceMap = {};
                const livePriceMap = {};
                data.forEach(ticker => {
                    if (ticker.symbol.endsWith('USDT')) {
                        const symbol = ticker.symbol.replace('USDT', '').toLowerCase();
                        priceMap[symbol] = parseFloat(ticker.priceChangePercent);
                        livePriceMap[symbol] = parseFloat(ticker.lastPrice);
                    }
                });

                setBinancePriceData(priceMap);
                setBinanceLivePrice(livePriceMap);
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

                    // Update live price with current price
                    setBinanceLivePrice(prevData => {
                        const newData = { ...prevData };
                        data.forEach(ticker => {
                            if (ticker.s && ticker.s.endsWith('USDT')) {
                                const symbol = ticker.s.replace('USDT', '').toLowerCase();
                                // c = current/last price
                                newData[symbol] = parseFloat(ticker.c);
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

    // Helper function to get live price for a coin symbol (from Binance)
    const getLivePrice = (symbol) => {
        if (!symbol) return null;
        const lowerSymbol = symbol.toLowerCase();
        return binanceLivePrice[lowerSymbol] ?? null;
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

    // Threshold constants for bell alerts
    const THRESHOLD_PERCENT = 30;
    const THRESHOLD_TOP_PERCENT = 15;
    const TOP_COINS_RANK_LIMIT = 15;

    // Threshold constants for meme coins
    const MEME_THRESHOLD_TOP_PERCENT = 20;
    const MEME_THRESHOLD_PERCENT = 50;

    // Check if price change exceeds threshold based on 24hr Binance data
    // Bell should appear across ALL timeframes when 24hr threshold is met
    const hasPriceAlertForTimeframe = (coin, timeframe) => {
        // Use Binance 24hr live data for alert check (applies to all timeframes)
        const priceChange = getPriceChangePercent(coin?.symbol);

        if (priceChange === null) return false;

        const marketCapRank = coin?.market_cap_rank;
        const isMeme = coin?.mem_coin === true;

        // For meme coins, use different thresholds
        if (isMeme) {
            // Show bell when:
            // 1. Meme coin with rank <= 15 and price change is ±20%
            // 2. OR meme coin with rank > 15 (or no rank) and price change is ±50%
            if (marketCapRank && marketCapRank <= TOP_COINS_RANK_LIMIT) {
                return Math.abs(priceChange) >= MEME_THRESHOLD_TOP_PERCENT;
            } else {
                return Math.abs(priceChange) >= MEME_THRESHOLD_PERCENT;
            }
        }

        // For regular coins (not meme coins), use original thresholds
        // Show bell when:
        // 1. Price change is ±30% (THRESHOLD_PERCENT)
        // 2. OR if coin's market_cap_rank <= 15 and price change is ±15%
        if (Math.abs(priceChange) >= THRESHOLD_PERCENT) {
            return true;
        }

        if (marketCapRank && marketCapRank <= TOP_COINS_RANK_LIMIT && Math.abs(priceChange) >= THRESHOLD_TOP_PERCENT) {
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
            formattedDate = localDate.format('DD MMM hh:mm A');
        } else {
            formattedDate = momentDate.utc().format('DD MMM hh:mm A');
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

    // Helper function to check if coin is in new_coins list
    const isNewCoin = (coin) => {
        if (!combinedData || !combinedData.notifications || !combinedData.notifications.new_coins) {
            return false;
        }

        const newCoins = combinedData.notifications.new_coins;
        return newCoins.some(newCoin =>
            newCoin.source_id === coin.source_id ||
            newCoin.symbol?.toLowerCase() === coin.symbol?.toLowerCase()
        );
    };

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

        // Check if any coin in this timeframe has a price alert (based on 24hr data)
        const hasAnyPriceAlert = allCoins.some(coin => hasPriceAlertForTimeframe(coin, timeframe));

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
            <div className="bg-gradient-to-br from-white/80 via-indigo-50/80 to-fuchsia-50/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 border-2 border-white/40">
                <div className="bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 p-4">
                    <h3 className="text-xl font-bold text-white text-center mb-1 flex items-center justify-center gap-2 drop-shadow-md">
                        {title}
                        {hasAnyPriceAlert && (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 bg-emerald-500 animate-pulse ring-2 ring-white/30">
                                <FaBell className="text-white text-[15px]" />
                            </div>
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
                                <th className="text-center py-2 px-2 text-black font-semibold text-md w-1/2">
                                    <div className="flex items-center justify-center gap-1">
                                        Coin
                                        <div className="relative group/info cursor-pointer">
                                            <FaInfoCircle className="text-gray-500 text-xs" />
                                            <div className="invisible group-hover/info:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-[99999]">
                                                {timeframe === '6hrs' ? (
                                                    <div className="text-left space-y-1">
                                                        <div>Click Coin for Coin details</div>
                                                        <div>Click Post for Post details</div>
                                                        <div>Click Channel for Channel details</div>
                                                        <div>Hover on Coin to see Live price</div>
                                                    </div>
                                                ) : (
                                                    "Hover on Coin to see Live price"
                                                )}
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                </th>
                                <th className="text-center py-2 px-2 text-black font-semibold text-md w-1/2">Outlook</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coins.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="text-center py-8 text-black">No Post available</td>
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
                                    // Get 24hr Binance data for bell color (since alert is based on 24hr data)
                                    const binance24hrChange = getPriceChangePercent(coin?.symbol);

                                    // const getAlertReason = () => {
                                    //     const binance24hrChange = getPriceChangePercent(coin?.symbol);
                                    //     const isMeme = coin?.mem_coin === true;

                                    //     if (binance24hrChange !== null) {
                                    //         const absChange = Math.abs(binance24hrChange);
                                    //         if (isMeme) {
                                    //             if (coin?.market_cap_rank && coin.market_cap_rank <= TOP_COINS_RANK_LIMIT && absChange >= MEME_THRESHOLD_TOP_PERCENT) {
                                    //                 return `24H: Meme Top ${TOP_COINS_RANK_LIMIT}, ${MEME_THRESHOLD_TOP_PERCENT}% Movement\nCurrent: ${binance24hrChange > 0 ? '+' : ''}${binance24hrChange.toFixed(2)}%`;
                                    //             }
                                    //             if (absChange >= MEME_THRESHOLD_PERCENT) {
                                    //                 return `24H: Meme ${MEME_THRESHOLD_PERCENT}% Price Movement\nCurrent: ${binance24hrChange > 0 ? '+' : ''}${binance24hrChange.toFixed(2)}%`;
                                    //             }
                                    //         } else {
                                    //             if (absChange >= THRESHOLD_PERCENT) {
                                    //                 return `24H: ${THRESHOLD_PERCENT}% Price Movement\nCurrent: ${binance24hrChange > 0 ? '+' : ''}${binance24hrChange.toFixed(2)}%`;
                                    //             }
                                    //             if (coin?.market_cap_rank && coin.market_cap_rank <= TOP_COINS_RANK_LIMIT && absChange >= THRESHOLD_TOP_PERCENT) {
                                    //                 return `24H: Top ${TOP_COINS_RANK_LIMIT} coin, ${THRESHOLD_TOP_PERCENT}% Movement\nCurrent: ${binance24hrChange > 0 ? '+' : ''}${binance24hrChange.toFixed(2)}%`;
                                    //             }
                                    //         }
                                    //     }
                                    //     return '24H Price Alert';
                                    // };
                                    const getAlertReason = () => {
                                        const binance24hrChange = getPriceChangePercent(coin?.symbol);
                                        const livePrice = getLivePrice(coin?.symbol);
                                        const isMeme = coin?.mem_coin === true;

                                        if (binance24hrChange !== null) {
                                            const absChange = Math.abs(binance24hrChange);
                                            const priceChangeText = `24H % Change: ${binance24hrChange > 0 ? '+' : ''}${binance24hrChange.toFixed(2)}%`;
                                            const livePriceText = livePrice !== null ? `\nLive Price: $${livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}` : '';

                                            if (isMeme) {
                                                if (coin?.market_cap_rank && coin.market_cap_rank <= TOP_COINS_RANK_LIMIT && absChange >= MEME_THRESHOLD_TOP_PERCENT) {
                                                    return `${priceChangeText}${livePriceText}`;
                                                }
                                                if (absChange >= MEME_THRESHOLD_PERCENT) {
                                                    return `${priceChangeText}${livePriceText}`;
                                                }
                                            } else {
                                                if (absChange >= THRESHOLD_PERCENT) {
                                                    return `${priceChangeText}${livePriceText}`;
                                                }
                                                if (coin?.market_cap_rank && coin.market_cap_rank <= TOP_COINS_RANK_LIMIT && absChange >= THRESHOLD_TOP_PERCENT) {
                                                    return `${priceChangeText}${livePriceText}`;
                                                }
                                            }
                                        }
                                        return '24H Price Alert';
                                    };

                                    return (
                                        <tr key={index} className="border-b border-gray-800">
                                            {/* Coin Column */}
                                            <td className="py-4 px-4 w-1/2">
                                                <div className="flex flex-col items-center text-center h-full min-h-[155px] justify-start">
                                                    <div className="relative">
                                                        {/* M Certificate - top left of coin image - only for 6hrs timeframe */}
                                                        {timeframe === '6hrs' && isNewCoin(coin) && (
                                                            <div className="absolute -top-2 -left-8 group/newcoin z-[9999]">
                                                                <div className="relative inline-flex items-center justify-center h-6 w-6">
                                                                    <FaCertificate className="text-blue-500 w-full h-full drop-shadow-md" />
                                                                    <span className="absolute text-[11px] font-bold text-white uppercase tracking-tighter">M</span>
                                                                </div>
                                                                <div className="invisible group-hover/newcoin:visible absolute top-full left-0 mt-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-[9999]">
                                                                    New Mention in last 6 hours
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="relative group/coinimage">
                                                            <img
                                                                src={coin.image_small || coin.image_thumb || coin.image_large}
                                                                alt={coin.symbol}
                                                                className="w-14 h-14 rounded-full mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => router.push(`/coins-list/${coin.source_id}`)}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${coin.symbol}&background=ED8936&color=fff&size=56`;
                                                                }}
                                                            />
                                                            {/* Show live price tooltip when hovering on coin image (only if NO bell) */}
                                                            {!showPriceAlert && getLivePrice(coin?.symbol) !== null && (
                                                                <div className="invisible group-hover/coinimage:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                                                    Live Price: ${getLivePrice(coin?.symbol).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Bell icon for coins exceeding price change threshold - positioned outside coin at top-right */}
                                                        {showPriceAlert && (
                                                            <div className="absolute -top-2 -right-8 group/bell cursor-pointer z-[9999]">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/30 ${binance24hrChange > 0 ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'} animate-pulse`}>
                                                                    <FaBell className="text-white text-[15px]" />
                                                                </div>
                                                                {/* Tooltip on hover - positioned below the bell */}
                                                                <div className="invisible group-hover/bell:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-pre-line z-[9999] min-w-[200px] text-center">
                                                                    {getAlertReason()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-black font-bold mb-1 flex items-center justify-center gap-1">
                                                        <span>{coin.symbol ? coin.symbol.charAt(0).toUpperCase() + coin.symbol.slice(1).toLowerCase() : ''}</span>
                                                    </div>
                                                    <div
                                                        className={`text-xs text-black ${timeframe === '6hrs' ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
                                                        onClick={() => {
                                                            if (timeframe === '6hrs') {
                                                                // Scroll to YouTubeTelegramInfluencers section
                                                                const influencersSection = document.getElementById('youtube-telegram-influencers');
                                                                if (influencersSection) {
                                                                    influencersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                                    // Dispatch custom event with coin data and reset source to Combined
                                                                    const event = new CustomEvent('filterByCoin', {
                                                                        detail: {
                                                                            source_id: coin.source_id,
                                                                            name: coin.coin_name,
                                                                            symbol: coin.symbol,
                                                                            resetSource: 'Combined'
                                                                        }
                                                                    });
                                                                    window.dispatchEvent(event);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        {sentimentData.mentions} posts
                                                    </div>

                                                    {/* YouTube Influencer Count */}
                                                    {coin.yt_unique_influencers_count > 0 && (
                                                        <div
                                                            className="cursor-pointer mt-3"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (coin.yt_unique_inf && coin.yt_unique_inf.length > 0) {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const modalWidth = 250;
                                                                    const influencerCount = coin.yt_unique_inf.length;
                                                                    // Calculate approximate modal height based on content
                                                                    // Header: ~50px, Each item: ~28px, Padding: ~20px
                                                                    const estimatedModalHeight = Math.min(400, 70 + (influencerCount * 28));
                                                                    const viewportWidth = window.innerWidth;
                                                                    const viewportHeight = window.innerHeight;
                                                                    const gap = 5;
                                                                    const padding = 10;

                                                                    // Calculate horizontal position - prefer right side
                                                                    let x = rect.right + gap;
                                                                    // If modal would overflow right, position it to the left of button
                                                                    if (x + modalWidth > viewportWidth - padding) {
                                                                        x = rect.left - modalWidth - gap;
                                                                        // If still overflowing left, clamp to left edge with padding
                                                                        if (x < padding) {
                                                                            x = padding;
                                                                        }
                                                                    }

                                                                    // Calculate vertical position - align with button top
                                                                    let y = rect.top;
                                                                    // If modal would overflow bottom, adjust to fit
                                                                    if (y + estimatedModalHeight > viewportHeight - padding) {
                                                                        y = Math.max(padding, viewportHeight - estimatedModalHeight - padding);
                                                                    }
                                                                    // Ensure not above viewport
                                                                    if (y < padding) {
                                                                        y = padding;
                                                                    }

                                                                    setInfluencerModal({
                                                                        isOpen: true,
                                                                        type: 'YouTube',
                                                                        influencers: coin.yt_unique_inf,
                                                                        position: { x, y }
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <div className="text-[10px] font-semibold flex items-center justify-center gap-1">
                                                                <FaYoutube className="text-red-600 text-xs" />
                                                                <span className="text-black">{coin.yt_unique_influencers_count} {coin.yt_unique_influencers_count === 1 ? 'Channel' : 'Channels'}</span>
                                                            </div>

                                                        </div>
                                                    )}

                                                    {/* Telegram Influencer Count */}
                                                    {coin.tg_unique_influencers_count > 0 && (
                                                        <div
                                                            className="cursor-pointer mt-3"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (coin.tg_unique_inf && coin.tg_unique_inf.length > 0) {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const modalWidth = 250;
                                                                    const influencerCount = coin.tg_unique_inf.length;
                                                                    // Calculate approximate modal height based on content
                                                                    // Header: ~50px, Each item: ~28px, Padding: ~20px
                                                                    const estimatedModalHeight = Math.min(400, 70 + (influencerCount * 28));
                                                                    const viewportWidth = window.innerWidth;
                                                                    const viewportHeight = window.innerHeight;
                                                                    const gap = 5;
                                                                    const padding = 10;

                                                                    // Calculate horizontal position - prefer right side
                                                                    let x = rect.right + gap;
                                                                    // If modal would overflow right, position it to the left of button
                                                                    if (x + modalWidth > viewportWidth - padding) {
                                                                        x = rect.left - modalWidth - gap;
                                                                        // If still overflowing left, clamp to left edge with padding
                                                                        if (x < padding) {
                                                                            x = padding;
                                                                        }
                                                                    }

                                                                    // Calculate vertical position - align with button top
                                                                    let y = rect.top;
                                                                    // If modal would overflow bottom, adjust to fit
                                                                    if (y + estimatedModalHeight > viewportHeight - padding) {
                                                                        y = Math.max(padding, viewportHeight - estimatedModalHeight - padding);
                                                                    }
                                                                    // Ensure not above viewport
                                                                    if (y < padding) {
                                                                        y = padding;
                                                                    }

                                                                    setInfluencerModal({
                                                                        isOpen: true,
                                                                        type: 'Telegram',
                                                                        influencers: coin.tg_unique_inf,
                                                                        position: { x, y }
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <div className="text-[10px] font-semibold flex items-center justify-center gap-1">
                                                                <FaTelegramPlane className="text-blue-600 text-xs" />
                                                                <span className="text-black">{coin.tg_unique_influencers_count} {coin.tg_unique_influencers_count === 1 ? 'Channel' : 'Channels'}</span>
                                                            </div>
                                                        </div>
                                                    )}

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
                                        No Post available
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
                                    <td colSpan="2" className="text-center py-8 text-black">No Post available</td>
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
                            className="bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-600 hover:via-indigo-700 hover:to-fuchsia-700 p-4 text-white font-semibold text-sm cursor-pointer rounded-lg transition-all shadow-md shadow-indigo-500/30"
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
            <div className="bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                    <div className="text-gray-900 text-lg font-semibold mb-2">Loading Data Table...</div>
                    <div className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 bg-clip-text text-transparent text-sm font-medium">Fetching YouTube & Telegram analytics</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Live Prices Scroller - Full Width */}
            {/* <div className="w-full mt-4">
                <h2 className="text-center text-gray-900 text-2xl font-bold mb-2">
                    Live Prices <span className="text-gray-600 text-sm">(Source Binance)</span>
                </h2>
                <h2 className="text-center text-gray-900 text-sm mb-3">
                    <span className="text-gray-600 text-sm">(Price change percentage in last 24 hours)</span>
                </h2>
                <div
                    ref={scrollContainerRef}
                    className="relative h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl border border-blue-200 overflow-hidden shadow-2xl"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onWheel={handleWheel}
                >
                    <div className="absolute inset-0 flex items-center">
                        <motion.div
                            drag="x"
                            dragConstraints={false}
                            dragElastic={0}
                            dragMomentum={false}
                            onDrag={handleDrag}
                            onDragStart={() => setIsDragging(true)}
                            onDragEnd={() => setIsDragging(false)}
                            style={{ x: xLive }}
                            animate={controlsLive}
                            className="flex whitespace-nowrap cursor-grab active:cursor-grabbing"
                        >
                            {[...scrollingData, ...scrollingData].map((item, index) => (
                                <div
                                    key={item.symbol + index}
                                    className="price-item flex items-center gap-3 px-5 py-3 mx-4 flex-shrink-0"
                                >
                                    {item.image && (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-8 h-8 rounded-full flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-purple-600 font-bold text-xs uppercase truncate">
                                            {item.symbol}
                                        </span>
                                        <span className="text-gray-600 text-xs capitalize truncate">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-gray-900 font-bold text-sm whitespace-nowrap">
                                            ${typeof item.price === 'number' ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price}
                                        </span>
                                        <span className={`text-xs font-semibold whitespace-nowrap ${typeof item.priceChange24h === 'number'
                                            ? item.priceChange24h >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            : 'text-gray-500'
                                            }`}>
                                            {typeof item.priceChange24h === 'number'
                                                ? `${item.priceChange24h >= 0 ? '+' : ''}${item.priceChange24h.toFixed(2)}%`
                                                : '0.00%'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-blue-100 to-transparent pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-purple-100 to-transparent pointer-events-none"></div>
                </div>
            </div> */}

            {/* Last Update - Above Filters */}
            {/* <div className="flex flex-col items-start gap-1 mt-4">
                <p className="text-md text-black-900">
                    Update: {lastUpdated ? formatDate(lastUpdated) : "N/A"}
                </p>
                <p className="text-md text-black-900">
                    Next Update: {nextUpdate ? formatDate(nextUpdate) : "N/A"}
                </p>
            </div> */}

            {/* Filters Section - Compact Single Line */}
            <div className="w-full mt-2 flex justify-start">
                <div className="bg-gradient-to-br from-white/80 via-indigo-50/60 to-fuchsia-50/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/10 border border-white/50 px-6 py-4 inline-flex items-center gap-6">
                    {/* Channel Dropdown */}
                    <div className="flex items-center gap-3">
                        <label className="text-lg text-black font-semibold">Channel:</label>
                        <select
                            value={selectedPlatform}
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                            className="bg-white border-2 border-indigo-300/50 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[150px] shadow-sm"
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
                            className="bg-white border-2 border-indigo-300/50 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[150px] shadow-sm"
                        >
                            {coinTypeOptions.map((option) => (
                                <option key={option.key} value={option.key} className="bg-white text-black">
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Source Icons - Inline */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-black font-medium">Source:</span>
                        <div className="flex items-center gap-2">
                            {selectedPlatform === "Combined" ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                    <TelegramIcon className="text-blue-600 w-4 h-4" />
                                </>
                            ) : selectedPlatform === "YouTube" ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            ) : selectedPlatform === "Telegram" ? (
                                <TelegramIcon className="text-blue-600 w-4 h-4" />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hover Instruction Text */}
            {/* <div className="flex justify-between items-center mt-4">
                <p className="text-black-600 text-sm ml-13">
                    Click Coin for Coin details <br />
                    Click Post for Post details<br />
                    Click Channel for Channel details
                </p>
                <div className="mr-16"></div>
            </div> */}

            {/* Info Icons Row - One above each table */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {['6hrs', '24hrs', '7days', '30days'].map((timeframe, index) => (
                    <div key={timeframe} className="flex justify-center">
                        <div className="relative group/info">
                            <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400 transition-colors">
                                <span className="text-gray-700 text-xs font-bold">ℹ</span>
                            </div>
                            <div className="invisible group-hover/info:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                Hover on Coin to see Live Price
                            </div>
                        </div>
                    </div>
                ))}
            </div> */}

            {/* Four Tables in One Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start mt-2">
                {renderTable("6hrs", "Last 6 Hours")}
                {renderTable("24hrs", "Last 24 Hours")}
                {renderTable("7days", "Last 7 Days")}
                {renderTable("30days", "Last 30 Days")}
            </div>

            {/* Influencer Popup */}
            {influencerModal.isOpen && (
                <>
                    {/* Click outside to close */}
                    <div
                        className="fixed inset-0 z-[9999]"
                        onClick={() => setInfluencerModal({ isOpen: false, type: '', influencers: {}, position: { x: 0, y: 0 } })}
                        onScroll={() => setInfluencerModal({ isOpen: false, type: '', influencers: {}, position: { x: 0, y: 0 } })}
                    />

                    {/* Popup positioned near clicked element */}
                    <div
                        className="fixed z-[10000] bg-gray-800 text-white rounded-lg shadow-2xl p-3 w-[250px] flex flex-col"
                        style={{
                            left: `${influencerModal.position.x}px`,
                            top: `${influencerModal.position.y}px`,
                            maxHeight: '400px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={() => setIsMouseOverModal(true)}
                        onMouseLeave={() => setIsMouseOverModal(false)}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600 flex-shrink-0">
                            <h3 className="text-xs font-bold flex items-center gap-1.5">
                                {influencerModal.type === 'YouTube' ? (
                                    <FaYoutube className="text-red-500 text-xs" />
                                ) : (
                                    <FaTelegramPlane className="text-blue-400 text-xs" />
                                )}
                                {influencerModal.type} Influencers
                            </h3>
                            <button
                                onClick={() => setInfluencerModal({ isOpen: false, type: '', influencers: {}, position: { x: 0, y: 0 } })}
                                className="text-gray-400 hover:text-white text-lg leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Influencer List */}
                        <div className="overflow-y-auto pr-1 min-h-0 flex-1" style={{ scrollbarWidth: 'thin' }}>
                            <div className="space-y-1">
                                {Array.isArray(influencerModal.influencers) ? (
                                    influencerModal.influencers.map((influencer) => (
                                        <div
                                            key={influencer.channel_id}
                                            className="text-[10px] py-1 text-gray-200 hover:text-white cursor-pointer hover:bg-gray-700 px-1 rounded transition-colors"
                                            onClick={() => {
                                                const route = influencerModal.type === 'YouTube'
                                                    ? `/influencers/${influencer.channel_id}?tab=recentActivities`
                                                    : `/telegram-influencer/${influencer.channel_id}?tab=recentActivities`;
                                                router.push(route);
                                            }}
                                        >
                                            • {influencer.influencer_name === "N/A" ? influencer.channel_id : influencer.influencer_name}
                                        </div>
                                    ))
                                ) : null}
                            </div>
                        </div>
                    </div>
                </>
            )}

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