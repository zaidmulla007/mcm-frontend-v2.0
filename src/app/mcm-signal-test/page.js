"use client";
import { useEffect, useState } from "react";

export default function MCMSignalTestPage() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState("6hrs");
  const [allData, setAllData] = useState(null);
  const [selectedSummary, setSelectedSummary] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/strategyyoutubedata/ytandtg');
        const data = await response.json();
        setAllData(data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!allData) return;

    const timeFrameData = allData.resultsByTimeframe?.[selectedTimeframe];
    if (timeFrameData) {
      const allCoins = timeFrameData.all_coins || [];
      const memCoins = timeFrameData.mem_coins || [];
      const combined = [...allCoins, ...memCoins];

      // Sort by total_mentions descending and take top 10
      combined.sort((a, b) => (b.total_mentions || 0) - (a.total_mentions || 0));
      setCoins(combined.slice(0, 10));
    } else {
      setCoins([]);
    }
  }, [allData, selectedTimeframe]);

  const truncateSummary = (summary) => {
    if (!summary) return "N/A";
    const words = summary.split(" ");
    if (words.length <= 6) return summary;
    return words.slice(0, 6).join(" ") + "...";
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 mt-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold flex items-center gap-3 drop-shadow-sm leading-normal">
              <span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent inline-block pb-1">
                MCM Signal Test
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full mt-2 shadow-lg shadow-indigo-500/50"></div>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0 bg-white/40 p-1.5 rounded-2xl backdrop-blur-md border border-white/50 shadow-sm">
            {["6hrs", "24hrs", "7days"].map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 transform ${selectedTimeframe === tf
                  ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                  : 'text-gray-600 hover:bg-white/60 hover:text-indigo-600'
                  }`}
              >
                {tf.replace("hrs", " Hours").replace("days", " Days")}
              </button>
            ))}
          </div>
        </div>

        {/* Signal Table */}
        <div className="overflow-x-auto rounded-xl shadow-2xl bg-white/50 backdrop-blur-sm">
          <table className="w-full border-collapse">
            <thead>
              {/* Header Level 1 */}
              <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <th rowSpan="2" className="px-4 py-3 font-extrabold border border-indigo-400/30 text-center w-28 uppercase tracking-wider text-xs shadow-sm">Coin</th>
                <th rowSpan="2" className="px-4 py-3 font-extrabold border border-indigo-400/30 text-center w-64 uppercase tracking-wider text-xs shadow-sm">AI Summary</th>
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
                <tr>
                  <td colSpan="10" className="px-6 py-20 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 border-t-4 border-t-cyan-500"></div>
                    </div>
                  </td>
                </tr>
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
                        <td rowSpan="3" className="px-4 py-4 text-gray-900 border-r-2 border-indigo-100 relative text-center align-middle bg-gradient-to-br from-white/80 to-indigo-50/50 backdrop-blur-sm shadow-[inset_-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                          <div className="flex flex-col gap-2 items-center">
                            <span className="text-sm text-gray-700 leading-snug">{truncateSummary(summaryText)}</span>
                            <button
                              onClick={() => setSelectedSummary({ title: ` ${coin.symbol}`, content: summaryText })}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors mt-1"
                            >
                              Read Full Analysis
                            </button>
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

      {/* Full Study Modal */}
      {selectedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSummary(null)}>
          <div
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-cyan-50 to-indigo-50">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                {selectedSummary.title}
              </h3>
              <button
                onClick={() => setSelectedSummary(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                {selectedSummary.content}
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedSummary(null)}
                className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transform hover:scale-[1.02] transition-all"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
