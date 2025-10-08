import { useState } from "react";
import SentimentGauge from "./SentimentGauge";
import GaugeComponent from "react-gauge-component";

export default function YearlyPerformanceTable({ yearlyData, quarterlyData, channelData }) {
    const [selectedTimeframe, setSelectedTimeframe] = useState("30");
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [selectedSentiment, setSelectedSentiment] = useState("");
    const [expandedRecommendations, setExpandedRecommendations] = useState(false);
    const [expandedWinLoss, setExpandedWinLoss] = useState(false);
    const [expandedAverageReturn, setExpandedAverageReturn] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState({});

    // Get available years from data
    const availableYears = Object.keys(yearlyData || {})
        .sort()
        .reverse();

    // Get hyperactive yearly data from channelData
    const hyperactiveYearly = channelData?.hyperactive?.Yearly || {};

    // Get normal yearly data from channelData
    const normalYearly = channelData?.normal?.Yearly || {};

    // Define getWinColor function at component level
    const getWinColor = (value) => {
        if (value < 33) return "text-red-400";     // 0–32%
        if (value < 66) return "text-yellow-400";  // 33–65%
        return "text-green-400";                   // 66–100%
    };

    // Add dynamic columns for last 7 days and last 15 days
    const getDynamicColumns = () => {
        const columns = [];

        const getWinColor = (value) => {
            if (value < 33) return "text-red-400";     // 0–32%
            if (value < 66) return "text-yellow-400";  // 33–65%
            return "text-green-400";                   // 66–100%
        };

        // Add "Last 7 Days" column with info icon
        columns.push({
            type: "dynamic",
            key: "last7days",
            label: "Last 7 Days",
            hasInfo: true,
            tooltipText: "Last 7 days calculated as per the latest system update time",
        });

        // Add "Last 15 Days" column with info icon
        columns.push({
            type: "dynamic",
            key: "last15days",
            label: "Last 15 Days",
            hasInfo: true,
            tooltipText:
                "Last 15 days calculated as per the latest system update time.",
        });

        // Add year columns
        availableYears.forEach((year) => {
            columns.push({ type: "year", key: year, label: year });
        });

        return columns;
    };

    const dynamicColumns = getDynamicColumns();

    // Generate period options for filtering
    const getPeriodOptions = () => {
        const options = [{ value: "", label: "All Periods" }];

        const quarterLabels = {
            Q1: "Jan - Mar (Q1)",
            Q2: "Apr - Jun (Q2)",
            Q3: "Jul - Sep (Q3)",
            Q4: "Oct - Dec (Q4)",
        };

        // Only show the 4 quarters, not year-specific
        Object.entries(quarterLabels).forEach(([quarter, label]) => {
            options.push({
                value: quarter,
                label: label,
            });
        });

        return options;
    };

    // Generate sentiment options for filtering
    const getSentimentOptions = () => {
        return [
            { value: "", label: "All Sentiments" },
            { value: "strong_bullish", label: "Strong Bullish" },
            { value: "mild_bullish", label: "Mild Bullish" },
            { value: "mild_bearish", label: "Mild Bearish" },
            { value: "strong_bearish", label: "Strong Bearish" },
        ];
    };

    // Get data for specific year with custom timeframe
    const getYearDataWithTimeframe = (yearKey, customTimeframe = null) => {
        const timeframeKey =
            customTimeframe ||
            (selectedTimeframe === "1"
                ? "1_hour"
                : selectedTimeframe === "24"
                    ? "24_hours"
                    : selectedTimeframe === "7"
                        ? "7_days"
                        : selectedTimeframe === "30"
                            ? "30_days"
                            : selectedTimeframe === "90"
                                ? "90_days"
                                : selectedTimeframe === "180"
                                    ? "180_days"
                                    : selectedTimeframe === "365"
                                        ? "1_year"
                                        : "30_days");

        let baseData;

        // If period is selected, use quarterly data
        if (selectedPeriod && quarterlyData) {
            const quarterlyKey = `${yearKey}${selectedPeriod}`;
            const quarterlyYearData = quarterlyData[quarterlyKey];
            if (quarterlyYearData) {
                baseData = quarterlyYearData[timeframeKey];
            }
            // If no quarterly data for this year, return null (will show "-" in table)
        } else {
            // Otherwise use yearly data
            baseData = yearlyData[yearKey]?.[timeframeKey];
        }

        // If no data found for the selected timeframe, return null
        if (!baseData) {
            return null;
        }

        // If sentiment is selected, filter data to only include sentiment-specific fields
        if (selectedSentiment && baseData) {
            const sentimentPrefix = {
                strong_bullish: "Strong_Bullish_",
                mild_bullish: "Mild_Bullish_",
                mild_bearish: "Mild_Bearish_",
                strong_bearish: "Strong_Bearish_",
            }[selectedSentiment];

            if (sentimentPrefix) {
                const filteredData = {};
                Object.keys(baseData).forEach((key) => {
                    if (key.startsWith(sentimentPrefix)) {
                        // Remove the sentiment prefix from the key
                        const newKey = key.replace(sentimentPrefix, "");
                        filteredData[newKey] = baseData[key];
                    }
                });
                // Return null if no sentiment-specific data was found
                return Object.keys(filteredData).length > 0 ? filteredData : null;
            }
        }

        return baseData;
    };

    // Get data for specific year and timeframe
    const getYearData = (yearKey) => {
        // Handle dynamic columns (last 7 days, last 15 days) - always return null to show "-"
        if (yearKey === "last7days" || yearKey === "last15days") {
            return null;
        }

        return getYearDataWithTimeframe(yearKey);
    };

    // Calculate hyperactivity for each year
    const calculateHyperactiveYearMetrics = (yearKey) => {
        // Handle dynamic columns (last 7 days, last 15 days) - always return null to show "-"
        if (yearKey === "last7days" || yearKey === "last15days") {
            return null;
        }

        const timeframeKey =
            selectedTimeframe === "1"
                ? "1_hour"
                : selectedTimeframe === "24"
                    ? "24_hours"
                    : selectedTimeframe === "7"
                        ? "7_days"
                        : selectedTimeframe === "30"
                            ? "30_days"
                            : selectedTimeframe === "90"
                                ? "90_days"
                                : selectedTimeframe === "180"
                                    ? "180_days"
                                    : selectedTimeframe === "365"
                                        ? "1_year"
                                        : "30_days";

        let baseData;

        // If period is selected, use quarterly hyperactive data
        if (selectedPeriod && channelData?.hyperactive?.Quarterly) {
            const quarterlyKey = `${yearKey}${selectedPeriod}`;
            const quarterlyHyperData = channelData.hyperactive.Quarterly[quarterlyKey];
            if (quarterlyHyperData) {
                baseData = quarterlyHyperData[timeframeKey];
            }
        } else {
            // Otherwise use yearly hyperactive data
            baseData = hyperactiveYearly[yearKey]?.[timeframeKey];
        }

        if (!baseData) return null;

        // If sentiment is selected, filter hyperactive data to only include sentiment-specific fields
        let timeframeData = baseData;
        if (selectedSentiment && baseData) {
            const sentimentPrefix = {
                strong_bullish: "Strong_Bullish_",
                mild_bullish: "Mild_Bullish_",
                mild_bearish: "Mild_Bearish_",
                strong_bearish: "Strong_Bearish_",
            }[selectedSentiment];

            if (sentimentPrefix) {
                const filteredData = {};
                Object.keys(baseData).forEach((key) => {
                    if (key.startsWith(sentimentPrefix)) {
                        const newKey = key.replace(sentimentPrefix, "");
                        filteredData[newKey] = baseData[key];
                    }
                });
                // Return null if no sentiment-specific data was found
                if (Object.keys(filteredData).length === 0) return null;
                timeframeData = filteredData;
            }
        }

        // Calculate hyperactivity as price_true_count + price_false_count
        const hyperactivity = (timeframeData.price_true_count || 0) + (timeframeData.price_false_count || 0);

        return {
            hyperactivity,
            timeframeData
        };
    };

    // Calculate normal yearly metrics for each year
    const calculateNormalYearMetrics = (yearKey) => {
        // Handle dynamic columns (last 7 days, last 15 days) - always return null to show "-"
        if (yearKey === "last7days" || yearKey === "last15days") {
            return null;
        }

        const timeframeKey =
            selectedTimeframe === "1"
                ? "1_hour"
                : selectedTimeframe === "24"
                    ? "24_hours"
                    : selectedTimeframe === "7"
                        ? "7_days"
                        : selectedTimeframe === "30"
                            ? "30_days"
                            : selectedTimeframe === "90"
                                ? "90_days"
                                : selectedTimeframe === "180"
                                    ? "180_days"
                                    : selectedTimeframe === "365"
                                        ? "1_year"
                                        : "30_days";

        let baseData;

        // If period is selected, use quarterly normal data
        if (selectedPeriod && channelData?.normal?.Quarterly) {
            const quarterlyKey = `${yearKey}${selectedPeriod}`;
            const quarterlyNormalData = channelData.normal.Quarterly[quarterlyKey];
            if (quarterlyNormalData) {
                baseData = quarterlyNormalData[timeframeKey];
            }
        } else {
            // Otherwise use yearly normal data
            baseData = normalYearly[yearKey]?.[timeframeKey];
        }

        if (!baseData) return null;

        // If sentiment is selected, filter normal data to only include sentiment-specific fields
        let timeframeData = baseData;
        if (selectedSentiment && baseData) {
            const sentimentPrefix = {
                strong_bullish: "Strong_Bullish_",
                mild_bullish: "Mild_Bullish_",
                mild_bearish: "Mild_Bearish_",
                strong_bearish: "Strong_Bearish_",
            }[selectedSentiment];

            if (sentimentPrefix) {
                const filteredData = {};
                Object.keys(baseData).forEach((key) => {
                    if (key.startsWith(sentimentPrefix)) {
                        const newKey = key.replace(sentimentPrefix, "");
                        filteredData[newKey] = baseData[key];
                    }
                });
                // Return null if no sentiment-specific data was found
                if (Object.keys(filteredData).length === 0) return null;
                timeframeData = filteredData;
            }
        }

        // Calculate normal activity as price_true_count + price_false_count
        const normalActivity = (timeframeData.price_true_count || 0) + (timeframeData.price_false_count || 0);

        return {
            normalActivity,
            timeframeData
        };
    };

    // Calculate metrics for each year
    const calculateYearMetrics = (yearKey) => {
        const data = getYearData(yearKey);
        if (!data) return null;

        // Total recommendations (total records)
        const totalRecommendations =
            (data.price_true_count || 0) + (data.price_false_count || 0);

        // Win/Loss ratio
        const winPercentage = data.price_probablity_of_winning_percentage || 0;
        const lossPercentage = data.price_probablity_of_loosing_percentage || 0;

        // Average return
        const averageReturn = data.probablity_weighted_returns_percentage || 0;

        // Check if we have meaningful data (at least some recommendations)
        if (totalRecommendations === 0) {
            return null;
        }

        return {
            totalRecommendations,
            winPercentage,
            lossPercentage,
            averageReturn,
            winningTrades: data.price_true_count || 0,
            losingTrades: data.price_false_count || 0,
        };
    };

    const periodOptions = getPeriodOptions();
    const sentimentOptions = getSentimentOptions();

    return (
        <div className="space-y-6">
            {/* Controls */}

            {/* Performance Table */}
            <div className="light-theme-table bg-white rounded-xl p-6 border border-gray-200 overflow-x-auto text-to-purple">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-end mb-4">
                    <div className="w-full sm:w-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div className="flex items-center gap-4 min-w-max px-2 py-1">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-to-purple whitespace-nowrap">Period:</label>
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="light-dropdown bg-[#c4c5e14d] border border-gray-300 rounded-lg px-3 py-1 text-sm text-to-purple"
                                >
                                    {periodOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-to-purple whitespace-nowrap">Sentiment:</label>
                                <select
                                    value={selectedSentiment}
                                    onChange={(e) => setSelectedSentiment(e.target.value)}
                                    className="light-dropdown bg-[#c4c5e14d] border border-gray-300 rounded-lg px-3 py-1 text-sm text-to-purple"
                                >
                                    {sentimentOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-to-purple whitespace-nowrap">Timeframe:</label>
                                <select
                                    value={selectedTimeframe}
                                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                                    className="light-dropdown bg-[#c4c5e14d] border border-gray-300 rounded-lg px-3 py-1 text-sm text-to-purple"
                                >
                                    <option value="1">1 Hour</option>
                                    <option value="24">24 Hours</option>
                                    <option value="7">7 Days</option>
                                    <option value="30">30 Days</option>
                                    <option value="90">90 Days</option>
                                    <option value="180">180 Days</option>
                                    <option value="365">1 Year</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-to-purple font-semibold text-sm">
                                Hits & Misses
                            </th>
                            {dynamicColumns.map((column) => (
                                <th
                                    key={column.key}
                                    className="text-center py-3 px-4 text-to-purple font-semibold text-sm"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <span>{column.label}</span>
                                        {column.type === "year" && selectedPeriod && (
                                            <span>{selectedPeriod}</span>
                                        )}
                                        {column.hasInfo && (
                                            <div className="relative inline-block">
                                                <button
                                                    onMouseEnter={() =>
                                                        setTooltipVisible({
                                                            ...tooltipVisible,
                                                            [column.key]: true,
                                                        })
                                                    }
                                                    onMouseLeave={() =>
                                                        setTooltipVisible({
                                                            ...tooltipVisible,
                                                            [column.key]: false,
                                                        })
                                                    }
                                                    className="text-gray-500 hover:text-gray-700 transition-colors ml-1"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                                {tooltipVisible[column.key] && (
                                                    <div className="absolute z-10 w-64 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg border border-gray-700 -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full">
                                                        {column.tooltipText}
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Total Recommendations Row */}
                        <tr className="border-b border-gray-200">
                            <td className="py-4 px-4 text-to-purple font-medium">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">No. of Recommendations during period</span>
                                    <button
                                        onClick={() =>
                                            setExpandedRecommendations(!expandedRecommendations)
                                        }
                                        className="text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <svg
                                            className={`w-4 h-4 transform transition-transform ${expandedRecommendations ? "rotate-180" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                </div>

                            </td>
                            {dynamicColumns.map((column) => {
                                const metrics = calculateYearMetrics(column.key);
                                return (
                                    <td key={column.key} className="py-4 px-4 text-center">
                                        <div className="font-semibold text-sm text-to-purple">
                                            {metrics ? metrics.totalRecommendations : "-"}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Expanded Hyper Activity Row */}
                        {expandedRecommendations && (
                            <tr className="border-b border-gray-100 light-dropdown ">
                                <td className="py-3 px-4 text-to-purple font-semibold text-sm pl-8">
                                    Hyperactivity
                                </td>
                                {dynamicColumns.map((column) => {
                                    const hyperactiveMetrics = calculateHyperactiveYearMetrics(column.key);
                                    return (
                                        <td key={column.key} className="py-3 px-4 text-center">
                                            <div className="font-semibold text-sm text-to-purple">
                                                {hyperactiveMetrics ? hyperactiveMetrics.hyperactivity : "-"}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        )}

                        {/* Expanded Without Hyper Activity Row */}
                        {expandedRecommendations && (
                            <tr className="border-b border-gray-100 light-dropdown ">
                                <td className="py-3 px-4 text-to-purple font-semibold text-sm pl-8">
                                    Non Hyperactivity
                                </td>
                                {dynamicColumns.map((column) => {
                                    const normalMetrics = calculateNormalYearMetrics(column.key);
                                    return (
                                        <td key={column.key} className="py-3 px-4 text-center">
                                            <div className="font-semibold text-sm text-to-purple">
                                                {normalMetrics ? normalMetrics.normalActivity : "-"}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        )}

                        {/* Win/Loss Ratio Row */}
                        <tr className="light-win-loss-row">
                            <td className="light-win-loss-header">
                                <div className="header-content">
                                    <span className="font-semibold text-sm">Win/Loss Ratio (Cumulative)</span>
                                    <button
                                        onClick={() => setExpandedWinLoss(!expandedWinLoss)}
                                        className="light-expand-button"
                                    >
                                        <svg
                                            className={`expand-icon ${expandedWinLoss ? "expanded" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </td>

                            {dynamicColumns.map((column) => {
                                const metrics = calculateYearMetrics(column.key);
                                const winPercentage = metrics?.winPercentage || 0;

                                return (
                                    <td key={column.key} className="light-win-loss-cell text-center">
                                        {metrics ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <GaugeComponent
                                                    id={`gauge-${column.key}-winloss`}
                                                    type="radial"
                                                    style={{ width: 60, height: 60 }}
                                                    labels={{
                                                        valueLabel: { hide: true },
                                                        tickLabels: {
                                                            ticks: [
                                                                { value: 20 },
                                                                { value: 50 },
                                                                { value: 80 },
                                                                { value: 100 }
                                                            ]
                                                        }
                                                    }}
                                                    arc={{
                                                        colorArray: ['#CE1F1F', '#00FF15'], // red → green
                                                        nbSubArcs: 90,
                                                        padding: 0.01,
                                                        width: 0.4
                                                    }}
                                                    pointer={{
                                                        animationDelay: 0,
                                                        strokeWidth: 7
                                                    }}
                                                    value={winPercentage}
                                                />
                                                <div className="font-semibold text-sm text-to-purple">
                                                    {Math.round(winPercentage)}% Win
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="light-empty-metric">-</div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Expanded Hyper Activity Win/Loss Row */}
                        {expandedWinLoss && (
                            <tr className="light-hyper-activity-row light-dropdown ">
                                <td className="light-hyper-activity-header">
                                    Hyperactivity
                                </td>
                                {dynamicColumns.map((column) => {
                                    const hyperactiveMetrics = calculateHyperactiveYearMetrics(column.key);
                                    if (!hyperactiveMetrics) {
                                        return (
                                            <td key={column.key} className="light-hyper-activity-cell">
                                                <div className="light-empty-metric">-</div>
                                            </td>
                                        );
                                    }

                                    const adjustedWin = hyperactiveMetrics.timeframeData?.price_probablity_of_winning_percentage || 0;

                                    return (
                                        <td key={column.key} className="light-hyper-activity-cell text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <GaugeComponent
                                                    id={`gauge-${column.key}-hyper-winloss`}
                                                    type="radial"
                                                    style={{ width: 60, height: 60 }}
                                                    labels={{
                                                        valueLabel: { hide: true },
                                                        tickLabels: {
                                                            ticks: [
                                                                { value: 20 },
                                                                { value: 50 },
                                                                { value: 80 },
                                                                { value: 100 }
                                                            ]
                                                        }
                                                    }}
                                                    arc={{
                                                        colorArray: ['#CE1F1F', '#00FF15'], // red → green
                                                        nbSubArcs: 90,
                                                        padding: 0.01,
                                                        width: 0.4
                                                    }}
                                                    pointer={{
                                                        animationDelay: 0,
                                                        strokeWidth: 7
                                                    }}
                                                    value={adjustedWin}
                                                />
                                                <div className="font-semibold text-sm text-to-purple">
                                                    {Math.round(adjustedWin)}% Win
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        )}

                        {/* Expanded Without Hyper Activity Win/Loss Row */}
                        {expandedWinLoss && (
                            <tr className="light-without-hyper-row light-dropdown ">
                                <td className="light-without-hyper-header">
                                    Non Hyperactivity
                                </td>
                                {dynamicColumns.map((column) => {
                                    const normalMetrics = calculateNormalYearMetrics(column.key);
                                    if (!normalMetrics) {
                                        return (
                                            <td key={column.key} className="light-without-hyper-cell">
                                                <div className="light-empty-metric">-</div>
                                            </td>
                                        );
                                    }

                                    const adjustedWin = normalMetrics.timeframeData?.price_probablity_of_winning_percentage || 0;

                                    return (
                                        <td key={column.key} className="light-without-hyper-cell text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <GaugeComponent
                                                    id={`gauge-${column.key}-without-winloss`}
                                                    type="radial"
                                                    style={{ width: 60, height: 60 }}
                                                    labels={{
                                                        valueLabel: { hide: true },
                                                        tickLabels: {
                                                            ticks: [
                                                                { value: 20 },
                                                                { value: 50 },
                                                                { value: 80 },
                                                                { value: 100 }
                                                            ]
                                                        }
                                                    }}
                                                    arc={{
                                                        colorArray: ['#CE1F1F', '#00FF15'], // red → green
                                                        nbSubArcs: 90,
                                                        padding: 0.01,
                                                        width: 0.4
                                                    }}
                                                    pointer={{
                                                        animationDelay: 0,
                                                        strokeWidth: 7
                                                    }}
                                                    value={adjustedWin}
                                                />
                                                <div className="font-semibold text-sm text-to-purple">
                                                    {Math.round(adjustedWin)}% Win
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        )}


                        {/* Average Return Row */}
                        <tr className="light-win-loss-row">
                            <td className="light-win-loss-header">
                                <div className="header-content">
                                    <span className="font-semibold text-sm">Average Return (Cumulative)</span>
                                    <button
                                        onClick={() => setExpandedAverageReturn(!expandedAverageReturn)}
                                        className="light-expand-button"
                                    >
                                        <svg
                                            className={`expand-icon ${expandedAverageReturn ? "expanded" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </td>

                            {dynamicColumns.map((column) => {
                                const metrics = calculateYearMetrics(column.key);
                                if (!metrics) {
                                    return (
                                        <td key={column.key} className="light-win-loss-cell">
                                            <div className="light-empty-metric">-</div>
                                        </td>
                                    );
                                }

                                const returnValue = metrics.averageReturn || 0;
                                const barWidth = 100;
                                const ballDiameter = 14;
                                const maxTravel = barWidth - ballDiameter;

                                const minValue = -100;
                                const maxValue = 500;
                                const clamped = Math.max(Math.min(returnValue, maxValue), minValue);
                                const normalized = (clamped - minValue) / (maxValue - minValue);
                                const positionPx = normalized * maxTravel;

                                return (
                                    <td key={column.key} className="light-win-loss-cell">
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
                                                    style={{ left: `${positionPx}px` }}
                                                />
                                            </div>

                                            {/* Value Text */}
                                            <div className="font-semibold text-sm text-to-purple">
                                                {returnValue > 0 ? "+" : ""}
                                                {returnValue.toFixed(1)}%
                                            </div>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Expanded Hyper Activity Average Return Row */}
                        {expandedAverageReturn && (
                            <tr className="border-b border-gray-100 light-dropdown ">
                                <td className="py-3 px-4 text-to-purple font-semibold text-sm pl-8">
                                   Hyperactivity
                                </td>

                                {dynamicColumns.map((column) => {
                                    const hyperMetrics = calculateHyperactiveYearMetrics(column.key);
                                    if (!hyperMetrics || !hyperMetrics.timeframeData) {
                                        return (
                                            <td key={column.key} className="light-win-loss-cell">
                                                <div className="light-empty-metric">-</div>
                                            </td>
                                        );
                                    }

                                    // Get probability weighted returns percentage from hyperactive data
                                    const returnValue = hyperMetrics.timeframeData.probablity_weighted_returns_percentage || 0;

                                    // Segmented bar settings
                                    const barWidth = 100; // px
                                    const ballDiameter = 14;
                                    const maxTravel = barWidth - ballDiameter;

                                    const minValue = -100;
                                    const maxValue = 500;
                                    const clamped = Math.max(Math.min(returnValue, maxValue), minValue);
                                    const normalized = (clamped - minValue) / (maxValue - minValue);
                                    const positionPx = normalized * maxTravel;

                                    return (
                                        <td key={column.key} className="light-win-loss-cell">
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
                                                        style={{ left: `${positionPx}px` }}
                                                    />
                                                </div>

                                                {/* Value Text */}
                                                <div className="font-semibold text-sm text-to-purple">
                                                    {returnValue > 0 ? "+" : ""}
                                                    {returnValue.toFixed(1)}%
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        )}

                        {/* Expanded Without Hyper Activity Average Return Row */}
                        {expandedAverageReturn && (
                            <tr className="border-b border-gray-100 light-dropdown ">
                                <td className="py-3 px-4 text-to-purple font-semibold text-sm pl-8">
                                    Non Hyperactivity
                                </td>

                                {dynamicColumns.map((column) => {
                                    const normalMetrics = calculateNormalYearMetrics(column.key);
                                    if (!normalMetrics || !normalMetrics.timeframeData) {
                                        return (
                                            <td key={column.key} className="light-win-loss-cell">
                                                <div className="light-empty-metric">-</div>
                                            </td>
                                        );
                                    }

                                    // Get probability weighted returns percentage from normal data
                                    const returnValue = normalMetrics.timeframeData.probablity_weighted_returns_percentage || 0;

                                    // Segmented bar settings
                                    const barWidth = 100; // px
                                    const ballDiameter = 14;
                                    const maxTravel = barWidth - ballDiameter;

                                    const minValue = -100;
                                    const maxValue = 500;
                                    const clamped = Math.max(Math.min(returnValue, maxValue), minValue);
                                    const normalized = (clamped - minValue) / (maxValue - minValue);
                                    const positionPx = normalized * maxTravel;


                                    return (
                                        <td key={column.key} className="light-win-loss-cell">
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
                                                        style={{ left: `${positionPx}px` }}
                                                    />
                                                </div>

                                                {/* Value Text */}
                                                <div className="font-semibold text-sm text-to-purple">
                                                    {returnValue > 0 ? "+" : ""}
                                                    {returnValue.toFixed(1)}%
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        )}


                    </tbody>
                </table>
            </div>

            {/* Additional Stats */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableYears.map((year) => {
          const metrics = calculateYearMetrics(year);
          if (!metrics) return null;

          return (
            <div key={year} className="bg-[#232042]/70 rounded-xl p-4 border border-[#35315a]">
              <h4 className="text-lg font-bold text-purple-300 mb-3">{year}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Winning Trades:</span>
                  <span className="text-green-400 font-semibold">
                    {metrics.winningTrades}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Losing Trades:</span>
                  <span className="text-red-400 font-semibold">
                    {metrics.losingTrades}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="text-blue-400 font-semibold">
                    {metrics.winPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div> */}
        </div>
    );
}