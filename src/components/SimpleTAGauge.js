import React from 'react';
import GaugeComponent from 'react-gauge-component';

/**
 * SimpleTAGauge - Updated to use GaugeComponent with Red-Green Gradient
 * Matches the visual style of Social Media Sentiment gauge.
 */
export default function SimpleTAGauge({ buy = 0, neutral = 0, sell = 0 }) {
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

  // Determine Label
  let labelText = "Neutral";
  let labelColor = "text-gray-500"; // Gray for Neutral

  if (score >= 55) {
    labelText = "Buy";
    labelColor = "text-green-600";
  } else if (score <= 45) {
    labelText = "Sell";
    labelColor = "text-red-600";
  }

  return (
    <div className="flex items-center gap-3">
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
        <div className="text-[10px] font-bold text-center mt-2">
          <span className="text-black">
            {Math.round(labelText === "Sell" ? 100 - score : score)}% {labelText}
          </span>
        </div>
      </div>

      {/* Counts breakdown */}
      <div className="flex flex-col gap-1 text-left">
        {/* <div className="text-[10px] font-bold text-gray-700">Analysis:</div> */}
        <div className="text-[10px] text-black">
          <span className="font-bold text-green-600">Buy:</span> {buy}
        </div>
        <div className="text-[10px] text-black">
          <span className="font-bold text-red-600">Sell:</span> {sell}
        </div>
        <div className="text-[10px] text-black">
          <span className="font-bold text-gray-500">Neutral:</span> {neutral}
        </div>
      </div>
    </div>
  );
}
