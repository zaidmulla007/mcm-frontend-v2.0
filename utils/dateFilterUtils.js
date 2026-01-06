/**
 * Get current quarter based on month (0-based)
 */
export const getCurrentQuarter = (month) => {
  if (month <= 2) return 1; // Jan, Feb, Mar
  if (month <= 5) return 2; // Apr, May, Jun
  if (month <= 8) return 3; // Jul, Aug, Sep
  return 4; // Oct, Nov, Dec
};

/**
 * Generate dynamic years array
 * @param {number} startYear - Starting year (default: 2022)
 * @param {boolean} includeNextYear - Whether to include next year (default: false)
 */
export const getAvailableYears = (startYear = 2022, includeNextYear = false) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-based

  // Rule: Current year is only available if Q1 (Jan-Mar) is completed.
  // Q1 ends on March 31st. So from April (month index 3) the current year is available.
  let endYear = currentYear;
  if (currentMonth < 3) { // Jan(0), Feb(1), Mar(2)
    endYear = currentYear - 1;
  }

  if (includeNextYear) {
    endYear += 1;
  }

  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  return years;
};

/**
 * Get available quarters for a specific year
 * @param {number} year - The year to get quarters for
 */
export const getAvailableQuarters = (year) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-based (0=Jan, 11=Dec)
  const currentDay = currentDate.getDate();

  const allQuarters = [
    { value: 1, label: 'Q1' },
    { value: 2, label: 'Q2' },
    { value: 3, label: 'Q3' },
    { value: 4, label: 'Q4' }
  ];

  // If it's the current year, only show completed quarters
  if (year === currentYear) {
    let completedQuarters = 0;

    // Q1 (Jan-Mar): Complete if we're past March or in April+
    if (currentMonth >= 3) completedQuarters = 1;

    // Q2 (Apr-Jun): Complete if we're past June or in July+  
    if (currentMonth >= 6) completedQuarters = 2;

    // Q3 (Jul-Sep): Complete if we're past September or in October+
    if (currentMonth >= 9) completedQuarters = 3;

    // Q4 (Oct-Dec): Complete if we're past December (next year)
    if (currentMonth >= 12) completedQuarters = 4; // This won't happen in same year

    return allQuarters.filter(q => q.value <= completedQuarters);
  }

  // If it's a future year, don't show any quarters (or show all for planning)
  if (year > currentYear) {
    return []; // Change to allQuarters if you want to allow future quarters
  }

  // For past years, show all quarters
  return allQuarters;
};

/**
 * Generate year options for the dropdown including "All Years"
 * @param {number} startYear - Starting year (default: 2022)
 * @param {boolean} includeNextYear - Whether to include next year (default: false)
 */
export const getYearOptions = (startYear = 2022, includeNextYear = false) => {
  const years = getAvailableYears(startYear, includeNextYear);
  const options = [{ value: "all", label: "All Years" }];

  // Reverse the years array to show current year first (descending order)
  years.reverse().forEach(year => {
    options.push({ value: year.toString(), label: year.toString() });
  });

  return options;
};

/**
 * Generate quarter options for the dropdown including "All Quarters"
 * @param {string|number} selectedYear - The selected year (can be "all" or a year number)
 */
export const getQuarterOptions = (selectedYear) => {
  const options = [{ value: "all", label: "All Quarters" }];

  // If no year is selected or "all" is selected, return only "All Quarters"
  if (!selectedYear || selectedYear === "all") {
    return options;
  }

  const year = parseInt(selectedYear);
  const availableQuarters = getAvailableQuarters(year);

  availableQuarters.forEach(quarter => {
    const label = `${quarter.label} (${getQuarterMonths(quarter.value)})`;
    options.push({
      value: quarter.label, // Use Q1, Q2, Q3, Q4 format to match API
      label: label
    });
  });

  return options;
};

/**
 * Get month range for a quarter
 * @param {number} quarter - Quarter number (1-4)
 */
export const getQuarterMonths = (quarter) => {
  const quarterMonths = {
    1: "Jan-Mar",
    2: "Apr-Jun",
    3: "Jul-Sep",
    4: "Oct-Dec"
  };
  return quarterMonths[quarter] || "";
};

/**
 * Get the maximum timeframe days available for a specific year based on completed quarters
 * @param {number} year - The year to check
 * @returns {number} Maximum days available (90, 180, 270, or 365)
 */
export const getMaxTimeframeDaysForYear = (year) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-based (0=Jan, 11=Dec)

  // For past years (before current year), all quarters are complete so show 1 year
  if (year < currentYear) {
    return 365;
  }

  // For future years, no quarters are complete
  if (year > currentYear) {
    return 0;
  }

  // For current year, calculate based on completed quarters
  let completedQuarters = 0;

  // Q1 (Jan-Mar): Complete if we're in April or later (month >= 3)
  if (currentMonth >= 3) completedQuarters = 1;

  // Q2 (Apr-Jun): Complete if we're in July or later (month >= 6)  
  if (currentMonth >= 6) completedQuarters = 2;

  // Q3 (Jul-Sep): Complete if we're in October or later (month >= 9)
  if (currentMonth >= 9) completedQuarters = 3;

  // Q4 (Oct-Dec): Complete if we're in next year (month >= 12) - but this won't happen in same year
  if (currentMonth >= 12) completedQuarters = 4;

  // Return days based on completed quarters
  return completedQuarters * 90; // 90 days per quarter
};

/**
 * Generate dynamic timeframe options based on selected year
 * @param {string|number} selectedYear - The selected year (can be "all" or a year number)
 * @returns {Array} Array of timeframe options
 */
export const getDynamicTimeframeOptions = (selectedYear) => {
  const baseOptions = [
    { value: "1_hour", label: "1 Hour" },
    { value: "24_hours", label: "24 Hours" },
    { value: "7_days", label: "7 Days" },
    { value: "30_days", label: "30 Days" },
    { value: "60_days", label: "60 Days" }
  ];

  // If "all" years selected, show all timeframe options
  if (!selectedYear || selectedYear === "all") {
    return [
      ...baseOptions,
      { value: "90_days", label: "90 Days" },
      { value: "180_days", label: "180 Days" },
      { value: "1_year", label: "1 Year" }
    ];
  }

  const year = parseInt(selectedYear);
  const maxDays = getMaxTimeframeDaysForYear(year);

  // Always include base short-term options
  const options = [...baseOptions];

  // Add longer timeframe options based on what's available for the year
  if (maxDays >= 90) {
    options.push({ value: "90_days", label: "90 Days" });
  }

  if (maxDays >= 180) {
    options.push({ value: "180_days", label: "180 Days" });
  }

  if (maxDays >= 365) {
    options.push({ value: "1_year", label: "1 Year" });
  }

  return options;
};

// Example usage in your component:
/*
import { getYearOptions, getQuarterOptions } from './utils/dateFilterUtils';

const MyComponent = () => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');

  const availableYears = getYearOptions(2022); // Start from 2022
  const availableQuarters = getQuarterOptions(selectedYear);

  // Reset quarter when year changes and current quarter is not available
  useEffect(() => {
    if (selectedYear && availableQuarters.length > 0) {
      const isQuarterValid = availableQuarters.some(q => q.value === selectedQuarter);
      if (!isQuarterValid) {
        setSelectedQuarter('all');
      }
    }
  }, [selectedYear]);

  return (
    // Your JSX here
  );
};
*/