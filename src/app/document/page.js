"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  FaChartLine, FaBalanceScale, FaChartBar, FaChartArea,
  FaCheckCircle, FaExclamationTriangle, FaArrowUp, FaArrowDown,
  FaBullhorn, FaLightbulb, FaShieldAlt, FaRocket, FaUsers,
  FaCoins, FaCog, FaGlobe, FaFileAlt, FaSpinner, FaDownload
} from "react-icons/fa";

// API URL (using local proxy)
const API_URL = "/api/document";

// Helper functions (matching Python script logic)
function formatDate(dateStr) {
  if (!dateStr || dateStr === "N/A") return dateStr;
  try {
    const dt = new Date(dateStr);
    const day = dt.getDate();
    const suffix = (day >= 11 && day <= 13) ? "th" :
      { 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th";
    const month = dt.toLocaleString('en-US', { month: 'short' });
    const year = dt.getFullYear().toString().slice(-2);
    return `${day}${suffix} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

function hasContent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    return !['', 'N/A', 'n/a', 'NA', 'None'].includes(value.trim());
  }
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.values(value).some(v => hasContent(v));
  }
  return true;
}

function parseNumberedText(text) {
  if (!text || typeof text !== 'string') return null;
  if (!/^1[.)]\s+(?=[A-Z])/.test(text)) return null;

  const matches = [...text.matchAll(/([1-9]\d?)[.)]\s+/g)];
  if (!matches.length) return null;

  const items = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const num = m[1];
    const start = m.index + m[0].length;

    if (m.index > 0 && /\d/.test(text[m.index - 1])) continue;

    let end = text.length;
    for (let j = i + 1; j < matches.length; j++) {
      const nextM = matches[j];
      if (nextM.index === 0 || !/\d/.test(text[nextM.index - 1])) {
        end = nextM.index;
        break;
      }
    }

    const content = text.slice(start, end).trim();
    if (content) items.push({ num, content });
  }

  return items.length >= 2 ? items : null;
}

function extractCoinData(coinData) {
  const safeDict = (val) => (typeof val === 'object' && val !== null && !Array.isArray(val)) ? val : {};

  const pdfReport = safeDict(coinData?.pdf_report);
  const whitepaper = safeDict(coinData?.whitepaper_analysis);
  let aiSummary = coinData?.ai_summary;
  if (typeof aiSummary === 'object' && aiSummary !== null) {
    aiSummary = safeDict(aiSummary?.["30_days"]);
  } else {
    aiSummary = {};
  }
  const priceChartData = safeDict(pdfReport?.price_chart_data);

  const sourceId = coinData?.source_id || "unknown";

  return {
    sourceId,
    symbol: (coinData?.symbol || sourceId).toUpperCase(),
    name: (pdfReport?.name || sourceId).toUpperCase(),
    imageUrl: coinData?.image_large || coinData?.image_small || coinData?.image_thumb || "",
    analysisDate: formatDate(pdfReport?.analysis_date || "N/A"),
    analysisDateRaw: pdfReport?.analysis_date || "N/A",
    analysisTime: pdfReport?.analysis_time || "N/A",
    basePrice: pdfReport?.base_price || "N/A",

    // Social Analysis
    socialAnalysis: {
      summary: safeDict(pdfReport?.social_analysis)?.summary || "",
      sentiment: safeDict(pdfReport?.social_analysis)?.sentiment || "",
      keyPoints: safeDict(pdfReport?.social_analysis)?.key_points || [],
      bullishFactors: aiSummary?.bullish_factors || "",
      bearishConcerns: aiSummary?.bearish_concerns || "",
      marketTrends: aiSummary?.market_trends || "",
      keyEvents: aiSummary?.key_events || "",
      importantAlerts: aiSummary?.important_alerts || "",
    },

    // Fundamental Analysis
    fundamentalAnalysis: {
      summary: safeDict(pdfReport?.fundamental_analysis)?.summary || "",
      score: safeDict(pdfReport?.fundamental_analysis)?.score || "",
      strengths: safeDict(pdfReport?.fundamental_analysis)?.strengths || [],
      weaknesses: safeDict(pdfReport?.fundamental_analysis)?.weaknesses || [],
      whitepaper: {
        coreConcept: safeDict(whitepaper?.core_concept),
        features: whitepaper?.features || [],
        tokenPurpose: safeDict(whitepaper?.token_purpose),
        technology: safeDict(whitepaper?.technology),
        team: safeDict(whitepaper?.team),
        marketFit: safeDict(whitepaper?.market_fit),
        tokenomics: safeDict(whitepaper?.tokenomics),
      }
    },

    // Technical Analysis
    technicalAnalysis: {
      summary: safeDict(pdfReport?.technical_analysis)?.summary || "",
      trend1h: safeDict(pdfReport?.technical_analysis)?.trend_1h || "",
      trend1d: safeDict(pdfReport?.technical_analysis)?.trend_1d || "",
      trend1w: safeDict(pdfReport?.technical_analysis)?.trend_1w || "",
      indicators: safeDict(safeDict(pdfReport?.technical_analysis)?.indicators)?.summary || "",
      keyLevels: safeDict(safeDict(pdfReport?.technical_analysis)?.key_levels),
      buyingRange: aiSummary?.buying_range || "",
      sellingRange: aiSummary?.selling_range || "",
    },

    // Overall Evaluation
    overallEvaluation: {
      summary: safeDict(pdfReport?.overall_evaluation)?.summary || "",
      keyStrengths: safeDict(pdfReport?.overall_evaluation)?.key_strengths || [],
      keyWeaknesses: safeDict(pdfReport?.overall_evaluation)?.key_weaknesses || [],
      finalNotes: safeDict(pdfReport?.overall_evaluation)?.final_notes || "",
    },

    // Price Chart Data
    priceChart: {
      high52w: priceChartData?.high_52w,
      low52w: priceChartData?.low_52w,
      change1d: priceChartData?.change_1d,
      change1w: priceChartData?.change_1w,
      change1y: priceChartData?.change_1y,
      dateRanges: priceChartData?.date_ranges || {},
      chartBinary: priceChartData?.price_chart_binary,
      chartSummary: pdfReport?.chart_summary || "",
    },

    // Conclusion
    conclusion: safeDict(pdfReport?.conclusion)?.summary || "",
  };
}

// Components
function SectionHeader({ number, title, icon: Icon }) {
  return (
    <div style={{ marginBottom: '24px', paddingBottom: '12px', borderBottom: '2px solid #e5e7eb' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          <tr>
            <td style={{ width: '40px', padding: '0', verticalAlign: 'middle' }}>
              <div
                className="rounded-xl text-white shadow-lg"
                style={{
                  background: 'linear-gradient(to bottom right, #3b82f6, #a855f7)',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon className="text-lg" />
              </div>
            </td>
            <td style={{ paddingLeft: '12px', verticalAlign: 'middle' }}>
              <span
                style={{
                  color: '#7c3aed',
                  fontSize: '1.25rem',
                  fontWeight: '700'
                }}
              >
                {number}. {title}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SubsectionHeader({ title, score = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', marginBottom: '12px' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>{title}</h3>
      {score !== null && (
        <span
          style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'linear-gradient(to right, #dbeafe, #f3e8ff)',
            display: 'inline-block',
            fontSize: '14px',
            fontWeight: '700',
            color: '#7c3aed'
          }}
        >
          Score: {score}/10
        </span>
      )}
    </div>
  );
}

function BulletList({ items, parseText = false }) {
  if (!items || (Array.isArray(items) && items.length === 0)) return null;

  let listItems = [];

  if (typeof items === 'string') {
    const parsed = parseNumberedText(items);
    if (parsed) {
      listItems = parsed.map(p => p.content);
    } else {
      listItems = [items];
    }
  } else if (Array.isArray(items)) {
    items.forEach(item => {
      const parsed = parseNumberedText(String(item));
      if (parsed) {
        listItems.push(...parsed.map(p => p.content));
      } else {
        listItems.push(item);
      }
    });
  }

  if (listItems.length === 0) return null;

  return (
    <div style={{ marginLeft: '16px' }}>
      {listItems.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', width: '100%', marginBottom: '12px', breakInside: 'avoid' }}>
          <div style={{ width: '20px', flexShrink: 0, paddingTop: '10px' }}>
            <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: 'linear-gradient(to right, #3b82f6, #a855f7)' }} />
          </div>
          <div style={{ flex: 1, color: '#374151', textAlign: 'justify', lineHeight: '1.6' }}>
            {item}
          </div>
        </div>
      ))}
    </div>
  );
}

function TextContent({ text }) {
  if (!hasContent(text)) return null;

  const parsed = parseNumberedText(text);
  if (parsed) {
    return <BulletList items={parsed.map(p => p.content)} />;
  }

  return <p style={{ color: '#374151', lineHeight: '1.75', textAlign: 'justify' }}>{text}</p>;
}

function TrendTable({ trend1h, trend1d, trend1w }) {
  if (!hasContent(trend1h) && !hasContent(trend1d) && !hasContent(trend1w)) return null;

  const trends = [
    { label: "1 Hour", value: trend1h },
    { label: "1 Day", value: trend1d },
    { label: "1 Week", value: trend1w },
  ].filter(t => hasContent(t.value));

  return (
    <div style={{ marginTop: '16px', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'linear-gradient(to right, #3b82f6, #a855f7)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'white' }}>Timeframe</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'white' }}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {trends.map((trend, idx) => (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'white' }}>
              <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1f2937' }}>{trend.label}</td>
              <td style={{ padding: '12px 16px', color: '#4b5563' }}>{trend.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KeyLevelsTable({ support = [], resistance = [] }) {
  if ((!support || support.length === 0) && (!resistance || resistance.length === 0)) return null;

  const maxRows = Math.max(support?.length || 0, resistance?.length || 0);

  return (
    <div style={{ marginTop: '16px', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'linear-gradient(to right, #3b82f6, #a855f7)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'white' }}>Support</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'white' }}>Resistance</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, idx) => (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'white' }}>
              <td style={{ padding: '12px 16px', textAlign: 'center', color: '#16a34a', fontWeight: '500' }}>
                {support?.[idx] !== undefined ? `$${support[idx]}` : "-"}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center', color: '#ef4444', fontWeight: '500' }}>
                {resistance?.[idx] !== undefined ? `$${resistance[idx]}` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PriceMovementTable({ data }) {
  const formatChange = (val) => {
    if (val === null || val === undefined) return { text: "N/A", color: '#9ca3af' };
    const color = val >= 0 ? '#16a34a' : '#ef4444';
    const sign = val >= 0 ? "+" : "";
    return { text: `${sign}${val}%`, color };
  };

  const change1d = formatChange(data.change1d);
  const change1w = formatChange(data.change1w);
  const change1y = formatChange(data.change1y);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginTop: '24px' }}>
      {/* 52 Weeks */}
      <div style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ background: 'linear-gradient(to right, #3b82f6, #a855f7)', color: 'white', padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
          52 WEEKS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div style={{ backgroundColor: '#f0fdf4', padding: '8px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>HIGH</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a', wordBreak: 'break-word' }}>
              {data.high52w ? `$${data.high52w}` : "N/A"}
            </div>
          </div>
          <div style={{ backgroundColor: '#fef2f2', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>LOW</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#ef4444', wordBreak: 'break-word' }}>
              {data.low52w ? `$${data.low52w}` : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Price Movement */}
      <div style={{ overflow: 'hidden', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ background: 'linear-gradient(to right, #3b82f6, #a855f7)', color: 'white', padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
          PRICE MOVEMENT
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div style={{ backgroundColor: '#fefce8', padding: '8px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>1 Day</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: change1d.color, wordBreak: 'break-word' }}>{change1d.text}</div>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', padding: '8px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>1 Week</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: change1w.color, wordBreak: 'break-word' }}>{change1w.text}</div>
          </div>
          <div style={{ backgroundColor: '#fdf2f8', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>1 Year</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: change1y.color, wordBreak: 'break-word' }}>{change1y.text}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoinSelector({ coins, selectedCoin, onSelect }) {
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {coins.map((coin) => (
        <button
          key={coin.sourceId}
          onClick={() => onSelect(coin)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-200 ${selectedCoin?.sourceId === coin.sourceId
            ? "border-purple-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md"
            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
        >
          {coin.imageUrl && (
            <Image src={coin.imageUrl} alt={coin.symbol} width={24} height={24} className="rounded-full" />
          )}
          <span className={`font-semibold ${selectedCoin?.sourceId === coin.sourceId
            ? "bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
            : "text-gray-700"
            }`}>
            {coin.symbol}
          </span>
        </button>
      ))}
    </div>
  );
}

// Main Report Component
function CoinReport({ data }) {
  // Decode chart image
  let chartImageSrc = null;
  if (data.priceChart.chartBinary) {
    let base64 = data.priceChart.chartBinary;
    if (typeof base64 === 'object') {
      if (base64.$binary) {
        base64 = base64.$binary.base64 || base64.$binary;
      } else if (base64.base64) {
        base64 = base64.base64;
      }
    }
    if (typeof base64 === 'string') {
      chartImageSrc = `data:image/png;base64,${base64}`;
    }
  }

  return (
    <div className="max-w-5xl mx-auto print:max-w-none print:mx-0">
      {/* Report Header */}
      <div className="mb-10 pb-8 border-b-2 border-gradient">
        {/* Header with gradient background */}
        <div
          className="p-6 shadow-lg rounded-2xl pdf-no-rounded"
          style={{
            background: 'linear-gradient(to right, #3b82f6, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          {/* Left side - Title and Date */}
          <div style={{ flex: '1', minWidth: '250px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              {data.imageUrl && (
                <Image src={data.imageUrl} alt={data.name} width={48} height={48} className="rounded-full shadow-lg" />
              )}
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', margin: 0 }}>
                {data.name} - Market Analysis Report
              </h1>
            </div>
            <p style={{ color: 'white', fontStyle: 'italic', margin: 0 }}>
              Analysis Date: {data.analysisDate} - Analysis Time: {data.analysisTime} UTC
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Flowing Layout */}
      <div className="bg-white border border-gray-200 p-8 columns-1 lg:columns-2 gap-8">
        {/* 1. Social Analysis */}
        {(hasContent(data.socialAnalysis.summary) || hasContent(data.socialAnalysis.bullishFactors)) && (
          <div className="mb-8 pb-8 border-b border-gray-200 break-inside-avoid">
            <SectionHeader number={1} title="Social Analysis" icon={FaBullhorn} />

            {hasContent(data.socialAnalysis.summary) && (
              <TextContent text={data.socialAnalysis.summary} />
            )}

            {hasContent(data.socialAnalysis.sentiment) && (
              <p className="mt-4 text-gray-700">
                <span className="font-semibold">Sentiment:</span>{" "}
                <span className={`font-medium ${data.socialAnalysis.sentiment.toLowerCase().includes('bullish')
                  ? 'text-green-600'
                  : data.socialAnalysis.sentiment.toLowerCase().includes('bearish')
                    ? 'text-red-500'
                    : 'text-gray-700'
                  }`}>
                  {data.socialAnalysis.sentiment}
                </span>
              </p>
            )}

            {hasContent(data.socialAnalysis.keyPoints) && (
              <>
                <SubsectionHeader title="Key Social Points" />
                <BulletList items={data.socialAnalysis.keyPoints} />
              </>
            )}

            {hasContent(data.socialAnalysis.bullishFactors) && (
              <>
                <SubsectionHeader title="Bullish Factors" />
                <div className="bg-green-50 p-4 border border-green-100" style={{ borderRadius: '12px' }}>
                  <TextContent text={data.socialAnalysis.bullishFactors} />
                </div>
              </>
            )}

            {hasContent(data.socialAnalysis.bearishConcerns) && (
              <>
                <SubsectionHeader title="Bearish Concerns" />
                <div className="bg-red-50 p-4 border border-red-100" style={{ borderRadius: '12px' }}>
                  <TextContent text={data.socialAnalysis.bearishConcerns} />
                </div>
              </>
            )}

            {hasContent(data.socialAnalysis.marketTrends) && (
              <>
                <SubsectionHeader title="Market Trends" />
                <TextContent text={data.socialAnalysis.marketTrends} />
              </>
            )}

            {hasContent(data.socialAnalysis.keyEvents) && (
              <>
                <SubsectionHeader title="Key Events" />
                <TextContent text={data.socialAnalysis.keyEvents} />
              </>
            )}

            {hasContent(data.socialAnalysis.importantAlerts) && (
              <>
                <SubsectionHeader title="Important Alerts" />
                <div className="bg-amber-50 p-4 border border-amber-200" style={{ borderRadius: '12px' }}>
                  <TextContent text={data.socialAnalysis.importantAlerts} />
                </div>
              </>
            )}
          </div>
        )}

        {/* 2. Fundamental Analysis */}
        {(hasContent(data.fundamentalAnalysis.summary) || hasContent(data.fundamentalAnalysis.whitepaper)) && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <SectionHeader number={2} title="Fundamental Analysis" icon={FaBalanceScale} />

            {hasContent(data.fundamentalAnalysis.summary) && (
              <TextContent text={data.fundamentalAnalysis.summary} />
            )}

            {hasContent(data.fundamentalAnalysis.score) && (
              <div style={{ marginTop: '16px' }}>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(to right, #dbeafe, #f3e8ff)',
                    display: 'inline-block',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#7c3aed'
                  }}
                >
                  Score: {data.fundamentalAnalysis.score}/10
                </span>
              </div>
            )}

            {hasContent(data.fundamentalAnalysis.strengths) && (
              <>
                <SubsectionHeader title="Strengths" />
                <div className="bg-green-50 p-4 border border-green-100" style={{ borderRadius: '12px' }}>
                  <BulletList items={data.fundamentalAnalysis.strengths} />
                </div>
              </>
            )}

            {hasContent(data.fundamentalAnalysis.weaknesses) && (
              <>
                <SubsectionHeader title="Weaknesses" />
                <div className="bg-red-50 p-4 border border-red-100" style={{ borderRadius: '12px' }}>
                  <BulletList items={data.fundamentalAnalysis.weaknesses} />
                </div>
              </>
            )}

            {/* Whitepaper sections */}
            {hasContent(data.fundamentalAnalysis.whitepaper.coreConcept?.summary) && (
              <>
                <SubsectionHeader
                  title="Core Concept"
                  score={data.fundamentalAnalysis.whitepaper.coreConcept?.score}
                />
                <TextContent text={data.fundamentalAnalysis.whitepaper.coreConcept.summary} />
              </>
            )}

            {hasContent(data.fundamentalAnalysis.whitepaper.features) && (
              <>
                <SubsectionHeader title="Product Features" />
                <BulletList items={data.fundamentalAnalysis.whitepaper.features} />
              </>
            )}

            {hasContent(data.fundamentalAnalysis.whitepaper.tokenPurpose?.summary) && (
              <>
                <SubsectionHeader
                  title="Token Purpose"
                  score={data.fundamentalAnalysis.whitepaper.tokenPurpose?.score}
                />
                <TextContent text={data.fundamentalAnalysis.whitepaper.tokenPurpose.summary} />
              </>
            )}

            {hasContent(data.fundamentalAnalysis.whitepaper.technology?.summary) && (
              <>
                <SubsectionHeader
                  title="Technology"
                  score={data.fundamentalAnalysis.whitepaper.technology?.score}
                />
                <TextContent text={data.fundamentalAnalysis.whitepaper.technology.summary} />
              </>
            )}

            {hasContent(data.fundamentalAnalysis.whitepaper.team?.summary) && (
              <>
                <SubsectionHeader
                  title="Team"
                  score={data.fundamentalAnalysis.whitepaper.team?.score}
                />
                <TextContent text={data.fundamentalAnalysis.whitepaper.team.summary} />
              </>
            )}

            {hasContent(data.fundamentalAnalysis.whitepaper.marketFit?.summary) && (
              <>
                <SubsectionHeader
                  title="Market Fit"
                  score={data.fundamentalAnalysis.whitepaper.marketFit?.score}
                />
                <TextContent text={data.fundamentalAnalysis.whitepaper.marketFit.summary} />
              </>
            )}

            {hasContent(data.fundamentalAnalysis.whitepaper.tokenomics?.summary) && (
              <>
                <SubsectionHeader
                  title="Tokenomics"
                  score={data.fundamentalAnalysis.whitepaper.tokenomics?.score}
                />
                <TextContent text={data.fundamentalAnalysis.whitepaper.tokenomics.summary} />
              </>
            )}
          </div>
        )}

        {/* 3. Technical Analysis */}
        {hasContent(data.technicalAnalysis.summary) && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <SectionHeader number={3} title="Technical Analysis" icon={FaChartLine} />

            <TextContent text={data.technicalAnalysis.summary} />

            <SubsectionHeader title="Trend Overview" />
            <TrendTable
              trend1h={data.technicalAnalysis.trend1h}
              trend1d={data.technicalAnalysis.trend1d}
              trend1w={data.technicalAnalysis.trend1w}
            />

            {hasContent(data.technicalAnalysis.indicators) && (
              <>
                <SubsectionHeader title="Technical Indicators" />
                <TextContent text={data.technicalAnalysis.indicators} />
              </>
            )}

            {hasContent(data.technicalAnalysis.keyLevels) && (
              <>
                <SubsectionHeader title="Key Levels" />
                <KeyLevelsTable
                  support={data.technicalAnalysis.keyLevels.support}
                  resistance={data.technicalAnalysis.keyLevels.resistance}
                />
              </>
            )}

            {/* Price Chart - Now part of Technical Analysis */}
            {(chartImageSrc || hasContent(data.priceChart.chartSummary)) && (
              <>
                <SubsectionHeader title="Price Chart" />

                {/* Price Box - Above Chart */}
                {hasContent(data.basePrice) && (
                  <div
                    className="rounded-xl mb-4"
                    style={{
                      backgroundColor: 'white',
                      overflow: 'hidden',
                      textAlign: 'center',
                      maxWidth: '205px',
                      borderRadius: '12px',
                      border: '2px solid #e5e7eb',
                      margin: '0 auto 16px auto'
                    }}
                  >
                    <div
                      style={{
                        background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(168, 85, 247))',
                        padding: '6px 8px',
                        fontSize: '0.65rem',
                        fontWeight: '500'
                      }}
                    >
                      <svg width="100%" height="14" style={{ display: 'block' }}>
                        <text
                          x="50%"
                          y="10"
                          textAnchor="middle"
                          fill="white"
                          style={{ fontSize: '0.65rem', fontWeight: '500' }}
                        >
                          Price at the time of publishing this report
                        </text>
                      </svg>
                    </div>
                    <div
                      style={{
                        padding: '8px 12px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#1f2937'
                      }}
                    >
                      ${Number(data.basePrice).toLocaleString()}
                    </div>
                  </div>
                )}


                {chartImageSrc && (
                  <div className="flex justify-center mb-6">
                    <img
                      src={chartImageSrc}
                      alt={`${data.name} Price Chart`}
                      className="max-w-full h-auto border border-gray-200"
                    />
                  </div>
                )}

                <PriceMovementTable data={data.priceChart} />

                {/* Date Ranges */}
                {hasContent(data.priceChart.dateRanges) && (
                  <div className="mt-4 text-center text-sm text-gray-500 font-medium">
                    {data.priceChart.dateRanges["1_day"] && (
                      <span className="mr-4">
                        1 day: {data.priceChart.dateRanges["1_day"].from} → {data.priceChart.dateRanges["1_day"].to}
                      </span>
                    )}
                    {data.priceChart.dateRanges["1_week"] && (
                      <span className="mr-4">
                        | 1 week: {data.priceChart.dateRanges["1_week"].from} → {data.priceChart.dateRanges["1_week"].to}
                      </span>
                    )}
                    {data.priceChart.dateRanges["1_year"] && (
                      <span>
                        | 1 year: {data.priceChart.dateRanges["1_year"].from} → {data.priceChart.dateRanges["1_year"].to}
                      </span>
                    )}
                  </div>
                )}

                {hasContent(data.priceChart.chartSummary) && (
                  <>
                    <SubsectionHeader title="Chart Analysis" />
                    <TextContent text={data.priceChart.chartSummary} />
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* 4. Conclusion */}
        {hasContent(data.conclusion) && (
          <div className="mb-8 pb-8 break-inside-avoid">
            <SectionHeader number={4} title="Conclusion" icon={FaFileAlt} />
            <TextContent text={data.conclusion} />
          </div>
        )}

        {/* Footer - Inside column container with borders */}
        <div style={{ textAlign: 'center', padding: '24px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', breakInside: 'avoid' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Generated by <span style={{ fontWeight: '600', color: '#7c3aed' }}>MyCryptoMonitor</span>
          </p>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: '24px', padding: '20px', background: 'linear-gradient(to right, #3b82f6, #a855f7)', borderRadius: '12px', breakInside: 'avoid' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'white', marginTop: 0, marginBottom: '12px' }}>
            Important Disclaimer
          </h4>
          <div style={{ fontSize: '0.85rem', color: 'white', lineHeight: '1.75' }}>
            <p style={{ margin: '0 0 12px 0', textAlign: 'justify' }}>
              This report is generated for informational and educational purposes only and does not constitute financial, investment, trading, or legal advice.
            </p>
            <p style={{ margin: '0 0 12px 0', textAlign: 'justify' }}>
              The analysis presented is produced using artificial intelligence based on historical market data, publicly available information, and predefined analytical frameworks. It is descriptive in nature, not predictive, and should not be interpreted as a recommendation to buy, sell, or hold any digital asset.
            </p>
            <p style={{ margin: '0 0 12px 0', textAlign: 'justify' }}>
              Cryptocurrencies are volatile and involve significant risk. Market conditions can change rapidly, and outcomes may differ materially from historical patterns or analytical observations.
            </p>
            <p style={{ margin: '0 0 12px 0', textAlign: 'justify' }}>
              The creators of this report do not guarantee the accuracy, completeness, or reliability of the information contained herein and accept no liability for any losses arising from reliance on this report.
            </p>
            <p style={{ margin: '0 0 12px 0', textAlign: 'justify' }}>
              Users are encouraged to conduct independent research and seek professional advice before making financial decisions.
            </p>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              This report provides analytical context only and should not be used as the sole basis for financial decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component with Search Params
function DocumentPageContent() {
  const searchParams = useSearchParams();
  const coinParam = searchParams.get('coin'); // Get coin symbol from URL query
  const autoDownload = searchParams.get('download') === 'true'; // Check if auto-download requested

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [analysisDate, setAnalysisDate] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);
  const reportRef = useRef(null);

  // PDF Download function
  const handleDownloadPDF = useCallback(async () => {
    if (!reportRef.current || !selectedCoin) return;

    setDownloading(true);
    try {
      // Dynamically import libraries
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = reportRef.current;

      // Add a temporary class for PDF rendering
      element.classList.add('pdf-rendering');

      // Wait for styles to apply and layout to settle
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create canvas with html2canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1280, // Fixed width to ensure proper column layout
        windowHeight: element.scrollHeight,
        // Ignore unsupported CSS color functions
        ignoreElements: (el) => false,
        onclone: (clonedDoc) => {
          // Hide only coin logos, keep chart images visible
          const allImages = clonedDoc.querySelectorAll('img');
          allImages.forEach(img => {
            // Hide logos (they have rounded-full class or logo in alt text)
            if (img.classList.contains('rounded-full') ||
              (img.alt && img.alt.toLowerCase().includes('logo'))) {
              img.style.display = 'none';
            } else {
              // Make sure chart images are visible
              img.style.display = 'block';
              img.style.visibility = 'visible';
              img.style.opacity = '1';
            }
          });

          // Remove rounded corners for PDF
          const noRoundedElements = clonedDoc.querySelectorAll('.pdf-no-rounded');
          noRoundedElements.forEach(el => {
            el.style.setProperty('border-radius', '0', 'important');
          });

          // Ensure score badges are visible (inline-flex with rounded-lg)
          const scoreBadges = clonedDoc.querySelectorAll('.inline-flex.rounded-lg');
          scoreBadges.forEach(badge => {
            badge.style.display = 'inline-flex';
            badge.style.visibility = 'visible';
            badge.style.opacity = '1';
            badge.style.backgroundColor = '#f5f3ff';
          });

          // Ensure subsection score badges are visible (span with rounded-full)
          const subsectionScores = clonedDoc.querySelectorAll('span.rounded-full');
          subsectionScores.forEach(score => {
            // Remove gradient classes that might interfere
            score.classList.remove('bg-gradient-to-r', 'from-blue-100', 'to-purple-100');

            score.style.setProperty('display', 'inline-block', 'important');
            score.style.setProperty('visibility', 'visible', 'important');
            score.style.setProperty('opacity', '1', 'important');
            score.style.setProperty('background-color', '#ede9fe', 'important');
            score.style.setProperty('background-image', 'none', 'important');
            score.style.setProperty('background', '#ede9fe', 'important');
            score.style.setProperty('color', '#9333ea', 'important');
            score.style.setProperty('border-radius', '9999px', 'important');
            score.style.setProperty('padding-left', '0.75rem', 'important');
            score.style.setProperty('padding-right', '0.75rem', 'important');
            score.style.setProperty('padding-top', '4px', 'important');
            score.style.setProperty('padding-bottom', '6px', 'important');
            score.style.setProperty('font-size', '0.875rem', 'important');
            score.style.setProperty('font-weight', '700', 'important');
            score.style.setProperty('line-height', '1.1', 'important');
            score.style.setProperty('text-align', 'center', 'important');
            score.style.setProperty('box-sizing', 'border-box', 'important');
          });

          // Convert lab() colors to hex in the cloned document
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const bgColor = computedStyle.backgroundColor;
            const color = computedStyle.color;

            // If color contains 'lab(' or 'oklch(', replace with fallback
            if (bgColor && (bgColor.includes('lab(') || bgColor.includes('oklch('))) {
              el.style.backgroundColor = '#ffffff';
            }
            if (color && (color.includes('lab(') || color.includes('oklch('))) {
              el.style.color = '#1f2937';
            }
          });
        }
      });

      // Remove the temporary class
      element.classList.remove('pdf-rendering');

      // Calculate PDF dimensions for single long page
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF with custom page size matching content height (single long page)
      const pdf = new jsPDF('p', 'mm', [imgWidth, imgHeight]);

      // Add the entire content as a single page
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgWidth, imgHeight);

      // Save the PDF
      pdf.save(`${selectedCoin.symbol}_Market_Analysis_Report.pdf`);

    } catch (err) {
      console.error('Error generating PDF:', err);
      // Remove the class even on error
      if (reportRef.current) {
        reportRef.current.classList.remove('pdf-rendering');
      }
      // Show more detailed error message
      alert(`Failed to generate PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setDownloading(false);
    }
  }, [selectedCoin]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        if (!data.success) throw new Error("API returned unsuccessful response");

        const results = data.results || [];
        const extractedCoins = results.map(coin => extractCoinData(coin));

        setCoins(extractedCoins);
        setAnalysisDate(data.analysisDate || "");

        // If coin parameter is provided, find and select that coin
        if (coinParam && extractedCoins.length > 0) {
          const matchedCoin = extractedCoins.find(
            c => c.symbol.toLowerCase() === coinParam.toLowerCase() ||
                 c.sourceId.toLowerCase() === coinParam.toLowerCase()
          );
          if (matchedCoin) {
            setSelectedCoin(matchedCoin);
          } else {
            // Fallback to first coin if no match found
            setSelectedCoin(extractedCoins[0]);
          }
        } else if (extractedCoins.length > 0) {
          setSelectedCoin(extractedCoins[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [coinParam]);

  // Auto-download PDF when coin is selected and autoDownload is true
  useEffect(() => {
    if (autoDownload && selectedCoin && !loading && !hasAutoDownloaded && reportRef.current) {
      // Small delay to ensure the report is fully rendered
      const timer = setTimeout(() => {
        setHasAutoDownloaded(true);
        handleDownloadPDF();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, selectedCoin, loading, hasAutoDownloaded, handleDownloadPDF]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-5xl text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading market analysis reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (coins.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <FaFileAlt className="text-5xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Reports Available</h2>
          <p className="text-gray-600">No coin analysis reports found for today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
            Market Analysis Reports
          </h1>
          <p className="text-gray-600">
            Analysis Date: <span className="font-semibold">{formatDate(analysisDate)}</span>
          </p>
        </div>

        {/* Coin Selector and Download Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <CoinSelector
            coins={coins}
            selectedCoin={selectedCoin}
            onSelect={setSelectedCoin}
          />

          {selectedCoin && (
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FaDownload />
                  Download PDF
                </>
              )}
            </button>
          )}
        </div>

        {/* Report Content */}
        <div ref={reportRef}>
          {selectedCoin && <CoinReport data={selectedCoin} />}
        </div>
      </div>
    </div>
  );
}

// Export wrapped in Suspense
export default function DocumentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-5xl text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading market analysis reports...</p>
        </div>
      </div>
    }>
      <DocumentPageContent />
    </Suspense>
  );
}
