import React from 'react';

/**
 * SimpleTAGauge - Exact TradingView Technical Analysis widget replica
 * Uses custom backend data instead of TradingView API
 */
export default function SimpleTAGauge({ buy = 0, neutral = 0, sell = 0 }) {
  const total = buy + neutral + sell;

  // If no data, show N/A
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '320px', backgroundColor: '#ffffff' }}>
        <span className="text-sm text-gray-400">No Data Available</span>
      </div>
    );
  }

  // Determine overall recommendation
  let recommendation = 'NEUTRAL';
  let recommendationColor = '#787b86';

  if (buy > neutral && buy > sell) {
    recommendation = 'BUY';
    recommendationColor = '#089981';
  } else if (sell > neutral && sell > buy) {
    recommendation = 'SELL';
    recommendationColor = '#f23645';
  }

  // Calculate needle angle (-90 to 90 degrees)
  const score = buy - sell;
  const needleAngle = (score / total) * 90;

  return (
    <div style={{
      width: '100%',
      minHeight: 'auto',
      backgroundColor: 'transparent',
      padding: '4px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif'
    }}>

      {/* Speedometer Gauge */}
      <div style={{ position: 'relative', width: '160px', height: '100px', marginTop: '0px', marginBottom: '4px' }}>
        <svg width="160" height="70" viewBox="0 0 240 140" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`gauge-gradient-${buy}-${neutral}-${sell}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#f23645', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#787b86', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#089981', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d="M 35 115 A 85 85 0 0 1 205 115"
            fill="none"
            stroke="#e0e3eb"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Colored gradient arc */}
          <path
            d="M 35 115 A 85 85 0 0 1 205 115"
            fill="none"
            stroke={`url(#gauge-gradient-${buy}-${neutral}-${sell})`}
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Center circle */}
          <circle cx="120" cy="115" r="8" fill="#131722" />
          <circle cx="120" cy="115" r="5" fill="#ffffff" />

          {/* Needle */}
          <g transform={`rotate(${needleAngle} 120 115)`} style={{ transition: 'transform 0.5s ease' }}>
            <path
              d="M 120 115 L 117 112 L 120 45 L 123 112 Z"
              fill={recommendationColor}
            />
            <circle cx="120" cy="115" r="6" fill={recommendationColor} />
          </g>
        </svg>

        {/* Labels below gauge with counts */}
        <div style={{
          position: 'absolute',
          bottom: '0px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '0 2px',
          fontSize: '9px',
          fontWeight: 500,
          color: '#787b86',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}>
            <span style={{ color: '#f23645', fontWeight: 600, fontSize: '9px' }}>Sell</span>
            <span style={{ color: '#131722', fontSize: '10px', fontWeight: 700 }}>{sell}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}>
            <span style={{ color: '#787b86', fontWeight: 600, fontSize: '9px' }}>Neutral</span>
            <span style={{ color: '#131722', fontSize: '10px', fontWeight: 700 }}>{neutral}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}>
            <span style={{ color: '#089981', fontWeight: 600, fontSize: '9px' }}>Buy</span>
            <span style={{ color: '#131722', fontSize: '10px', fontWeight: 700 }}>{buy}</span>
          </div>
        </div>
      </div>

      {/* Recommendation Badge */}
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: recommendationColor,
        letterSpacing: '0.3px',
        marginTop: '2px'
      }}>
        {recommendation}
      </div>
    </div>
  );
}
