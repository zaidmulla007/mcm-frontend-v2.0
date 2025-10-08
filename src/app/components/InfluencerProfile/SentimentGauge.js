import { useEffect, useState } from "react";

export default function SentimentGauge({
  winningPercentage,
  losingPercentage,
}) {
  // Calculate probabilities with animation
  const [animatedWinning, setAnimatedWinning] = useState(0);
  const [animatedLosing, setAnimatedLosing] = useState(0);
  const [animatedNeutral, setAnimatedNeutral] = useState(0);

  const winningProbability = winningPercentage || 0;
  const losingProbability = losingPercentage || 0;
  const neutralProbability = Math.max(
    0,
    100 - winningProbability - losingProbability
  );

  // Animate values when they change
  useEffect(() => {
    const duration = 1000; // 1 second animation
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedWinning(winningProbability * progress);
      setAnimatedLosing(losingProbability * progress);
      setAnimatedNeutral(neutralProbability * progress);

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [winningProbability, losingProbability, neutralProbability]);

  // Colors from Figma design
  const colors = {
    winning: "#4ade80", // Green
    losing: "#D55D5D", // Red
    neutral: "#35315a", // Dark gray for dark theme
    background: "transparent", // Transparent background
    border: "#35315a",
    text: "#989898",
    title: "#ffffff",
  };

  // Create SVG donut chart
  const createDonutChart = (winning, losing, neutral, size = 60) => {
    const radius = size / 2 - 4;

    const winningAngle = (winning / 100) * 360;
    const losingAngle = (losing / 100) * 360;
    const neutralAngle = (neutral / 100) * 360;

    let currentAngle = -90; // Start from top

    const createArc = (angle, color) => {
      if (angle <= 0) return null;

      const startAngle = currentAngle;
      currentAngle += angle;

      // Handle full circle case (360 degrees)
      if (angle >= 360) {
        return (
          <circle
            key={`${color}-full`}
            cx="0"
            cy="0"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
        );
      }

      const x1 = radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = radius * Math.cos((currentAngle * Math.PI) / 180);
      const y2 = radius * Math.sin((currentAngle * Math.PI) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      ].join(" ");

      return (
        <path
          key={`${color}-${startAngle}`}
          d={path}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
      );
    };

    return (
      <svg
        width={size}
        height={size}
        viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
        style={{ background: 'transparent' }}
      >
        {/* Background circle */}
        <circle
          cx="0"
          cy="0"
          r={radius}
          stroke={colors.neutral}
          strokeWidth="8"
          fill="none"
        />
        {/* Data arcs */}
        {createArc(winningAngle, colors.winning)}
        {createArc(losingAngle, colors.losing)}
        {createArc(neutralAngle, colors.neutral)}
      </svg>
    );
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative" style={{ background: 'transparent' }}>
        {createDonutChart(animatedWinning, animatedLosing, animatedNeutral, 60)}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="font-bold text-white text-sm">
              {animatedWinning.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
