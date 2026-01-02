"use client";
import { useEffect, useState } from "react";

export default function MCMSignalTestPage() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/strategyyoutubedata/ytandtg');
        const data = await response.json();

        // Handle response format
        const timeFrameData = data.resultsByTimeframe?.["6hrs"];
        if (timeFrameData) {
          const allCoins = timeFrameData.all_coins || [];
          const memCoins = timeFrameData.mem_coins || [];
          const combined = [...allCoins, ...memCoins];

          // Sort by total_mentions descending and take top 10
          combined.sort((a, b) => (b.total_mentions || 0) - (a.total_mentions || 0));
          setCoins(combined.slice(0, 10));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const truncateSummary = (summary) => {
    if (!summary) return "N/A";
    const words = summary.split(" ");
    if (words.length <= 3) return summary;
    return words.slice(0, 3).join(" ") + "...";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-fuchsia-50 text-gray-900 font-sans overflow-x-hidden relative p-8 pt-12">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-fuchsia-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-[90rem] mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold flex items-center gap-3 drop-shadow-sm mb-2 mt-4 leading-normal">
          <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent inline-block pb-1">
            MCM Signal Test
          </span>
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full flex-shrink-0 mt-2 mb-6 shadow-lg shadow-indigo-500/50"></div>

        {/* Signal Table */}
        <div className="overflow-x-auto rounded-xl shadow-2xl bg-white/50 backdrop-blur-sm">
          <table className="w-full border-collapse">
            <thead>
              {/* Header Level 1 */}
              <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <th rowSpan="2" className="px-4 py-3 font-extrabold border border-indigo-400/30 text-center w-28 uppercase tracking-wider text-xs shadow-sm">Coin</th>
                <th rowSpan="2" className="px-4 py-3 font-extrabold border border-indigo-400/30 text-center w-48 uppercase tracking-wider text-xs shadow-sm">AI Summary</th>
                <th rowSpan="2" className="px-4 py-3 font-extrabold border border-indigo-400/30 text-center w-28 uppercase tracking-wider text-xs shadow-sm">Fund Score</th>
                <th colSpan="7" className="px-4 py-3 font-bold text-center border-x border-b border-indigo-400/30 shadow-sm tracking-wide text-lg">
                  MCM Signal(Dummy Data)
                </th>
              </tr>
              {/* Header Level 2 */}
              <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs uppercase tracking-wide">
                <th className="px-4 py-2 font-semibold border border-indigo-400/30 text-center">Outlook</th>
                <th className="px-4 py-2 font-semibold border border-indigo-400/30 text-center">MCM Signal</th>
                <th className="px-4 py-2 font-semibold border border-indigo-400/30 text-center">Confidence</th>
                <th className="px-4 py-2 font-semibold border border-indigo-400/30 text-center">Bias</th>
                <th className="px-4 py-2 font-semibold border border-indigo-400/30 text-center">Entry Zone</th>
                <th className="px-4 py-2 font-semibold border border-indigo-400/30 text-center">Target Zone</th>
                <th className="px-4 py-2 font-semibold border border-indigo-400/30 text-center">Stop-Loss</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-indigo-100">
              {loading ? (
                <tr><td colSpan="10" className="text-center py-10 text-lg text-gray-600">Loading...</td></tr>
              ) : (
                coins.map((coin, index) => {
                  const summaryText = coin.ai_summary?.summary || "No summary available";
                  return (
                    // Use a fragment to group the 3 rows for one coin
                    <>
                      {/* Row 1: Short Term (+ Common Data) */}
                      <tr className="border-t-2 border-indigo-100 hover:bg-white/50 transition-colors group">
                        {/* Common Columns (RowSpan = 3) */}
                        <td rowSpan="3" className="px-4 py-4 text-gray-900 font-bold border-r-2 border-indigo-100 text-center align-middle bg-gradient-to-br from-white/80 to-indigo-50/50 backdrop-blur-sm shadow-[inset_-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                          <div className="flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                            <div className="relative p-1 bg-white rounded-full shadow-md mb-2">
                              <img
                                src={coin.image_small || coin.image_thumb || coin.image_large}
                                alt={coin.symbol}
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${coin.symbol}&background=ED8936&color=fff&size=40`;
                                }}
                              />
                            </div>
                            <span className="text-sm font-black text-indigo-900 tracking-tight">{coin.symbol}</span>
                          </div>
                        </td>
                        <td rowSpan="3" className="px-4 py-4 text-gray-900 border-r-2 border-indigo-100 relative cursor-pointer text-center align-middle bg-gradient-to-br from-white/80 to-indigo-50/50 backdrop-blur-sm shadow-[inset_-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                          <div className="group/summary">
                            <span className="border-b-2 border-dotted border-indigo-300 font-medium text-gray-700 hover:text-indigo-700 hover:border-indigo-600 transition-colors">{truncateSummary(summaryText)}</span>
                            <div className={`absolute z-50 invisible group-hover/summary:visible bg-gray-900 text-white text-xs rounded-xl p-4 left-0 w-72 shadow-2xl text-left leading-relaxed ${index === 0 ? 'top-full mt-2' : 'bottom-full mb-2'}`}>
                              {summaryText}
                              <div className={`absolute left-8 transform -translate-x-1/2 border-8 border-transparent ${index === 0 ? 'bottom-full border-b-gray-900' : 'top-full border-t-gray-900'}`}></div>
                            </div>
                          </div>
                        </td>
                        <td rowSpan="3" className="px-4 py-4 text-gray-900 border-r-2 border-indigo-100 text-center font-medium align-middle bg-gradient-to-br from-white/80 to-indigo-50/50 backdrop-blur-sm shadow-[inset_-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                          <div className="flex flex-col items-center bg-white rounded-lg py-2 px-3 shadow-sm border border-indigo-50">
                            <span className="text-xl font-black bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">{coin.fundamental_score ? coin.fundamental_score : "N/A"}</span>
                            {coin.fundamental_score && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score / 10</span>}
                          </div>
                        </td>

                        {/* Short Term Data */}
                        <td className="px-4 py-3 text-gray-900 border border-blue-200/30 text-center font-semibold bg-blue-50/30">Short Term</td>
                        <td className="px-4 py-3 text-emerald-700 border border-blue-200/30 text-center font-bold bg-blue-50/30">Buy</td>
                        <td className="px-4 py-3 text-gray-700 border border-blue-200/30 text-center bg-blue-50/30">Low</td>
                        <td className="px-4 py-3 text-gray-700 border border-blue-200/30 text-center bg-blue-50/30">Speculative Bullish</td>
                        <td className="px-4 py-3 text-gray-600 border border-blue-200/30 text-center font-mono text-xs bg-blue-50/30">0.150 – 0.158</td>
                        <td className="px-4 py-3 text-gray-600 border border-blue-200/30 text-center font-mono text-xs bg-blue-50/30">0.175 – 0.200</td>
                        <td className="px-4 py-3 text-red-600 border border-blue-200/30 text-center font-mono text-xs bg-blue-50/30">0.145</td>
                      </tr>

                      {/* Row 2: Mid Term */}
                      <tr className="bg-white/40 hover:bg-white/60 transition-colors text-sm">
                        <td className="px-4 py-3 text-gray-900 border border-blue-200/30 text-center font-semibold">Mid Term</td>
                        <td className="px-4 py-3 text-amber-600 border border-blue-200/30 text-center font-bold">Hold</td>
                        <td className="px-4 py-3 text-gray-700 border border-blue-200/30 text-center">Medium</td>
                        <td className="px-4 py-3 text-gray-700 border border-blue-200/30 text-center">Neutral → Bearish</td>
                        <td className="px-4 py-3 text-gray-600 border border-blue-200/30 text-center font-mono text-xs">0.120 – 0.135</td>
                        <td className="px-4 py-3 text-gray-600 border border-blue-200/30 text-center font-mono text-xs">0.180 – 0.220</td>
                        <td className="px-4 py-3 text-red-600 border border-blue-200/30 text-center font-mono text-xs">0.105</td>
                      </tr>

                      {/* Row 3: Long Term */}
                      <tr className="bg-white/40 hover:bg-white/60 transition-colors text-sm">
                        <td className="px-4 py-3 text-gray-900 border border-blue-200/30 text-center font-semibold">Long Term</td>
                        <td className="px-4 py-3 text-amber-600 border border-blue-200/30 text-center font-bold">Hold</td>
                        <td className="px-4 py-3 text-gray-700 border border-blue-200/30 text-center">Medium</td>
                        <td className="px-4 py-3 text-gray-700 border border-blue-200/30 text-center">High Risk Accumulation</td>
                        <td className="px-4 py-3 text-gray-600 border-b border-blue-200/30 text-center font-mono text-xs">0.090 – 0.120</td>
                        <td className="px-4 py-3 text-gray-600 border-b border-blue-200/30 text-center font-mono text-xs">0.300+ (Conditional)</td>
                        <td className="px-4 py-3 text-red-600 border-b border-blue-200/30 text-center font-mono text-xs">&lt; 0.080</td>
                      </tr>
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
