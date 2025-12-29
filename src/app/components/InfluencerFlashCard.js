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
          <stop offset="0%" stopColor="#374151" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1f2937" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={`moonSurface-${year}`} cx="35%" cy="35%">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="50%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </radialGradient>
      </defs>

      {/* Outer glow */}
      <circle cx="32" cy="32" r="30" fill={`url(#moonGlow-${year})`} />

      {/* Main moon body - black-gray background */}
      <circle cx="32" cy="32" r="28" fill={`url(#moonSurface-${year})`} />

      {/* Craters */}
      <circle cx="24" cy="24" r="4" fill="#1f2937" opacity="0.4" />
      <circle cx="38" cy="28" r="5" fill="#1f2937" opacity="0.3" />
      <circle cx="28" cy="38" r="3" fill="#1f2937" opacity="0.35" />
      <circle cx="40" cy="22" r="2.5" fill="#1f2937" opacity="0.4" />
      <circle cx="35" cy="40" r="2" fill="#1f2937" opacity="0.3" />

      {/* Light blue overlay - represents the percentage */}
      <path
        d={getShadowPath(percentage)}
        fill="#dbeafe"
        opacity="0.9"
      />

      {/* Subtle edge highlight */}
      <path
        d={getShadowPath(percentage)}
        fill="none"
        stroke="#dbeafe"
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
    const height = 120; // Reduced height for horizontal layout
    const padding = 10; // Padding to ensure bubbles don't get cut off

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Sort data by year (oldest to newest)
    const sortedData = [...data].sort((a, b) => {
      const yearA = parseInt(a.year.replace('*', ''));
      const yearB = parseInt(b.year.replace('*', ''));
      return yearA - yearB;
    });

    // Define defs for filters
    const defs = svg.append("defs");

    // Add gradient for text
    const textGradient = defs.append("linearGradient")
      .attr("id", "textGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    textGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3b82f6"); // blue-500

    textGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#a855f7"); // purple-500

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
    const maxCalls = d3.max(sortedData, d => d.calls);
    const minCalls = d3.min(sortedData, d => d.calls);

    // Reduce max radius to ensure bubbles fit horizontally with year label below
    const maxRadius = Math.min(35, (height - 30) / 2); // Reserve 30px for year label below
    const minRadius = maxRadius * 0.5;

    const radiusScale = d3.scaleSqrt()
      .domain([minCalls, maxCalls])
      .range([minRadius, maxRadius]);

    // Calculate fixed positions for bubbles - horizontal layout
    const nodes = sortedData.map((d, index) => {
      const radius = radiusScale(d.calls);
      return {
        ...d,
        radius: radius,
        index: index
      };
    });

    // Calculate fixed positions in a horizontal line from left to right
    const calculateFixedPositions = (bubbles) => {
      if (bubbles.length === 0) return bubbles;

      // Find the maximum radius to center bubbles vertically
      const maxBubbleRadius = d3.max(bubbles, d => d.radius);

      // Calculate available width accounting for bubble sizes
      const availableWidth = width - (maxBubbleRadius * 2) - (padding * 2);
      const spacing = bubbles.length > 1 ? availableWidth / (bubbles.length - 1) : 0;

      bubbles.forEach((bubble, i) => {
        // Position horizontally from left to right, ensuring bubbles stay within bounds
        bubble.x = padding + maxBubbleRadius + (i * spacing);
        // Center vertically (accounting for year label below)
        bubble.y = maxBubbleRadius + padding + 5;
      });

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

    // Create color scale based on number of calls
    const colorScale = d3.scaleLinear()
      .domain([minCalls, maxCalls])
      .range(["#6b7280", "#374151"]); // gray-500 for low calls, gray-700 for high calls

    // Add main bubble circles with colors based on call count
    bubbleGroups.append("circle")
      .attr("class", "bubble-main")
      .attr("r", d => d.radius)
      .attr("fill", d => colorScale(d.calls))
      .attr("filter", "url(#glow)")
      .style("transition", "all 0.3s ease");

    // Function to calculate responsive text size for calls count
    const getCallsFontSize = (radius) => {
      // Calls count - BIG size
      if (radius < 20) return Math.max(10, radius * 0.50);
      if (radius < 30) return Math.max(12, radius * 0.48);
      if (radius < 40) return Math.max(14, radius * 0.45);
      return Math.max(16, radius * 0.42);
    };

    // Add calls count text at CENTER
    bubbleGroups.append("text")
      .attr("class", "bubble-calls")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em") // Vertically center the text
      .style("font-size", d => `${getCallsFontSize(d.radius)}px`)
      .style("font-weight", "bold")
      .style("fill", "#ffffff")
      .style("pointer-events", "none")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.3)")
      .text(d => d.calls.toLocaleString());

    // 3. Add year text OUTSIDE BELOW the bubble - smaller than text-xs and black
    bubbleGroups.append("text")
      .attr("class", "bubble-year")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius + 12) // Position below the bubble
      .style("font-size", "10px") // Smaller than text-xs (12px)
      .style("font-weight", "500")
      .style("fill", "#000000") // Black color
      .style("pointer-events", "none")
      .text(d => d.year);

    // Add hover effects
    bubbleGroups
      .on("mouseenter", function () {
        d3.select(this).select(".bubble-main")
          .transition()
          .duration(200)
          .attr("filter", "url(#glow) drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))");
      })
      .on("mouseleave", function () {
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

const InfluencerFlashCard = memo(({ data, rank, rankLabel, isLoggedIn }) => {
  const [showTooltip, setShowTooltip] = useState(null);

  // Get star rating from API data (180 days current_rating)
  const getStarRating = () => {
    // Try to get star rating from API response
    if (data?.star_rating?.overall?.["180_days"]?.current_rating !== undefined) {
      return data.star_rating.overall["180_days"].current_rating;
    }
    // Fallback to calculating from trust score if not available
    const trustScore = data?.trustScore || 75;
    return Math.min(5, Math.max(0, Math.round(trustScore / 20)));
  };

  // Render star rating with full, half, and empty stars
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar key={`full-${i}`} className="text-yellow-400" size={16} />
      );
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative inline-block" style={{ width: '16px', height: '16px' }}>
          <FaStar className="text-gray-400 absolute" size={16} />
          <div style={{ overflow: 'hidden', width: '50%', position: 'absolute' }}>
            <FaStar className="text-yellow-400" size={16} />
          </div>
        </div>
      );
    }

    // Add empty stars to make total 5
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaStar key={`empty-${i}`} className="text-gray-400" size={16} />
      );
    }

    return stars;
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

  const starRating = getStarRating();

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
    <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-600 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300">
      <div className="bg-white rounded-2xl overflow-hidden h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 p-4 relative overflow-hidden">
          {/* Decorative background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>

          <div className="flex items-center gap-3 relative z-10">
            {/* Profile Image - Centered */}
            <div className="relative flex-shrink-0">
              {profileImage ? (
                <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-lg ring-2 ring-white/50">
                  <Image
                    src={profileImage}
                    alt={influencerName}
                    width={64}
                    height={64}
                    className="rounded-full w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center shadow-xl border-3 border-white ring-2 ring-white/50">
                  <span className="text-xl font-bold text-white uppercase">
                    {(() => {
                      // Try to get channel name from various sources and convert to string
                      const name = String(data?.channel_name || data?.name || data?.title || data?.channel_id || influencerName || "?");

                      // Extract initials using word boundary pattern
                      const initials = name.match(/\b\w/g)?.join("").toUpperCase().slice(0, 4) || "?";

                      return initials;
                    })()}
                  </span>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white">
                  {/* Rank Badge - Above Name */}
                  <h3 className="text-base font-extrabold drop-shadow-md">{influencerName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      {channelType === "Telegram" ? channelType : `${channelType} • ${subscribers}`}
                    </span>
                  </div>
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
                  className="text-white text-xs hover:text-gray-100 font-bold whitespace-nowrap bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-white/30"
                >
                  View Full →
                </button>
              </div>

              {/* MCM Trust Score / Star Rating */}
              <div className="flex items-center justify-between">
                <div className="text-white text-xs font-semibold">MCM Rating</div>
                <div className="flex">
                  {renderStars(starRating)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
          {/* Total Calls */}
          <div className="bg-gradient-to-br from-white/80 via-indigo-50/50 to-fuchsia-50/50 backdrop-blur-sm rounded-xl p-4 shadow-md border border-indigo-100/50 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-extrabold bg-gradient-to-r from-indigo-700 to-fuchsia-700 bg-clip-text text-transparent">Total No.of Calls</h4>
              <button
                className="relative group"
                onMouseEnter={() => setShowTooltip('totalRecommendations')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FaInfoCircle className="text-indigo-400 text-xs hover:text-indigo-600 transition-colors" />
                {showTooltip === 'totalRecommendations' && (
                  <div className="absolute z-[9999] w-64 p-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xs rounded-lg shadow-2xl top-full left-1/2 -translate-x-1/2 mt-2 border border-gray-700 pointer-events-none">
                    <p className="text-left leading-relaxed">Total bullish and bearish recommendations given by the influencer each year.</p>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1">
                      <div className="border-4 border-transparent border-b-gray-900"></div>
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Chart Container */}
            <div className="mt-3 bg-white rounded-xl p-3 border border-indigo-200/50 shadow-inner">
              {totalCallsChartData && totalCallsChartData.length > 0 ? (
                <BubbleClusterChart data={totalCallsChartData.map(item => ({
                  year: item.year,
                  calls: item.total
                }))} />
              ) : (
                <div className="h-24 flex items-center justify-center text-gray-400 text-xs">No data available</div>
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
              className="text-indigo-600 text-xs font-bold mt-3 hover:text-indigo-700 transition-colors underline decoration-2 underline-offset-2"
            >
              View Total Calls Dashboard →
            </button>
          </div>

          {/* ROI % - Win Rate Percentage */}
          <div className="bg-gradient-to-br from-white/80 via-cyan-50/50 to-indigo-50/50 backdrop-blur-sm rounded-xl p-4 shadow-md border border-cyan-100/50 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-extrabold bg-gradient-to-r from-cyan-700 to-indigo-700 bg-clip-text text-transparent">ROI %</h4>
              <button
                className="relative group"
                onMouseEnter={() => setShowTooltip('roi')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FaInfoCircle className="text-cyan-400 text-xs hover:text-cyan-600 transition-colors" />
                {showTooltip === 'roi' && (
                  <div className="absolute z-[9999] w-72 p-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xs rounded-lg shadow-2xl -top-2 left-6 border border-gray-700 pointer-events-none">
                    <p className="text-left leading-relaxed mb-2">% of calls that generated positive returns (that is, where the price of the coin moved in the direction of the influencer&apos;s sentiment), for a 180 day holding period</p>
                    <p className="text-left leading-relaxed"><strong>H1:</strong> January to June</p>
                    <p className="text-left leading-relaxed"><strong>H2:</strong> June to December</p>
                  </div>
                )}
              </button>
            </div>
            {/* Line Graph */}
            <div className="mt-3 bg-white rounded-xl p-4 border border-cyan-200/50 shadow-inner">
              {roiGraphData && roiGraphData.length > 0 ? (
                (() => {
                  const dataPoints = roiGraphData;

                  // Fixed width to fit container without scrolling
                  const graphWidth = 280;
                  const graphHeight = 100;
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

                          const prevPoint = dataPoints[index - 1];

                          // Calculate Y positions for both points using same logic as data points
                          let y1, y2;

                          // Previous point Y position (use actualValue)
                          if (prevPoint.actualValue > 100) {
                            y1 = padding.top + (0 * graphHeight / (yLabels.length - 1));
                          } else if (prevPoint.actualValue < -100) {
                            y1 = padding.top + (5 * graphHeight / (yLabels.length - 1));
                          } else {
                            const clampedPrevValue = Math.max(-100, Math.min(100, prevPoint.actualValue));
                            const position1 = 3 - (clampedPrevValue / 50);
                            y1 = padding.top + (position1 * graphHeight / (yLabels.length - 1));
                          }

                          // Current point Y position (use actualValue)
                          if (point.actualValue > 100) {
                            y2 = padding.top + (0 * graphHeight / (yLabels.length - 1));
                          } else if (point.actualValue < -100) {
                            y2 = padding.top + (5 * graphHeight / (yLabels.length - 1));
                          } else {
                            const clampedValue = Math.max(-100, Math.min(100, point.actualValue));
                            const position2 = 3 - (clampedValue / 50);
                            y2 = padding.top + (position2 * graphHeight / (yLabels.length - 1));
                          }

                          const x1 = padding.left + ((index - 1) / (dataPoints.length - 1)) * graphWidth;
                          const x2 = padding.left + (index / (dataPoints.length - 1)) * graphWidth;

                          // Use #1e3a8a (dark blue) for positive values (>= 0), #dbeafe (light blue) for negative values (< 0)
                          const strokeColor = point.actualValue >= 0 ? "#1e3a8a" : "#dbeafe";

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

                          // Calculate Y position based on actualValue (not clamped value)
                          // Labels are at positions 0-5, where:
                          // Position 0 = 100+ (top)
                          // Position 1 = 100
                          // Position 2 = 50
                          // Position 3 = 0
                          // Position 4 = -50
                          // Position 5 = -100 (bottom)
                          let y;
                          if (point.actualValue > 100) {
                            // Values > 100 should be at position 0 (100+)
                            y = padding.top + (0 * graphHeight / (yLabels.length - 1));
                          } else if (point.actualValue < -100) {
                            // Values < -100 should be at position 5 (-100)
                            y = padding.top + (5 * graphHeight / (yLabels.length - 1));
                          } else {
                            // Map value to position 1-5 range
                            // 100 -> position 1, -100 -> position 5
                            const clampedValue = Math.max(-100, Math.min(100, point.actualValue));
                            // Convert value (-100 to 100) to position (5 to 1)
                            const position = 3 - (clampedValue / 50); // 100->1, 50->2, 0->3, -50->4, -100->5
                            y = padding.top + (position * graphHeight / (yLabels.length - 1));
                          }

                          // Use #1e3a8a (dark blue) for positive values (>= 0), #dbeafe (light blue) for negative values (< 0)
                          const fillColor = point.actualValue >= 0 ? "#1e3a8a" : "#dbeafe";

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
              className="text-cyan-600 text-xs font-bold mt-3 hover:text-cyan-700 transition-colors underline decoration-2 underline-offset-2"
            >
              View ROI Dashboard →
            </button>
          </div>

          {/* Moonshot Probability */}
          <div className="bg-gradient-to-br from-white/80 via-fuchsia-50/50 to-purple-50/50 backdrop-blur-sm rounded-xl p-4 shadow-md border border-fuchsia-100/50 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-extrabold bg-gradient-to-r from-fuchsia-700 to-purple-700 bg-clip-text text-transparent">Moonshots</h4>
              <button
                className="relative group"
                onMouseEnter={() => setShowTooltip('moonshot')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <FaInfoCircle className="text-fuchsia-400 text-xs hover:text-fuchsia-600 transition-colors" />
                {showTooltip === 'moonshot' && (
                  <div className="absolute z-[9999] w-64 p-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xs rounded-lg shadow-2xl -top-32 left-0 right-0 mx-auto border border-gray-700 pointer-events-none">
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
                      const percentage = Math.min(count, 100);

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
    </div>
  );
});

InfluencerFlashCard.displayName = 'InfluencerFlashCard';

export default InfluencerFlashCard;