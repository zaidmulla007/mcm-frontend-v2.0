"use client";

import { FaInfoCircle, FaStar } from "react-icons/fa";
import { useState, useMemo, memo, useEffect, useRef } from "react";
import Image from "next/image";
import * as d3 from "d3";

// Moon Phase Component
const MoonPhase = memo(({ percentage, year }) => {
  const getShadowPath = (percent) => {
    const radius = 28;
    const centerX = 32;
    const centerY = 32;

    // Convert percentage to phase (0 to 1)
    const phase = percent / 100;

    // Calculate the shadow offset
    const offset = (phase * 2 - 1) * radius;

    // Create ellipse for shadow based on phase
    const shadowWidth = Math.abs(offset);

    if (phase < 0.5) {
      // Waxing phase (shadow on right)
      return `M ${centerX},${centerY - radius}
              A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
              A ${shadowWidth},${radius} 0 0,0 ${centerX},${centerY - radius}`;
    } else {
      // Waning phase (shadow on left)
      return `M ${centerX},${centerY - radius}
              A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
              A ${shadowWidth},${radius} 0 0,1 ${centerX},${centerY - radius}`;
    }
  };

  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <defs>
        <radialGradient id={`moonGlow-${year}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#dbeafe" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={`moonSurface-${year}`} cx="35%" cy="35%">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="50%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </radialGradient>
      </defs>

      {/* Outer glow */}
      <circle cx="32" cy="32" r="30" fill={`url(#moonGlow-${year})`} />

      {/* Main moon body */}
      <circle cx="32" cy="32" r="28" fill={`url(#moonSurface-${year})`} />

      {/* Craters */}
      <circle cx="24" cy="24" r="4" fill="#60a5fa" opacity="0.4" />
      <circle cx="38" cy="28" r="5" fill="#60a5fa" opacity="0.3" />
      <circle cx="28" cy="38" r="3" fill="#60a5fa" opacity="0.35" />
      <circle cx="40" cy="22" r="2.5" fill="#60a5fa" opacity="0.4" />
      <circle cx="35" cy="40" r="2" fill="#60a5fa" opacity="0.3" />

      {/* Shadow overlay */}
      <path
        d={getShadowPath(percentage)}
        fill="rgba(30, 30, 50, 0.75)"
        opacity="0.9"
      />

      {/* Subtle shadow edge highlight */}
      <path
        d={getShadowPath(percentage)}
        fill="none"
        stroke="rgba(30, 30, 50, 0.3)"
        strokeWidth="1"
      />
    </svg>
  );
});

MoonPhase.displayName = 'MoonPhase';

// Bubble Cluster Chart Component
const BubbleClusterChart = memo(({ data }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const containerWidth = containerRef.current?.offsetWidth || 350;
    const width = containerWidth;
    const height = 200; // Increased height to accommodate bubbles
    const padding = 10; // Padding to ensure bubbles don't get cut off

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Define vibrant crypto-style gradients
    const defs = svg.append("defs");

    const gradients = [
      ["#22d3ee", "#06b6d4", "#0891b2"], // Cyan (matches header)
      ["#a78bfa", "#8b5cf6", "#7c3aed"], // Purple (matches header)
      ["#60a5fa", "#3b82f6", "#2563eb"], // Blue
      ["#93c5fd", "#60a5fa", "#3b82f6"], // Light Blue
      ["#c4b5fd", "#a78bfa", "#8b5cf6"], // Light Purple
      ["#06b6d4", "#8b5cf6", "#7c3aed"], // Cyan-Purple gradient
      ["#22d3ee", "#a78bfa", "#8b5cf6"], // Cyan-Purple blend
      ["#3b82f6", "#8b5cf6", "#7c3aed"]  // Blue-Purple gradient
    ];

    data.forEach((d, i) => {
      const colorScheme = gradients[i % gradients.length];
      const gradient = defs.append("radialGradient")
        .attr("id", `bubble-gradient-${d.year}`)
        .attr("cx", "30%")
        .attr("cy", "30%");

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScheme[0])
        .attr("stop-opacity", 1);

      gradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", colorScheme[1])
        .attr("stop-opacity", 0.9);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScheme[2])
        .attr("stop-opacity", 0.8);

      // Add shimmer overlay gradient
      const shimmerGradient = defs.append("radialGradient")
        .attr("id", `shimmer-${d.year}`)
        .attr("cx", "30%")
        .attr("cy", "30%");

      shimmerGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#ffffff")
        .attr("stop-opacity", 0.4);

      shimmerGradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "#ffffff")
        .attr("stop-opacity", 0.1);

      shimmerGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#ffffff")
        .attr("stop-opacity", 0);
    });

    // Add glow filter
    const filter = defs.append("filter")
      .attr("id", "glow");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Calculate bubble sizes with padding consideration
    const maxCalls = d3.max(data, d => d.calls);
    const minCalls = d3.min(data, d => d.calls);

    const bubbleCount = data.length;
    // Reduce max radius to ensure bubbles fit with padding
    const maxRadius = Math.min(45, (width - padding * 4) / (bubbleCount * 1.5));
    const minRadius = maxRadius * 0.4;

    const radiusScale = d3.scaleSqrt()
      .domain([minCalls, maxCalls])
      .range([minRadius, maxRadius]);

    // Calculate fixed positions for bubbles - no animation
    const nodes = data.map((d) => {
      const radius = radiusScale(d.calls);
      return {
        ...d,
        radius: radius
      };
    });

    // Sort nodes by radius (largest first) for better visual hierarchy
    nodes.sort((a, b) => b.radius - a.radius);

    // Calculate fixed positions in a tight cluster with bounds checking
    const calculateFixedPositions = (bubbles) => {
      if (bubbles.length === 0) return bubbles;

      // Place largest bubble at center
      bubbles[0].x = width / 2;
      bubbles[0].y = height / 2;

      if (bubbles.length === 1) return bubbles;

      // Position remaining bubbles in a circular pattern around the center
      for (let i = 1; i < bubbles.length; i++) {
        const angle = ((i - 1) / (bubbles.length - 1)) * 2 * Math.PI;
        const distance = bubbles[0].radius + bubbles[i].radius + 8;

        let x = width / 2 + Math.cos(angle) * distance;
        let y = height / 2 + Math.sin(angle) * distance;

        // Ensure bubbles stay within bounds
        x = Math.max(bubbles[i].radius + padding, Math.min(width - bubbles[i].radius - padding, x));
        y = Math.max(bubbles[i].radius + padding, Math.min(height - bubbles[i].radius - padding, y));

        bubbles[i].x = x;
        bubbles[i].y = y;
      }

      return bubbles;
    };

    const positionedNodes = calculateFixedPositions(nodes);

    // Create bubble groups with fixed positions (no animation)
    const bubbleGroups = svg.selectAll(".bubble-group")
      .data(positionedNodes)
      .join("g")
      .attr("class", "bubble-group")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer");

    // Add drop shadow circles
    bubbleGroups.append("circle")
      .attr("class", "bubble-shadow")
      .attr("r", d => d.radius)
      .attr("fill", "rgba(0, 0, 0, 0.2)")
      .attr("filter", "url(#glow)");

    // Add main bubble circles
    bubbleGroups.append("circle")
      .attr("class", "bubble-main")
      .attr("r", d => d.radius)
      .attr("fill", d => `url(#bubble-gradient-${d.year})`)
      .attr("filter", "url(#glow)")
      .style("transition", "all 0.3s ease");

    // Add shimmer overlay
    bubbleGroups.append("circle")
      .attr("class", "bubble-shimmer")
      .attr("r", d => d.radius)
      .attr("fill", d => `url(#shimmer-${d.year})`)
      .attr("pointer-events", "none");

    // Function to calculate responsive text sizes
    const getCallsFontSize = (radius) => {
      // Calls count - BIG size
      if (radius < 20) return Math.max(10, radius * 0.50);
      if (radius < 30) return Math.max(12, radius * 0.48);
      if (radius < 40) return Math.max(14, radius * 0.45);
      return Math.max(16, radius * 0.42);
    };

    const getLabelFontSize = (radius) => {
      // "Trading calls" label - SMALL size
      if (radius < 20) return Math.max(5, radius * 0.22);
      if (radius < 30) return Math.max(6, radius * 0.20);
      if (radius < 40) return Math.max(7, radius * 0.18);
      return Math.max(8, radius * 0.16);
    };

    const getYearFontSize = (radius) => {
      // Year - SMALL size
      if (radius < 20) return Math.max(5, radius * 0.22);
      if (radius < 30) return Math.max(6, radius * 0.20);
      if (radius < 40) return Math.max(7, radius * 0.18);
      return Math.max(8, radius * 0.16);
    };

    // 1. Add calls count text at TOP - BIG
    bubbleGroups.append("text")
      .attr("class", "bubble-calls")
      .attr("text-anchor", "middle")
      .attr("dy", d => {
        const fontSize = getCallsFontSize(d.radius);
        return -fontSize * 0.5;
      })
      .style("font-size", d => `${getCallsFontSize(d.radius)}px`)
      .style("font-weight", "bold")
      .style("fill", "#ffffff")
      .style("pointer-events", "none")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.3)")
      .text(d => d.calls.toLocaleString());

    // 2. Add "Trading calls" label in MIDDLE - small (tight spacing)
    bubbleGroups.append("text")
      .attr("class", "bubble-label")
      .attr("text-anchor", "middle")
      .attr("dy", d => {
        const callsFontSize = getCallsFontSize(d.radius);
        const labelFontSize = getLabelFontSize(d.radius);
        return -callsFontSize * 0.5 + callsFontSize * 0.7 + labelFontSize * 0.4;
      })
      .style("font-size", d => `${getLabelFontSize(d.radius)}px`)
      .style("font-weight", "500")
      .style("fill", "#ffffff")
      .style("opacity", 0.85)
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.3)")
      .text("Trading calls");

    // 3. Add year text at BOTTOM - small (tight spacing)
    bubbleGroups.append("text")
      .attr("class", "bubble-year")
      .attr("text-anchor", "middle")
      .attr("dy", d => {
        const callsFontSize = getCallsFontSize(d.radius);
        const labelFontSize = getLabelFontSize(d.radius);
        const yearFontSize = getYearFontSize(d.radius);
        return -callsFontSize * 0.5 + callsFontSize * 0.7 + labelFontSize * 0.4 + labelFontSize * 0.8 + yearFontSize * 0.3;
      })
      .style("font-size", d => `${getYearFontSize(d.radius)}px`)
      .style("font-weight", "500")
      .style("fill", "#ffffff")
      .style("opacity", 0.85)
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.3)")
      .text(d => d.year);

    // Add hover effects
    bubbleGroups
      .on("mouseenter", function() {
        d3.select(this).select(".bubble-main")
          .transition()
          .duration(200)
          .attr("filter", "url(#glow) drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))");
      })
      .on("mouseleave", function() {
        d3.select(this).select(".bubble-main")
          .transition()
          .duration(200)
          .attr("filter", "url(#glow)");
      });
  }, [data]);

  return (
    <div ref={containerRef} className="flex justify-center w-full">
      <svg ref={svgRef}></svg>
    </div>
  );
});

BubbleClusterChart.displayName = 'BubbleClusterChart';

const InfluencerFlashCard = memo(({ data, rank, rankLabel, isLoggedIn, onViewFull }) => {
  const [showTooltip, setShowTooltip] = useState(null);

  // Calculate star rating from trust score (0-5 stars)
  const getStarRating = (trustScore) => {
    return Math.min(5, Math.max(0, Math.round(trustScore / 20)));
  };

  // Extract total calls from 180 days data across all quarters
  const extractTotalCallsByQuarter = (channelData) => {
    const callsByQuarter = {};

    console.log('Full Channel Data:', channelData);
    console.log('Has Quarterly?', !!channelData?.Quarterly);
    console.log('Quarterly keys:', channelData?.Quarterly ? Object.keys(channelData.Quarterly) : 'none');

    if (channelData?.Quarterly) {
      Object.entries(channelData.Quarterly)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort quarters chronologically
        .forEach(([quarter, quarterData]) => {
          console.log(`Quarter ${quarter}:`, quarterData);
          console.log(`180_days data:`, quarterData?.["180_days"]);

          // Get total coins from 180_days data
          const calls = quarterData?.["180_days"]?.total_coins || 0;
          console.log(`Quarter ${quarter} calls:`, calls);
          callsByQuarter[quarter] = calls;
        });
    } else {
      console.log('No Quarterly data found. Channel data structure:', Object.keys(channelData || {}));
    }

    console.log('Final Calls by Quarter:', callsByQuarter);

    return callsByQuarter;
  };

  // Extract ROI data from 180 days probablity_weighted_returns_percentage
  const extractROIByQuarter = (channelData) => {
    const roiByYear = {};

    if (channelData?.Quarterly) {
      Object.entries(channelData.Quarterly).forEach(([quarter, quarterData]) => {
        // Extract year from quarter (e.g., "2023Q1" -> "2023")
        const year = quarter.substring(0, 4);

        // Get ROI percentage from 180_days data
        const roi = quarterData?.["180_days"]?.probablity_weighted_returns_percentage || 0;

        // Store quarters for each year
        if (!roiByYear[year]) {
          roiByYear[year] = [];
        }
        roiByYear[year].push(roi);
      });
    }

    console.log('ROI by Year:', roiByYear);

    return roiByYear;
  };

  const starRating = getStarRating(data?.trustScore || 75);

  // Parse data from API response
  // Determine platform based on available fields
  const channelType = data?.platform || (data?.influencer_name ? "YouTube" : (data?.channel_id ? "Telegram" : "YouTube"));
  const influencerName = data?.channel_name || data?.influencer_name || data?.name || data?.title || data?.channel_id || "Anonymous Influencer";

  // Format subscriber count for YouTube
  const formatSubscribers = (count) => {
    if (!count) return "N/A";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M subs`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K subs`;
    }
    return `${count} subs`;
  };

  const subscribers = channelType === "Telegram"
    ? (formatSubscribers(data?.subscriber_count || data?.subs || data?.subscribers) || "Channel")
    : formatSubscribers(data?.subscriber_count || data?.subs || data?.subscribers);
  const profileImage = data?.channel_thumbnails?.high?.url || data?.thumbnail || null;
  const trustScore = data?.ai_overall_score ? data.ai_overall_score * 10 : 75;
  const totalCalls = extractTotalCallsByQuarter(data);
  const roiData = extractROIByQuarter(data);
  const winRate = data?.winRate || { 2022: 82, 2023: 85, 2024: 88, 2025: 90 };
  const channelId = data?.id || data?.channel_id || data?.channelId;
  const platformType = channelType === "Telegram" ? "telegram" : "youtube";

  // Extract moonshot count from moonshotData (180_days moonshots_price_count)
  const extractMoonshotProb = (channelData, platform) => {
    const moonshotProb = {};

    console.log('=== MOONSHOT DEBUG ===');
    console.log('Channel Data:', channelData);
    console.log('Platform:', platform);
    console.log('Has moonshotData?', !!channelData?.moonshotData);
    console.log('moonshotData value:', channelData?.moonshotData);

    // Handle both API structures:
    // 1. data.moonshotData (new structure from rankings API)
    // 2. data["score.moonshots.yearly"] (alternative structure)
    const moonshotData = channelData?.moonshotData ||
      channelData?.["score.moonshots.yearly"] ||
      {};

    console.log('Moonshot Data:', moonshotData);
    console.log('Moonshot Data Keys:', Object.keys(moonshotData));

    if (moonshotData && Object.keys(moonshotData).length > 0) {
      Object.entries(moonshotData).forEach(([year, yearData]) => {
        console.log(`Processing year ${year}:`, yearData);

        // Filter based on platform and year
        // For YouTube: only show data from 2022 onwards
        // For Telegram: only show data from 2024 onwards
        const yearNum = parseInt(year);

        if (platform === "Telegram") {
          // Telegram: remove all data before 2024
          if (yearNum < 2024) {
            console.log(`Skipping Telegram year ${year} (< 2024)`);
            return; // Skip this year
          }
        } else {
          // YouTube: remove all data before 2022
          if (yearNum < 2022) {
            console.log(`Skipping YouTube year ${year} (< 2022)`);
            return; // Skip this year
          }
        }

        // Get moonshots_price_count from 180_days timeframe
        const count = yearData?.["180_days"]?.moonshots_price_count || 0;
        console.log(`Year ${year} moonshot count:`, count);

        // Include ALL years regardless of has_data status (show 0 for years without data)
        moonshotProb[year] = count;
      });
    } else {
      console.log('No moonshot data found in any expected location');
    }

    console.log('Final Moonshot Prob:', moonshotProb);
    console.log('=== END MOONSHOT DEBUG ===');

    return moonshotProb;
  };

  const moonshotProb = extractMoonshotProb(data, channelType);

  // Get current year once - stable value
  const currentYear = useMemo(() => new Date().getFullYear().toString(), []);

  // Memoize chart data to prevent flickering
  const totalCallsChartData = useMemo(() => {
    if (!data?.Yearly) return null;

    const overallData = data.Yearly;

    const transformYearlyData = (yearlyData) => {
      if (!yearlyData) return [];
      return Object.keys(yearlyData)
        .map((year) => ({
          year,
          total: (yearlyData[year]?.bullish_count || 0) + (yearlyData[year]?.bearish_count || 0),
        }))
        .sort((a, b) => a.year.localeCompare(b.year));
    };

    const chartData = transformYearlyData(overallData).map((item) => ({
      year: item.year === currentYear ? item.year + '*' : item.year,
      total: item.total,
    }));

    return chartData;
  }, [data?.Yearly, currentYear]);

  // Memoize ROI graph data points to prevent recalculation on every render
  const roiGraphData = useMemo(() => {
    console.log('=== ROI GRAPH DEBUG ===');
    console.log('data.Yearly:', data?.Yearly);

    if (!data?.Yearly) {
      console.log('No Yearly data available');
      return null;
    }

    const dataPoints = [];
    const sortedYears = Object.keys(data.Yearly).sort((a, b) => a.localeCompare(b));

    console.log('Sorted years:', sortedYears);

    sortedYears.forEach(year => {
      const yearData = data.Yearly[year];
      const day180Data = yearData?.["180_days"];

      console.log(`Year ${year} - 180_days data:`, day180Data);

      if (day180Data) {
        // Add H1 data point if available
        const h1Value = day180Data.h1_price_returns_average;
        if (h1Value !== null && h1Value !== undefined) {
          const clampedH1 = Math.max(-100, Math.min(100, h1Value));
          dataPoints.push({
            label: `${year} H1`,
            value: clampedH1,
            actualValue: h1Value,
            isYearly: false,
            year: year
          });
          console.log(`Added H1 for ${year}: ${h1Value}`);
        }

        // Add H2 data point if available
        const h2Value = day180Data.h2_price_returns_average;
        if (h2Value !== null && h2Value !== undefined) {
          const clampedH2 = Math.max(-100, Math.min(100, h2Value));
          dataPoints.push({
            label: `${year} H2`,
            value: clampedH2,
            actualValue: h2Value,
            isYearly: false,
            year: year
          });
          console.log(`Added H2 for ${year}: ${h2Value}`);
        }

        // If neither H1 nor H2 available, use probablity_weighted_returns_percentage
        if ((h1Value === null || h1Value === undefined) && (h2Value === null || h2Value === undefined)) {
          const roi = day180Data.probablity_weighted_returns_percentage || 0;
          const clampedRoi = Math.max(-100, Math.min(100, roi));
          const yearLabel = year === currentYear ? year + '*' : year;
          dataPoints.push({
            label: yearLabel,
            value: clampedRoi,
            actualValue: roi,
            isYearly: true,
            year: year
          });
          console.log(`Added yearly for ${year}: ${roi}`);
        }
      }
    });

    console.log('Final ROI dataPoints:', dataPoints);
    console.log('=== END ROI GRAPH DEBUG ===');

    return dataPoints.length > 0 ? dataPoints : null;
  }, [data?.Yearly, currentYear]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
        <div className="flex items-center gap-3">
          {/* Profile Image - Centered */}
          <div className="relative flex-shrink-0">
            {profileImage ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                <Image
                  src={profileImage}
                  alt={influencerName}
                  width={64}
                  height={64}
                  className="rounded-full w-full h-full object-cover"
                />
              </div>
            ) : channelType === "Telegram" ? (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shadow-lg border-2 border-white">
                <span className="text-xl font-bold text-white">
                  {influencerName ? influencerName.match(/\b\w/g)?.join("") || "?" : "?"}
                </span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300 border-2 border-white"></div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white">
                {/* Rank Badge - Above Name */}
                <h3 className="text-sm font-bold">{influencerName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">
                    {channelType === "Telegram" ? channelType : `${channelType} • ${subscribers}`}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => onViewFull(e)}
                className="text-white text-xs hover:text-gray-200 font-semibold whitespace-nowrap"
              >
                View Full →
              </button>
            </div>

            {/* MCM Trust Score / Star Rating */}
            <div className="flex items-center justify-between">
              <div className="text-white text-xs">MCM Rating</div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={star <= starRating ? "text-yellow-400" : "text-gray-400"}
                    size={16}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Total Calls */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-bold text-gray-900">Total Calls</h4>
            <button
              className="relative"
              onMouseEnter={() => setShowTooltip('totalRecommendations')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <FaInfoCircle className="text-gray-400 text-xs" />
              {showTooltip === 'totalRecommendations' && (
                <div className="absolute z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg -top-2 left-6">
                  <p className="text-left leading-relaxed">Total bullish and bearish recommendations given by the influencer each year.</p>
                </div>
              )}
            </button>
          </div>

          {/* Chart Container */}
          <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200">
            {totalCallsChartData && totalCallsChartData.length > 0 ? (
              <BubbleClusterChart data={totalCallsChartData.map(item => ({
                year: item.year,
                calls: item.total
              }))} />
            ) : (
              <div className="h-24 flex items-center justify-center text-gray-400 text-xs">
                No data available
              </div>
            )}
          </div>

          {/* View Dashboard Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const userData = localStorage.getItem('userData');
              if (userData) {
                window.location.href =
                  platformType === 'youtube'
                    ? `/influencers/${channelId}`
                    : `/telegram-influencer/${channelId}`;
              } else {
                window.location.href = '/login?signup=true';
              }
            }}
            className="text-blue-600 text-xs font-semibold mt-2 hover:text-blue-700"
          >
            View Total Calls Dashboard →
          </button>
        </div>


        {/* ROI % - Win Rate Percentage */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-bold text-gray-900">ROI %</h4>
            <button
              className="relative"
              onMouseEnter={() => setShowTooltip('roi')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <FaInfoCircle className="text-gray-400 text-xs" />
              {showTooltip === 'roi' && (
                <div className="absolute z-10 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg -top-2 left-6">
                  <p className="text-left leading-relaxed">% of calls that generated positive returns (that is, where the price of the coin moved in the direction of the influencer&apos;s sentiment), for a 180 day holding period</p>
                </div>
              )}
            </button>
          </div>
          {/* Line Graph */}
          <div className="mt-3 bg-white rounded-lg p-4 border border-gray-200">
            {roiGraphData && roiGraphData.length > 0 ? (
              (() => {
                const dataPoints = roiGraphData;

                // Y-axis scale - visual display range
                const yMax = 100;
                const yMin = -100;
                const range = yMax - yMin;

                // Fixed width to fit container without scrolling
                const graphWidth = 280;
                const graphHeight = 120;
                const padding = { left: 35, right: 20, top: 20, bottom: 30 };

                // Custom Y-axis labels: 100+, 100, 50, 0, -50, -100
                // The 100+ label is at the top and represents any value > 100
                const yLabels = [
                  { value: 100, display: '100+', position: 0 },  // Top position for 100+
                  { value: 100, display: '100', position: 1 },   // Second position for exactly 100
                  { value: 50, display: '50', position: 2 },
                  { value: 0, display: '0', position: 3 },
                  { value: -50, display: '-50', position: 4 },
                  { value: -100, display: '-100', position: 5 }
                ];

                return (
                  <div className="relative overflow-hidden" style={{ height: `${graphHeight + padding.top + padding.bottom}px`, width: '100%' }}>
                    <svg width="100%" height={graphHeight + padding.top + padding.bottom} viewBox={`0 0 ${graphWidth + padding.left + padding.right} ${graphHeight + padding.top + padding.bottom}`} preserveAspectRatio="xMidYMid meet">
                      {/* Y-axis */}
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={graphHeight + padding.top}
                        stroke="#374151"
                        strokeWidth="2"
                      />

                      {/* X-axis */}
                      <line
                        x1={padding.left}
                        y1={graphHeight + padding.top}
                        x2={graphWidth + padding.left}
                        y2={graphHeight + padding.top}
                        stroke="#374151"
                        strokeWidth="2"
                      />

                      {/* Y-axis labels and grid lines */}
                      {yLabels.map((label, i) => {
                        const y = padding.top + (label.position * graphHeight / (yLabels.length - 1));
                        return (
                          <g key={i}>
                            <text
                              x={padding.left - 8}
                              y={y + 4}
                              fontSize="10"
                              textAnchor="end"
                              fill="#374151"
                              fontWeight="bold"
                            >
                              {label.display}
                            </text>
                            {/* Only draw grid line for positions 1-5, not for 100+ at position 0 */}
                            {label.position > 0 && label.position < yLabels.length - 1 && (
                              <line
                                x1={padding.left}
                                y1={y}
                                x2={graphWidth + padding.left}
                                y2={y}
                                stroke="#e5e7eb"
                                strokeWidth="1"
                              />
                            )}
                          </g>
                        );
                      })}

                      {/* Data line segments with color based on value */}
                      {dataPoints.map((point, index) => {
                        if (index === 0) return null;

                        // Clamp values between -100 and 100 for display
                        const clampedPrevValue = Math.max(yMin, Math.min(yMax, dataPoints[index - 1].value));
                        const clampedValue = Math.max(yMin, Math.min(yMax, point.value));

                        // Calculate positions using same logic as data points
                        const normalizedPrevValue = (clampedPrevValue - yMin) / range;
                        const normalizedValue = (clampedValue - yMin) / range;
                        const effectiveGraphHeight = graphHeight * (5/6);

                        const x1 = padding.left + ((index - 1) / (dataPoints.length - 1)) * graphWidth;
                        const y1 = padding.top + (graphHeight - (normalizedPrevValue * effectiveGraphHeight));
                        const x2 = padding.left + (index / (dataPoints.length - 1)) * graphWidth;
                        const y2 = padding.top + (graphHeight - (normalizedValue * effectiveGraphHeight));

                        // Use #1e3a8a for positive values (>= 0), #dbeafe for negative values (< 0)
                        const strokeColor = point.value >= 0 ? "#1e3a8a" : "#dbeafe";

                        return (
                          <line
                            key={`line-${index}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={strokeColor}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        );
                      })}

                      {/* Data points */}
                      {dataPoints.map((point, index) => {
                        const x = padding.left + (index / (dataPoints.length - 1)) * graphWidth;

                        // Clamp value between -100 and 100 for display position
                        const clampedValue = Math.max(yMin, Math.min(yMax, point.value));

                        // Calculate Y position: map -100 to 100 onto the graph height
                        // The "100" label is at position 1 out of 5 positions (20% from top)
                        // So we need to map our data to that space
                        const normalizedValue = (clampedValue - yMin) / range; // 0 to 1
                        const effectiveGraphHeight = graphHeight * (5/6); // Use 5/6 of height (exclude 100+ space)
                        const y = padding.top + (graphHeight - (normalizedValue * effectiveGraphHeight));

                        // Use #1e3a8a for positive values (>= 0), #dbeafe for negative values (< 0)
                        const fillColor = point.value >= 0 ? "#1e3a8a" : "#dbeafe";

                        return (
                          <g key={point.label}>
                            <circle
                              cx={x}
                              cy={y}
                              r="5"
                              fill={fillColor}
                              className="cursor-pointer"
                            >
                              <title>{point.label}: {point.actualValue >= 0 ? '+' : ''}{point.actualValue.toFixed(1)}%</title>
                            </circle>
                            {/* X-axis label */}
                            <text
                              x={x}
                              y={graphHeight + padding.top + 18}
                              fontSize="9"
                              textAnchor="middle"
                              fill="#374151"
                              fontWeight="bold"
                            >
                              {point.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()
            ) : (
              <div className="h-24 flex items-center justify-center text-gray-400 text-xs">No data available</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const userData = localStorage.getItem('userData');
              if (userData) {
                window.location.href = platformType === "youtube"
                  ? `/influencers/${channelId}`
                  : `/telegram-influencer/${channelId}`;
              } else {
                window.location.href = '/login?signup=true';
              }
            }}
            className="text-blue-600 text-xs font-semibold mt-2 hover:text-blue-700"
          >
            View ROI Dashboard →
          </button>
        </div>

        {/* Moonshot Probability */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-bold text-gray-900">Moonshots</h4>
            <button
              className="relative"
              onMouseEnter={() => setShowTooltip('moonshot')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <FaInfoCircle className="text-gray-400 text-xs" />
              {showTooltip === 'moonshot' && (
                <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-xl -top-32 left-0 right-0 mx-auto">
                  <p className="text-left leading-relaxed">Moonshot is defined by hyperactivity in a coin recommended by the influencer within a short period of time. A recommendation was considered as a moonshot if the price of the coin moved by 50% within 1 hour, or by 100% within 7 days, or by 200% within 30 days, or by 300% within 180 days or by 400% within 1 year. The display on the screen is filtered for those recommendations where the coin moved by +300% within 180 days.</p>
                </div>
              )}
            </button>
          </div>
          <div className={`grid gap-2 ${Object.keys(moonshotProb).length === 5 ? 'grid-cols-5' : Object.keys(moonshotProb).length === 4 ? 'grid-cols-4' : Object.keys(moonshotProb).length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {Object.keys(moonshotProb).length > 0 ? (
              (() => {
                const currentYear = new Date().getFullYear().toString();
                return Object.entries(moonshotProb)
                  .sort(([a], [b]) => a.localeCompare(b)) // Sort years chronologically (2021, 2022, 2023, 2024, 2025)
                  .map(([year, count]) => {
                    // Treat count as percentage (0-100)
                    // Cap at 100 if count exceeds 100
                    const percentage =100 - Math.min(count, 100);

                    // Mark current year with asterisk
                    const displayYear = year === currentYear ? year + '*' : year;

                    return (
                      <div key={year} className="flex flex-col items-center">
                        <div className="text-xs text-gray-600 mb-1">{displayYear}</div>
                        <div className="relative w-16 h-16">
                          <MoonPhase percentage={percentage} year={year} />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-white" style={{ textShadow: '0 0 3px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.6)' }}>{count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
              })()
            ) : (
              <div className="col-span-full text-center text-gray-400 text-xs py-4">No moonshot data available</div>
            )}
          </div>
          {/* <button
            onClick={(e) => {
              e.stopPropagation();
              const userData = localStorage.getItem('userData');
              if (userData) {
                window.location.href = platformType === "youtube"
                  ? `/influencers/${channelId}`
                  : `/telegram-influencer/${channelId}`;
              } else {
                window.location.href = '/login?signup=true';
              }
            }}
            className="text-blue-600 text-xs font-semibold mt-2 hover:text-blue-700 transition-colors"
          >
            View Moonshot Dashboard →
          </button> */}
        </div>
      </div>
    </div>
  );
});

InfluencerFlashCard.displayName = 'InfluencerFlashCard';

export default InfluencerFlashCard;