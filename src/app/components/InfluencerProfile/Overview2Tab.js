export const Overview2Tab = ({ channelData, bullishPercentage, bearishPercentage, summaryType, setSummaryType, selectedPeriod, setSelectedPeriod }) => {
  return (
    <div className="flex flex-col gap-8">
      {/* Bio & Sentiment - Dark Glassmorphism Style */}
      <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
        <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          About {channelData.influencer_name || channelData.channel_title}
        </h3>
        <p className="text-gray-300 mb-6 leading-relaxed">
          {channelData.channel_description ||
            channelData.branding_channel_description ||
            "No description available."}
        </p>
        <div className="flex gap-12 mt-4">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2 text-emerald-400 drop-shadow-lg">
              {bullishPercentage}%
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Bullish Calls</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2 text-rose-400 drop-shadow-lg">
              {bearishPercentage}%
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Bearish Calls</div>
          </div>
        </div>
      </div>

      {/* Summary Dropdown Section - Glassmorphism */}
      <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
        <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Channel Summary Analysis
        </h3>
        
        {/* Type Selection Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              setSummaryType("quarterly");
              setSelectedPeriod("");
            }}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              summaryType === "quarterly"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105"
                : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700"
            }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => {
              setSummaryType("yearly");
              setSelectedPeriod("");
            }}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              summaryType === "yearly"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105"
                : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700"
            }`}
          >
            Yearly
          </button>
          <button
            onClick={() => {
              setSummaryType("overall");
              setSelectedPeriod("overall");
            }}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              summaryType === "overall"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105"
                : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700"
            }`}
          >
            Overall
          </button>
        </div>

        {/* Period Selection Dropdown */}
        {summaryType !== "overall" && (
          <div className="mb-6">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full md:w-auto px-6 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
            >
              <option value="">Select a {summaryType === "quarterly" ? "quarter" : "year"}...</option>
              {summaryType === "quarterly" 
                ? channelData?.Gemini?.Quarterly && Object.keys(channelData.Gemini.Quarterly)
                    .sort((a, b) => {
                      const [yearA, qA] = a.split('_');
                      const [yearB, qB] = b.split('_');
                      if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
                      return qB.localeCompare(qA);
                    })
                    .map(quarter => (
                      <option key={quarter} value={quarter}>
                        {quarter.replace('_', ' ')}
                      </option>
                    ))
                : channelData?.Gemini?.Yearly && Object.keys(channelData.Gemini.Yearly)
                    .sort((a, b) => parseInt(b) - parseInt(a))
                    .map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))
              }
            </select>
          </div>
        )}

        {/* Summary Display */}
        {selectedPeriod && (
          <div className="mt-8 p-6 bg-gray-800/30 rounded-xl border border-gray-700/50 backdrop-blur-sm">
            {(() => {
              const data = summaryType === "quarterly" 
                ? channelData?.Gemini?.Quarterly?.[selectedPeriod]
                : summaryType === "yearly"
                ? channelData?.Gemini?.Yearly?.[selectedPeriod]
                : channelData?.Gemini?.Overall;
              
              if (!data) return <p className="text-gray-400">No data available for this period.</p>;
              
              return (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/30 flex-1 min-w-[200px]">
                      <div className="text-sm text-gray-400 mb-1">Period</div>
                      <div className="font-bold text-white">
                        {summaryType === "quarterly" 
                          ? data.quarter?.replace('_', ' ') 
                          : summaryType === "yearly" 
                          ? data.year 
                          : "Overall"}
                      </div>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/30 flex-1 min-w-[200px]">
                      <div className="text-sm text-gray-400 mb-1">Credibility Score</div>
                      <div className="font-bold text-white">
                        {data.overall_credibility_score}/10
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-white mb-3">Summary</h4>
                    <p className="text-gray-300 leading-relaxed">{data.summary}</p>
                  </div>
                  
                  {data.posting_frequency_analysis && (
                    <div>
                      <h4 className="font-bold text-white mb-3">Posting Frequency Analysis</h4>
                      <p className="text-gray-300 leading-relaxed">{data.posting_frequency_analysis}</p>
                    </div>
                  )}
                  
                  {data.credibility_explanation && (
                    <div>
                      <h4 className="font-bold text-white mb-3">Credibility Analysis</h4>
                      <p className="text-gray-300 leading-relaxed">{data.credibility_explanation}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Performance Metrics - Glassmorphism Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
          <h3 className="font-bold mb-6 text-white text-lg">
            Channel Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Clarity Score:</span>
              <span className="font-bold text-white text-lg">
                {channelData.avg_clarity_of_analysis
                  ? parseFloat(
                    channelData.avg_clarity_of_analysis.$numberDecimal
                  ).toFixed(1)
                  : "N/A"}
                /10
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Credibility Score:</span>
              <span className="font-bold text-white text-lg">
                {channelData.avg_credibility_score
                  ? parseFloat(
                    channelData.avg_credibility_score.$numberDecimal
                  ).toFixed(1)
                  : "N/A"}
                /10
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Actionable Insights:</span>
              <span className="font-bold text-white text-lg">
                {channelData.avg_actionable_insights
                  ? parseFloat(
                    channelData.avg_actionable_insights.$numberDecimal
                  ).toFixed(1)
                  : "N/A"}
                /10
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Risk Management:</span>
              <span className="font-bold text-white text-lg">
                {channelData.avg_risk_management
                  ? parseFloat(
                    channelData.avg_risk_management.$numberDecimal
                  ).toFixed(1)
                  : "N/A"}
                /10
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Educational Value:</span>
              <span className="font-bold text-white text-lg">
                {channelData.avg_educational_purpose
                  ? parseFloat(
                    channelData.avg_educational_purpose.$numberDecimal
                  ).toFixed(1)
                  : "N/A"}
                /10
              </span>
            </div>
          </div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
          <h3 className="font-bold mb-6 text-white text-lg">Sentiment Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Strong Bullish:</span>
              <span className="font-bold text-emerald-400 text-lg">
                {channelData.total_strong_bullish || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Mild Bullish:</span>
              <span className="font-bold text-emerald-400 text-lg">
                {channelData.total_mild_bullish || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Strong Bearish:</span>
              <span className="font-bold text-rose-400 text-lg">
                {channelData.total_strong_bearish || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Mild Bearish:</span>
              <span className="font-bold text-rose-400 text-lg">
                {channelData.total_mild_bearish || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid - Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
          <h3 className="font-bold mb-4 text-white text-lg">30-Day Performance</h3>
          <div className="h-48 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl">
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              {channelData.Overall?.["30_days"]
                ? `ROI: ${channelData.Overall["30_days"]
                  .probablity_weighted_returns_percentage > 0
                  ? "+"
                  : ""
                }${channelData.Overall[
                  "30_days"
                ].probablity_weighted_returns_percentage.toFixed(2)}%`
                : "No data available"}
            </span>
          </div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
          <h3 className="font-bold mb-4 text-white text-lg">Win Rate Analysis</h3>
          <div className="space-y-3">
            {(() => {
              const periods = [
                { key: '24_hours', label: '24 Hours' },
                { key: '7_days', label: '7 Days' },
                { key: '30_days', label: '30 Days' },
                { key: '90_days', label: '90 Days' },
                { key: '180_days', label: '180 Days' },
                { key: '1_year', label: '1 Year' }
              ];

              const winRates = periods.map(period => ({
                ...period,
                value: channelData.Overall?.[period.key]?.price_probablity_of_winning_percentage || 0
              }));

              const maxWinRate = Math.max(...winRates.map(item => item.value), 100);
              
              if (winRates.every(item => item.value === 0)) {
                return (
                  <div className="h-40 flex items-center justify-center text-gray-400 italic">
                    No win rate data available
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {winRates.map((period, index) => (
                    <div key={period.key} className="flex items-center justify-between">
                      <div className="flex items-center w-24">
                        <span className="text-sm text-gray-400 font-medium">{period.label}</span>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-800/50 rounded-full h-4 relative overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out shadow-lg"
                            style={{ 
                              width: `${(period.value / maxWinRate) * 100}%`,
                              minWidth: period.value > 0 ? '8px' : '0px'
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-sm font-bold text-white">
                          {period.value > 0 ? `${period.value.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Best/Worst Picks - Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="font-bold text-white text-lg">Best Performance</div>
              <div className="text-sm text-gray-400">
                BTC -{" "}
                {channelData.start_date
                  ? new Date(channelData.start_date).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400">
            {channelData.Overall?.["30_days"]
              ?.probablity_weighted_returns_percentage
              ? `${channelData.Overall["30_days"]
                .probablity_weighted_returns_percentage > 0
                ? "+"
                : ""
              }${channelData.Overall[
                "30_days"
              ].probablity_weighted_returns_percentage.toFixed(1)}%`
              : "N/A"}
          </div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl">📉</span>
            <div>
              <div className="font-bold text-white text-lg">7-Day Performance</div>
              <div className="text-sm text-gray-400">
                BTC -{" "}
                {channelData.end_date
                  ? new Date(channelData.end_date).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-400">
            {channelData.Overall?.["7_days"]
              ?.probablity_weighted_returns_percentage
              ? `${channelData.Overall["7_days"]
                .probablity_weighted_returns_percentage > 0
                ? "+"
                : ""
              }${channelData.Overall[
                "7_days"
              ].probablity_weighted_returns_percentage.toFixed(1)}%`
              : "N/A"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-2">
            <div>
              <div className="font-bold text-white text-lg">Total No. of Videos Posted</div>
            </div>
          </div>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {channelData.total_records || 0}
          </div>
        </div>
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-2">
            <div>
              <div className="font-bold text-white text-lg">Crypto Related Videos -overall period</div>
            </div>
          </div>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {channelData.crypto_related || 0}
          </div>
        </div>
      </div>
    </div>
  );
};