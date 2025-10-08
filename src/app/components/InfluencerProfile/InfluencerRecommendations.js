"use client";
import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { useLivePrice } from "./useLivePrice";
import { FaEye } from "react-icons/fa";
import moment from "moment-timezone";
import { useTimezone } from "../../contexts/TimezoneContext";

export default function InfluencerRecommendations({ channelID, channelData }) {
  const { useLocalTime, formatDate } = useTimezone();
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [uniqueSymbols, setUniqueSymbols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const symbolsToTrack = [...new Set(recommendations.map(rec => rec.symbol).filter(Boolean))];
  const { formatPrice: formatLivePrice, getPriceData, isSymbolLive, getPriceSource, getPriceTimestamp } = useLivePrice(symbolsToTrack);
  // const { formatPrice: formatLivePrice } = useLivePrice(symbolsToTrack);
  // const { formatPrice: formatLivePrice, getPriceData } = useLivePrice(symbolsToTrack);
  const [overallAnalysisStartDate, setOverallAnalysisStartDate] = useState(
    channelData.Overall.start_date
  );
  const [overallAnalysisEndDate, setOverallAnalysisEndDate] = useState(
    channelData.Overall.end_date
  );

  // Number formatting function
  function formatNumberWithCommas(number) {
    if (number === undefined || number === null) return "-";
    if (typeof number === "object" && number.$numberDecimal) {
      number = parseFloat(number.$numberDecimal);
    }
    if (isNaN(Number(number))) return "-";
    return Number(number).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  function formatNumberWithCommas(number) {
    if (number === undefined || number === null) return "-";
    if (typeof number === "object" && number.$numberDecimal) {
      number = parseFloat(number.$numberDecimal);
    }
    if (isNaN(Number(number))) return "-";
    return Number(number).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  // Date validation function
  const validateDates = () => {
    setDateError("");

    if (!startDate && !endDate) {
      return true; // Both dates empty is valid
    }

    // Validate start date
    if (startDate) {
      const start = new Date(startDate);

      // Check if start date is not in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (start > today) {
        setDateError("Start date cannot be in the future");
        return false;
      }

      // Check if start date is not lower than overall analysis start date
      if (overallAnalysisStartDate) {
        const overallStart = new Date(overallAnalysisStartDate);
        if (start < overallStart) {
          setDateError(
            `Start date cannot be earlier than ${overallAnalysisStartDate}`
          );
          return false;
        }
      }

      // Check if start date is not higher than end date (if end date is set)
      if (endDate) {
        const end = new Date(endDate);
        if (start > end) {
          setDateError("Start date cannot be after end date");
          return false;
        }
      }
    }

    // Validate end date
    if (endDate) {
      const end = new Date(endDate);

      // Check if end date is not in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (end > today) {
        setDateError("End date cannot be in the future");
        return false;
      }

      // Check if end date is not lower than start date (if start date is set)
      if (startDate) {
        const start = new Date(startDate);
        if (end < start) {
          setDateError("End date cannot be before start date");
          return false;
        }
      }

      // Check if end date is not higher than overall analysis end date
      if (overallAnalysisEndDate) {
        const overallEnd = new Date(overallAnalysisEndDate);
        if (end > overallEnd) {
          setDateError(
            `End date cannot be later than ${overallAnalysisEndDate}`
          );
          return false;
        }
      }
    }

    return true;
  };

  const getRecommendations = async (
    page = 0,
    limit = 100,
    symbol = "",
    sentiment = ""
  ) => {
    try {
      setLoading(true);
      let url = `/api/admin/strategyyoutubedata/page/${page}?channelID=${channelID}&limit=${limit}`;
      // Only add symbol parameter if it's not empty
      if (symbol && symbol.trim() !== "") {
        url += `&symbol=${symbol}`;
      }

      // Only add sentiment parameter if it's not empty
      if (sentiment && sentiment.trim() !== "") {
        url += `&sentiment=${sentiment}`;
      }

      // Only add date parameters if they exist and are not empty
      if (startDate && startDate.trim() !== "") {
        url += `&startDate=${startDate}`;
      }

      if (endDate && endDate.trim() !== "") {
        url += `&endDate=${endDate}`;
      }

      const apiRes = await axios.get(url);
      setRecommendations(apiRes.data.results);
      setCurrentPage(apiRes.data.page);
      setTotalPages(apiRes.data.totalPages);
      setTotalItems(apiRes.data.totalItems);
      setAnalytics(apiRes.data.analytics);
      setUniqueSymbols(apiRes.data.analytics.unique_symbols);
    } catch (error) {
      console.error("Error fetching recommendations", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load - only load on mount and channelID change
  useEffect(() => {
    if (channelID) {
      getRecommendations(0, 100, selectedSymbol, selectedSentiment);
    }
  }, [channelID]);

  // Only auto-reload when start or end date changes
  useEffect(() => {
    if (channelID && (startDate || endDate)) {
      getRecommendations(0, 100, selectedSymbol, selectedSentiment);
    }
  }, [startDate, endDate]);

  // Helper function to calculate ROI
  const calculateROI = (basePrice, currentPrice) => {
    if (!basePrice || !currentPrice) return null;
    return ((currentPrice - basePrice) / basePrice) * 100;
  };

  // Helper function to format price
  const formatPrice = (price) => {
    if (!price) return "N/A";
    return `$${formatNumberWithCommas(parseFloat(price))}`;
  };

  // Helper function to get sentiment color
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case "Strong_Bullish":
        return "text-to-purple-400";
      case "Mild_Bullish":
        return "text-to-purple-400";
      case "Strong_Bearish":
        return "text-to-red-recomendations";
      case "Mild_Bearish":
        return "text-to-red-recomendations";
      default:
        return "text-to-purple-400";
    }
  };

  const handleSymbolChange = (e) => {
    setSelectedSymbol(e.target.value);
    setCurrentPage(0); // Reset to first page when filtering
  };

  const handleSentimentChange = (e) => {
    setSelectedSentiment(e.target.value);
    setCurrentPage(0); // Reset to first page when filtering
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setDateError(""); // Clear any previous errors
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setDateError(""); // Clear any previous errors
  };

  const handleApplyFilters = () => {
    if (validateDates()) {
      setCurrentPage(0); // Reset to first page when applying filters
      getRecommendations(0, 100, selectedSymbol, selectedSentiment);
    }
  };

  const handleClearFilters = () => {
    setSelectedSymbol("");
    setSelectedSentiment("");
    setStartDate("");
    setEndDate("");
    setDateError("");
    setCurrentPage(0);
    // Call API with only channelID and limit parameters
    getRecommendations(0, 100);
  };
  const scrollToFilters = () => {
    // First, show advanced filters to ensure all filters are visible
    setShowAdvancedFilters(true);

    // Wait a brief moment for the advanced filters to render
    setTimeout(() => {
      // Try to find the top of the recommendations component first
      const topSection = document.getElementById("influencer-recommendations-top");

      if (topSection) {
        // Get the position of the element
        const rect = topSection.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Scroll to a position slightly above the component to ensure all filters are visible
        window.scrollTo({
          top: scrollTop + rect.top - 100, // 100px offset to show more context above
          behavior: "smooth"
        });
      } else {
        // Fallback: scroll to filters section directly
        const filtersSection = document.getElementById("influencer-filters-section");
        if (filtersSection) {
          const rect = filtersSection.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

          window.scrollTo({
            top: scrollTop + rect.top - 100, // 100px offset
            behavior: "smooth"
          });
        }
      }
    }, 50); // Small delay to ensure advanced filters are rendered
  };

  return (
    <div id="influencer-recommendations-top" className="bg-white rounded-xl border border-gray-200 overflow-x-auto text-to-purple">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-6 border-b border-gray-200">
        <h3 className="font-normal text-to-purple">
          Number of mentions of{" "}
          <span className="font-bold text-to-purple">{selectedSymbol || "all coins"}</span>
          {startDate && endDate && startDate === endDate ? " " : " during "}
          <span className="font-bold text-to-purple">
            {startDate && endDate
              ? startDate === endDate
                ? `on ${formatDate(startDate)}`
                : `${formatDate(startDate)} to ${formatDate(endDate)}`
              : startDate
                ? `from ${formatDate(startDate)}`
                : endDate
                  ? `until ${formatDate(endDate)}`
                  : "all time"}
          </span>{" "}
          for{" "}
          <span className="font-bold text-to-purple">
            {selectedSentiment ? selectedSentiment.replace("_", " ") : "all"}
          </span>{" "}
          sentiment (
          <span className="font-bold text-to-purple">
            {formatNumberWithCommas(totalItems)}
          </span>
          )
        </h3>

        <div id="influencer-filters-section" className="flex flex-col gap-3 items-end">
          {/* Main Filters Row */}
          <div className="w-full md:w-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex gap-3 items-center min-w-max px-2 py-1">
              <div className="relative">
                <select
                  className="bg-[#c4c5e14d] border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-to-purple appearance-none"
                  value={selectedSymbol}
                  onChange={handleSymbolChange}
                >
                  <option value="">All Coins</option>
                  {uniqueSymbols &&
                    uniqueSymbols?.symbols?.map((symbol) => (
                      <option key={symbol} value={symbol}>
                        {symbol}
                      </option>
                    ))}
                </select>
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-to-purple-400 pointer-events-none">
                  ▾
                </span>
              </div>
              <div className="relative">
                <select
                  className="bg-[#c4c5e14d] border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-to-purple appearance-none"
                  value={selectedSentiment}
                  onChange={handleSentimentChange}
                >
                  <option value="">All Sentiments</option>
                  <option value="Strong_Bullish">Strong Bullish</option>
                  <option value="Mild_Bullish">Mild Bullish</option>
                  <option value="Strong_Bearish">Strong Bearish</option>
                  <option value="Mild_Bearish">Mild Bearish</option>
                </select>
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-to-purple-400 pointer-events-none">
                  ▾
                </span>
              </div>
              <button
                onClick={handleApplyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap"
              >
                Apply
              </button>
              <button
                onClick={handleClearFilters}
                className="bg-transparent border border-gray-300 text-to-purple hover:bg-gray-100 px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap"
              >
                Clear
              </button>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="bg-[#c4c5e14d] border border-gray-300 rounded px-3 py-2 text-sm text-to-purple hover:bg-gray-100 flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                Advanced Filters
                <span
                  className={`transition-transform duration-200 ${showAdvancedFilters ? "rotate-180" : ""
                    }`}
                >
                  ▾
                </span>
              </button>
            </div>
          </div>

          {/* Advanced Filters Section */}
          {showAdvancedFilters && (
            <div className="w-full md:w-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="flex gap-3 items-center min-w-max px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-to-purple whitespace-nowrap">Start Date:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    className="bg-[#c4c5e14d] border border-gray-300 rounded px-3 py-2 text-sm text-to-purple"
                    min={overallAnalysisStartDate || undefined}
                    max={
                      endDate ||
                      overallAnalysisEndDate ||
                      new Date().toISOString().split("T")[0]
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-to-purple whitespace-nowrap">End Date:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    className="bg-[#c4c5e14d] border border-gray-300 rounded px-3 py-2 text-sm text-to-purple"
                    min={startDate || overallAnalysisStartDate || undefined}
                    max={
                      overallAnalysisEndDate ||
                      new Date().toISOString().split("T")[0]
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Error Display */}
      {dateError && (
        <div className="px-6 py-2 bg-red-900/20 border-l-4 border-red-500 text-to-red-recomendations text-sm">
          {dateError}
        </div>
      )}

      {/* Summary Tables Container */}
      {analytics && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary Table */}
            <div className="bg-[#f5f5f5] rounded-lg border border-gray-200 shadow-lg">
              <h4 className="text-lg font-semibold text-to-purple mb-4 p-4 pb-0">
                Performance Summary (Avg ROI)
              </h4>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-4 pt-0">
                <table className="min-w-full text-sm" style={{ minWidth: '600px' }}>
                  <thead>
                    <tr className="bg-[#e8e8e8] text-to-purple">
                      <th className="p-2 text-left font-semibold">Metric</th>
                      <th className="p-2 text-center font-semibold">1H</th>
                      <th className="p-2 text-center font-semibold">24H</th>
                      <th className="p-2 text-center font-semibold">7D</th>
                      <th className="p-2 text-center font-semibold">30D</th>
                      <th className="p-2 text-center font-semibold">60D</th>
                      <th className="p-2 text-center font-semibold">90D</th>
                      <th className="p-2 text-center font-semibold">180D</th>
                      <th className="p-2 text-center font-semibold">1Y</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-100">
                      <td className="p-3 font-medium text-to-purple">
                        Average Performance
                      </td>
                      <td
                        className={`p-2 text-center font-semibold ${analytics.average_roi["1H"] > 0
                          ? "text-to-purple-400"
                          : analytics.average_roi["1H"] < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {analytics.average_roi["1H"] !== null
                          ? `${analytics.average_roi["1H"] > 0 ? "+" : ""
                          }${formatNumberWithCommas(
                            analytics.average_roi["1H"]
                          )}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 text-center font-semibold ${analytics.average_roi["24H"] > 0
                          ? "text-to-purple-400"
                          : analytics.average_roi["24H"] < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {analytics.average_roi["24H"] !== null
                          ? `${analytics.average_roi["24H"] > 0 ? "+" : ""
                          }${formatNumberWithCommas(
                            analytics.average_roi["24H"]
                          )}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 text-center font-semibold ${analytics.average_roi["7D"] > 0
                          ? "text-to-purple-400"
                          : analytics.average_roi["7D"] < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {analytics.average_roi["7D"] !== null
                          ? `${analytics.average_roi["7D"] > 0 ? "+" : ""
                          }${formatNumberWithCommas(
                            analytics.average_roi["7D"]
                          )}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 text-center font-semibold ${analytics.average_roi["30D"] > 0
                          ? "text-to-purple-400"
                          : analytics.average_roi["30D"] < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {analytics.average_roi["30D"] !== null
                          ? `${analytics.average_roi["30D"] > 0 ? "+" : ""
                          }${formatNumberWithCommas(
                            analytics.average_roi["30D"]
                          )}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 text-center font-semibold ${analytics.average_roi["60D"] > 0
                          ? "text-to-purple-400"
                          : analytics.average_roi["60D"] < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {analytics.average_roi["60D"] !== null
                          ? `${analytics.average_roi["60D"] > 0 ? "+" : ""
                          }${formatNumberWithCommas(
                            analytics.average_roi["60D"]
                          )}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 text-center font-semibold ${analytics.average_roi["90D"] > 0
                          ? "text-to-purple-400"
                          : analytics.average_roi["90D"] < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {analytics.average_roi["90D"] !== null
                          ? `${analytics.average_roi["90D"] > 0 ? "+" : ""
                          }${formatNumberWithCommas(
                            analytics.average_roi["90D"]
                          )}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 text-center font-semibold ${analytics.average_roi["180D"] > 0
                          ? "text-to-purple-400"
                          : analytics.average_roi["180D"] < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {analytics.average_roi["180D"] !== null
                          ? `${analytics.average_roi["180D"] > 0 ? "+" : ""
                          }${formatNumberWithCommas(
                            analytics.average_roi["180D"]
                          )}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 text-center font-semibold ${analytics.average_roi["1Y"] > 0
                          ? "text-to-purple-400"
                          : analytics.average_roi["1Y"] < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {analytics.average_roi["1Y"] !== null
                          ? `${analytics.average_roi["1Y"] > 0 ? "+" : ""
                          }${formatNumberWithCommas(
                            analytics.average_roi["1Y"]
                          )}%`
                          : "N/A"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sentiment Summary Table */}
            <div className="bg-[#f5f5f5] rounded-lg border border-gray-200 shadow-lg">
              <h4 className="text-lg font-semibold text-to-purple mb-4 p-4 pb-0">
                Sentiment Summary
              </h4>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-4 pt-0">
                <table className="min-w-full text-sm" style={{ minWidth: '500px' }}>
                  <thead>
                    <tr className="bg-[#e8e8e8] text-to-purple">
                      <th className="p-2 text-left font-semibold">Metric</th>
                      <th className="p-2 text-center font-semibold">
                        Strong Bullish
                      </th>
                      <th className="p-2 text-center font-semibold">
                        Mild Bullish
                      </th>
                      <th className="p-2 text-center font-semibold">
                        Mild Bearish
                      </th>
                      <th className="p-2 text-center font-semibold">
                        Strong Bearish
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-100">
                      <td className="p-3 font-medium text-to-purple">
                        Sentiment Distribution
                      </td>
                      <td className="p-3 text-center text-to-purple-400 font-semibold">
                        {formatNumberWithCommas(
                          analytics.sentiment_analysis.sentiment_breakdown["Strong_Bullish"] || 0
                        )}
                      </td>
                      <td className="p-3 text-center text-to-purple-400 font-semibold">
                        {formatNumberWithCommas(
                          analytics.sentiment_analysis.sentiment_breakdown["Mild_Bullish"] || 0
                        )}
                      </td>
                      <td className="p-3 text-center text-to-red-recomendations font-semibold">
                        {formatNumberWithCommas(
                          analytics.sentiment_analysis.sentiment_breakdown["Mild_Bearish"] || 0
                        )}
                      </td>
                      <td className="p-3 text-center text-to-red-recomendations font-semibold">
                        {formatNumberWithCommas(
                          analytics.sentiment_analysis.sentiment_breakdown["Strong_Bearish"] || 0
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-to-purple">Loading recommendations...</p>
        </div>
      ) : recommendations.length > 0 ? (
        <>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="min-w-full text-sm" style={{ minWidth: '1200px' }}>
              <thead>
                <tr className="bg-[#e8e8e8] text-to-purple">
                  <th className="p-2 text-left font-semibold sticky left-0 bg-[#e8e8e8] z-10" style={{ minWidth: '120px' }}>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">Date UTC</span>
                      <button
                        onClick={scrollToFilters}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="View filters"
                      >
                        <FaEye size={12} />
                      </button>
                    </div>
                  </th>
                  <th className="p-2 text-center font-semibold sticky left-[120px] bg-[#e8e8e8] z-10" style={{ minWidth: '100px' }}>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs">Coin</span>
                      <button
                        onClick={scrollToFilters}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                        title="View filters"
                      >
                        <FaEye size={12} />
                      </button>
                    </div>
                  </th>
                  <th className="p-2 text-center font-semibold" style={{ minWidth: '100px' }}>
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-black text-xs">Current Price</span>
                    </div>
                  </th>
                  <th className="p-2 text-center font-semibold" style={{ minWidth: '90px' }}>
                    <span className="text-xs">Sentiment</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '80px' }}>
                    <span className="text-xs">Initial</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '60px' }}>
                    <span className="text-xs">1H</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '60px' }}>
                    <span className="text-xs">24H</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '60px' }}>
                    <span className="text-xs">7D</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '60px' }}>
                    <span className="text-xs">30D</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '60px' }}>
                    <span className="text-xs">60D</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '60px' }}>
                    <span className="text-xs">90D</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '60px' }}>
                    <span className="text-xs">180D</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '60px' }}>
                    <span className="text-xs">1Y</span>
                  </th>
                  <th className="p-2 text-center font-semibold" style={{ minWidth: '150px' }}>
                    <span className="text-xs">Video Title</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '60px' }}>
                    <span className="text-xs">Video</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec) => {
                  // Use the new ROI calculation keys directly from the response
                  const oneHourROI = rec["1_hour_price_returns"];
                  const oneDayROI = rec["24_hours_price_returns"];
                  const sevenDayROI = rec["7_days_price_returns"];
                  const thirtyDayROI = rec["30_days_price_returns"];
                  const sixtyDayROI = rec["60_days_price_returns"];
                  const ninetyDayROI = rec["90_days_price_returns"];
                  const oneYearROI = rec["1_year_price_returns"];
                  const oneEightyDayROI = rec["180_days_price_returns"];
                  return (
                    <tr key={rec._id} className="hover:bg-gray-100 group">
                      <td className="p-2 text-to-purple sticky left-0 bg-white group-hover:bg-gray-100 z-10" style={{ minWidth: '120px' }}>
                        <div className="text-xs">
                          {new Date(rec.publishedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            timeZone: "UTC",
                          })}
                          <br />
                          {new Date(rec.publishedAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "UTC",
                          })}
                        </div>
                      </td>
                      <td className="p-2 flex items-center gap-1 sticky left-[120px] bg-white group-hover:bg-gray-100 z-10" style={{ minWidth: '100px' }}>
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-xs font-bold">
                          {rec.symbol?.charAt(0) || "?"}
                        </span>
                        <div>
                          <div className="font-semibold text-to-purple text-xs">{rec.symbol}</div>
                          <div className="text-xs text-to-purple-400 truncate" style={{ maxWidth: '60px' }}>
                            {rec.coin_name}
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        {(() => {
                          const priceText = formatLivePrice(rec.symbol);
                          const isLive = isSymbolLive(rec.symbol);
                          const source = getPriceSource(rec.symbol);
                          const timestamp = getPriceTimestamp(rec.symbol);

                          if (priceText === "-" || priceText === "" || priceText === null || priceText === undefined) {
                            return <span className="text-red-400 font-semibold text-xs">-</span>;
                          }

                          return (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1">
                                <span
                                  className={`font-semibold text-xs ${isLive ? 'text-to-purple' : ''}`}
                                  style={{ color: isLive ? undefined : '#2b7fff' }}
                                >
                                  ${priceText}
                                </span>
                                {!isLive && timestamp && (
                                  <div className="relative group">
                                    <button
                                      className="text-xs cursor-pointer"
                                      style={{ color: "#2b7fff" }}
                                    // title={`Last updated: ${new Date(timestamp).toUTCString().replace(" GMT", " UTC")}`}
                                    >
                                      ⓘ
                                    </button>
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                      Last updated: {new Date(timestamp).toUTCString().replace(" GMT", " UTC")}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      {/* <td className="p-3 text-to-purple">-</td> */}
                      <td className="p-2 text-center">
                        <span
                          className={`inline-block text-xs font-semibold text-center ${getSentimentColor(
                            rec.sentiment
                          )}`}
                        >
                          {rec.sentiment?.replace("_", " ") || "N/A"}
                        </span>
                      </td>
                      <td className="p-2 text-to-purple text-xs">{formatPrice(rec.base?.price)}</td>
                      <td
                        className={`p-2 font-semibold text-xs ${oneHourROI > 0
                          ? "text-to-purple-400"
                          : oneHourROI < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {oneHourROI !== null && oneHourROI !== undefined
                          ? `${oneHourROI > 0 ? "+" : ""}${formatNumberWithCommas(
                            oneHourROI
                          )}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 font-semibold text-xs ${oneDayROI > 0
                          ? "text-to-purple-400"
                          : oneDayROI < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {oneDayROI !== null && oneDayROI !== undefined
                          ? `${oneDayROI > 0 ? "+" : ""}${formatNumberWithCommas(
                            oneDayROI
                          )}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 font-semibold text-xs ${sevenDayROI > 0
                          ? "text-to-purple-400"
                          : sevenDayROI < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {sevenDayROI !== null && sevenDayROI !== undefined
                          ? `${sevenDayROI > 0 ? "+" : ""
                          }${formatNumberWithCommas(sevenDayROI)}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 font-semibold text-xs ${thirtyDayROI > 0
                          ? "text-to-purple-400"
                          : thirtyDayROI < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {thirtyDayROI !== null && thirtyDayROI !== undefined
                          ? `${thirtyDayROI > 0 ? "+" : ""
                          }${formatNumberWithCommas(thirtyDayROI)}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 font-semibold text-xs ${sixtyDayROI > 0
                          ? "text-to-purple-400"
                          : sixtyDayROI < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {sixtyDayROI !== null && sixtyDayROI !== undefined
                          ? `${sixtyDayROI > 0 ? "+" : ""
                          }${formatNumberWithCommas(sixtyDayROI)}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 font-semibold text-xs ${ninetyDayROI > 0
                          ? "text-to-purple-400"
                          : ninetyDayROI < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {ninetyDayROI !== null && ninetyDayROI !== undefined
                          ? `${ninetyDayROI > 0 ? "+" : ""
                          }${formatNumberWithCommas(ninetyDayROI)}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 font-semibold text-xs ${oneEightyDayROI > 0
                          ? "text-to-purple-400"
                          : oneEightyDayROI < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {oneEightyDayROI !== null && oneEightyDayROI !== undefined
                          ? `${oneEightyDayROI > 0 ? "+" : ""
                          }${formatNumberWithCommas(oneEightyDayROI)}%`
                          : "N/A"}
                      </td>
                      <td
                        className={`p-2 font-semibold text-xs ${oneYearROI > 0
                          ? "text-to-purple-400"
                          : oneYearROI < 0
                            ? "text-to-red-recomendations"
                            : "text-to-purple-400"
                          }`}
                      >
                        {oneYearROI !== null && oneYearROI !== undefined
                          ? `${oneYearROI > 0 ? "+" : ""}${formatNumberWithCommas(
                            oneYearROI
                          )}%`
                          : "N/A"}
                      </td>
                      <td className="p-2">
                        <div className="text-xs truncate" style={{ maxWidth: '140px' }} title={rec.title}>
                          {rec.title}
                        </div>
                      </td>
                      <td className="p-2">
                        <a
                          href={`https://www.youtube.com/watch?v=${rec.videoID}`}
                          className="text-blue-400 hover:underline text-xs"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <div className="text-sm text-to-purple">
                Showing page {currentPage + 1} of {totalPages} (
                {formatNumberWithCommas(totalItems)} total items)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
                    getRecommendations(newPage, 100, selectedSymbol, selectedSentiment);
                  }}
                  disabled={currentPage === 0}
                  className="px-3 py-1 bg-[#c4c5e14d] border border-gray-300 rounded text-sm text-to-purple disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    const newPage = currentPage + 1;
                    setCurrentPage(newPage);
                    getRecommendations(newPage, 100, selectedSymbol, selectedSentiment);
                  }}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1 bg-[#c4c5e14d] border border-gray-300 rounded text-sm text-to-purple disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-8 text-center text-to-purple">
          <p>No recommendations available for this channel.</p>
        </div>
      )}
    </div>
  );
}
