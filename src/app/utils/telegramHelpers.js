// Utility functions for Telegram data processing

export const formatTelegramData = (data) => {
  if (!data || !data.success || !data.results) {
    return null;
  }

  return {
    channelId: data.results.channel_id,
    overall: data.results.Overall,
    aiScoring: data.results.Ai_scoring,
    lastUpdated: data.results.last_updated,
    totalRecords: data.results.total_records,
    cryptoRelated: data.results.crypto_related,
    // Add more formatted fields as needed
  };
};

export const calculatePerformanceMetrics = (overallData) => {
  if (!overallData) return {};

  const timeframes = ['1_hour', '24_hours', '7_days', '30_days', '60_days', '90_days'];
  const metrics = {};

  timeframes.forEach(timeframe => {
    const data = overallData[timeframe];
    if (data && (data.price_true_count > 0 || data.price_false_count > 0)) {
      metrics[timeframe] = {
        accuracy: data.price_probablity_of_winning_percentage || 0,
        avgReturns: data.price_returns_average || 0,
        totalPredictions: (data.price_true_count || 0) + (data.price_false_count || 0),
        correctPredictions: data.price_true_count || 0,
        incorrectPredictions: data.price_false_count || 0,
      };
    }
  });

  return metrics;
};

export const getSentimentDistribution = (overallData) => {
  if (!overallData) return {};

  return {
    bullish: overallData.bullish_count || 0,
    bearish: overallData.bearish_count || 0,
    neutral: overallData.neutral_count || 0,
    total: (overallData.bullish_count || 0) + (overallData.bearish_count || 0) + (overallData.neutral_count || 0),
  };
};

export const getPerformanceRating = (accuracy) => {
  if (accuracy >= 70) return { rating: 'Excellent', color: 'text-green-400' };
  if (accuracy >= 60) return { rating: 'Good', color: 'text-blue-400' };
  if (accuracy >= 50) return { rating: 'Average', color: 'text-yellow-400' };
  return { rating: 'Poor', color: 'text-red-400' };
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Not available';
  
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatNumber = (number) => {
  if (typeof number !== 'number') return 'N/A';
  return number.toLocaleString();
};

export const formatPercentage = (number, decimals = 2) => {
  if (typeof number !== 'number') return 'N/A';
  return `${number.toFixed(decimals)}%`;
};