import { useState } from "react";
import GaugeComponent from "react-gauge-component";

export default function YearlyPerformanceTable({ yearlyData, quarterlyData }) {
    const [selectedTimeframe, setSelectedTimeframe] = useState("30");
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [selectedSentiment, setSelectedSentiment] = useState("");

    // Define columns for sentiment categories
    const columns = [
        {id: "Last_7_days", label: "Last 7 days", type: "neutral"},
        { id: "cumulative", label: "Last 15 days", type: "neutral" },
        { id: "mild_bearish", label: "Mild Bearish", type: "bearish" },
        { id: "bearish", label: "Bearish", type: "bearish" },
        { id: "mild_bullish", label: "Mild Bullish", type: "bullish" },
        { id: "bullish", label: "Bullish", type: "bullish" }
    ];
    
    // Define rows
    const rows = [
        { id: "sentiment", label: "Overall" },
        { id: "hyper", label: "Hyper Activity" },
        { id: "without", label: "Without Hyper Activity" }
    ];

    // Hardcoded data for now
    const sentimentData = {
        sentiment: { cumulative: 12, mild_bearish: 23, bearish: 15, mild_bullish: 65, bullish: 78, Last_7_days:7},
        hyper: { cumulative: 14, mild_bearish: 18, bearish: 12, mild_bullish: 58, bullish: 70,Last_7_days:5 },
        without: { cumulative: 17, mild_bearish: 28, bearish: 18, mild_bullish: 72, bullish: 86 ,Last_7_days:9}
    };

    // Generate period options for filtering
    const periodOptions = [
        { value: "", label: "All Periods" },
        { value: "Q1", label: "Jan - Mar (Q1)" },
        { value: "Q2", label: "Apr - Jun (Q2)" },
        { value: "Q3", label: "Jul - Sep (Q3)" },
        { value: "Q4", label: "Oct - Dec (Q4)" }
    ];

    // Generate sentiment options for filtering
    const sentimentOptions = [
        { value: "", label: "All Sentiments" },
        { value: "strong_bullish", label: "Strong Bullish" },
        { value: "mild_bullish", label: "Mild Bullish" },
        { value: "mild_bearish", label: "Mild Bearish" },
        { value: "strong_bearish", label: "Strong Bearish" }
    ];
    
    // Get color class based on sentiment type
    const getValueColor = (type) => {
        if (type === "bearish") return "text-red-500";
        return "text-to-purple"; // Default to green for bullish and neutral
    };

    return (
        <div className="space-y-6">
            {/* Performance Table */}
            <div className="light-theme-table bg-white rounded-xl p-6 border border-gray-200 overflow-x-auto text-to-purple">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-end mb-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-to-purple">Period:</label>
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
                        {/* <div className="flex items-center gap-2">
                            <label className="text-sm text-to-purple">Sentiment:</label>
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
                        </div> */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-to-purple">Timeframe:</label>
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
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-to-purple font-bold text-xl">
                                Sentiment Analysis
                            </th>
                            {columns.map((col) => (
                                <th key={col.id} className="text-center py-3 px-4 text-to-purple font-bold text-xl">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className="border-b border-gray-200">
                                <td className="py-4 px-4 text-to-purple font-medium">
                                    <span className="font-bold text-xl">{row.label}</span>
                                </td>
                                {columns.map((col) => {
                                    const value = sentimentData[row.id][col.id];
                                    // Determine text color - only red or green
                                    const textColor = col.type === 'bearish' ? '#ef4444' : '#10b981';
                                    return (
                                        <td key={col.id} className="py-4 px-4 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <GaugeComponent
                                                    id={`gauge-${row.id}-${col.id}`}
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
                                                        colorArray: ['#CE1F1F', '#00FF15'],
                                                        nbSubArcs: 150,
                                                        padding: 0.01,
                                                        width: 0.4
                                                    }}
                                                    pointer={{
                                                        animationDelay: 0,
                                                        strokeWidth: 7
                                                    }}
                                                    value={value}
                                                />
                                                <div className={`font-bold text-xl ${col.type === 'bearish' ? 'text-red-500' : 'text-to-purple'}`}>
                                                    {value}
                                                </div>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}