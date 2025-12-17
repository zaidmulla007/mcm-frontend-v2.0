import React from 'react';
import GaugeComponent from 'react-gauge-component';

/**
 * SimpleTAGauge - Updated to use GaugeComponent with Red-Green Gradient
 * Matches the visual style of Social Media Sentiment gauge.
 * 
 * Accepts taData prop from API: { total_counts: { buy, sell, neutral }, recommendation }
 */
export default function SimpleTAGauge({ taData = null, signal = null }) {
  // Extract data from taData - handle both lowercase and uppercase keys
  const counts = taData?.total_counts || {};
  const buy = counts.buy ?? counts.BUY ?? 0;
  const sell = counts.sell ?? counts.SELL ?? 0;
  const neutral = counts.neutral ?? counts.NEUTRAL ?? 0;

  // Use signal if provided (explicitly requested to NOT use recommendation)
  const displayText = signal || null;

  const total = buy + neutral + sell;

  // If no data, show N/A
  if (total === 0) {
    return (
      <span className="text-xs text-gray-400">N/A</span>
    );
  }

  // Calculate score (0 to 100)
  // Formula: ((Buy - Sell) / Total + 1) * 50
  // 100 = All Buy, 50 = Neutral, 0 = All Sell
  let score = 50;
  if (total > 0) {
    score = (((buy - sell) / total) + 1) * 50;
  }

  // Get text style based on content
  const getTextStyle = (text) => {
    if (!text) return { color: 'text-gray-500' };

    const textLower = text.toLowerCase();
    if (textLower.includes('strong buy') || textLower.includes('bullish')) {
      return { color: 'text-green-700 font-bold' };
    } else if (textLower.includes('buy')) {
      return { color: 'text-green-600' };
    } else if (textLower.includes('strong sell') || textLower.includes('bearish')) {
      return { color: 'text-red-700 font-bold' };
    } else if (textLower.includes('sell')) {
      return { color: 'text-red-600' };
    } else {
      return { color: 'text-gray-500' };
    }
  };

  const textStyle = getTextStyle(displayText);

  return (
    <div className="flex items-center justify-center">
      {/* Gauge */}
      <div className="flex flex-col items-center">
        <GaugeComponent
          type="radial"
          style={{ width: 60, height: 60 }}
          value={score}
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
            colorArray: ['#CE1F1F', '#00FF15'], // Red to Green
            nbSubArcs: 90,
            padding: 0.01,
            width: 0.4
          }}
          pointer={{
            animationDelay: 0,
            strokeWidth: 7
          }}
        />
        {/* Signal display below gauge */}
        {displayText && (
          <div className={`text-[10px] font-semibold text-center mt-1 ${textStyle.color}`}>
            {displayText}
          </div>
        )}
      </div>
    </div>
  );
}
