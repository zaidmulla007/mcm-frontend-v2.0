"use client";
import React, { useState, useEffect, useRef } from "react";
import { FaYoutube, FaTelegramPlane, FaCertificate } from "react-icons/fa";
import { motion, useMotionValue, useAnimationFrame } from "framer-motion";

// Helper function to clean up message format
const cleanMessageFormat = (content) => {
    if (!content) return content;

    // Pattern to match: "COIN has moved down/up by X.XX%"
    let cleaned = content.replace(/(\w+)\s+has moved (down|up) by\s+(\d+\.?\d*%)/gi, (match, coin, direction, percentage) => {
        const percentValue = parseFloat(percentage);
        if (percentValue === 0 || percentValue === 0.0 || percentValue === 0.00) {
            return `${coin}: Minor movement`;
        }
        return `${coin}: ${percentage}`;
    });

    cleaned = cleaned.replace(/(^|·\s*)([A-Z]{2,10})\s+(\d+\.?\d*%\s+[↑↓])/g, '$1$2: $3');
    cleaned = cleaned.replace(/\s+in\s+2\s+hours/gi, ' in last 2 Hrs');
    cleaned = cleaned.replace(/\s+in\s+last\s+6\s+hours/gi, ' in last 6 Hrs');
    cleaned = cleaned.replace(/in\s+last\s+2\s+Hrs,/gi, 'in last 2 Hrs');
    cleaned = cleaned.replace(/(TG:\s+\d+\s+New\s+Posts?)\s+(in\s+last\s+6\s+Hrs)/gi, '$2 $1');

    return cleaned;
};

export default function TrendingCoinScroller() {
    const [trendingMessages, setTrendingMessages] = useState([]);
    const [selectedTimeframe, setSelectedTimeframe] = useState("2hrs");

    // State for 2-hour scroller
    const [is2HourPaused, setIs2HourPaused] = useState(false);
    const [is2HourDragging, setIs2HourDragging] = useState(false);
    const x2Hour = useMotionValue(0);
    const scrollContainer2Hour = useRef(null);
    const [contentWidth2Hour, setContentWidth2Hour] = useState(0);

    // State for 6-hour scroller
    const [is6HourPaused, setIs6HourPaused] = useState(false);
    const [is6HourDragging, setIs6HourDragging] = useState(false);
    const x6Hour = useMotionValue(0);
    const scrollContainer6Hour = useRef(null);
    const [contentWidth6Hour, setContentWidth6Hour] = useState(0);

    const baseTrendingVelocity = 50; // pixels per second

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/admin/strategyyoutubedata/ytandtg`);
                const data = await response.json();

                if (data && data.notifications) {
                    const messages = [];
                    const notifications = data.notifications;

                    // Add 2-hour hourly alerts summary (scroller data)
                    if (notifications.scroller) {
                        messages.push({
                            label: "2 Hours",
                            content: cleanMessageFormat(notifications.scroller)
                        });
                    } else if (notifications.hourly_alerts_summary) {
                        messages.push({
                            label: "2 Hours",
                            content: cleanMessageFormat(notifications.hourly_alerts_summary)
                        });
                    }

                    // Add 6-hour new coins summary
                    if (notifications.new_coins_summary) {
                        messages.push({
                            label: "6 Hours",
                            content: cleanMessageFormat(notifications.new_coins_summary)
                        });
                    }

                    if (messages.length === 0) {
                        messages.push({ label: null, content: "Waiting for market updates..." });
                    }

                    setTrendingMessages(messages);
                }
            } catch (error) {
                console.error('Error fetching trending data:', error);
                setTrendingMessages([{ label: null, content: "Loading trending updates..." }]);
            }
        };

        fetchData();
    }, []);

    // Measure 2-hour and 6-hour scroller content width for infinite loop
    useEffect(() => {
        const measureWidth = () => {
            if (scrollContainer2Hour.current) {
                const contentItem = scrollContainer2Hour.current.querySelector('.scroller-content-item');
                if (contentItem) {
                    setContentWidth2Hour(contentItem.offsetWidth);
                }
            }
            if (scrollContainer6Hour.current) {
                const contentItem = scrollContainer6Hour.current.querySelector('.scroller-content-item');
                if (contentItem) {
                    setContentWidth6Hour(contentItem.offsetWidth);
                }
            }
        };

        measureWidth();
        const timer = setTimeout(measureWidth, 100);
        return () => clearTimeout(timer);
    }, [trendingMessages]);

    // Animation for 2-hour scroller with seamless infinite loop
    useAnimationFrame((t, delta) => {
        if (is2HourPaused || is2HourDragging) return;

        const moveBy = (baseTrendingVelocity * (delta / 1000));
        let newX = x2Hour.get() - moveBy;

        if (contentWidth2Hour > 0) {
            if (newX <= -contentWidth2Hour) {
                newX = newX + contentWidth2Hour;
            }
            if (newX >= contentWidth2Hour) {
                newX = newX - contentWidth2Hour;
            }
        }

        x2Hour.set(newX);
    });

    // Animation for 6-hour scroller with seamless infinite loop
    useAnimationFrame((t, delta) => {
        if (is6HourPaused || is6HourDragging) return;

        const moveBy = (baseTrendingVelocity * (delta / 1000));
        let newX = x6Hour.get() - moveBy;

        if (contentWidth6Hour > 0) {
            if (newX <= -contentWidth6Hour) {
                newX = newX + contentWidth6Hour;
            }
            if (newX >= contentWidth6Hour) {
                newX = newX - contentWidth6Hour;
            }
        }

        x6Hour.set(newX);
    });

    const handle2HourDrag = (event, info) => {
        const currentX = x2Hour.get();

        if (contentWidth2Hour > 0) {
            if (currentX <= -contentWidth2Hour) {
                x2Hour.set(currentX + contentWidth2Hour);
            }
            else if (currentX >= 0) {
                x2Hour.set(currentX - contentWidth2Hour);
            }
        }
    };

    const handle6HourDrag = (event, info) => {
        const currentX = x6Hour.get();

        if (contentWidth6Hour > 0) {
            if (currentX <= -contentWidth6Hour) {
                x6Hour.set(currentX + contentWidth6Hour);
            }
            else if (currentX >= 0) {
                x6Hour.set(currentX - contentWidth6Hour);
            }
        }
    };

    return (
        <div className="w-full">
            {/* Gradient border wrapper */}
            <div className="relative rounded-lg p-[2px] bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
                <div className="bg-white rounded-lg overflow-hidden relative">
                    {/* Timeframe Filter and Eye Icon */}
                    <div className="px-4 pt-3 pb-2 bg-gradient-to-r from-purple-100 to-blue-200 flex items-center gap-3">
                        {/* Eye Icon with Tooltip */}
                        <div className="relative group cursor-pointer">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            <div className="invisible group-hover:visible absolute top-full left-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                N/A: percent change is not available
                            </div>
                        </div>

                        {/* Legend for New Mention */}
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="relative inline-flex items-center justify-center h-7 w-7">
                                <FaCertificate className="text-blue-500 w-full h-full drop-shadow-sm" />
                                <span className="absolute text-[12px] font-bold text-white uppercase tracking-tighter">M</span>
                            </div>
                            <span className="text-gray-700 text-xs font-medium">
                                New mention in last {selectedTimeframe === "2hrs" ? "6" : "6"} hours
                            </span>
                        </div>
                    </div>

                    {/* Scrolling Content */}
                    <div className="px-4 pb-3 bg-gradient-to-r from-purple-50 to-blue-100">
                        <div
                            className="rounded-md relative overflow-hidden"
                            ref={selectedTimeframe === "2hrs" ? scrollContainer2Hour : scrollContainer6Hour}
                        >
                            <motion.div
                                className="flex whitespace-nowrap cursor-grab active:cursor-grabbing"
                                style={{ x: selectedTimeframe === "2hrs" ? x2Hour : x6Hour }}
                                drag="x"
                                dragConstraints={false}
                                dragElastic={0}
                                dragMomentum={false}
                                onDragStart={() => selectedTimeframe === "2hrs" ? setIs2HourDragging(true) : setIs6HourDragging(true)}
                                onDragEnd={() => selectedTimeframe === "2hrs" ? setIs2HourDragging(false) : setIs6HourDragging(false)}
                                onDrag={selectedTimeframe === "2hrs" ? handle2HourDrag : handle6HourDrag}
                                onMouseEnter={() => selectedTimeframe === "2hrs" ? setIs2HourPaused(true) : setIs6HourPaused(true)}
                                onMouseLeave={() => selectedTimeframe === "2hrs" ? setIs2HourPaused(false) : setIs6HourPaused(false)}
                            >
                                {(() => {
                                    const message = trendingMessages.find(m => m.label === "2 Hours");
                                    const content = message ? message.content : "";

                                    if (!content) return null;

                                    const formatNewStyle = (text) => {
                                        const entries = text.split('·').filter(entry => entry.trim());

                                        return entries.map((entry, idx) => {
                                            let trimmedEntry = entry.trim();
                                            if (!trimmedEntry) return null;

                                            const isNewMention = trimmedEntry.includes('🆕');
                                            trimmedEntry = trimmedEntry.replace('🆕', '').trim();

                                            const colonIndex = trimmedEntry.indexOf(':');
                                            if (colonIndex === -1) return null;

                                            const symbol = trimmedEntry.substring(0, colonIndex).trim();
                                            let restOfText = trimmedEntry.substring(colonIndex + 1).trim();

                                            let twoHrPercent = null;
                                            let is2HrUp = false;
                                            const twoHrMatch = restOfText.match(/In\s+last\s+2\s+hrs:\s*(\d+\.?\d*)%\s*([↑↓])/i);
                                            if (twoHrMatch) {
                                                twoHrPercent = twoHrMatch[1] + '%';
                                                is2HrUp = twoHrMatch[2] === '↑';
                                            }

                                            let sixHrPercent = null;
                                            let is6HrUp = false;
                                            let hasFireEmoji = false;
                                            const sixHrMatch = restOfText.match(/In\s+last\s+6\s+hrs:\s*(🔥\s*)?(\d+\.?\d*)%\s*([↑↓])/i);
                                            if (sixHrMatch) {
                                                hasFireEmoji = !!sixHrMatch[1];
                                                sixHrPercent = sixHrMatch[2] + '%';
                                                is6HrUp = sixHrMatch[3] === '↑';
                                            }

                                            const ytMatch = restOfText.match(/YT:\s*(\d+)/i);
                                            const tgMatch = restOfText.match(/TG:\s*(\d+)/i);

                                            const hasYT = restOfText.includes('YT:');
                                            const hasTG = restOfText.includes('TG:');

                                            return (
                                                <span key={idx} className="inline-flex items-center whitespace-nowrap gap-1">
                                                    {isNewMention && (
                                                        <div className="relative inline-flex items-center justify-center h-6 w-6">
                                                            <FaCertificate className="text-blue-500 w-full h-full drop-shadow-sm" />
                                                            <span className="absolute text-[10px] font-bold text-white uppercase tracking-tighter">M</span>
                                                        </div>
                                                    )}
                                                    <span className="font-bold">{symbol}:</span>
                                                    {twoHrPercent && (
                                                        <>
                                                            <span>In last 2 hrs:</span>
                                                            <span className="font-semibold">{twoHrPercent}</span>
                                                            <span className={is2HrUp ? 'text-green-600 font-bold text-lg' : 'text-red-600 font-bold text-lg'}>
                                                                {is2HrUp ? '↑' : '↓'}
                                                            </span>
                                                        </>
                                                    )}
                                                    {sixHrPercent && (
                                                        <>
                                                            <span>,</span>
                                                            <span>In last 6 hrs:</span>
                                                            {hasFireEmoji && <span>🔥</span>}
                                                            <span className="font-semibold">{sixHrPercent}</span>
                                                            <span className={is6HrUp ? 'text-green-600 font-bold text-lg' : 'text-red-600 font-bold text-lg'}>
                                                                {is6HrUp ? '↑' : '↓'}
                                                            </span>
                                                        </>
                                                    )}
                                                    {(hasYT || hasTG) && (
                                                        <>
                                                            <span>with</span>
                                                            {hasYT && (
                                                                <>
                                                                    <FaYoutube className="text-red-600 text-xl" />
                                                                    <span>:</span>
                                                                    <span className="font-semibold">{ytMatch ? ytMatch[1] : '0'} new Posts</span>
                                                                </>
                                                            )}
                                                            {hasYT && hasTG && <span>,</span>}
                                                            {hasTG && (
                                                                <>
                                                                    <FaTelegramPlane className="text-blue-500 text-xl" />
                                                                    <span>:</span>
                                                                    <span className="font-semibold">{tgMatch ? tgMatch[1] : '0'} new Posts</span>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    <span className="text-black font-bold text-3xl px-3">•</span>
                                                </span>
                                            );
                                        }).filter(Boolean);
                                    };

                                    const contentGroup = (
                                        <>
                                            {[...Array(10)].map((_, i) => (
                                                <span key={i} className="text-gray-700 font-medium text-base px-2 py-2 inline-flex items-center gap-1">
                                                    {formatNewStyle(content)}
                                                </span>
                                            ))}
                                        </>
                                    );

                                    return (
                                        <>
                                            <div className="scroller-content-item inline-flex items-center">
                                                {contentGroup}
                                            </div>
                                            <div className="inline-flex items-center">
                                                {contentGroup}
                                            </div>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
