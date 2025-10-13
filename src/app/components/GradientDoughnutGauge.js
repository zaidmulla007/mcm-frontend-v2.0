"use client";

export default function GradientDoughnutGauge({ bullishPercent, bearishPercent, size = 28 }) {
    const radius = size / 2;
    const circumference = 2 * Math.PI * radius;
    const bullishOffset = circumference - (bullishPercent / 100) * circumference;
    const bearishOffset = circumference - (bearishPercent / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size * 2} ${size * 2}`}>
                <defs>
                    <linearGradient id={`bullish-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id={`bearish-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>

                {/* Background circle */}
                <circle
                    cx={size}
                    cy={size}
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={size / 7}
                />

                {/* Bullish arc */}
                <circle
                    cx={size}
                    cy={size}
                    r={radius}
                    fill="none"
                    stroke={`url(#bullish-gradient-${size})`}
                    strokeWidth={size / 7}
                    strokeDasharray={circumference}
                    strokeDashoffset={bullishOffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size} ${size})`}
                />

                {/* Bearish arc */}
                <circle
                    cx={size}
                    cy={size}
                    r={radius}
                    fill="none"
                    stroke={`url(#bearish-gradient-${size})`}
                    strokeWidth={size / 7}
                    strokeDasharray={circumference}
                    strokeDashoffset={bearishOffset}
                    strokeLinecap="round"
                    transform={`rotate(${(bullishPercent / 100) * 360 - 90} ${size} ${size})`}
                />
            </svg>
        </div>
    );
}
