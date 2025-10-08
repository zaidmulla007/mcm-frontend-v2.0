"use client";
import { useState, useEffect, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import TelegramInfluencerProfileHeader from "./TelegramInfluencerProfileHeader";
import GaugeComponent from "react-gauge-component";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, ResponsiveContainer } from 'recharts';
import { FaEye } from "react-icons/fa";
import { useLivePrice } from "./useLivePrice";
import TelegramRecentActivities from "@/app/components/InfluencerProfile/TelegramRecentActivities";
import moment from "moment-timezone";
import { useTimezone } from "../../contexts/TimezoneContext";

// Use global CSS class .text-to-purple from globals.css

export default function TelegramInfluencerProfile({ channelId }) {
  const { useLocalTime, formatDate } = useTimezone();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [channelData, setChannelData] = useState(null);
  const [telegramLast5, setTelegramLast5] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "performance", label: "Performance Summary" },
    { id: "recommendations", label: "Recommendations" },
    { id: "recentActivities", label: "Recent Activities" }
  ];

  // Fetch Telegram data
  useEffect(() => {
    if (!channelId) return;

    const fetchTelegramData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/influencertelegramdata/channel/${channelId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        let last5 = data?.telegram_last_5 || [];

        if (!data) throw new Error("No data found in response");

        setChannelData(data);
        setTelegramLast5(last5);
      } catch (err) {
        console.error("Error fetching telegram data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTelegramData();
  }, [channelId]);

  // Handle tab query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabs.find(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1625] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
          <p className="text-gray-400">Loading Telegram data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1625] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Data</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!channelData || !channelData.success) {
    return (
      <div className="min-h-screen bg-[#1a1625] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">No Data Found</h2>
          <p className="text-gray-400">No data available for this Telegram channel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1625] text-white">
      {/* Header */}
      <TelegramInfluencerProfileHeader channelData={channelData} />

      {/* Tabs Navigation */}
      <div className="w-full border-b border-[#232042] px-4">
        <div className="flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${activeTab === tab.id
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-6">
        {activeTab === "overview" && (
          <OverviewTab channelData={channelData} />
        )}
        {activeTab === "performance" && (
          <PerformanceTab channelData={channelData} />
        )}
        {activeTab === "recommendations" && (
          <RecommendationsTab channelData={channelData} formatDate={formatDate} />
        )}
        {activeTab === "recentActivities" && (
          <TelegramRecentActivities channelID={channelId} channelData={channelData} telegramLast5={telegramLast5} rank={channelData?.rank} />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ channelData }) {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryType, setSummaryType] = useState("yearly");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [hoveredColumnROI, setHoveredColumnROI] = useState(null);
  const [hoveredRowROI, setHoveredRowROI] = useState(null);
  const [hoveredColumnWinRate, setHoveredColumnWinRate] = useState(null);
  const [hoveredRowWinRate, setHoveredRowWinRate] = useState(null);

  const overall = channelData.results?.Overall;
  const currentYear = new Date().getFullYear();

  const quarterLabels = {
    q1: "Jan - Mar (Q1)",
    q2: "Apr - Jun (Q2)",
    q3: "Jul - Sep (Q3)",
    q4: "Oct - Dec (Q4)"
  };

  const formatPercentageWithStyling = (value, column, hoveredColumn, hoveredRow, row) => {
    const isHovered = hoveredColumn === column && hoveredRow === row;
    const isNegative = value && value < 0;
    const display = value != null ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%` : 'N/A';

    return {
      display,
      isHovered,
      isNegative
    };
  };

  return (
    <div className="flex flex-col gap-8 overflow-x-hidden">
      {/* About Section */}
      {/* <div className="bg-white rounded-xl p-6 mb-2 border border-gray-200">
        <h3 className="text-lg font-bold mb-2 text-[#0c0023]">
          About {channelData.results?.channel_id || "Unknown Channel"}
        </h3>
        <button
          onClick={() => setIsAboutOpen(!isAboutOpen)}
          className="text-sm text-purple-600 hover:underline mb-2"
        >
          {isAboutOpen ? "Hide Details" : "Read More"}
        </button>
        {isAboutOpen && (
          <>
            <p className="text-to-purple mb-4">
              Telegram channel providing cryptocurrency analysis and trading signals.
              {channelData.results?.total_records &&
                ` Total of ${channelData.results.total_records} messages analyzed.`}
              {channelData.results?.crypto_related &&
                ` ${channelData.results.crypto_related} messages are crypto-related.`}
            </p>
          </>
        )}
      </div> */}

      {/* Summary Dropdown Section */}
      <div className="bg-white rounded-xl p-6 mb-2 border border-gray-200">
        <h3 className="text-lg font-bold mb-2 text-[#0c0023]">
          Channel Summary Analysis
        </h3>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSummaryOpen(!isSummaryOpen)}
          className="text-sm text-purple-600 hover:underline mb-2"
        >
          {isSummaryOpen ? "Hide Summary" : "View Summary"}
        </button>

        {isSummaryOpen && (
          <>
            {/* Type Selection Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setSummaryType("yearly");
                  setSelectedPeriod("");
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${summaryType === "yearly"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  : "bg-gray-100 text-[#0c0023] hover:bg-gray-200"
                  }`}
              >
                Year
              </button>
              <button
                onClick={() => {
                  setSummaryType("quarterly");
                  setSelectedPeriod("");
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${summaryType === "quarterly"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  : "bg-gray-100 text-[#0c0023] hover:bg-gray-200"
                  }`}
              >
                Quarter
              </button>
              <button
                onClick={() => {
                  setSummaryType("overall");
                  setSelectedPeriod("overall");
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${summaryType === "overall"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  : "bg-gray-100 text-[#0c0023] hover:bg-gray-200"
                  }`}
              >
                Cumulative
              </button>
            </div>

            {/* Period Selection Dropdown */}
            {summaryType !== "overall" && (
              <div className="mb-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg text-[#0c0023] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    Select a {summaryType === "quarterly" ? "quarter" : "year"}...
                  </option>
                  {summaryType === "quarterly"
                    ? channelData?.results?.Gemini?.Quarterly &&
                    Object.keys(channelData.results.Gemini.Quarterly)
                      .sort((a, b) => {
                        const [yearA, qA] = a.split("_");
                        const [yearB, qB] = b.split("_");
                        if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
                        return qB.localeCompare(qA);
                      })
                      .map((quarter) => (
                        <option key={quarter} value={quarter}>
                          {quarter.replace("_", " ")}
                        </option>
                      ))
                    : channelData?.results?.Gemini?.Yearly &&
                    Object.keys(channelData.results.Gemini.Yearly)
                      .sort((a, b) => parseInt(b) - parseInt(a))
                      .map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                </select>
              </div>
            )}

            {/* Summary Display */}
            {selectedPeriod && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                {(() => {
                  const data =
                    summaryType === "quarterly"
                      ? channelData?.results?.Gemini?.Quarterly?.[selectedPeriod]
                      : summaryType === "yearly"
                        ? channelData?.results?.Gemini?.Yearly?.[selectedPeriod]
                        : channelData?.results?.Gemini?.Overall;

                  if (!data)
                    return (
                      <p className="text-gray-500">
                        No data available for this period.
                      </p>
                    );

                  return (
                    <div className="space-y-6">
                      {/* Summary Section */}
                      <div>
                        <h4 className="font-semibold text-[#0c0023] mb-2">Summary</h4>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {data.summary}
                        </p>
                      </div>

                      {/* Posting Frequency Analysis */}
                      <div>
                        <h4 className="font-semibold text-[#0c0023] mb-2">Posting Frequency Analysis</h4>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {data.posting_frequency_analysis}
                        </p>
                      </div>

                      {/* Credibility Score */}
                      <div>
                        <h4 className="font-semibold text-[#0c0023] mb-2">Credibility Score</h4>
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold mr-3">
                            {data.overall_credibility_score}
                          </div>
                          <p className="text-gray-700">
                            {data.overall_credibility_score}/10
                          </p>
                        </div>
                      </div>

                      {/* Credibility Explanation */}
                      <div>
                        <h4 className="font-semibold text-[#0c0023] mb-2">Credibility Explanation</h4>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {data.credibility_explanation}
                        </p>
                      </div>

                      {/* Telegram Specific Insights (only for Quarterly/Yearly) */}
                      {summaryType !== "overall" && (
                        <div>
                          <h4 className="font-semibold text-[#0c0023] mb-2">
                            {summaryType === "quarterly"
                              ? "Telegram Specific Insights"
                              : "Telegram Yearly Insights"}
                          </h4>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {summaryType === "quarterly"
                              ? data.telegram_specific_insights
                              : data.telegram_yearly_insights}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Channel Performance Metrics */}
      <div className="bg-white rounded-xl p-6 mb-2 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#0c0023]">
            Channel Performance Metrics
          </h3>
        </div>

        <div className="space-y-6">
          {channelData?.results?.Ai_scoring?.Yearly
            ? (() => {
              // Prepare data for charts
              const years = Object.keys(channelData.results.Ai_scoring.Yearly).sort().reverse();
              const currentYear = new Date().getFullYear().toString();

              // Define metrics with their properties
              const metrics = [
                {
                  key: 'overall_score',
                  label: 'Overall Score',
                  field: 'avg_overall_score',
                  color: '#1e3a8a',
                  definition: 'Combined score reflecting overall quality across all metrics.'
                },
                {
                  key: 'credibility_score',
                  label: 'Credibility Score',
                  field: 'avg_credibility_score',
                  color: '#1d4ed8',
                  definition: 'Trustworthiness and accuracy of the content.'
                },
                {
                  key: 'risk_management',
                  label: 'Risk Management',
                  field: 'avg_risk_management',
                  color: '#3b82f6',
                  definition: 'How well risk strategies are addressed (e.g. sizing, risk-reward ratios, portfolio allocation).'
                },
                {
                  key: 'actionable_insights',
                  label: 'Actionable Insights',
                  field: 'avg_actionable_insights',
                  color: '#93c5fd',
                  definition: 'Presence and quality of actionable insights. Higher score when the reader can take specific actions.'
                },
                {
                  key: 'educational_value',
                  label: 'Educational Value',
                  field: 'avg_educational_purpose',
                  color: '#dbeafe',
                  definition: 'Higher when explanations of why certain moves are expected are included.'
                }
              ];

              // Create separate chart data for each metric
              const chartsData = metrics.map(metric => {
                const data = years.map(year => ({
                  year: year === currentYear ? year + '*' : year,
                  value: channelData.results.Ai_scoring.Yearly[year][metric.field] || 0
                })).filter(d => d.value > 0);

                return {
                  ...metric,
                  data: data,
                  hasData: data.length > 0
                };
              }).filter(chart => chart.hasData);

              return (
                <div className="space-y-4">
                  {chartsData.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-gray-500 italic">
                      No yearly performance data available
                    </div>
                  ) : (
                    <>
                      {/* Mobile single column layout */}
                      <div className="block md:hidden grid grid-cols-1 gap-4">
                        {chartsData.map((metric) => (
                          <div key={metric.key} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <h4 className="text-center font-medium text-gray-700">{metric.label}</h4>
                              <div className="relative group">
                                <svg
                                  className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                  {metric.definition}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                              <BarChart
                                data={metric.data}
                                margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                  dataKey="year"
                                  tick={{ fontSize: 11 }}
                                  stroke="#666"
                                />
                                <YAxis
                                  domain={[0, 10]}
                                  ticks={[0, 5, 10]}
                                  tick={{ fontSize: 11 }}
                                  stroke="#666"
                                />
                                <Bar
                                  dataKey="value"
                                  fill={metric.color}
                                  radius={[8, 8, 0, 0]}
                                  barSize={40}
                                >
                                  <LabelList
                                    dataKey="value"
                                    position="top"
                                    formatter={(value) => value.toFixed(1)}
                                    style={{ fontSize: '12px', fontWeight: 'bold', fill: '#333' }}
                                  />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ))}
                      </div>

                      {/* Desktop grid layout */}
                      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {chartsData.map((metric) => (
                          <div key={metric.key} className="space-y-2">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-[#0c0023]">{metric.label}</h4>
                              <div className="relative group">
                                <svg
                                  className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                  {metric.definition}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <ResponsiveContainer width="100%" height={150}>
                              <BarChart
                                data={metric.data}
                                margin={{ top: 5, right: 5, left: 0, bottom: 25 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                  dataKey="year"
                                  tick={{ fontSize: 10 }}
                                  stroke="#666"
                                />
                                <YAxis
                                  domain={[0, 10]}
                                  ticks={[0, 5, 10]}
                                  tick={{ fontSize: 10 }}
                                  stroke="#666"
                                />
                                <Bar
                                  dataKey="value"
                                  fill={metric.color}
                                  radius={[8, 8, 0, 0]}
                                  barSize={25}
                                >
                                  <LabelList
                                    dataKey="value"
                                    position="top"
                                    formatter={(value) => value.toFixed(1)}
                                    style={{ fontSize: '12px', fontWeight: 'bold', fill: '#333' }}
                                  />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500 text-right mt-2">
                        Current year {currentYear}*
                      </p>
                    </>
                  )}
                </div>
              );
            })()
            : (
              <div className="h-40 flex items-center justify-center text-gray-500 italic">
                No yearly performance data available
              </div>
            )}
        </div>
      </div>



      {/* Sentiment Analysis Charts */}
      <div className="bg-white rounded-xl p-6 mb-2 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#0c0023]">
            Total Recommendations
          </h3>
        </div>
        <div className="space-y-6">
          {(() => {
            // Get yearly data from different sources
            const overallData = channelData?.results?.Yearly || {};
            const moonshotsData = channelData?.results?.hyperactive?.Yearly || {};
            const normalData = channelData?.results?.normal?.Yearly || {};

            const currentYear = new Date().getFullYear().toString();

            // Helper function to transform data for charts
            const transformData = (data) => {
              return Object.keys(data).map(year => ({
                year: year === currentYear ? year + '*' : year,
                bullish: data[year].bullish_count,
                bearish: data[year].bearish_count
              })).sort((a, b) => b.year.replace('*', '') - a.year.replace('*', '')); // Sort by year descending
            };

            // Define categories with their properties
            const categories = [
              {
                key: 'overall',
                label: 'Overall',
                data: transformData(overallData)
              },
              {
                key: 'with_moonshots',
                label: 'Hyperactivity',
                data: transformData(moonshotsData)
              },
              {
                key: 'without_moonshots',
                label: 'Non Hyperactivity',
                data: transformData(normalData)
              }
            ];

            // Format data for charts
            const chartsData = categories.map(category => ({
              ...category,
              hasData: category.data.length > 0
            })).filter(chart => chart.hasData);

            // Explanatory text content
            const explanations = [
              {
                title: "Understanding the Categories",
                content: "Overall represents the total recommendations across all types. Hyperactivity includes recommendations that are considered high-risk, high-reward opportunities. Non Hyperactivity excludes these high-risk recommendations."
              }
            ];

            return (
              <div className="space-y-4">
                {chartsData.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-gray-500 italic">
                    No recommendation data available
                  </div>
                ) : (
                  <>
                    {/* Mobile single column layout */}
                    <div className="block md:hidden grid grid-cols-1 gap-4">
                      {chartsData.map((category) => (
                        <div key={category.key} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="text-center font-medium text-gray-700 mb-3">{category.label}</h4>
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart
                              data={category.data}
                              margin={{ top: 30, right: 10, left: 0, bottom: 30 }}
                            >
                              <XAxis
                                dataKey="year"
                                tick={{ fontSize: 11 }}
                                stroke="#666"
                              />
                              <YAxis hide={true} />
                              <Bar
                                dataKey="bullish"
                                fill="#1e3a8a"
                                name="Bullish"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                              >
                                <LabelList
                                  dataKey="bullish"
                                  position="top"
                                  style={{ fontSize: '10px', fill: '#333' }}
                                  formatter={(value) => value.toLocaleString()}
                                />
                              </Bar>
                              <Bar
                                dataKey="bearish"
                                fill="#dbeafe"
                                name="Bearish"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                              >
                                <LabelList
                                  dataKey="bearish"
                                  position="top"
                                  style={{ fontSize: '10px', fill: '#333' }}
                                  formatter={(value) => value.toLocaleString()}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ))}
                      {/* Explanatory box for mobile */}
                      {explanations.map((explanation, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-[#0c0023] mb-2">{explanation.title}</h4>
                          <p className="text-xs text-gray-600">{explanation.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Desktop grid layout - 3 charts + 1 explanatory box */}
                    <div className="hidden md:grid md:grid-cols-4 gap-3">
                      {/* First 3 columns for charts */}
                      {chartsData.map((category) => (
                        <div key={category.key} className="space-y-2">
                          <h4 className="text-sm font-semibold text-[#0c0023] text-center mb-2">{category.label}</h4>
                          <ResponsiveContainer width="100%" height={150}>
                            <BarChart
                              data={category.data}
                              margin={{ top: 25, right: 5, left: 0, bottom: 25 }}
                            >
                              <XAxis
                                dataKey="year"
                                tick={{ fontSize: 10 }}
                                stroke="#666"
                              />
                              <YAxis hide={true} />
                              <Bar
                                dataKey="bullish"
                                fill="#1e3a8a"
                                name="Bullish"
                                radius={[4, 4, 0, 0]}
                                barSize={15}
                              >
                                <LabelList
                                  dataKey="bullish"
                                  position="top"
                                  style={{ fontSize: '10px', fill: '#333' }}
                                  formatter={(value) => value.toLocaleString()}
                                />
                              </Bar>
                              <Bar
                                dataKey="bearish"
                                fill="#dbeafe"
                                name="Bearish"
                                radius={[4, 4, 0, 0]}
                                barSize={15}
                              >
                                <LabelList
                                  dataKey="bearish"
                                  position="top"
                                  style={{ fontSize: '10px', fill: '#333' }}
                                  formatter={(value) => value.toLocaleString()}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ))}

                      {/* 4th column for explanatory box */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        {explanations.map((explanation, index) => (
                          <div key={index}>
                            <h4 className="text-sm font-semibold text-[#0c0023] mb-2">{explanation.title}</h4>
                            <p className="text-xs text-gray-600">{explanation.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: "#1e3a8a" }}></div>
                        <span className="text-sm text-[#0c0023]">Bullish</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: "#dbeafe" }}></div>
                        <span className="text-sm text-[#0c0023]">Bearish</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 text-right mt-2">
                      Current year {currentYear}*
                    </p>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Performance Overview ROI */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-black">Performance Overview ROI</h3>
        </div>
        <p className="text-md mb-3 text-to-purple">Hover Mouse for info</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-black">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple" rowSpan={2}>Year</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple" rowSpan={2}>Quarter</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple" colSpan={8}>Holding Period (From the Date of Post/Recommendations)</th>
              </tr>
              <tr>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnROI('1_hour')}
                  onMouseLeave={() => setHoveredColumnROI(null)}>1 Hour</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnROI('24_hours')}
                  onMouseLeave={() => setHoveredColumnROI(null)}>24 Hours</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnROI('7_days')}
                  onMouseLeave={() => setHoveredColumnROI(null)}>7 Days</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnROI('30_days')}
                  onMouseLeave={() => setHoveredColumnROI(null)}>30 Days</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnROI('60_days')}
                  onMouseLeave={() => setHoveredColumnROI(null)}>60 Days</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnROI('90_days')}
                  onMouseLeave={() => setHoveredColumnROI(null)}>90 Days</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnROI('180_days')}
                  onMouseLeave={() => setHoveredColumnROI(null)}>180 Days</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnROI('1_year')}
                  onMouseLeave={() => setHoveredColumnROI(null)}>1 Year</th>
              </tr>
            </thead>
            <tbody>
              {channelData?.results?.Yearly &&
                Object.entries(channelData.results.Yearly)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([year, yearData]) => {
                    const yearQuarters = channelData?.results?.Quarterly
                      ? Object.entries(channelData.results.Quarterly)
                        .filter(([quarter]) => quarter && quarter.startsWith(year))
                        .sort(([a], [b]) => {
                          const qA = parseInt(a.split("-")[1]?.replace("Q", "") || "0");
                          const qB = parseInt(b.split("-")[1]?.replace("Q", "") || "0");
                          return qA - qB;
                        })
                      : [];

                    return (
                      <Fragment key={year}>
                        <tr className="hover:bg-gray-50">
                          <td
                            className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple"
                            rowSpan={yearQuarters.length + 1}
                          >
                            {parseInt(year) >= currentYear ? `${year}*` : year}
                          </td>
                        </tr>

                        {/* Quarter rows */}
                        {yearQuarters.map(([quarter, quarterData]) => (
                          <tr key={quarter} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-1 text-xs text-to-purple">
                              {quarterLabels[quarter.slice(-2).toLowerCase()] ?? quarter}
                            </td>
                            <td
                              className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${(() => {
                                const result = formatPercentageWithStyling(quarterData?.["1_hour"]?.probablity_weighted_returns_percentage, '1_hour', hoveredColumnROI, hoveredRowROI, quarter);
                                if (hoveredColumnROI === '1_hour' || hoveredRowROI === quarter) {
                                  return result.isNegative ? "text-red-800 font-bold" : "text-to-purple font-bold";
                                } else {
                                  return result.isNegative ? "text-red-200 hover:text-red-800 hover:font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold";
                                }
                              })()} ${hoveredColumnROI === '1_hour' && hoveredRowROI === quarter ? 'bg-yellow-200' : ''
                                }`}
                              onMouseEnter={() => {
                                setHoveredColumnROI('1_hour');
                                setHoveredRowROI(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnROI(null);
                                setHoveredRowROI(null);
                              }}
                            >
                              {(() => {
                                const result = formatPercentageWithStyling(quarterData?.["1_hour"]?.probablity_weighted_returns_percentage, '1_hour', hoveredColumnROI, hoveredRowROI, quarter);
                                return result.display === 'N/A' ? <span className={hoveredColumnROI === '1_hour' || hoveredRowROI === quarter ? "text-red-800 font-bold" : "text-red-200 hover:text-red-800 hover:font-bold"}>N/A</span> : result.display;
                              })()}
                            </td>

                            <td className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${(() => {
                              const result = formatPercentageWithStyling(quarterData?.["24_hours"]?.probablity_weighted_returns_percentage, '24_hours', hoveredColumnROI, hoveredRowROI, quarter);
                              if (hoveredColumnROI === '24_hours' || hoveredRowROI === quarter) {
                                return result.isNegative ? "text-red-800 font-bold" : "text-to-purple font-bold";
                              } else {
                                return result.isNegative ? "text-red-200 hover:text-red-800 hover:font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold";
                              }
                            })()} ${hoveredColumnROI === '24_hours' && hoveredRowROI === quarter ? 'bg-yellow-200' : ''
                              }`}
                              onMouseEnter={() => {
                                setHoveredColumnROI('24_hours');
                                setHoveredRowROI(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnROI(null);
                                setHoveredRowROI(null);
                              }}>
                              {(() => {
                                const result = formatPercentageWithStyling(quarterData?.["24_hours"]?.probablity_weighted_returns_percentage, '24_hours', hoveredColumnROI, hoveredRowROI, quarter);
                                return result.display === 'N/A' ? <span className={hoveredColumnROI === '24_hours' || hoveredRowROI === quarter ? "text-red-800 font-bold" : "text-red-200 hover:text-red-800 hover:font-bold"}>N/A</span> : result.display;
                              })()}
                            </td>

                            <td className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${(() => {
                              const result = formatPercentageWithStyling(quarterData?.["7_days"]?.probablity_weighted_returns_percentage, '7_days', hoveredColumnROI, hoveredRowROI, quarter);
                              if (hoveredColumnROI === '7_days' || hoveredRowROI === quarter) {
                                return result.isNegative ? "text-red-800 font-bold" : "text-to-purple font-bold";
                              } else {
                                return result.isNegative ? "text-red-200 hover:text-red-800 hover:font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold";
                              }
                            })()} ${hoveredColumnROI === '7_days' && hoveredRowROI === quarter ? 'bg-yellow-200' : ''
                              }`}
                              onMouseEnter={() => {
                                setHoveredColumnROI('7_days');
                                setHoveredRowROI(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnROI(null);
                                setHoveredRowROI(null);
                              }}>
                              {(() => {
                                const result = formatPercentageWithStyling(quarterData?.["7_days"]?.probablity_weighted_returns_percentage, '7_days', hoveredColumnROI, hoveredRowROI, quarter);
                                return result.display === 'N/A' ? <span className={hoveredColumnROI === '7_days' || hoveredRowROI === quarter ? "text-red-800 font-bold" : "text-red-200 hover:text-red-800 hover:font-bold"}>N/A</span> : result.display;
                              })()}
                            </td>

                            <td className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${(() => {
                              const result = formatPercentageWithStyling(quarterData?.["30_days"]?.probablity_weighted_returns_percentage, '30_days', hoveredColumnROI, hoveredRowROI, quarter);
                              if (hoveredColumnROI === '30_days' || hoveredRowROI === quarter) {
                                return result.isNegative ? "text-red-800 font-bold" : "text-to-purple font-bold";
                              } else {
                                return result.isNegative ? "text-red-200 hover:text-red-800 hover:font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold";
                              }
                            })()} ${hoveredColumnROI === '30_days' && hoveredRowROI === quarter ? 'bg-yellow-200' : ''
                              }`}
                              onMouseEnter={() => {
                                setHoveredColumnROI('30_days');
                                setHoveredRowROI(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnROI(null);
                                setHoveredRowROI(null);
                              }}>
                              {(() => {
                                const result = formatPercentageWithStyling(quarterData?.["30_days"]?.probablity_weighted_returns_percentage, '30_days', hoveredColumnROI, hoveredRowROI, quarter);
                                return result.display === 'N/A' ? <span className={hoveredColumnROI === '30_days' || hoveredRowROI === quarter ? "text-red-800 font-bold" : "text-red-200 hover:text-red-800 hover:font-bold"}>N/A</span> : result.display;
                              })()}
                            </td>

                            <td className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${(() => {
                              const result = formatPercentageWithStyling(quarterData?.["60_days"]?.probablity_weighted_returns_percentage, '60_days', hoveredColumnROI, hoveredRowROI, quarter);
                              if (hoveredColumnROI === '60_days' || hoveredRowROI === quarter) {
                                return result.isNegative ? "text-red-800 font-bold" : "text-to-purple font-bold";
                              } else {
                                return result.isNegative ? "text-red-200 hover:text-red-800 hover:font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold";
                              }
                            })()} ${hoveredColumnROI === '60_days' && hoveredRowROI === quarter ? 'bg-yellow-200' : ''
                              }`}
                              onMouseEnter={() => {
                                setHoveredColumnROI('60_days');
                                setHoveredRowROI(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnROI(null);
                                setHoveredRowROI(null);
                              }}>
                              {(() => {
                                const result = formatPercentageWithStyling(quarterData?.["60_days"]?.probablity_weighted_returns_percentage, '60_days', hoveredColumnROI, hoveredRowROI, quarter);
                                return result.display === 'N/A' ? <span className={hoveredColumnROI === '60_days' || hoveredRowROI === quarter ? "text-red-800 font-bold" : "text-red-200 hover:text-red-800 hover:font-bold"}>N/A</span> : result.display;
                              })()}
                            </td>

                            <td className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${(() => {
                              const result = formatPercentageWithStyling(quarterData?.["90_days"]?.probablity_weighted_returns_percentage, '90_days', hoveredColumnROI, hoveredRowROI, quarter);
                              if (hoveredColumnROI === '90_days' || hoveredRowROI === quarter) {
                                return result.isNegative ? "text-red-800 font-bold" : "text-to-purple font-bold";
                              } else {
                                return result.isNegative ? "text-red-200 hover:text-red-800 hover:font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold";
                              }
                            })()} ${hoveredColumnROI === '90_days' && hoveredRowROI === quarter ? 'bg-yellow-200' : ''
                              }`}
                              onMouseEnter={() => {
                                setHoveredColumnROI('90_days');
                                setHoveredRowROI(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnROI(null);
                                setHoveredRowROI(null);
                              }}>
                              {(() => {
                                const result = formatPercentageWithStyling(quarterData?.["90_days"]?.probablity_weighted_returns_percentage, '90_days', hoveredColumnROI, hoveredRowROI, quarter);
                                return result.display === 'N/A' ? <span className={hoveredColumnROI === '90_days' || hoveredRowROI === quarter ? "text-red-800 font-bold" : "text-red-200 hover:text-red-800 hover:font-bold"}>N/A</span> : result.display;
                              })()}
                            </td>

                            <td className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${(() => {
                              const result = formatPercentageWithStyling(quarterData?.["180_days"]?.probablity_weighted_returns_percentage, '180_days', hoveredColumnROI, hoveredRowROI, quarter);
                              if (hoveredColumnROI === '180_days' || hoveredRowROI === quarter) {
                                return result.isNegative ? "text-red-800 font-bold" : "text-to-purple font-bold";
                              } else {
                                return result.isNegative ? "text-red-200 hover:text-red-800 hover:font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold";
                              }
                            })()} ${hoveredColumnROI === '180_days' && hoveredRowROI === quarter ? 'bg-yellow-200' : ''
                              }`}
                              onMouseEnter={() => {
                                setHoveredColumnROI('180_days');
                                setHoveredRowROI(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnROI(null);
                                setHoveredRowROI(null);
                              }}>
                              {(() => {
                                const result = formatPercentageWithStyling(quarterData?.["180_days"]?.probablity_weighted_returns_percentage, '180_days', hoveredColumnROI, hoveredRowROI, quarter);
                                return result.display === 'N/A' ? <span className={hoveredColumnROI === '180_days' || hoveredRowROI === quarter ? "text-red-800 font-bold" : "text-red-200 hover:text-red-800 hover:font-bold"}>N/A</span> : result.display;
                              })()}
                            </td>

                            <td className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${(() => {
                              const result = formatPercentageWithStyling(quarterData?.["1_year"]?.probablity_weighted_returns_percentage, '1_year', hoveredColumnROI, hoveredRowROI, quarter);
                              if (hoveredColumnROI === '1_year' || hoveredRowROI === quarter) {
                                return result.isNegative ? "text-red-800 font-bold" : "text-to-purple font-bold";
                              } else {
                                return result.isNegative ? "text-red-200 hover:text-red-800 hover:font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold";
                              }
                            })()} ${hoveredColumnROI === '1_year' && hoveredRowROI === quarter ? 'bg-yellow-200' : ''
                              }`}
                              onMouseEnter={() => {
                                setHoveredColumnROI('1_year');
                                setHoveredRowROI(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnROI(null);
                                setHoveredRowROI(null);
                              }}>
                              {(() => {
                                const result = formatPercentageWithStyling(quarterData?.["1_year"]?.probablity_weighted_returns_percentage, '1_year', hoveredColumnROI, hoveredRowROI, quarter);
                                return result.display === 'N/A' ? <span className={hoveredColumnROI === '1_year' || hoveredRowROI === quarter ? "text-red-800 font-bold" : "text-red-200 hover:text-red-800 hover:font-bold"}>N/A</span> : result.display;
                              })()}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Win Rate Analysis */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold mb-4 text-[#0c0023]">Win Rate Analysis</h3>
        <p className="text-md mb-3 text-to-purple">Hover Mouse for info</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-black">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple" rowSpan={2}>Year</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple" rowSpan={2}>Quarter</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple" colSpan={8}>Holding Period (From the Date of Post/Recommendations)</th>
              </tr>
              <tr>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnWinRate('1_hour')}
                  onMouseLeave={() => setHoveredColumnWinRate(null)}>1 Hour</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnWinRate('24_hours')}
                  onMouseLeave={() => setHoveredColumnWinRate(null)}>24 Hours</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnWinRate('7_days')}
                  onMouseLeave={() => setHoveredColumnWinRate(null)}>7 Days</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnWinRate('30_days')}
                  onMouseLeave={() => setHoveredColumnWinRate(null)}>30 Days</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnWinRate('60_days')}
                  onMouseLeave={() => setHoveredColumnWinRate(null)}>60 Days</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnWinRate('90_days')}
                  onMouseLeave={() => setHoveredColumnWinRate(null)}>90 Days</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnWinRate('180_days')}
                  onMouseLeave={() => setHoveredColumnWinRate(null)}>180 Days</th>
                <th className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple cursor-pointer"
                  onMouseEnter={() => setHoveredColumnWinRate('1_year')}
                  onMouseLeave={() => setHoveredColumnWinRate(null)}>1 Year</th>
              </tr>
            </thead>
            <tbody>
              {channelData?.results?.Yearly &&
                Object.entries(channelData.results.Yearly)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([year, yearData]) => {
                    const yearQuarters = channelData?.results?.Quarterly
                      ? Object.entries(channelData.results.Quarterly)
                        .filter(([quarter]) => quarter && quarter.startsWith(year))
                        .sort(([a], [b]) => {
                          const qA = parseInt(a.split("-")[1]?.replace("Q", "") || "0");
                          const qB = parseInt(b.split("-")[1]?.replace("Q", "") || "0");
                          return qA - qB;
                        })
                      : [];

                    return (
                      <Fragment key={year}>
                        {/* Year row */}
                        <tr className="hover:bg-gray-50">
                          <td
                            className="border border-gray-300 bg-gray-50 px-3 py-1 font-medium text-to-purple"
                            rowSpan={yearQuarters.length + 1}
                          >
                            {parseInt(year) >= currentYear ? `${year}*` : year}
                          </td>
                          <td className="border border-gray-300 px-3 py-1 text-to-purple">{year}</td>
                          <td
                            className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '1_hour' || hoveredRowWinRate === year
                              ? "text-to-purple font-bold"
                              : "text-gray-300 hover:text-to-purple hover:font-bold"
                              } ${hoveredColumnWinRate === '1_hour' && hoveredRowWinRate === year
                                ? 'bg-yellow-200'
                                : ''
                              }`}
                            onMouseEnter={() => {
                              setHoveredColumnWinRate('1_hour');
                              setHoveredRowWinRate(year);
                            }}
                            onMouseLeave={() => {
                              setHoveredColumnWinRate(null);
                              setHoveredRowWinRate(null);
                            }}
                          >
                            {yearData?.["1_hour"]?.price_probablity_of_winning_percentage != null
                              ? `${yearData["1_hour"].price_probablity_of_winning_percentage.toFixed(0)}%`
                              : <span className={hoveredColumnWinRate === '1_hour' || hoveredRowWinRate === year ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                          </td>
                          <td
                            className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '24_hours' || hoveredRowWinRate === year
                              ? "text-to-purple font-bold"
                              : "text-gray-300 hover:text-to-purple hover:font-bold"
                              } ${hoveredColumnWinRate === '24_hours' && hoveredRowWinRate === year
                                ? 'bg-yellow-200'
                                : ''
                              }`}
                            onMouseEnter={() => {
                              setHoveredColumnWinRate('24_hours');
                              setHoveredRowWinRate(year);
                            }}
                            onMouseLeave={() => {
                              setHoveredColumnWinRate(null);
                              setHoveredRowWinRate(null);
                            }}
                          >
                            {yearData?.["24_hours"]?.price_probablity_of_winning_percentage != null
                              ? `${yearData["24_hours"].price_probablity_of_winning_percentage.toFixed(0)}%`
                              : <span className={hoveredColumnWinRate === '24_hours' || hoveredRowWinRate === year ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                          </td>
                          <td
                            className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '7_days' || hoveredRowWinRate === year
                              ? "text-to-purple font-bold"
                              : "text-gray-300 hover:text-to-purple hover:font-bold"
                              } ${hoveredColumnWinRate === '7_days' && hoveredRowWinRate === year
                                ? 'bg-yellow-200'
                                : ''
                              }`}
                            onMouseEnter={() => {
                              setHoveredColumnWinRate('7_days');
                              setHoveredRowWinRate(year);
                            }}
                            onMouseLeave={() => {
                              setHoveredColumnWinRate(null);
                              setHoveredRowWinRate(null);
                            }}
                          >
                            {yearData?.["7_days"]?.price_probablity_of_winning_percentage != null
                              ? `${yearData["7_days"].price_probablity_of_winning_percentage.toFixed(0)}%`
                              : <span className={hoveredColumnWinRate === '7_days' || hoveredRowWinRate === year ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                          </td>
                          <td
                            className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '30_days' || hoveredRowWinRate === year
                              ? "text-to-purple font-bold"
                              : "text-gray-300 hover:text-to-purple hover:font-bold"
                              } ${hoveredColumnWinRate === '30_days' && hoveredRowWinRate === year
                                ? 'bg-yellow-200'
                                : ''
                              }`}
                            onMouseEnter={() => {
                              setHoveredColumnWinRate('30_days');
                              setHoveredRowWinRate(year);
                            }}
                            onMouseLeave={() => {
                              setHoveredColumnWinRate(null);
                              setHoveredRowWinRate(null);
                            }}
                          >
                            {yearData?.["30_days"]?.price_probablity_of_winning_percentage != null
                              ? `${yearData["30_days"].price_probablity_of_winning_percentage.toFixed(0)}%`
                              : <span className={hoveredColumnWinRate === '30_days' || hoveredRowWinRate === year ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                          </td>
                          <td
                            className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '60_days' || hoveredRowWinRate === year
                              ? "text-to-purple font-bold"
                              : "text-gray-300 hover:text-to-purple hover:font-bold"
                              } ${hoveredColumnWinRate === '60_days' && hoveredRowWinRate === year
                                ? 'bg-yellow-200'
                                : ''
                              }`}
                            onMouseEnter={() => {
                              setHoveredColumnWinRate('60_days');
                              setHoveredRowWinRate(year);
                            }}
                            onMouseLeave={() => {
                              setHoveredColumnWinRate(null);
                              setHoveredRowWinRate(null);
                            }}
                          >
                            {yearData?.["60_days"]?.price_probablity_of_winning_percentage != null
                              ? `${yearData["60_days"].price_probablity_of_winning_percentage.toFixed(0)}%`
                              : <span className={hoveredColumnWinRate === '60_days' || hoveredRowWinRate === year ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                          </td>
                          <td
                            className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '90_days' || hoveredRowWinRate === year
                              ? "text-to-purple font-bold"
                              : "text-gray-300 hover:text-to-purple hover:font-bold"
                              } ${hoveredColumnWinRate === '90_days' && hoveredRowWinRate === year
                                ? 'bg-yellow-200'
                                : ''
                              }`}
                            onMouseEnter={() => {
                              setHoveredColumnWinRate('90_days');
                              setHoveredRowWinRate(year);
                            }}
                            onMouseLeave={() => {
                              setHoveredColumnWinRate(null);
                              setHoveredRowWinRate(null);
                            }}
                          >
                            {yearData?.["90_days"]?.price_probablity_of_winning_percentage != null
                              ? `${yearData["90_days"].price_probablity_of_winning_percentage.toFixed(0)}%`
                              : <span className={hoveredColumnWinRate === '90_days' || hoveredRowWinRate === year ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                          </td>
                          <td
                            className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '180_days' || hoveredRowWinRate === year
                              ? "text-to-purple font-bold"
                              : "text-gray-300 hover:text-to-purple hover:font-bold"
                              } ${hoveredColumnWinRate === '180_days' && hoveredRowWinRate === year
                                ? 'bg-yellow-200'
                                : ''
                              }`}
                            onMouseEnter={() => {
                              setHoveredColumnWinRate('180_days');
                              setHoveredRowWinRate(year);
                            }}
                            onMouseLeave={() => {
                              setHoveredColumnWinRate(null);
                              setHoveredRowWinRate(null);
                            }}
                          >
                            {yearData?.["180_days"]?.price_probablity_of_winning_percentage != null
                              ? `${yearData["180_days"].price_probablity_of_winning_percentage.toFixed(0)}%`
                              : <span className={hoveredColumnWinRate === '180_days' || hoveredRowWinRate === year ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                          </td>
                          <td
                            className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '1_year' || hoveredRowWinRate === year
                              ? "text-to-purple font-bold"
                              : "text-gray-300 hover:text-to-purple hover:font-bold"
                              } ${hoveredColumnWinRate === '1_year' && hoveredRowWinRate === year
                                ? 'bg-yellow-200'
                                : ''
                              }`}
                            onMouseEnter={() => {
                              setHoveredColumnWinRate('1_year');
                              setHoveredRowWinRate(year);
                            }}
                            onMouseLeave={() => {
                              setHoveredColumnWinRate(null);
                              setHoveredRowWinRate(null);
                            }}
                          >
                            {yearData?.["1_year"]?.price_probablity_of_winning_percentage != null
                              ? `${yearData["1_year"].price_probablity_of_winning_percentage.toFixed(0)}%`
                              : <span className={hoveredColumnWinRate === '1_year' || hoveredRowWinRate === year ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                          </td>
                        </tr>
                        {/* Quarter rows */}
                        {yearQuarters.map(([quarter, quarterData]) => (
                          <tr key={quarter} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-1 text-xs text-to-purple">
                              {quarterLabels[quarter.slice(-2).toLowerCase()] ?? quarter}
                            </td>
                            <td
                              className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '1_hour' || hoveredRowWinRate === quarter
                                ? "text-to-purple font-bold"
                                : "text-gray-300 hover:text-to-purple hover:font-bold"
                                } ${hoveredColumnWinRate === '1_hour' && hoveredRowWinRate === quarter
                                  ? 'bg-yellow-200'
                                  : ''
                                }`}
                              onMouseEnter={() => {
                                setHoveredColumnWinRate('1_hour');
                                setHoveredRowWinRate(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnWinRate(null);
                                setHoveredRowWinRate(null);
                              }}
                            >
                              {quarterData?.["1_hour"]?.price_probablity_of_winning_percentage != null
                                ? `${quarterData["1_hour"].price_probablity_of_winning_percentage.toFixed(0)}%`
                                : <span className={hoveredColumnWinRate === '1_hour' || hoveredRowWinRate === quarter ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                            </td>
                            <td
                              className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '24_hours' || hoveredRowWinRate === quarter
                                ? "text-to-purple font-bold"
                                : "text-gray-300 hover:text-to-purple hover:font-bold"
                                } ${hoveredColumnWinRate === '24_hours' && hoveredRowWinRate === quarter
                                  ? 'bg-yellow-200'
                                  : ''
                                }`}
                              onMouseEnter={() => {
                                setHoveredColumnWinRate('24_hours');
                                setHoveredRowWinRate(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnWinRate(null);
                                setHoveredRowWinRate(null);
                              }}
                            >
                              {quarterData?.["24_hours"]?.price_probablity_of_winning_percentage != null
                                ? `${quarterData["24_hours"].price_probablity_of_winning_percentage.toFixed(0)}%`
                                : <span className={hoveredColumnWinRate === '24_hours' || hoveredRowWinRate === quarter ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                            </td>
                            <td
                              className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '7_days' || hoveredRowWinRate === quarter
                                ? "text-to-purple font-bold"
                                : "text-gray-300 hover:text-to-purple hover:font-bold"
                                } ${hoveredColumnWinRate === '7_days' && hoveredRowWinRate === quarter
                                  ? 'bg-yellow-200'
                                  : ''
                                }`}
                              onMouseEnter={() => {
                                setHoveredColumnWinRate('7_days');
                                setHoveredRowWinRate(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnWinRate(null);
                                setHoveredRowWinRate(null);
                              }}
                            >
                              {quarterData?.["7_days"]?.price_probablity_of_winning_percentage != null
                                ? `${quarterData["7_days"].price_probablity_of_winning_percentage.toFixed(0)}%`
                                : <span className={hoveredColumnWinRate === '7_days' || hoveredRowWinRate === quarter ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                            </td>
                            <td
                              className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '30_days' || hoveredRowWinRate === quarter
                                ? "text-to-purple font-bold"
                                : "text-gray-300 hover:text-to-purple hover:font-bold"
                                } ${hoveredColumnWinRate === '30_days' && hoveredRowWinRate === quarter
                                  ? 'bg-yellow-200'
                                  : ''
                                }`}
                              onMouseEnter={() => {
                                setHoveredColumnWinRate('30_days');
                                setHoveredRowWinRate(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnWinRate(null);
                                setHoveredRowWinRate(null);
                              }}
                            >
                              {quarterData?.["30_days"]?.price_probablity_of_winning_percentage != null
                                ? `${quarterData["30_days"].price_probablity_of_winning_percentage.toFixed(0)}%`
                                : <span className={hoveredColumnWinRate === '30_days' || hoveredRowWinRate === quarter ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                            </td>
                            <td
                              className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '60_days' || hoveredRowWinRate === quarter
                                ? "text-to-purple font-bold"
                                : "text-gray-300 hover:text-to-purple hover:font-bold"
                                } ${hoveredColumnWinRate === '60_days' && hoveredRowWinRate === quarter
                                  ? 'bg-yellow-200'
                                  : ''
                                }`}
                              onMouseEnter={() => {
                                setHoveredColumnWinRate('60_days');
                                setHoveredRowWinRate(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnWinRate(null);
                                setHoveredRowWinRate(null);
                              }}
                            >
                              {quarterData?.["60_days"]?.price_probablity_of_winning_percentage != null
                                ? `${quarterData["60_days"].price_probablity_of_winning_percentage.toFixed(0)}%`
                                : <span className={hoveredColumnWinRate === '60_days' || hoveredRowWinRate === quarter ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                            </td>
                            <td
                              className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '90_days' || hoveredRowWinRate === quarter
                                ? "text-to-purple font-bold"
                                : "text-gray-300 hover:text-to-purple hover:font-bold"
                                } ${hoveredColumnWinRate === '90_days' && hoveredRowWinRate === quarter
                                  ? 'bg-yellow-200'
                                  : ''
                                }`}
                              onMouseEnter={() => {
                                setHoveredColumnWinRate('90_days');
                                setHoveredRowWinRate(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnWinRate(null);
                                setHoveredRowWinRate(null);
                              }}
                            >
                              {quarterData?.["90_days"]?.price_probablity_of_winning_percentage != null
                                ? `${quarterData["90_days"].price_probablity_of_winning_percentage.toFixed(0)}%`
                                : <span className={hoveredColumnWinRate === '90_days' || hoveredRowWinRate === quarter ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                            </td>
                            <td
                              className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '180_days' || hoveredRowWinRate === quarter
                                ? "text-to-purple font-bold"
                                : "text-gray-300 hover:text-to-purple hover:font-bold"
                                } ${hoveredColumnWinRate === '180_days' && hoveredRowWinRate === quarter
                                  ? 'bg-yellow-200'
                                  : ''
                                }`}
                              onMouseEnter={() => {
                                setHoveredColumnWinRate('180_days');
                                setHoveredRowWinRate(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnWinRate(null);
                                setHoveredRowWinRate(null);
                              }}
                            >
                              {quarterData?.["180_days"]?.price_probablity_of_winning_percentage != null
                                ? `${quarterData["180_days"].price_probablity_of_winning_percentage.toFixed(0)}%`
                                : <span className={hoveredColumnWinRate === '180_days' || hoveredRowWinRate === quarter ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                            </td>
                            <td
                              className={`border border-gray-300 px-2 py-1 text-center cursor-pointer ${hoveredColumnWinRate === '1_year' || hoveredRowWinRate === quarter
                                ? "text-to-purple font-bold"
                                : "text-gray-300 hover:text-to-purple hover:font-bold"
                                } ${hoveredColumnWinRate === '1_year' && hoveredRowWinRate === quarter
                                  ? 'bg-yellow-200'
                                  : ''
                                }`}
                              onMouseEnter={() => {
                                setHoveredColumnWinRate('1_year');
                                setHoveredRowWinRate(quarter);
                              }}
                              onMouseLeave={() => {
                                setHoveredColumnWinRate(null);
                                setHoveredRowWinRate(null);
                              }}
                            >
                              {quarterData?.["1_year"]?.price_probablity_of_winning_percentage != null
                                ? `${quarterData["1_year"].price_probablity_of_winning_percentage.toFixed(0)}%`
                                : <span className={hoveredColumnWinRate === '1_year' || hoveredRowWinRate === quarter ? "text-to-purple font-bold" : "text-gray-300 hover:text-to-purple hover:font-bold"}>N/A</span>}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-8">
        <PerformanceTab channelData={channelData} />
      </div>
    </div>
  );
}

// Performance Tab Component
function PerformanceTab({ channelData }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("30");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState("");
  const [expandedRecommendations, setExpandedRecommendations] = useState(false);
  const [expandedWinLoss, setExpandedWinLoss] = useState(false);
  const [expandedAverageReturn, setExpandedAverageReturn] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState({});

  // Get available years from Telegram data
  const yearlyData = channelData?.results?.Yearly || {};
  const quarterlyData = channelData?.results?.Quarterly || {};

  const availableYears = Object.keys(yearlyData)
    .sort()
    .reverse();

  const currentYear = new Date().getFullYear();

  // Generate period options for filtering
  const getPeriodOptions = () => {
    const options = [{ value: "", label: "All Periods" }];

    const quarterLabels = {
      Q1: "Jan - Mar (Q1)",
      Q2: "Apr - Jun (Q2)",
      Q3: "Jul - Sep (Q3)",
      Q4: "Oct - Dec (Q4)",
    };

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

  // Add dynamic columns for last 7 days and last 15 days
  const getDynamicColumns = () => {
    const columns = [];

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
      const quarterlyKey = `${yearKey}-${selectedPeriod}`;
      const quarterlyYearData = quarterlyData[quarterlyKey];
      if (quarterlyYearData) {
        baseData = quarterlyYearData[timeframeKey];
      }
    } else {
      // Otherwise use yearly data
      baseData = yearlyData[yearKey]?.[timeframeKey];
    }

    if (!baseData) {
      return null;
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
                      {metrics ? metrics.totalRecommendations.toLocaleString() : "-"}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Expanded Moonshots Row */}
            {expandedRecommendations && (
              <tr className="border-b border-gray-100 light-dropdown">
                <td className="py-3 px-4 text-to-purple font-semibold text-sm pl-8">
                  Hyperactivity
                </td>
                {dynamicColumns.map((column) => {
                  const metrics = calculateYearMetrics(column.key);
                  // For Telegram data, calculate moonshots as ~70% of total (estimate)
                  const moonshotCount = metrics ? Math.floor(metrics.totalRecommendations * 0.7) : 0;
                  return (
                    <td key={column.key} className="py-3 px-4 text-center">
                      <div className="font-semibold text-sm text-to-purple">
                        {metrics ? moonshotCount.toLocaleString() : "-"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Expanded Without Moonshots Row */}
            {expandedRecommendations && (
              <tr className="border-b border-gray-100 light-dropdown">
                <td className="py-3 px-4 text-to-purple font-semibold text-sm pl-8">
                  Non Hyperactivity
                </td>
                {dynamicColumns.map((column) => {
                  const metrics = calculateYearMetrics(column.key);
                  // For Telegram data, calculate without moonshots as ~30% of total (estimate)
                  const withoutMoonshotCount = metrics ? Math.floor(metrics.totalRecommendations * 0.3) : 0;
                  return (
                    <td key={column.key} className="py-3 px-4 text-center">
                      <div className="font-semibold text-sm text-to-purple">
                        {metrics ? withoutMoonshotCount.toLocaleString() : "-"}
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

            {/* Expanded Moonshots Win/Loss Row */}
            {expandedWinLoss && (
              <tr className="border-b border-gray-100 light-dropdown">
                <td className="py-3 px-4 text-to-purple font-semibold text-sm pl-8">
                  Hyperactivity
                </td>
                {dynamicColumns.map((column) => {
                  const metrics = calculateYearMetrics(column.key);
                  // For Telegram data, use slightly adjusted win percentage for moonshots
                  const adjustedWin = metrics ? Math.max(0, metrics.winPercentage - 5) : 0;

                  return (
                    <td key={column.key} className="light-hyper-activity-cell text-center">
                      {metrics ? (
                        <div className="flex flex-col items-center gap-2">
                          <GaugeComponent
                            id={`gauge-${column.key}-moonshot-winloss`}
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
                      ) : (
                        <div className="light-empty-metric">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Expanded Without Moonshots Win/Loss Row */}
            {expandedWinLoss && (
              <tr className="border-b border-gray-100 light-dropdown">
                <td className="py-3 px-4 text-to-purple font-semibold text-sm pl-8">
                  Non Hyperactivity
                </td>
                {dynamicColumns.map((column) => {
                  const metrics = calculateYearMetrics(column.key);
                  // For Telegram data, use slightly adjusted win percentage for without moonshots
                  const adjustedWin = metrics ? Math.min(100, metrics.winPercentage + 10) : 0;

                  return (
                    <td key={column.key} className="light-without-hyper-cell text-center">
                      {metrics ? (
                        <div className="flex flex-col items-center gap-2">
                          <GaugeComponent
                            id={`gauge-${column.key}-without-moonshot-winloss`}
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
                      ) : (
                        <div className="light-empty-metric">-</div>
                      )}
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

            {/* Expanded Moonshots Average Return Row */}
            {expandedAverageReturn && (
              <tr className="border-b border-gray-100 light-dropdown">
                <td className="py-3 px-4 text-to-purple font-semibold text-sm pl-8">
                  Hyperactivity
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

                  // For Telegram data, moonshots typically have higher volatility/returns
                  const returnValue = (metrics.averageReturn || 0) * 1.5;
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
            )}

            {/* Expanded Without Moonshots Average Return Row */}
            {expandedAverageReturn && (
              <tr className="border-b border-gray-100 light-dropdown">
                <td className="py-3 px-4 text-to-purple font-semibold text-sm pl-8">
                  Non Hyperactivity
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

                  // For Telegram data, without moonshots typically have more conservative returns
                  const returnValue = (metrics.averageReturn || 0) * 0.6;
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
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Recommendations Tab Component
function RecommendationsTab({ channelData, formatDate }) {
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-03-31');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const symbolsToTrack = [...new Set((recommendationsData?.results || []).map(rec => rec.symbol).filter(Boolean))];
  const { formatPrice: formatLivePrice, getPriceData, isSymbolLive, getPriceSource, getPriceTimestamp } = useLivePrice(symbolsToTrack);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch recommendations data
  const fetchRecommendations = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const url = new URL(window.location.origin + '/api/admin/strategytelegramdata/page/' + currentPage);

      // Only add parameters if they have values
      if (startDate && startDate.trim() !== '') {
        url.searchParams.append('startDate', startDate);
      }
      if (endDate && endDate.trim() !== '') {
        url.searchParams.append('endDate', endDate);
      }
      if (selectedSentiment && selectedSentiment.trim() !== '') {
        url.searchParams.append('sentiment', selectedSentiment);
      }
      if (selectedSymbol && selectedSymbol.trim() !== '') {
        url.searchParams.append('symbol', selectedSymbol);
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setRecommendationsData(data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load - only load on mount and when page changes
  useEffect(() => {
    fetchRecommendations();
  }, [currentPage]);

  // Only auto-reload when start or end date changes
  useEffect(() => {
    if (startDate || endDate) {
      fetchRecommendations(false); // Don't show loading for date changes
    }
  }, [startDate, endDate]);

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

  const getActionColor = (action) => {
    switch (action) {
      case 'Buy': return 'text-green-400 bg-green-400/10';
      case 'Sell': return 'text-red-400 bg-red-400/10';
      case 'Hold': return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-blue-400 bg-blue-400/10';
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return typeof price === 'number' ? `$${price.toFixed(4)}` : price;
  };

  const formatReturns = (returns) => {
    if (returns === null || returns === undefined) return 'N/A';
    const formatted = returns.toFixed(2);
    return `${returns > 0 ? '+' : ''}${formatted}%`;
  };

  // Number formatting function
  const formatNumberWithCommas = (number) => {
    if (number === undefined || number === null) return "-";
    if (typeof number === "object" && number.$numberDecimal) {
      number = parseFloat(number.$numberDecimal);
    }
    if (isNaN(Number(number))) return "-";
    return Number(number).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Scroll to filters function
  const scrollToFilters = () => {
    // First, show advanced filters to ensure all filters are visible
    setShowAdvancedFilters(true);

    // Wait a brief moment for the advanced filters to render
    setTimeout(() => {
      // Try to find the top of the recommendations component first
      const topSection = document.getElementById("telegram-recommendations-top");

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
        const filtersSection = document.getElementById("telegram-filters-section");
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

  const handleApplyFilters = () => {
    setCurrentPage(0); // Reset to first page when applying filters
    fetchRecommendations(false); // Don't show loading for advanced filters
  };

  const handleClearFilters = () => {
    setSelectedSymbol('');
    setSelectedSentiment('');
    setStartDate('2024-01-01');
    setEndDate('2024-03-31');
    setCurrentPage(0);
    // Fetch with default values - no loading popup
    fetchRecommendations(false);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div id="telegram-recommendations-top" className="bg-white rounded-xl border border-gray-200 overflow-x-auto text-to-purple">
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
            {(recommendationsData?.totalItems || 0).toLocaleString()}
          </span>
          )
        </h3>

        <div id="telegram-filters-section" className="flex flex-col gap-3 items-end">
          {/* Main Filters Row */}
          <div className="w-full md:w-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex gap-3 items-center min-w-max px-2 py-1">
              <div className="relative">
                <select
                  className="bg-[#c4c5e14d] border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-to-purple appearance-none"
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                >
                  <option value="">All Coins</option>
                  {recommendationsData?.analytics?.unique_symbols?.symbols?.map((symbol) => (
                    <option key={symbol} value={symbol}>
                      {symbol}
                    </option>
                  ))}
                </select>
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-to-purple pointer-events-none">
                  ▾
                </span>
              </div>
              <div className="relative">
                <select
                  className="bg-[#c4c5e14d] border border-gray-300 rounded px-3 py-2 pr-8 text-sm text-to-purple appearance-none"
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                >
                  <option value="">All Sentiments</option>
                  <option value="Strong_Bullish">Strong Bullish</option>
                  <option value="Mild_Bullish">Mild Bullish</option>
                  <option value="Strong_Bearish">Strong Bearish</option>
                  <option value="Mild_Bearish">Mild Bearish</option>
                </select>
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-to-purple pointer-events-none">
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
                  className={`transition-transform duration-200 ${showAdvancedFilters ? "rotate-180" : ""}`}
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
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-[#c4c5e14d] border border-gray-300 rounded px-3 py-2 text-sm text-to-purple"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-to-purple whitespace-nowrap">End Date:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[#c4c5e14d] border border-gray-300 rounded px-3 py-2 text-sm text-to-purple"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Dashboard */}
      {recommendationsData?.analytics && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary Table */}
            <div className="bg-[#f5f5f5] rounded-lg border border-gray-200 shadow-lg">
              <h4 className="text-lg font-semibold text-to-purple mb-4 p-4 pb-0">
                Performance Summary (Avg ROI)
              </h4>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-4 pt-0">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[#e8e8e8] text-to-purple">
                      <th className="p-2 text-left font-semibold">Metric</th>
                      <th className="p-2 text-center font-semibold">1H</th>
                      <th className="p-2 text-center font-semibold">24H</th>
                      <th className="p-2 text-center font-semibold">7D</th>
                      <th className="p-2 text-center font-semibold">30D</th>
                      <th className="p-2 text-center font-semibold">60D</th>
                      <th className="p-2 text-center font-semibold">90D</th>
                      <th className="p-2 text-center font-semibold">1Y</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-100">
                      <td className="p-3 font-medium text-to-purple">Average Performance</td>
                      {Object.entries(recommendationsData.analytics.average_roi).map(([timeframe, roi]) => (
                        <td key={timeframe} className={`p-2 text-center font-semibold ${roi > 0 ? "text-green-600" : roi < 0 ? "text-red-600" : "text-gray-600"}`}>
                          {roi !== null ? `${roi > 0 ? "+" : ""}${roi.toFixed(2)}%` : "N/A"}
                        </td>
                      ))}
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
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-[#e8e8e8] text-to-purple">
                      <th className="p-2 text-left font-semibold">Metric</th>
                      <th className="p-2 text-center font-semibold">Strong Bullish</th>
                      <th className="p-2 text-center font-semibold">Mild Bullish</th>
                      <th className="p-2 text-center font-semibold">Mild Bearish</th>
                      <th className="p-2 text-center font-semibold">Strong Bearish</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-100">
                      <td className="p-3 font-medium text-to-purple">Sentiment Distribution</td>
                      <td className="p-3 text-center text-green-600 font-semibold">
                        {(recommendationsData.analytics.sentiment_analysis.sentiment_breakdown["Strong_Bullish"] || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center text-green-500 font-semibold">
                        {(recommendationsData.analytics.sentiment_analysis.sentiment_breakdown["Mild_Bullish"] || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center text-red-500 font-semibold">
                        {(recommendationsData.analytics.sentiment_analysis.sentiment_breakdown["Mild_Bearish"] || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center text-red-600 font-semibold">
                        {(recommendationsData.analytics.sentiment_analysis.sentiment_breakdown["Strong_Bearish"] || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {recommendationsData?.results && recommendationsData.results.length > 0 ? (
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
                  {/* <th className="p-2 text-center font-semibold" style={{ minWidth: '150px' }}>
                    <span className="text-xs">Message</span>
                  </th>
                  <th className="p-2 text-left font-semibold" style={{ minWidth: '60px' }}>
                    <span className="text-xs">Link</span>
                  </th> */}
                </tr>
              </thead>
              <tbody>
                {recommendationsData.results.map((rec) => {
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
                          {new Date(rec.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            timeZone: "UTC",
                          })}
                          <br />
                          {new Date(rec.date).toLocaleTimeString(undefined, {
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
                      {/* <td className="p-2 text-center">
                        <span className="font-semibold text-xs text-to-purple">
                          {formatPrice(rec.price)}
                        </span>
                      </td> */}
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
                      <td className="p-2 text-center">
                        <span
                          className={`inline-block text-xs font-semibold text-center ${getSentimentColor(
                            rec.sentiment
                          )}`}
                        >
                          {rec.sentiment?.replace("_", " ") || "N/A"}
                        </span>
                      </td>
                      <td className="p-2 text-to-purple text-xs">{formatPrice(rec.price)}</td>
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
                      {/* <td className="p-2">
                        <div className="text-xs truncate" style={{ maxWidth: '140px' }} title={rec.tradingCall}>
                          {rec.tradingCall}
                        </div>
                      </td>
                      <td className="p-2">
                        <a
                          href={rec.messageURL}
                          className="text-blue-400 hover:underline text-xs"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                      </td> */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {recommendationsData?.totalPages > 1 && (
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <div className="text-sm text-to-purple">
                Showing page {currentPage + 1} of {recommendationsData.totalPages} (
                {formatNumberWithCommas(recommendationsData.totalItems)} total items)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newPage = currentPage - 1;
                    setCurrentPage(newPage);
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
                  }}
                  disabled={currentPage >= recommendationsData.totalPages - 1}
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