import { useState } from "react";
import SentimentGauge from "./SentimentGauge";

export default function YearlyStatsRow({ yearKey, yearData, quarterlyData }) {
  const [timeframe, setTimeframe] = useState("30");
  const [period, setPeriod] = useState("");
  const [sentiment, setSentiment] = useState("");

  // Generate dynamic period options based on available quarterly data
  const getPeriodOptions = () => {
    const options = [{ value: "", label: "All Periods" }];

    if (quarterlyData) {
      const availableQuarters = Object.keys(quarterlyData).filter((key) =>
        key.startsWith(yearKey)
      );

      const quarterLabels = {
        Q1: "Jan - Mar",
        Q2: "Apr - Jun",
        Q3: "Jul - Sep",
        Q4: "Oct - Dec",
      };

      availableQuarters.forEach((quarterKey) => {
        const quarter = quarterKey.replace(yearKey, "");
        if (quarterLabels[quarter]) {
          options.push({
            value: quarter,
            label: quarterLabels[quarter],
          });
        }
      });
    }

    return options;
  };

  const periodOptions = getPeriodOptions();

  // Generate dynamic sentiment options based on available data
  const getSentimentOptions = (data) => {
    const options = [{ value: "", label: "All Sentiments" }];

    if (data) {
      const sentimentTypes = [
        {
          value: "strong_bullish",
          label: "Strong Bullish",
          prefix: "Strong_Bullish_",
        },
        {
          value: "mild_bullish",
          label: "Mild Bullish",
          prefix: "Mild_Bullish_",
        },
        {
          value: "mild_bearish",
          label: "Mild Bearish",
          prefix: "Mild_Bearish_",
        },
        {
          value: "strong_bearish",
          label: "Strong Bearish",
          prefix: "Strong_Bearish_",
        },
      ];

      sentimentTypes.forEach((sentimentType) => {
        // Check if this sentiment has data by looking for any field with this prefix
        const hasData = Object.keys(data).some(
          (key) =>
            key.startsWith(sentimentType.prefix) &&
            (key.includes("price_true_count") ||
              key.includes("price_false_count"))
        );

        if (hasData) {
          options.push({
            value: sentimentType.value,
            label: sentimentType.label,
          });
        }
      });
    }

    return options;
  };

  // Get data for selected timeframe and period
  const getTimeframeStats = (timeframe, period, sentiment = "") => {
    const timeframeKey =
      timeframe === "1"
        ? "1_hour"
        : timeframe === "24"
        ? "24_hours"
        : timeframe === "7"
        ? "7_days"
        : timeframe === "30"
        ? "30_days"
        : timeframe === "90"
        ? "90_days"
        : timeframe === "180"
        ? "180_days"
        : timeframe === "365"
        ? "1_year"
        : "30_days";

    let baseData;

    // If period is selected, use quarterly data
    if (period && quarterlyData) {
      const quarterlyKey = `${yearKey}${period}`;
      const quarterlyYearData = quarterlyData[quarterlyKey];
      if (quarterlyYearData) {
        baseData = quarterlyYearData[timeframeKey];
      }
    } else {
      // Otherwise use yearly data
      baseData = yearData[timeframeKey];
    }

    // If sentiment is selected, filter data to only include sentiment-specific fields
    if (sentiment && baseData) {
      const sentimentPrefix = {
        strong_bullish: "Strong_Bullish_",
        mild_bullish: "Mild_Bullish_",
        mild_bearish: "Mild_Bearish_",
        strong_bearish: "Strong_Bearish_",
      }[sentiment];

      if (sentimentPrefix) {
        const filteredData = {};
        Object.keys(baseData).forEach((key) => {
          if (key.startsWith(sentimentPrefix)) {
            // Remove the sentiment prefix from the key
            const newKey = key.replace(sentimentPrefix, "");
            filteredData[newKey] = baseData[key];
          }
        });
        return filteredData;
      }
    }

    return baseData;
  };

  const yearStats = getTimeframeStats(timeframe, period, sentiment);
  const sentimentOptions = getSentimentOptions(
    getTimeframeStats(timeframe, period)
  );
  if (!yearStats) return null;

  // Get winning and losing percentages for SentimentGauge
  const winningPercentage = sentiment
    ? yearStats.price_true_count_percentage || 0
    : yearStats.price_probablity_of_winning_percentage || 0;
  const losingPercentage = sentiment
    ? yearStats.price_false_count_percentage || 0
    : yearStats.price_probablity_of_loosing_percentage || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h3 className="text-xl font-bold text-purple-300">{yearKey}</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-[#232042] border border-[#35315a] rounded-lg px-3 py-1 text-sm text-white"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Sentiment:</label>
            <select
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
              className="bg-[#232042] border border-[#35315a] rounded-lg px-3 py-1 text-sm text-white"
            >
              {sentimentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Timeframe:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-[#232042] border border-[#35315a] rounded-lg px-3 py-1 text-sm text-white"
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

      {/* 6 boxes for this year (reduced from 7) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Sentiment Gauge Box */}
        <div className="bg-[#232042]/70 rounded-xl p-5 text-center border border-[#35315a] flex flex-col justify-center items-center">
          <SentimentGauge
            winningPercentage={winningPercentage}
            losingPercentage={losingPercentage}
          />
          <div className="text-xs text-gray-400">Probability of Winning</div>
        </div>
        <div className="bg-[#232042]/70 rounded-xl p-5 text-center border border-[#35315a] flex flex-col justify-center items-center">
          <div className="text-2xl font-bold mb-1 text-green-400">
            {yearStats.average_winning_returns_percentage?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-gray-400">Average Winning Returns</div>
        </div>
        <div className="bg-[#232042]/70 rounded-xl p-5 text-center border border-[#35315a] flex flex-col justify-center items-center">
          <div className="text-2xl font-bold mb-1 text-red-400">
            {yearStats.average_loss_percentage?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-gray-400">Average Loss Percentage</div>
        </div>
        <div className="bg-[#232042]/70 rounded-xl p-5 text-center border border-[#35315a] flex flex-col justify-center items-center">
          <div className="text-2xl font-bold mb-1 text-blue-400">
            {yearStats.probablity_weighted_returns_percentage?.toFixed(1) || 0}%
          </div>
          <div className="text-xs text-gray-400">
            Probability Weighted Returns
          </div>
        </div>
        <div className="bg-[#232042]/70 rounded-xl p-5 text-center border border-[#35315a] flex flex-col justify-center items-center">
          <div className="text-2xl font-bold mb-1">
            {(yearStats.price_true_count || 0) +
              (yearStats.price_false_count || 0)}
          </div>
          <div className="text-xs text-gray-400">Total Records</div>
        </div>
        <div className="bg-[#232042]/70 rounded-xl p-5 text-center border border-[#35315a] flex flex-col justify-center items-center">
          <div className="text-2xl font-bold mb-1">
            {yearStats.price_true_count || 0}
          </div>
          <div className="text-xs text-gray-400">Winning Trades</div>
        </div>
      </div>
    </div>
  );
}
